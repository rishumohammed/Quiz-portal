import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigService } from './config.service.js';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class EmailService {
  constructor() {
    this.ready = false;
    this.resendApiKey = '';
    this.fromEmail = 'noreply@kefta.in';
    this.fromName = 'Kefta Talent Hunt';
    this.sendMail = this.sendEmail.bind(this);
    this.init();
  }

  async init() {
    try {
      // Fetch dynamic config from DB (unmasked)
      let configMap = {};
      try {
        const config = await ConfigService.getAll(false);
        config.forEach(c => { configMap[c.key] = c.value; });
      } catch (e) {
        console.warn('Could not fetch config from DB, falling back to ENV');
      }

      this.resendApiKey = configMap.resend_api_key || process.env.RESEND_API_KEY || '';
      this.fromEmail = configMap.smtp_from_email || configMap.resend_from_email || process.env.RESEND_FROM || process.env.SMTP_FROM || 'noreply@kefta.in';
      this.fromName = configMap.smtp_from_name || process.env.SMTP_FROM_NAME || 'Kefta Talent Hunt';

      if (this.resendApiKey && this.resendApiKey.trim().length > 0) {
        this.ready = true;
      } else {
        this.ready = false;
      }
    } catch (err) {
      console.error('EmailService init error:', err);
      this.ready = false;
    }
  }

  async sendEmailViaResend({ to, subject, html, attachments }) {
    try {
      const recipientList = Array.isArray(to) ? to : [to];
      const fromField = this.fromName ? `"${this.fromName}" <${this.fromEmail}>` : this.fromEmail;

      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromField,
          to: recipientList,
          subject: subject,
          html: html,
          ...(attachments && { attachments })
        },
        {
          headers: {
            Authorization: `Bearer ${this.resendApiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('Email successfully dispatched via Resend REST API:', response.data?.id);
      return { messageId: response.data?.id, ...response.data };
    } catch (error) {
      const errorDetail = error.response?.data?.message || error.response?.data?.error || error.message;
      console.error('Resend REST API send error:', error.response?.data || error.message);
      throw new Error(`Resend Email Error: ${errorDetail}`);
    }
  }

  async sendEmail({ to, subject, html, attachments }) {
    await this.init(); // Refresh config dynamically before sending

    if (!this.ready) {
      console.log('\n--- EMAIL LOG (NO RESEND API KEY CONFIGURED) ---');
      console.log('From:', `"${this.fromName}" <${this.fromEmail}>`);
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', html);
      console.log('------------------------------------------------\n');
      return { messageId: 'console-log-dev-mode', status: 'logged_to_console' };
    }

    try {
      return await this.sendEmailViaResend({ to, subject, html, attachments });
    } catch (error) {
      console.error('Error sending email via Resend:', error.message);
      throw error;
    }
  }

  async sendPasswordResetEmail(email, token) {
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #007AFF;">Reset Your Password</h2>
          <p>You requested a password reset for your Kefta Talent Hunt account.</p>
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
        subject: 'Reset Your Password - Kefta Talent Hunt',
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
        subject: 'Your Account Has Been Created',
        html
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
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
          <p style="font-size: 12px; color: #999;">Kefta Talent Hunt Team</p>
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

  async sendExamCertificateEmail(candidate, exam, pdfBuffer) {
    try {
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #4f46e5;">Congratulations! 🎉</h2>
          <p>Dear ${candidate.name},</p>
          <p>Thank you for participating in <strong>${exam.name}</strong>.</p>
          <p>We have attached your Certificate of Participation to this email.</p>
          <p style="font-size: 14px; color: #666;">If you have any questions, feel free to contact us.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">Kefta Talent Hunt Team</p>
        </div>
      `;

      await this.sendEmail({
        to: candidate.email,
        subject: `Your Certificate for ${exam.name}`,
        html,
        attachments: [
          {
            filename: `Certificate_${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            content: pdfBuffer.toString('base64'),
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send exam certificate email:', error);
    }
  }

  async sendFaceReEnrollmentEmail(candidate, exam, reEnrollUrl) {
    try {
      const html = `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: #6366f1; color: #ffffff; font-size: 28px;">📷</div>
            <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px;">Face Re-Enrollment Request</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">${exam.name}</p>
          </div>
          
          <p>Dear <strong>${candidate.name}</strong>,</p>
          <p>The exam administrator has issued a single-use link for you to re-enroll your face photo and verification profile for <strong>${exam.name}</strong>.</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
            <strong style="color: #334155; display: block; margin-bottom: 4px;">Important Security Note:</strong>
            <span style="color: #64748b; font-size: 13px; line-height: 1.5;">This re-enrollment link is single-use and will automatically expire as soon as you successfully submit your new selfie photos.</span>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${reEnrollUrl}" style="display: inline-block; padding: 14px 32px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">
              Re-Enroll Your Face Profile Now →
            </a>
          </div>

          <p style="font-size: 13px; color: #94a3b8; text-align: center;">If the button above does not work, copy and paste this link into your browser:<br><a href="${reEnrollUrl}" style="color: #6366f1;">${reEnrollUrl}</a></p>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Kefta Talent Hunt Security Team</p>
        </div>
      `;

      await this.sendEmail({
        to: candidate.email,
        subject: `[Action Required] Face Re-Enrollment Link for ${exam.name}`,
        html
      });
    } catch (error) {
      console.error('Failed to send face re-enrollment email:', error);
    }
  }

  async sendExam24hReminderEmail(candidate, exam, loginUrl) {
    try {
      const examDateStr = exam.exam_start_date ? new Date(exam.exam_start_date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : 'Tomorrow';
      const verifyFaceUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-exams/${exam.slug}/verify-face`;

      const html = `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: #eab308; color: #ffffff; font-size: 28px;">⏰</div>
            <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px;">Exam Starts in 24 Hours!</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">${exam.name}</p>
          </div>
          
          <p>Dear <strong>${candidate.name}</strong>,</p>
          <p>This is a friendly reminder that your upcoming examination <strong>${exam.name}</strong> is scheduled to begin in 24 hours.</p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; margin: 20px 0; border-radius: 10px;">
            <div style="margin-bottom: 8px;"><strong>Exam Schedule:</strong> ${examDateStr}</div>
            <div style="margin-bottom: 8px;"><strong>Exam Duration:</strong> ${exam.duration_minutes || 60} Minutes</div>
            <div><strong>Registered Email:</strong> ${candidate.email}</div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">
              Access Exam Portal →
            </a>
          </div>

          <div style="background: #eef2ff; border-radius: 10px; padding: 16px; text-align: center; margin-top: 20px;">
            <strong style="color: #3730a3; display: block; margin-bottom: 4px;">Camera & Face Verification Check</strong>
            <span style="color: #4338ca; font-size: 13px;">Test your webcam before exam time:</span><br>
            <a href="${verifyFaceUrl}" style="color: #4f46e5; font-weight: bold; font-size: 13px; display: inline-block; margin-top: 6px;">Test Face Enrollment Status →</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Kefta Talent Hunt Examination Team</p>
        </div>
      `;

      await this.sendEmail({
        to: candidate.email,
        subject: `[24-Hour Reminder] ${exam.name} Starts Tomorrow!`,
        html
      });
    } catch (error) {
      console.error('Failed to send 24h reminder email:', error);
    }
  }

  async sendExamReConductNotification(candidate, exam, loginUrl) {
    try {
      const examDateStr = exam.exam_start_date ? new Date(exam.exam_start_date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : 'Scheduled Soon';

      const html = `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 28px;">📢</div>
            <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px;">New Exam Schedule Announced</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">${exam.name}</p>
          </div>
          
          <p>Dear <strong>${candidate.name}</strong>,</p>
          <p>The examination administrator has re-scheduled <strong>${exam.name}</strong> for registered candidates. You can log in and take the exam on the new schedule below.</p>

          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <div style="margin-bottom: 6px;"><strong>New Exam Date/Time:</strong> ${examDateStr}</div>
            <div style="margin-bottom: 6px;"><strong>Duration:</strong> ${exam.duration_minutes || 60} Minutes</div>
            <div><strong>Registered Account:</strong> ${candidate.email}</div>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">
              Log In to Write Exam →
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Kefta Talent Hunt Examination Team</p>
        </div>
      `;

      await this.sendEmail({
        to: candidate.email,
        subject: `[Important] New Schedule for ${exam.name}`,
        html
      });
    } catch (error) {
      console.error('Failed to send exam re-conduct email:', error);
    }
  }
}

export default new EmailService();
