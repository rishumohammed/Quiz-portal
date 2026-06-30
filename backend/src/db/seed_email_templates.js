import { pool } from './connection.js';

const templates = [
  {
    id: 'exam_registration_otp', 
    name: 'Exam Registration OTP', 
    subject: 'Your Registration OTP for {{exam_name}}', 
    body: '<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">\n  <h2 style="color: #007AFF;">Verify Your Email</h2>\n  <p>Hi {{name}},</p>\n  <p>You requested to register for <strong>{{exam_name}}</strong>.</p>\n  <p>Please use the following One-Time Password (OTP) to complete your registration:</p>\n  <div style="text-align: center; margin: 30px 0;">\n    <div style="display: inline-block; padding: 14px 30px; background: #f0f7ff; color: #007AFF; border: 1px dashed #007AFF; border-radius: 8px; font-weight: bold; font-size: 24px; letter-spacing: 4px;">{{otp}}</div>\n  </div>\n  <p style="font-size: 14px; color: #666;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>\n</div>'
  },
  {
    id: 'exam_registration_success', 
    name: 'Exam Registration Success', 
    subject: 'Registration Confirmed - {{exam_name}}', 
    body: '<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">\n  <h2 style="color: #4CAF50;">Registration Successful! 🎉</h2>\n  <p>Hi {{name}},</p>\n  <p>You have successfully registered for <strong>{{exam_name}}</strong>.</p>\n  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">\n    <h3 style="margin-top: 0; color: #333; font-size: 16px;">Exam Details</h3>\n    <p style="margin: 5px 0; font-size: 14px;"><strong>Date & Time:</strong> {{exam_date}}</p>\n    <p style="margin: 5px 0; font-size: 14px;"><strong>Duration:</strong> {{exam_duration}} minutes</p>\n    <p style="margin: 15px 0 5px 0; font-size: 14px;"><strong>Login Credentials:</strong></p>\n    <p style="margin: 5px 0; font-size: 14px;">Username (Email): <strong>{{email}}</strong></p>\n    <p style="margin: 5px 0; font-size: 14px;">Password: <strong>{{password}}</strong></p>\n  </div>\n  <p>You can login to the portal using the link below:</p>\n  <div style="text-align: center; margin: 25px 0;">\n    <a href="{{exam_link}}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Exam Portal</a>\n  </div>\n  <p>Good luck!</p>\n</div>'
  },
  {
    id: 'exam_reminder_1day', 
    name: 'Exam Reminder (1 Day Before)', 
    subject: 'Reminder: {{exam_name}} is tomorrow', 
    body: '<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">\n  <h2 style="color: #4CAF50;">Your Exam is Tomorrow!</h2>\n  <p>Hi {{name}},</p>\n  <p>This is a reminder that the <strong>{{exam_name}}</strong> is scheduled to start in less than 24 hours.</p>\n  <p>Please log in to the portal in advance to ensure everything is set up.</p>\n  <div style="text-align: center; margin: 25px 0;">\n    <a href="{{exam_link}}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Exam Portal</a>\n  </div>\n  <p>Good luck!</p>\n</div>'
  },
  {
    id: 'exam_reminder_10min', 
    name: 'Exam Reminder (10 Minutes Before)', 
    subject: 'Starting Soon: {{exam_name}}', 
    body: '<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">\n  <h2 style="color: #ff9800;">Your Exam Starts Soon!</h2>\n  <p>Hi {{name}},</p>\n  <p>The <strong>{{exam_name}}</strong> will begin in approximately 10 minutes.</p>\n  <p>Please log in now and wait for the start button to become active.</p>\n  <div style="text-align: center; margin: 25px 0;">\n    <a href="{{exam_link}}" style="background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start Exam Now</a>\n  </div>\n  <p>Best of luck!</p>\n</div>'
  }
];

async function seed() {
  try {
    for (const t of templates) {
      await pool.query(
        `INSERT INTO email_templates (id, name, subject, body) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), subject = VALUES(subject), body = VALUES(body)`,
        [t.id, t.name, t.subject, t.body]
      );
    }
    console.log('Successfully seeded email templates.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
