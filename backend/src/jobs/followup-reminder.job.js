import cron from 'node-cron';
import { pool } from '../db/connection.js';
import emailService from '../services/email.service.js';

export const initFollowupJob = () => {
  // Schedule to run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily follow-up reminder job...');
    
    try {
      // Get all agents who have pending follow-ups today
      const [agents] = await pool.query(`
        SELECT DISTINCT u.id, u.email, u.name
        FROM users u
        JOIN lead_followups f ON u.id = f.agent_id
        WHERE DATE(f.scheduled_at) = CURDATE() AND f.status = 'pending'
      `);

      for (const agent of agents) {
        // Get follow-ups for this specific agent
        const [followups] = await pool.query(`
          SELECT f.*, l.name as lead_name, l.phone as lead_phone
          FROM lead_followups f
          JOIN leads l ON f.lead_id = l.id
          WHERE DATE(f.scheduled_at) = CURDATE() AND f.status = 'pending' AND f.agent_id = ?
        `, [agent.id]);

        if (followups.length > 0) {
          const followupItems = followups.map(f => `
            <li style="margin-bottom: 8px;">
              <strong>${f.lead_name}</strong> (${f.lead_phone}) at ${new Date(f.scheduled_at).toLocaleTimeString()}: 
              <em>${f.note || 'No note'}</em>
            </li>
          `).join('');

          const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Follow-up Reminders for Today</h2>
              <p>Hello <strong>${agent.name}</strong>,</p>
              <p>You have <strong>${followups.length}</strong> follow-ups scheduled for today:</p>
              <ul>
                ${followupItems}
              </ul>
              <p style="margin-top: 20px;">Good luck!<br>Kefta Talent Hunt CRM System</p>
            </div>
          `;

          try {
            await emailService.sendEmail({
              to: agent.email,
              subject: 'Kefta: Your Follow-up Reminders for Today',
              html
            });
            console.log(`Sent reminder email to ${agent.email}`);
          } catch (mailError) {
            console.error(`Failed to send email to ${agent.email}:`, mailError.message);
          }
        }
      }
    } catch (error) {
      console.error('Error in follow-up reminder job:', error);
    }
  });
};
