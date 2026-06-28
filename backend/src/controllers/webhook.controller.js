import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { LeadService } from '../services/lead.service.js';
import { WhatsAppService } from '../services/whatsapp.service.js';
import invoiceService from '../services/invoice.service.js';
import crypto from 'crypto';

export const WebhookController = {
  // Webhook Verification (GET)
  async verifyWhatsApp(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  },

  // Webhook Payload (POST)
  async handleWhatsApp(req, res) {
    const signature = req.headers['x-hub-signature-256'];
    const payload = req.body;
    const logId = uuidv4();

    try {
      // 1. Verify Signature
      if (process.env.WHATSAPP_APP_SECRET && signature) {
        const expectedSignature = crypto
          .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
          .update(JSON.stringify(payload))
          .digest('hex');
        
        if (signature !== `sha256=${expectedSignature}`) {
          return res.sendStatus(403);
        }
      }

      // 2. Log Webhook
      await pool.query(
        'INSERT INTO whatsapp_logs (id, payload) VALUES (?, ?)',
        [logId, JSON.stringify(payload)]
      );

      // 3. Parse Payload
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // Phone number
        const text = message.text?.body;
        const name = value?.contacts?.[0]?.profile?.name || from;

        // 4. Create/Update Lead
        await LeadService.createLead({
          name: name,
          phone: from,
          source: 'whatsapp',
          custom_fields: {
            whatsapp_message: text,
            wa_id: message.id
          }
        });

        // 5. Send Auto-Reply
        // You would typically use a template here for the first message, 
        // but for ongoing conversations, text works.
        // For simplicity, we try to send a text if within 24h window.
        await WhatsAppService.sendTextMessage(from, 'Thanks for contacting us! Our team will reach out shortly.');

        await pool.query('UPDATE whatsapp_logs SET processed = TRUE WHERE id = ?', [logId]);
      }

      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Webhook Error:', error);
      await pool.query('UPDATE whatsapp_logs SET error = ? WHERE id = ?', [error.message, logId]);
      res.status(500).send('INTERNAL_ERROR');
    }
  },

  async handleRazorpay(req, res) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    const logId = uuidv4();

    try {
      // Log event
      await pool.query(
        'INSERT INTO payment_webhook_logs (id, event_type, payload) VALUES (?, ?, ?)',
        [logId, event.event, JSON.stringify(event)]
      );

      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const invoiceNumber = payment.notes.invoice_number || payment.description; // Fallback
        
        // Find invoice by number
        const [invoices] = await pool.query('SELECT id FROM invoices WHERE invoice_number = ?', [invoiceNumber]);
        
        if (invoices.length > 0) {
          const invoiceId = invoices[0].id;
          const amount = payment.amount / 100;
          const razorpayPaymentId = payment.id;
          
          // Idempotency: check if payment already recorded
          const [existing] = await pool.query('SELECT id FROM invoice_payments WHERE reference = ?', [razorpayPaymentId]);
          if (existing.length === 0) {
            await invoiceService.recordPayment(invoiceId, amount, 'card', razorpayPaymentId);
          }
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Razorpay Webhook Error:', error);
      res.status(500).send('INTERNAL_ERROR');
    }
  }
};
