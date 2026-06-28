import cron from 'node-cron';
import { pool } from '../db/connection.js';
import { createNotification } from '../services/notification.service.js';
import dayjs from 'dayjs';

export const initLiveSessionJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running Live Session Reminders Check...');
    
    try {
      // Find sessions starting in the next 30-35 minutes that haven't been reminded yet
      // (Using a status or a flag to prevent multiple reminders would be better, 
      // but for now we'll check based on the time window)
      
      const now = dayjs();
      const thirtyMinsLater = now.add(30, 'minute');
      const thirtyFiveMinsLater = now.add(35, 'minute');

      const [sessions] = await pool.query(`
        SELECT l.*, c.title as course_title, c.id as course_id
        FROM course_lessons l
        JOIN course_sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        WHERE l.type = 'live' 
        AND l.scheduled_at BETWEEN ? AND ?
      `, [thirtyMinsLater.format('YYYY-MM-DD HH:mm:ss'), thirtyFiveMinsLater.format('YYYY-MM-DD HH:mm:ss')]);

      for (const session of sessions) {
        console.log(`Sending reminders for live session: ${session.title}`);
        
        // Get enrolled students
        const [enrollments] = await pool.query('SELECT student_id FROM enrollments WHERE course_id = ?', [session.course_id]);
        
        for (const enrollment of enrollments) {
          await createNotification({
            userId: enrollment.student_id,
            type: 'live_session_starting',
            title: 'Live Session Starting Soon!',
            body: `The session "${session.title}" for ${session.course_title} starts in 30 minutes.`,
            link: `/learn/${session.course_id}/${session.id}`,
            emailNotify: true
          });
        }
      }
    } catch (error) {
      console.error('Error in live session reminder job:', error);
    }
  });
};
