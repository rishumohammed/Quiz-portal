import cron from 'node-cron';
import { pool } from '../db/connection.js';
import { submitExamAttempt } from '../services/exam-grading.service.js';

export function initExamAutocompleteJob() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Fetch expired attempts
      const [expiredAttempts] = await connection.query(`
        SELECT id, answers_json 
        FROM public_exam_attempts 
        WHERE status = 'in_progress' AND session_expires_at <= NOW()
      `);

      if (expiredAttempts.length === 0) {
        return; // No expired exams to autocomplete
      }

      console.log(`[Exam Autocomplete Job] Found ${expiredAttempts.length} expired attempt(s). Processing...`);

      let successCount = 0;
      let errorCount = 0;

      for (const attempt of expiredAttempts) {
        try {
          const guestAnswers = attempt.answers_json ? 
            (typeof attempt.answers_json === 'string' ? JSON.parse(attempt.answers_json) : attempt.answers_json) 
            : [];
          
          await submitExamAttempt(attempt.id, guestAnswers);
          successCount++;
        } catch (err) {
          console.error(`[Exam Autocomplete Job] Failed to submit attempt ${attempt.id}:`, err.message);
          errorCount++;
        }
      }

      console.log(`[Exam Autocomplete Job] Completed. Success: ${successCount}, Failed: ${errorCount}`);

    } catch (error) {
      console.error('[Exam Autocomplete Job] Error fetching expired attempts:', error);
    } finally {
      if (connection) connection.release();
    }
  });

  console.log('Exam Autocomplete Job initialized (runs every 5 minutes)');
}
