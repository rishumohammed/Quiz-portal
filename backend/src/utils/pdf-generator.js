import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Color palette — header uses admin-configurable color
const COLOR_ACCENT   = '#e53935'; // red for balance due
const COLOR_LIGHT_BG = '#f5f6fa'; // light grey row bg
const COLOR_TEXT     = '#212121'; // near-black text
const COLOR_MUTED    = '#757575'; // grey muted text
const COLOR_WHITE    = '#ffffff';
const COLOR_BORDER   = '#e0e0e0'; // subtle border

// Helper: draw filled rectangle
const rect = (doc, x, y, w, h, color) => {
  doc.save().rect(x, y, w, h).fill(color).restore();
};

export const generateInvoicePDF = async (invoice, student, course, institute, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = 595.28; // A4 width in points
    const MARGIN = 48;
    const headerColor = institute.header_color || '#1a237e'; // admin-configurable

    // ── HEADER BAND ──────────────────────────────────────────────
    rect(doc, 0, 0, W, 110, headerColor);

    // Logo or Brand Name (left side of header)
    let logoLoaded = false;
    if (institute.logo_url) {
      const logoPath = path.join(process.cwd(), institute.logo_url);
      if (fs.existsSync(logoPath)) {
        try {
          // Draw logo fitted inside a 160×60 box, vertically centered in header
          doc.image(logoPath, MARGIN, 25, { fit: [160, 60], valign: 'center' });
          logoLoaded = true;
        } catch (err) {
          console.error('Failed to load logo for PDF:', err);
        }
      }
    }

    if (!logoLoaded) {
      // Fallback: draw brand name text
      doc.fillColor(COLOR_WHITE)
         .font('Helvetica-Bold')
         .fontSize(22)
         .text(institute.name || 'AEMS Academy', MARGIN, 38, { width: 220 });
    }

    // "INVOICE" label (right side of header)
    doc.fillColor(COLOR_WHITE)
       .font('Helvetica-Bold')
       .fontSize(32)
       .text('INVOICE', 0, 32, { align: 'right', width: W - MARGIN });

    // Invoice number below the label
    const invNum = invoice.invoice_number || invoice.id.split('-')[0].toUpperCase();
    doc.fillColor('rgba(255,255,255,0.75)')
       .font('Helvetica')
       .fontSize(10)
       .text(`#${invNum}`, 0, 72, { align: 'right', width: W - MARGIN });

    // ── INFO STRIP (below header) ──────────────────────────────────
    rect(doc, 0, 110, W, 36, COLOR_LIGHT_BG);

    // Status badge
    const statusColor = invoice.payment_status === 'paid'
      ? '#2e7d32'
      : invoice.payment_status === 'partial'
        ? '#e65100'
        : '#c62828';
    const statusText = (invoice.payment_status || 'pending').toUpperCase();

    rect(doc, MARGIN, 119, 70, 18, statusColor);
    doc.fillColor(COLOR_WHITE).font('Helvetica-Bold').fontSize(8)
       .text(statusText, MARGIN, 123, { width: 70, align: 'center' });

    // Dates
    const issuedDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    doc.fillColor(COLOR_MUTED).font('Helvetica').fontSize(9)
       .text(`Issue Date: `, MARGIN + 85, 124, { continued: true })
       .fillColor(COLOR_TEXT).font('Helvetica-Bold').text(issuedDate);

    // ── TWO-COLUMN SECTION ─────────────────────────────────────────
    const COL_LEFT  = MARGIN;
    const COL_RIGHT = W / 2 + 10;
    let Y = 168;

    // Left: Billed From
    doc.fillColor(COLOR_MUTED).font('Helvetica-Bold').fontSize(8)
       .text('FROM', COL_LEFT, Y);
    Y += 14;
    doc.fillColor(COLOR_TEXT).font('Helvetica-Bold').fontSize(11)
       .text(institute.name || 'AEMS Academy', COL_LEFT, Y);
    Y += 16;
    doc.fillColor(COLOR_MUTED).font('Helvetica').fontSize(9);
    if (institute.address) {
      doc.text(institute.address, COL_LEFT, Y); Y += 13;
    }
    if (institute.email) {
      doc.text(institute.email, COL_LEFT, Y); Y += 13;
    }
    if (institute.phone) {
      doc.text(institute.phone, COL_LEFT, Y); Y += 13;
    }

    // Right: Bill To
    let Y2 = 168;
    doc.fillColor(COLOR_MUTED).font('Helvetica-Bold').fontSize(8)
       .text('BILL TO', COL_RIGHT, Y2);
    Y2 += 14;
    doc.fillColor(COLOR_TEXT).font('Helvetica-Bold').fontSize(11)
       .text(student.name || 'N/A', COL_RIGHT, Y2);
    Y2 += 16;
    doc.fillColor(COLOR_MUTED).font('Helvetica').fontSize(9);
    if (student.email) {
      doc.text(student.email, COL_RIGHT, Y2); Y2 += 13;
    }
    if (student.phone) {
      doc.text(student.phone, COL_RIGHT, Y2); Y2 += 13;
    }

    // ── TABLE ──────────────────────────────────────────────────────
    const tableY = Math.max(Y, Y2) + 28;
    const TABLE_COLS = { desc: MARGIN, qty: 340, rate: 400, amt: 470 };

    // Table header row
    rect(doc, MARGIN, tableY, W - MARGIN * 2, 24, headerColor);
    doc.fillColor(COLOR_WHITE).font('Helvetica-Bold').fontSize(9);
    doc.text('DESCRIPTION',  TABLE_COLS.desc + 8, tableY + 8);
    doc.text('QTY',          TABLE_COLS.qty,       tableY + 8, { width: 55, align: 'center' });
    doc.text('RATE (INR)',   TABLE_COLS.rate,       tableY + 8, { width: 65, align: 'right' });
    doc.text('AMOUNT (INR)', TABLE_COLS.amt,        tableY + 8, { width: W - MARGIN - TABLE_COLS.amt, align: 'right' });

    // Table row
    const rowY = tableY + 24;
    rect(doc, MARGIN, rowY, W - MARGIN * 2, 30, COLOR_LIGHT_BG);
    const courseTitle = course.title || 'Course Enrollment';
    const amount      = parseFloat(invoice.amount || 0).toFixed(2);

    doc.fillColor(COLOR_TEXT).font('Helvetica').fontSize(9);
    doc.text(courseTitle,  TABLE_COLS.desc + 8, rowY + 10, { width: 280 });
    doc.text('1',          TABLE_COLS.qty,       rowY + 10, { width: 55, align: 'center' });
    doc.text(amount,       TABLE_COLS.rate,       rowY + 10, { width: 65, align: 'right' });
    doc.text(amount,       TABLE_COLS.amt,        rowY + 10, { width: W - MARGIN - TABLE_COLS.amt, align: 'right' });

    // Bottom border
    const rowBottomY = rowY + 30;
    doc.save().moveTo(MARGIN, rowBottomY).lineTo(W - MARGIN, rowBottomY)
       .strokeColor(COLOR_BORDER).lineWidth(0.5).stroke().restore();

    // ── SUMMARY BOX ────────────────────────────────────────────────
    const summaryX = W / 2 + 10;
    const summaryW = W - MARGIN - summaryX;
    let sY = rowBottomY + 20;

    const amountPaid  = parseFloat(invoice.amount_paid  || 0).toFixed(2);
    const balanceDue  = parseFloat(invoice.balance_due  || 0).toFixed(2);

    const summaryRows = [
      { label: 'Subtotal',     value: `INR ${amount}` },
      { label: 'Amount Paid',  value: `INR ${amountPaid}` },
    ];

    summaryRows.forEach(({ label, value }) => {
      doc.fillColor(COLOR_MUTED).font('Helvetica').fontSize(9)
         .text(label, summaryX, sY, { width: summaryW - 8, align: 'left' });
      doc.fillColor(COLOR_TEXT)
         .text(value, summaryX, sY, { width: summaryW - 8, align: 'right' });
      sY += 18;
    });

    // Divider before balance
    doc.save().moveTo(summaryX, sY - 4).lineTo(W - MARGIN, sY - 4)
       .strokeColor(COLOR_BORDER).lineWidth(0.5).stroke().restore();

    // Balance Due row (highlighted)
    rect(doc, summaryX - 8, sY, summaryW + 8, 28, parseFloat(balanceDue) > 0 ? '#ffebee' : '#e8f5e9');
    doc.fillColor(COLOR_TEXT).font('Helvetica-Bold').fontSize(10)
       .text('Balance Due', summaryX, sY + 9, { width: summaryW - 8, align: 'left' });
    doc.fillColor(parseFloat(balanceDue) > 0 ? COLOR_ACCENT : '#2e7d32')
       .font('Helvetica-Bold').fontSize(11)
       .text(`INR ${balanceDue}`, summaryX, sY + 8, { width: summaryW - 8, align: 'right' });
    sY += 28;

    // ── FOOTER ──────────────────────────────────────────────────────
    const footerY = 780;
    rect(doc, 0, footerY, W, 61.89, headerColor); // 841.89 - 780

    doc.fillColor('rgba(255,255,255,0.9)').font('Helvetica-Bold').fontSize(11)
       .text(`Thank you for choosing ${institute.name || 'AEMS Academy'}!`, 0, footerY + 12, { align: 'center', width: W });
    doc.fillColor('rgba(255,255,255,0.6)').font('Helvetica').fontSize(8)
       .text('This is a computer-generated invoice and does not require a signature.', 0, footerY + 32, { align: 'center', width: W });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};
