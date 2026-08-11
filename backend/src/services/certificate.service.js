import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directory exists
const certsDir = path.join(__dirname, '../../uploads/certificates');
if (!fsSync.existsSync(certsDir)) {
  fsSync.mkdirSync(certsDir, { recursive: true });
}

// Colors from the KEFTA design
const GOLD    = '#C9A84C';
const NAVY    = '#1B2A6B';
const DARK    = '#1a1a2e';
const CREAM   = '#F9F6EE';
const LIGHT_GOLD = '#E5C97A';

export class CertificateService {
  /**
   * Generates a KEFTA-styled participation certificate as a PDF
   * @param {string} candidateName 
   * @param {string} examName 
   * @param {Date} date 
   * @param {string|null} logoAbsPath  Absolute filesystem path to logo image (optional)
   * @returns {Promise<{ buffer: Buffer, pdfUrl: string }>}
   */
  static async generateParticipationCertificate(candidateName, examName, date, logoAbsPath = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          layout: 'portrait',
          size: [480, 680],
          margin: 0,
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
          const pdfData = Buffer.concat(buffers);
          const filename = `cert_${uuidv4()}.pdf`;
          const filepath = path.join(certsDir, filename);
          try {
            await fs.writeFile(filepath, pdfData);
            const pdfUrl = `/uploads/certificates/${filename}`;
            resolve({ buffer: pdfData, pdfUrl });
          } catch (writeErr) {
            reject(writeErr);
          }
        });

        const W = 480;
        const H = 680;

        // ── Background (cream) ─────────────────────────────────────
        doc.rect(0, 0, W, H).fill(CREAM);

        // ── Outer golden border ────────────────────────────────────
        doc.rect(14, 14, W - 28, H - 28).lineWidth(3).stroke(GOLD);
        doc.rect(20, 20, W - 40, H - 40).lineWidth(1).stroke(GOLD);

        // ── Left side vertical text strip ─────────────────────────
        doc.save();
        doc.translate(32, H / 2);
        doc.rotate(-90);
        doc.fontSize(8.5).fillColor(GOLD).font('Helvetica')
          .text('Igniting Scientific Temper, Inspiring Future Innovators.', -120, 0, { width: 240, align: 'center' });
        doc.restore();

        // ── Top-right logo ─────────────────────────────────────────
        if (logoAbsPath && fsSync.existsSync(logoAbsPath)) {
          try {
            doc.image(logoAbsPath, W - 110, 28, { width: 80, height: 60, fit: [80, 60] });
          } catch (_) { /* skip logo if error */ }
        }

        // ── Top decorative gold corner box ─────────────────────────
        doc.rect(38, 38, 14, 14).fill(GOLD);
        doc.rect(W - 52, 38, 14, 14).fill(GOLD);

        // ── Exam title (navy bold) ─────────────────────────────────
        doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold')
          .text('KEFTA ~ NATIONAL LEVEL', 60, 100, { width: W - 120, align: 'center' });
        doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold')
          .text('TALENT HUNT', 60, 120, { width: W - 120, align: 'center' });

        // ── Gold rule + ornament ───────────────────────────────────
        doc.moveTo(60, 148).lineTo(W - 60, 148).lineWidth(1.5).stroke(GOLD);
        doc.fontSize(14).fillColor(GOLD).font('Helvetica')
          .text('✦  ❖  ✦', 0, 152, { align: 'center' });
        doc.moveTo(60, 174).lineTo(W - 60, 174).lineWidth(1.5).stroke(GOLD);

        // ── CERTIFICATE heading ────────────────────────────────────
        doc.fontSize(26).fillColor(GOLD).font('Helvetica-Bold')
          .text('CERTIFICATE', 0, 188, { align: 'center' });

        // ── "OF PARTICIPATION" sub-label ───────────────────────────
        doc.moveTo(100, 220).lineTo(180, 220).lineWidth(0.8).stroke(GOLD);
        doc.fontSize(10).fillColor(GOLD).font('Helvetica')
          .text('— OF PARTICIPATION —', 0, 224, { align: 'center' });
        doc.moveTo(300, 220).lineTo(380, 220).lineWidth(0.8).stroke(GOLD);

        // ── "This is to certify that" ──────────────────────────────
        doc.fontSize(11).fillColor(DARK).font('Helvetica-Oblique')
          .text('This is to certify that', 0, 258, { align: 'center' });

        // ── Candidate Name ─────────────────────────────────────────
        doc.fontSize(22).fillColor(GOLD).font('Helvetica-BoldOblique')
          .text(candidateName || 'Participant', 60, 278, { width: W - 120, align: 'center' });

        // ── Decorative underline under name ───────────────────────
        doc.moveTo(100, 310).lineTo(W - 100, 310).lineWidth(0.8).stroke(GOLD);

        // ── Body text ─────────────────────────────────────────────
        doc.fontSize(10.5).fillColor(DARK).font('Helvetica')
          .text(`has participated in the National Level Talent Hunt organized by\nKerala Food Technologists Association - KEFTA.`, 60, 322, {
            width: W - 120,
            align: 'center',
            lineGap: 4,
          });

        // ── Date ──────────────────────────────────────────────────
        const dateString = date
          ? new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
          : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fontSize(9).fillColor('#555555').font('Helvetica')
          .text(`Date: ${dateString}`, 0, 372, { align: 'center' });

        // ── Gold separator ─────────────────────────────────────────
        doc.moveTo(60, 392).lineTo(W - 60, 392).lineWidth(0.8).stroke(GOLD);

        // ── Seal placeholder (circular badge look) ─────────────────
        const sealX = W / 2;
        const sealY = 455;
        const sealR = 46;
        doc.circle(sealX, sealY, sealR).lineWidth(3).stroke(NAVY);
        doc.circle(sealX, sealY, sealR - 6).lineWidth(1).stroke(GOLD);
        doc.fontSize(7).fillColor(NAVY).font('Helvetica-Bold')
          .text('KERALA FOOD TECHNOLOGISTS', sealX - 36, sealY - 20, { width: 72, align: 'center' });
        doc.fontSize(10).fillColor(GOLD).font('Helvetica-Bold')
          .text('kefta', sealX - 20, sealY - 6, { width: 40, align: 'center' });
        doc.fontSize(7).fillColor(NAVY).font('Helvetica-Bold')
          .text('ASSOCIATION', sealX - 30, sealY + 8, { width: 60, align: 'center' });

        // ── Signatures ────────────────────────────────────────────
        const sigY = 515;
        // Left signature line
        doc.moveTo(60, sigY).lineTo(170, sigY).lineWidth(0.8).stroke(DARK);
        doc.fontSize(9).fillColor(DARK).font('Helvetica-Bold')
          .text('Mr. Ameer Faisal', 50, sigY + 4, { width: 120, align: 'center' });
        doc.fontSize(7.5).fillColor('#555555').font('Helvetica')
          .text('Co-founder & State Convenor, KEFTA', 42, sigY + 17, { width: 136, align: 'center' });

        // Right signature line
        doc.moveTo(310, sigY).lineTo(420, sigY).lineWidth(0.8).stroke(DARK);
        doc.fontSize(9).fillColor(DARK).font('Helvetica-Bold')
          .text('Mr. Bins K Thomas', 300, sigY + 4, { width: 130, align: 'center' });
        doc.fontSize(7.5).fillColor('#555555').font('Helvetica')
          .text('General Secretary, KEFTA', 300, sigY + 17, { width: 130, align: 'center' });

        // ── Bottom gold band ───────────────────────────────────────
        doc.rect(20, H - 76, W - 40, 54).fill(GOLD);
        doc.fontSize(11.5).fillColor('#1a1a2e').font('Helvetica-Bold')
          .text('Kerala Food Technologists Association - KEFTA', 40, H - 65, { width: W - 80, align: 'center' });
        doc.fontSize(8).fillColor('#3a2800').font('Helvetica')
          .text('Kozhikode - Kerala, www.kefta.in, kefta.kerala@gmail.com', 40, H - 48, { width: W - 80, align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
