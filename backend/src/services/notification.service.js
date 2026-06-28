import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { getIO } from '../socket/index.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const createNotification = async ({ userId, type, title, message, body, link, emailNotify = false }) => {
  const finalMessage = message || body;
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, type, title, finalMessage, link]
    );

    // Real-time dispatch
    const io = getIO();
    io.to(`user-${userId}`).emit('notification', {
      id,
      type,
      title,
      message: finalMessage,
      link,
      created_at: new Date(),
      is_read: false
    });

    // Email notification
    if (emailNotify) {
      const [[user]] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
      if (user) {
        await transporter.sendMail({
          from: `"AEMS Academy" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: title,
          text: finalMessage,
          html: `<div style="font-family: sans-serif;">
            <h2>${title}</h2>
            <p>${finalMessage}</p>
            ${link ? `<a href="${process.env.FRONTEND_URL}${link}" style="display: inline-block; padding: 10px 20px; background: #007AFF; color: white; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
          </div>`
        });
      }
    }

    return id;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const broadcastToCourse = async (courseId, { title, message, link, type = 'announcement', emailNotify = true }) => {
  try {
    const [enrollments] = await pool.query('SELECT student_id FROM enrollments WHERE course_id = ?', [courseId]);
    
    for (const enrollment of enrollments) {
      await createNotification({
        userId: enrollment.student_id,
        type,
        title,
        message,
        link,
        emailNotify
      });
    }
  } catch (error) {
    console.error('Error broadcasting notification:', error);
  }
};
