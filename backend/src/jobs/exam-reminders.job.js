import cron from 'node-cron';
import { pool } from '../db/connection.js';
import EmailService from '../services/email.service.js';
import { ConfigService } from '../services/config.service.js';

export const initExamRemindersJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const connection = await pool.getConnection();

      // 1-DAY REMINDERS (Starts between 23.5 and 24.5 hours from now to give buffer)
      const [oneDayExams] = await connection.query(`
        SELECT id, name, slug, exam_start_date 
        FROM public_exams 
        WHERE status = 'published' 
        AND exam_start_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
      `);

      for (const exam of oneDayExams) {
        const [candidates] = await connection.query(`
          SELECT id, name, email 
          FROM public_exam_candidates 
          WHERE exam_id = ? AND notified_1day_before = FALSE
        `, [exam.id]);

        for (const candidate of candidates) {
          try {
            const examLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-exams/${exam.slug}`;
            const [tplRows] = await connection.query('SELECT subject, body FROM email_templates WHERE id = ?', ['exam_reminder_1day']);
            let subject = tplRows[0].subject.replace(/{{exam_name}}/g, exam.name);
            
            const logoConfig = await ConfigService.getByKey('app_logo');
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
            const logoUrl = logoConfig?.value ? (logoConfig.value.startsWith('http') ? logoConfig.value : `${backendUrl}${logoConfig.value}`) : '';

            let html = tplRows[0].body
              .replace(/{{name}}/g, candidate.name || 'Candidate')
              .replace(/{{exam_name}}/g, exam.name)
              .replace(/{{exam_link}}/g, examLink)
              .replace(/{{brand_logo}}/g, logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 50px; margin-bottom: 20px;" />` : '');

            await EmailService.sendEmail({
              to: candidate.email,
              subject: subject,
              html
            });

            await connection.query('UPDATE public_exam_candidates SET notified_1day_before = TRUE WHERE id = ?', [candidate.id]);
          } catch (e) {
            console.error(`Failed to send 1-day reminder to ${candidate.email}:`, e.message);
          }
        }
      }

      // 10-MIN REMINDERS (Starts between now and 15 mins from now)
      const [tenMinExams] = await connection.query(`
        SELECT id, name, slug, exam_start_date 
        FROM public_exams 
        WHERE status = 'published' 
        AND exam_start_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 15 MINUTE)
      `);

      for (const exam of tenMinExams) {
        const [candidates] = await connection.query(`
          SELECT id, name, email 
          FROM public_exam_candidates 
          WHERE exam_id = ? AND notified_10min_before = FALSE
        `, [exam.id]);

        for (const candidate of candidates) {
          try {
            const examLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-exams/${exam.slug}`;
            const [tplRows] = await connection.query('SELECT subject, body FROM email_templates WHERE id = ?', ['exam_reminder_10min']);
            let subject = tplRows[0].subject.replace(/{{exam_name}}/g, exam.name);
            
            const logoConfig = await ConfigService.getByKey('app_logo');
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
            const logoUrl = logoConfig?.value ? (logoConfig.value.startsWith('http') ? logoConfig.value : `${backendUrl}${logoConfig.value}`) : '';

            let html = tplRows[0].body
              .replace(/{{name}}/g, candidate.name || 'Candidate')
              .replace(/{{exam_name}}/g, exam.name)
              .replace(/{{exam_link}}/g, examLink)
              .replace(/{{brand_logo}}/g, logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 50px; margin-bottom: 20px;" />` : '');

            await EmailService.sendEmail({
              to: candidate.email,
              subject: subject,
              html
            });

            await connection.query('UPDATE public_exam_candidates SET notified_10min_before = TRUE WHERE id = ?', [candidate.id]);
          } catch (e) {
            console.error(`Failed to send 10-min reminder to ${candidate.email}:`, e.message);
          }
        }
      }

      connection.release();
    } catch (error) {
      console.error('Error in exam reminders job:', error.message);
    }
  });

  console.log('Registered cron job: Exam Reminders (every 5 minutes)');
};
