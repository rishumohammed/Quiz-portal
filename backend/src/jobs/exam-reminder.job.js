import cron from 'node-cron';
import { pool } from '../db/connection.js';
import EmailService from '../services/email.service.js';

let isReminderRunning = false;

/**
 * Checks upcoming exams starting within 23-25 hours and sends 24h reminder emails.
 */
export async function run24hExamReminderTask() {
  if (isReminderRunning) {
    console.warn('[Exam Reminder Job] A task is already in progress. Skipping...');
    return null;
  }

  isReminderRunning = true;
  console.log(`[Exam Reminder Job] Scanning upcoming exams for 24-hour reminders at ${new Date().toISOString()}...`);

  try {
    const now = new Date();
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const [exams] = await pool.query(
      `SELECT * FROM public_exams 
       WHERE status = 'published' 
         AND deleted_at IS NULL 
         AND exam_start_date BETWEEN ? AND ?`,
      [in23h, in25h]
    );

    let totalEmailsSent = 0;

    for (const exam of exams) {
      const [candidates] = await pool.query(
        `SELECT id, name, email FROM public_exam_candidates 
         WHERE exam_id = ? AND (reminder_24h_sent = 0 OR reminder_24h_sent IS NULL)`,
        [exam.id]
      );

      if (candidates.length === 0) continue;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const loginUrl = `${frontendUrl}/public-exams/${exam.slug}/login`;

      console.log(`[Exam Reminder Job] Dispatching 24h reminders for "${exam.name}" to ${candidates.length} candidate(s)...`);

      for (const cand of candidates) {
        try {
          await EmailService.sendExam24hReminderEmail(cand, exam, loginUrl);
          await pool.query('UPDATE public_exam_candidates SET reminder_24h_sent = 1 WHERE id = ?', [cand.id]);
          totalEmailsSent++;
        } catch (err) {
          console.error(`[Exam Reminder Job] Error sending reminder to ${cand.email}:`, err.message);
        }
      }
    }

    console.log(`[Exam Reminder Job] Completed. Sent ${totalEmailsSent} reminder email(s).`);
    return { success: true, emailsSent: totalEmailsSent };
  } catch (error) {
    console.error('[Exam Reminder Job] Task failed:', error);
    throw error;
  } finally {
    isReminderRunning = false;
  }
}

/**
 * Initializes the automated 24h exam reminder cron job running every hour.
 */
export function initExamReminderJob() {
  if (process.env.NODE_APP_INSTANCE && process.env.NODE_APP_INSTANCE !== '0') {
    console.log(`[Exam Reminder Job] Skipping cron initialization on PM2 worker instance ${process.env.NODE_APP_INSTANCE}`);
    return;
  }

  // Schedule cron job to run at minute 0 of every hour ('0 * * * *')
  cron.schedule('0 * * * *', async () => {
    console.log('[Exam Reminder Job] Hourly cron trigger fired.');
    try {
      await run24hExamReminderTask();
    } catch (e) {
      console.error('[Exam Reminder Job] Cron execution error:', e.message);
    }
  });

  console.log('[Exam Reminder Job] Background cron service initialized (running hourly).');
}
