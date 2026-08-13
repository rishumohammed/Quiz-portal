import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directory exists
const certsDir = path.join(__dirname, '../../uploads/certificates');
if (!fsSync.existsSync(certsDir)) {
  fsSync.mkdirSync(certsDir, { recursive: true });
}

// Colors from reference certificate
const GOLD       = '#D4AF37';
const DARK_GOLD  = '#B8860B';
const NAVY       = '#003366';
const LIGHT_NAVY = '#1B3A68';
const CREAM      = '#F4EFE6';

export class CertificateService {
  /**
   * Helper to fetch full certificate config from system_config table
   */
  static async getCertificateConfig() {
    const config = {
      logoAbsPath: null,
      sealAbsPath: null,
      sig1ImageAbsPath: null,
      sig1Name: '',
      sig1Title: '',
      sig2ImageAbsPath: null,
      sig2Name: '',
      sig2Title: '',
    };

    try {
      const [rows] = await pool.query(
        "SELECT `key`, `value` FROM system_config WHERE `key` LIKE 'certificate_%'"
      );
      const map = {};
      for (const row of rows) {
        map[row.key] = row.value;
      }

      const resolveAbsPath = (relPath) => {
        if (!relPath) return null;
        const normalized = relPath.startsWith('/') ? relPath : '/' + relPath;
        const abs = path.join(__dirname, '../../', normalized);
        return fsSync.existsSync(abs) ? abs : null;
      };

      if (map.certificate_logo) config.logoAbsPath = resolveAbsPath(map.certificate_logo);
      if (map.certificate_seal) config.sealAbsPath = resolveAbsPath(map.certificate_seal);
      if (map.certificate_sig1_image) config.sig1ImageAbsPath = resolveAbsPath(map.certificate_sig1_image);
      if (map.certificate_sig1_name !== undefined) config.sig1Name = map.certificate_sig1_name;
      if (map.certificate_sig1_title !== undefined) config.sig1Title = map.certificate_sig1_title;
      if (map.certificate_sig2_image) config.sig2ImageAbsPath = resolveAbsPath(map.certificate_sig2_image);
      if (map.certificate_sig2_name !== undefined) config.sig2Name = map.certificate_sig2_name;
      if (map.certificate_sig2_title !== undefined) config.sig2Title = map.certificate_sig2_title;
    } catch (_) { /* ignore config fetch failure fallback to defaults */ }

    return config;
  }

  /**
   * Generates a KEFTA-styled participation certificate as a PDF matching the reference design
   * @param {string} candidateName 
   * @param {string} examName 
   * @param {Date} date 
   * @param {Object|string|null} customOptions Or logoAbsPath string for backwards compatibility
   * @returns {Promise<{ buffer: Buffer, pdfUrl: string }>}
   */
  static async generateParticipationCertificate(candidateName, examName, date, customOptions = null) {
    let opts = {};
    if (typeof customOptions === 'string') {
      opts = { logoAbsPath: customOptions };
    } else if (customOptions && typeof customOptions === 'object') {
      opts = customOptions;
    }

    const sysConfig = await CertificateService.getCertificateConfig();
    const config = { ...sysConfig, ...opts };

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

        // 1. Background (Cream)
        doc.rect(0, 0, W, H).fill(CREAM);

        // 2. Decorative Left and Top Frame
        // Outer Frame Elements
        doc.lineWidth(1.5).strokeColor(GOLD);
        // Outer Square
        doc.rect(36, 36, 8, 8).stroke();
        // Outer Horizontal Line
        doc.moveTo(44, 40).lineTo(340, 40).stroke();
        // Outer Vertical Line
        doc.moveTo(40, 44).lineTo(40, 550).stroke();

        // Inner Frame Elements
        doc.lineWidth(1).strokeColor(GOLD);
        // Inner Square
        doc.rect(48, 48, 6, 6).stroke();
        // Inner Horizontal Line
        doc.moveTo(54, 51).lineTo(290, 51).stroke();
        // Inner Vertical Line
        doc.moveTo(51, 54).lineTo(51, 600).stroke();

        // 3. Left vertical text motto strip
        doc.save();
        doc.translate(28, H);
        doc.rotate(-90);
        doc.fontSize(11).fillColor(DARK_GOLD).font('Helvetica')
          .text('Igniting Scientific Temper, Inspiring Future Innovators.', 0, 0, { width: H, align: 'center' });
        doc.restore();

        // 4. Top-right Logo
        if (config.logoAbsPath && fsSync.existsSync(config.logoAbsPath)) {
          try {
            doc.image(config.logoAbsPath, W - 140, 40, { width: 100, height: 60, fit: [100, 60] });
          } catch (_) { /* fallback if logo error */ }
        }

        // 5. Exam Title
        doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold')
          .text('KEFTA - NATIONAL LEVEL', 0, 110, { align: 'center' });
        doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold')
          .text('TALENT HUNT', 0, 130, { align: 'center' });

        // 6. Gold Rule + Ornament
        const midY = 160;
        doc.moveTo(140, midY).lineTo(230, midY).lineWidth(1).stroke(DARK_GOLD);
        doc.moveTo(250, midY).lineTo(340, midY).lineWidth(1).stroke(DARK_GOLD);
        doc.save();
        doc.translate(240, midY);
        doc.rotate(45);
        doc.rect(-3, -3, 6, 6).stroke(DARK_GOLD);
        doc.restore();

        // 7. CERTIFICATE OF PARTICIPATION
        doc.fontSize(28).fillColor(GOLD).font('Times-Roman')
          .text('CERTIFICATE', 0, 190, { align: 'center' });
        doc.fontSize(12).fillColor(GOLD).font('Times-Roman')
          .text('— OF PARTICIPATION —', 0, 225, { align: 'center' });

        // 8. Certification Body
        doc.fontSize(10).fillColor(LIGHT_NAVY).font('Helvetica')
          .text('This is to certify that', 0, 280, { align: 'center' });

        doc.fontSize(24).fillColor(DARK_GOLD).font('Times-BoldItalic')
          .text(candidateName || 'Participant', 0, 315, { align: 'center' });

        doc.moveTo(140, 345).lineTo(340, 345).lineWidth(1).stroke('#AAAAAA');

        doc.fontSize(9).fillColor(LIGHT_NAVY).font('Helvetica')
          .text('has participated in the National Level Talent Hunt organized by', 0, 370, { align: 'center' });
        doc.fontSize(9).fillColor(LIGHT_NAVY).font('Helvetica')
          .text('Kerala Food Technologists Association - KEFTA.', 0, 385, { align: 'center' });

        // 9. Seal (Center)
        const sealX = W / 2;
        const sealY = 485;
        if (config.sealAbsPath && fsSync.existsSync(config.sealAbsPath)) {
          try {
            doc.image(config.sealAbsPath, sealX - 35, sealY - 35, { width: 70, height: 70, fit: [70, 70] });
          } catch (_) { /* fallback if image load fails */ }
        }

        // 10. Signatures
        const sigY = 540;

        // Signature 1 (Left)
        if (config.sig1ImageAbsPath && fsSync.existsSync(config.sig1ImageAbsPath)) {
          try {
            doc.image(config.sig1ImageAbsPath, 85, sigY - 35, { width: 90, height: 32, fit: [90, 32] });
          } catch (_) {}
        } else if (config.sig1Name) {
          doc.fontSize(16).fillColor(LIGHT_NAVY).font('Times-BoldItalic')
             .text(config.sig1Name.split(' ')[0], 85, sigY - 25);
        }
        doc.moveTo(70, sigY).lineTo(190, sigY).lineWidth(0.5).stroke('#888888');
        doc.fontSize(10).fillColor(DARK_GOLD).font('Times-Bold')
          .text(config.sig1Name || '', 55, sigY + 5, { width: 150, align: 'center' });
        doc.fontSize(7.5).fillColor(LIGHT_NAVY).font('Helvetica')
          .text(config.sig1Title || '', 45, sigY + 20, { width: 170, align: 'center' });

        // Signature 2 (Right)
        if (config.sig2ImageAbsPath && fsSync.existsSync(config.sig2ImageAbsPath)) {
          try {
            doc.image(config.sig2ImageAbsPath, 305, sigY - 35, { width: 90, height: 32, fit: [90, 32] });
          } catch (_) {}
        } else if (config.sig2Name) {
          doc.fontSize(16).fillColor(LIGHT_NAVY).font('Times-BoldItalic')
             .text(config.sig2Name.split(' ')[0], 320, sigY - 25);
        }
        doc.moveTo(290, sigY).lineTo(410, sigY).lineWidth(0.5).stroke('#888888');
        doc.fontSize(10).fillColor(DARK_GOLD).font('Times-Bold')
          .text(config.sig2Name || '', 275, sigY + 5, { width: 150, align: 'center' });
        doc.fontSize(7.5).fillColor(LIGHT_NAVY).font('Helvetica')
          .text(config.sig2Title || '', 265, sigY + 20, { width: 170, align: 'center' });

        // 11. Footer Band
        const footerY = H - 50;
        doc.rect(0, footerY, W, 50).fill('#EAE6DC');
        doc.moveTo(0, footerY).lineTo(W, footerY).lineWidth(1).dash(2, { space: 2 }).stroke('#CCCCCC');
        doc.undash();
        doc.fontSize(10).fillColor('#333333').font('Helvetica-Bold')
          .text('Kerala Food Technologists Association - KEFTA', 0, footerY + 15, { align: 'center' });
        doc.fontSize(8).fillColor('#666666').font('Helvetica')
          .text('Kozhikode - Kerala, www.kefta.in, kefta.kerala@gmail.com', 0, footerY + 30, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
