import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigService } from './config.service.js';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class EmailService {
  constructor() {
    this.ready = false;
    this.useGmailApi = false;
    this.sendMail = this.sendEmail.bind(this);
    this.init();
  }

  async init() {
    try {
      // Fetch dynamic config from DB (unmasked)
      let configMap = {};
      try {
        const config = await ConfigService.getAll(false);
        config.forEach(c => configMap[c.key] = c.value);
      } catch(e) {
        console.warn('Could not fetch config from DB, falling back to ENV');
      }

      this.smtpUser = configMap.smtp_user || process.env.SMTP_USER;
      this.smtpHost = configMap.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
      this.smtpPort = configMap.smtp_port || process.env.SMTP_PORT || 465;
      
      this.clientId = configMap.smtp_client_id || process.env.SMTP_CLIENT_ID;
      this.clientSecret = configMap.smtp_client_secret || process.env.SMTP_CLIENT_SECRET;
      this.refreshToken = configMap.smtp_refresh_token || process.env.SMTP_REFRESH_TOKEN;
      this.smtpPass = configMap.smtp_pass || process.env.SMTP_PASS;
      
      this.smtpFromEmail = configMap.smtp_from_email || process.env.SMTP_FROM || 'noreply@kefta.in';
      this.smtpFromName = configMap.smtp_from_name || 'Kefta Talent Hunt';

      if (this.smtpUser && this.clientId && this.clientSecret && this.refreshToken) {
        this.useGmailApi = true;
        this.ready = true;
      } else if (this.smtpUser && this.smtpPass) {
        this.transporter = nodemailer.createTransport({
          host: this.smtpHost,
          port: parseInt(this.smtpPort, 10),
          secure: parseInt(this.smtpPort, 10) === 465, // true for 465, false for other ports
          auth: {
            user: this.smtpUser,
            pass: this.smtpPass
          }
        });
        this.useGmailApi = false;
        this.ready = true;
      } else {
        // Fallback to ethereal if no config provided
        this.ready = false;
        this.useGmailApi = false;
        console.warn('No SMTP credentials found in DB or ENV. Emails will be logged to console.');
      }
    } catch (err) {
      console.error('EmailService init error:', err);
      this.ready = false;
      this.useGmailApi = false;
    }
  }

  async sendEmailViaGmailApi({ to, subject, html }) {
    try {
      // 1. Refresh Access Token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      });
      const accessToken = tokenResponse.data.access_token;

      // 2. Construct raw RFC 2822 message
      const rawMessage = [
        `From: "${this.smtpFromName}" <${this.smtpFromEmail}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html
      ].join('\r\n');

      // 3. Base64url encode the message
      const base64SafeString = Buffer.from(rawMessage, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 4. Send via Gmail REST API
      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: base64SafeString },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Email sent via Gmail API:', response.data.id);
      return { messageId: response.data.id };
    } catch (error) {
      console.error('Gmail REST API send error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendEmail({ to, subject, html }) {
    await this.init(); // Refresh config dynamically before sending

    if (!this.ready) {
      console.log('\n--- EMAIL LOG (NO SMTP) ---');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', html);
      console.log('---------------------------\n');
      return { messageId: 'console-log' };
    }

    try {
      if (this.useGmailApi) {
        return await this.sendEmailViaGmailApi({ to, subject, html });
      } else {
        const info = await this.transporter.sendMail({
          from: `"${this.smtpFromName}" <${this.smtpFromEmail}>`,
          to,
          subject,
          html
        });
        console.log('Email sent: %s', info.messageId);
        if (info.host === 'smtp.ethereal.email') {
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return info;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email, token) {
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #007AFF;">Reset Your Password</h2>
          <p>You requested a password reset for your AEMS Academy account.</p>
          <p>Please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; background: #007AFF; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">This link will expire in 1 hour.</p>
        </div>
      `;

      await this.sendEmail({
        to: email,
        subject: 'Reset Your Password - AEMS Academy',
        html
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  async sendWelcomeEmail(student, credentials, courseName) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails/welcome-student.html');
      let html = await fs.readFile(templatePath, 'utf-8');

      // Replace placeholders
      html = html
        .replace(/{{NAME}}/g, student.name)
        .replace(/{{EMAIL}}/g, student.email)
        .replace(/{{PASSWORD}}/g, credentials.password)
        .replace(/{{COURSE_NAME}}/g, courseName)
        .replace(/{{LOGIN_URL}}/g, `${process.env.FRONTEND_URL}/login`);

      await this.sendEmail({
        to: student.email,
        subject: 'Your Student Account Has Been Created',
        html
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // We don't throw here to avoid failing the whole conversion flow if email fails
    }
  }

  async sendCourseCompletionEmail(student, courseName, completionDate, certificateDetails) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails/course-completion.html');
      let html = await fs.readFile(templatePath, 'utf-8');

      const dateStr = new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      let certText = '';
      let certButton = '';
      
      if (certificateDetails && certificateDetails.pdfUrl) {
        certText = 'Your certificate of completion has been generated and is now available for download.';
        const fullPdfUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}${certificateDetails.pdfUrl}`;
        certButton = `<a href="${fullPdfUrl}" target="_blank" class="btn">Download Certificate</a>`;
      }

      let profilePicHtml = '';
      if (student.name) {
        const parts = student.name.trim().split(' ');
        let initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]) : parts[0].substring(0, 2);
        initials = initials.toUpperCase();
        
        if (student.avatar_url) {
          const fullAvatarUrl = student.avatar_url.startsWith('http') ? student.avatar_url : `${process.env.FRONTEND_URL || 'http://localhost:3000'}${student.avatar_url}`;
          profilePicHtml = `<img src="${fullAvatarUrl}" alt="Profile Picture" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 20px; object-fit: cover;">`;
        } else {
          profilePicHtml = `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #ec4899); color: #ffffff; font-size: 32px; font-weight: bold; line-height: 80px; text-align: center; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin: 0 auto 20px auto;">${initials}</div>`;
        }
      }

      html = html
        .replace(/{{PROFILE_PICTURE_HTML}}/g, profilePicHtml)
        .replace(/{{STUDENT_NAME}}/g, student.name)
        .replace(/{{COURSE_NAME}}/g, courseName)
        .replace(/{{COMPLETION_DATE}}/g, dateStr)
        .replace(/{{CERTIFICATE_TEXT}}/g, certText)
        .replace(/{{CERTIFICATE_BUTTON}}/g, certButton)
        .replace(/{{FRONTEND_URL}}/g, process.env.FRONTEND_URL || 'http://localhost:3000');

      await this.sendEmail({
        to: student.email,
        subject: `Congratulations on Completing ${courseName}! 🎉`,
        html
      });
    } catch (error) {
      console.error('Failed to send course completion email:', error);
    }
  }

  async sendPlacementEmail(student, jobTitle, companyName) {
    try {
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #4f46e5;">🎉 Congratulations! You Have Been Selected</h2>
          <p>Dear ${student.name || 'Candidate'},</p>
          <p>We are thrilled to inform you that you have been selected for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
          <p>Your hard work and dedication have paid off. The employer will be reaching out to you shortly with the official offer details and your joining schedule.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/placements" style="display: inline-block; padding: 14px 30px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Placement Details</a>
          </div>
          <p style="font-size: 14px; color: #666;">If you have any questions, feel free to contact your career counselor or the employer directly.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">AEMS Academy Placement Cell</p>
        </div>
      `;

      await this.sendEmail({
        to: student.email,
        subject: `Congratulations! You Have Been Selected for ${jobTitle}`,
        html
      });
    } catch (error) {
      console.error('Failed to send placement email:', error);
    }
  }
}

export default new EmailService();
