import express from 'express';
import { ConfigService } from '../services/config.service.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import EmailService from '../services/email.service.js';

// Cleaned up invoice PDF generator

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure we upload to the backend/uploads directory regardless of PM2 working directory
    const __filename = new URL(import.meta.url).pathname;
    let __dirname = path.dirname(__filename);
    // Fix Windows leading slash issue in ES modules URL
    if (process.platform === 'win32' && __dirname.startsWith('/')) {
        __dirname = __dirname.substring(1);
    }
    const uploadPath = path.join(__dirname, '../../uploads/branding');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all config
router.get('/', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const config = await ConfigService.getAll();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch configuration' });
  }
});

// Update multiple config keys
router.put('/', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const configMap = req.body;
    await ConfigService.updateMultiple(configMap);
    res.json({ message: 'Configuration updated successfully' });

    // Trigger async PDF regeneration if branding/contact changed
    // (Removed invoice PDF logic)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update configuration' });
  }
});

// Manually regenerate all invoice PDFs (Removed)

// Test Email Config
router.post('/test-email', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
    try {
      const { email } = req.body;
      const targetEmail = email || req.user.email;
      
      await EmailService.sendEmail({
        to: targetEmail,
        subject: 'Kefta Talent Hunt - SMTP Test Successful',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #4f46e5;">✅ SMTP Configuration Successful!</h2>
            <p>If you are reading this email, it means your SMTP configuration in the Kefta Talent Hunt admin panel is working perfectly.</p>
            <p>You can now send system notifications, password resets, and exam results to candidates.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Sent dynamically from Kefta Talent Hunt</p>
          </div>
        `
      });
      res.json({ message: `Test email successfully sent to ${targetEmail}` });
    } catch (error) {
      console.error('Test email failed:', error);
      res.status(500).json({ message: 'Failed to send test email. Check your SMTP credentials and console logs.', error: error.message });
    }
});

// Upload Branding Assets (logo, favicon, hero images)
router.post('/branding/upload', authenticateJWT, authorizeRoles('super_admin'), upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
  { name: 'hero_image', maxCount: 1 },
  { name: 'about_image', maxCount: 1 },
  { name: 'aboutpage_who_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const updates = {};
    if (req.files['logo']) {
      updates.app_logo = `/uploads/branding/${req.files['logo'][0].filename}`;
    }
    if (req.files['favicon']) {
      updates.app_favicon = `/uploads/branding/${req.files['favicon'][0].filename}`;
    }
    if (req.files['hero_image']) {
      updates.homepage_hero_image = `/uploads/branding/${req.files['hero_image'][0].filename}`;
    }
    if (req.files['about_image']) {
      updates.homepage_about_image = `/uploads/branding/${req.files['about_image'][0].filename}`;
    }
    if (req.files['aboutpage_who_image']) {
      updates.aboutpage_who_image = `/uploads/branding/${req.files['aboutpage_who_image'][0].filename}`;
    }
    
    if (Object.keys(updates).length > 0) {
      await ConfigService.updateMultiple(updates);
    }
    res.json({ message: 'Branding assets uploaded successfully', updates });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload branding assets', error: error.message });
  }
});

// --- Dynamic Social Platforms Management ---

// Get all social platforms
router.get('/social-platforms', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const [platforms] = await pool.query('SELECT * FROM social_platforms ORDER BY created_at ASC');
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch social platforms', error: error.message });
  }
});

// Create new social platform
router.post('/social-platforms', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const { name, icon, color, url, is_active } = req.body;
    const id = uuidv4();
    
    await pool.query(
      'INSERT INTO social_platforms (id, name, icon, color, url, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, icon, color, url || '', is_active ? 1 : 0]
    );
    res.status(201).json({ id, name, icon, color, url, is_active });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create social platform', error: error.message });
  }
});

// Update social platform
router.put('/social-platforms/:id', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color, url, is_active } = req.body;
    
    await pool.query(
      'UPDATE social_platforms SET name = ?, icon = ?, color = ?, url = ?, is_active = ? WHERE id = ?',
      [name, icon, color, url || '', is_active ? 1 : 0, id]
    );
    res.json({ message: 'Social platform updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update social platform', error: error.message });
  }
});

// Delete social platform
router.delete('/social-platforms/:id', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM social_platforms WHERE id = ?', [id]);
    res.json({ message: 'Social platform deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete social platform', error: error.message });
  }
});

// GET /api/admin/config/terms-privacy-acceptances
router.get('/terms-privacy-acceptances', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT tpa.*, c.name as candidate_name, c.email as candidate_email, e.name as exam_name
      FROM terms_privacy_acceptances tpa
      JOIN public_exam_candidates c ON tpa.candidate_id = c.id
      JOIN public_exams e ON c.exam_id = e.id
      ORDER BY tpa.accepted_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch terms/privacy acceptance history' });
  }
});

// --- Currency Management --- (Removed)
export default router;
