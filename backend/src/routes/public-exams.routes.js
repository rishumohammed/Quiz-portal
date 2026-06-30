import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { pool, redis } from '../db/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createNotification } from '../services/notification.service.js';
import { ConfigService } from '../services/config.service.js';
import EmailService from '../services/email.service.js';

const PUBLIC_EXAM_JWT_SECRET = process.env.PUBLIC_EXAM_JWT_SECRET || 'aems_public_exam_secret_key_2024';

// Middleware: verify candidate JWT for exam access
function verifyCandidateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Please login to access this exam.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, PUBLIC_EXAM_JWT_SECRET);
    req.candidate = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session. Please login again.' });
  }
}

const router = express.Router();

// Helper to grade correct answers
function gradeQuestion(type, correct, submitted) {
  if (submitted === undefined || submitted === null) return false;
  
  const cleanStr = (val) => val.toString().trim().toLowerCase();
  
  if (type === 'mcq' || type === 'truefalse') {
    return cleanStr(correct) === cleanStr(submitted);
  }
  if (type === 'fib') {
    return cleanStr(correct) === cleanStr(submitted);
  }
  if (type === 'msq') {
    try {
      const correctArr = Array.isArray(correct) ? correct : JSON.parse(correct);
      const submittedArr = Array.isArray(submitted) ? submitted : JSON.parse(submitted);
      
      if (!Array.isArray(correctArr) || !Array.isArray(submittedArr)) {
        return cleanStr(correct) === cleanStr(submitted);
      }
      if (correctArr.length !== submittedArr.length) return false;
      
      const cleanAndSort = (arr) => arr.map(x => cleanStr(x)).sort();
      const cSorted = cleanAndSort(correctArr);
      const sSorted = cleanAndSort(submittedArr);
      
      return cSorted.every((val, idx) => val === sSorted[idx]);
    } catch (e) {
      return cleanStr(correct) === cleanStr(submitted);
    }
  }
  return false;
}

// 1. GET /api/public/exams/categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query("SELECT * FROM public_exam_categories WHERE status = 'active' ORDER BY name ASC");
    res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. GET /api/public/exams
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = `
      SELECT e.*, c.name as category_name, c.slug as category_slug
      FROM public_exams e
      JOIN public_exam_categories c ON e.category_id = c.id
      WHERE e.status = 'published' AND c.status = 'active'
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ' AND (c.slug = ? OR c.id = ?)';
      params.push(category, category);
    }

    if (search) {
      query += ' AND (e.name LIKE ? OR e.description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY e.created_at DESC';

    const [exams] = await pool.query(query, params);
    res.json(exams);
  } catch (error) {
    console.error('Fetch exams error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/public/exams/terms-privacy
router.get('/terms-privacy', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM system_config WHERE `key` IN ('terms_content', 'terms_version', 'privacy_content', 'privacy_version')");
    const config = {};
    rows.forEach(r => {
      config[r.key] = r.value;
    });
    res.json({
      terms_content: config.terms_content || 'Default Terms & Conditions Content.',
      terms_version: config.terms_version || '1.0',
      privacy_content: config.privacy_content || 'Default Privacy Policy Content.',
      privacy_version: config.privacy_version || '1.0'
    });
  } catch (error) {
    console.error('Fetch terms-privacy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. GET /api/public/exams/:slug
router.get('/:slug', async (req, res) => {
  try {
    const [exams] = await pool.query(`
      SELECT e.*, e.registration_status, c.name as category_name, c.slug as category_slug
      FROM public_exams e
      JOIN public_exam_categories c ON e.category_id = c.id
      WHERE e.slug = ? AND e.status = 'published' AND c.status = 'active'
    `, [req.params.slug]);

    if (exams.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = exams[0];
    res.json(exam);
  } catch (error) {
    console.error('Fetch exam error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CANDIDATE LOGIN — POST /api/public/candidates/login
router.post('/candidates/login', async (req, res) => {
  try {
    const { email, password, exam_slug } = req.body;

    if (!email || !password || !exam_slug) {
      return res.status(400).json({ message: 'Email, password, and exam slug are required.' });
    }

    // Find exam by slug
    const [exams] = await pool.query(
      'SELECT id, name, slug, status FROM public_exams WHERE slug = ?',
      [exam_slug]
    );
    if (exams.length === 0) {
      return res.status(404).json({ message: 'Exam not found.' });
    }
    const exam = exams[0];

    // Find candidate for this exam
    const [candidates] = await pool.query(
      'SELECT id, name, email, phone, password_hash, registration_status FROM public_exam_candidates WHERE email = ? AND exam_id = ?',
      [email.trim().toLowerCase(), exam.id]
    );

    if (candidates.length === 0) {
      return res.status(403).json({
        message: 'You are not registered for this examination. Please complete registration first.',
        code: 'NOT_REGISTERED'
      });
    }

    const candidate = candidates[0];

    // Verify password
    const isValid = await bcrypt.compare(password, candidate.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid Email or Password.', code: 'INVALID_CREDENTIALS' });
    }

    // Update login stats
    await pool.query(
      'UPDATE public_exam_candidates SET login_count = login_count + 1, last_login_at = NOW() WHERE id = ?',
      [candidate.id]
    );

    // Issue JWT
    const token = jwt.sign(
      { candidateId: candidate.id, examId: exam.id, examSlug: exam.slug, name: candidate.name, email: candidate.email },
      PUBLIC_EXAM_JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      candidate: { id: candidate.id, name: candidate.name, email: candidate.email, phone: candidate.phone },
      exam: { id: exam.id, name: exam.name, slug: exam.slug }
    });
  } catch (error) {
    console.error('Candidate login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3.4 POST /api/public/exams/:slug/send-otp
router.post('/:slug/send-otp', async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [exams] = await pool.query('SELECT id, name, registration_status FROM public_exams WHERE slug = ?', [slug]);
    if (exams.length === 0) return res.status(404).json({ message: 'Exam not found' });
    if (exams[0].registration_status === 'closed') {
      return res.status(403).json({ message: 'Registrations are currently closed.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `exam_reg_otp:${slug}:${email.toLowerCase().trim()}`;
    
    await redis.setex(redisKey, 600, otp);

    const [tplRows] = await pool.query('SELECT subject, body FROM email_templates WHERE id = ?', ['exam_registration_otp']);
    let subject = tplRows[0].subject.replace(/{{exam_name}}/g, exams[0].name);
    
    const logoConfig = await ConfigService.getByKey('app_logo');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const logoUrl = logoConfig?.value ? (logoConfig.value.startsWith('http') ? logoConfig.value : `${backendUrl}${logoConfig.value}`) : '';

    let html = tplRows[0].body
      .replace(/{{name}}/g, name || 'Candidate')
      .replace(/{{exam_name}}/g, exams[0].name)
      .replace(/{{otp}}/g, otp)
      .replace(/{{brand_logo}}/g, logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 50px; margin-bottom: 20px;" />` : '');

    await EmailService.sendEmail({
      to: email,
      subject: subject,
      html
    });

    res.json({ message: 'OTP sent successfully to your email.' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
  }
});

// 3.5 POST /api/public/exams/:slug/register
router.post('/:slug/register', async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, phone, password, country, state, city, qualification, college, course_stream, year_of_study, agreed_to_terms, otp } = req.body;

    if (!agreed_to_terms) {
      return res.status(400).json({ message: 'You must agree to the Terms & Conditions and Privacy Policy to continue.' });
    }
    
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required. Please verify your email.' });
    }

    const [exams] = await pool.query('SELECT id, name, slug, status, registration_status, exam_start_date, duration_minutes FROM public_exams WHERE slug = ?', [slug]);
    if (exams.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    const exam = exams[0];

    // Block registration if closed
    if (exam.registration_status === 'closed') {
      return res.status(403).json({ message: 'Registrations for this examination are currently closed. Please contact the administrator.' });
    }

    // Check if candidate already registered for THIS exam
    const [existing] = await pool.query('SELECT id FROM public_exam_candidates WHERE email = ? AND exam_id = ?', [email, exam.id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already registered for this exam.' });
    }

    // Verify OTP
    const redisKey = `exam_reg_otp:${slug}:${email.toLowerCase().trim()}`;
    const storedOtp = await redis.get(redisKey);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Fetch config versions
    const [configRows] = await pool.query("SELECT * FROM system_config WHERE `key` IN ('terms_version', 'privacy_version')");
    const config = {};
    configRows.forEach(r => { config[r.key] = r.value; });
    const termsVersion = config.terms_version || '1.0';
    const privacyVersion = config.privacy_version || '1.0';

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const candidateId = uuidv4();
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO public_exam_candidates 
        (id, exam_id, name, email, phone, password_hash, country, state, city, qualification, college, course_stream, year_of_study, agreed_to_terms, registration_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
      `, [candidateId, exam.id, name, email, phone, password_hash, country || null, state || null, city || null, qualification || null, college || null, course_stream || null, year_of_study || null, !!agreed_to_terms]);

      await connection.query(`
        INSERT INTO terms_privacy_acceptances (id, candidate_id, accepted_terms_version, accepted_privacy_version, ip_address)
        VALUES (?, ?, ?, ?, ?)
      `, [uuidv4(), candidateId, termsVersion, privacyVersion, clientIp]);

      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
    
    // Clean up OTP
    await redis.del(redisKey);

    // Send Registration Success Email
    try {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-exams/${exam.slug}`;
      const examDate = exam.exam_start_date ? new Date(exam.exam_start_date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : 'TBD';
      
      const [tplRows] = await pool.query('SELECT subject, body FROM email_templates WHERE id = ?', ['exam_registration_success']);
      let subject = tplRows[0].subject.replace(/{{exam_name}}/g, exam.name);
      
      const logoConfig = await ConfigService.getByKey('app_logo');
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const logoUrl = logoConfig?.value ? (logoConfig.value.startsWith('http') ? logoConfig.value : `${backendUrl}${logoConfig.value}`) : '';

      let html = tplRows[0].body
        .replace(/{{name}}/g, name || 'Candidate')
        .replace(/{{exam_name}}/g, exam.name)
        .replace(/{{exam_date}}/g, examDate)
        .replace(/{{exam_duration}}/g, exam.duration_minutes || '--')
        .replace(/{{email}}/g, email)
        .replace(/{{password}}/g, password)
        .replace(/{{exam_link}}/g, loginUrl)
        .replace(/{{brand_logo}}/g, logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 50px; margin-bottom: 20px;" />` : '');
      await EmailService.sendEmail({
        to: email,
        subject: subject,
        html
      });
    } catch (e) {
      console.warn('Failed to send registration success email:', e.message);
    }

    res.status(201).json({
      message: 'Registration Successful',
      candidate: {
        id: candidateId,
        name,
        email,
        exam_id: exam.id,
        exam_name: exam.name
      }
    });
  } catch (error) {
    console.error('Candidate registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. POST /api/public/exams/:id/attempt  (requires candidate JWT)
router.post('/:id/attempt', verifyCandidateToken, async (req, res) => {
  try {
    const candidateFromToken = req.candidate;
    const examId = req.params.id;
    const { guest_name, guest_email, guest_phone, is_anonymous, candidate_id } = req.body;

    // Ensure the candidate token matches this exam
    if (candidateFromToken.examId !== examId) {
      return res.status(403).json({ message: 'You are not authorised to access this exam. Please login with the correct credentials.' });
    }

    const [exams] = await pool.query('SELECT * FROM public_exams WHERE id = ? AND status = ?', [examId, 'published']);
    if (exams.length === 0) {
      return res.status(404).json({ message: 'Exam not found or inactive' });
    }
    const exam = exams[0];

    // Check Anonymous access restrictions
    if (!exam.anonymous_access && is_anonymous) {
      return res.status(400).json({ message: 'Anonymous access is disabled for this exam. Please provide registration details.' });
    }

    // Input fields constraints checking
    if (!is_anonymous) {
      if (exam.require_name && !guest_name) {
        return res.status(400).json({ message: 'Candidate Name is required to start this exam.' });
      }
      if (exam.require_email && !guest_email) {
        return res.status(400).json({ message: 'Candidate Email is required to start this exam.' });
      }
      if (exam.require_mobile && !guest_phone) {
        return res.status(400).json({ message: 'Candidate Mobile Number is required to start this exam.' });
      }
    }

    // Compute Guest Name if anonymous
    let finalName = guest_name;
    if (is_anonymous || !guest_name) {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      finalName = `Guest ${randNum}`;
    }

    const attemptId = uuidv4();
    const durationSec = exam.duration_minutes * 60;
    const sessionExpiresAt = new Date(Date.now() + (durationSec + 300) * 1000); // 5 min buffer

    // Insert attempt
    await pool.query(`
      INSERT INTO public_exam_attempts (id, exam_id, guest_name, guest_email, guest_phone, is_anonymous, started_at, status, answers_json, session_expires_at, candidate_id)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), 'in_progress', '[]', ?, ?)
    `, [
      attemptId,
      examId,
      finalName,
      guest_email || null,
      guest_phone || null,
      !!is_anonymous,
      sessionExpiresAt,
      candidate_id || null
    ]);

    // Fetch questions WITH optional randomization
    let [questions] = await pool.query(`
      SELECT id, question_text, type, options_json, marks, order_index
      FROM public_exam_questions
      WHERE exam_id = ?
      ORDER BY order_index ASC
    `, [examId]);

    let formattedQuestions = questions.map(q => {
      let opts = q.options_json ? (typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json) : [];
      if (exam.randomize_options && Array.isArray(opts)) {
        opts = [...opts].sort(() => Math.random() - 0.5);
      }
      return {
        id: q.id,
        question_text: q.question_text,
        type: q.type,
        marks: q.marks,
        order_index: q.order_index,
        options: opts
      };
    });

    if (exam.randomize_questions) {
      formattedQuestions = [...formattedQuestions].sort(() => Math.random() - 0.5);
    }

    res.status(201).json({
      attempt_id: attemptId,
      guest_name: finalName,
      duration_seconds: durationSec,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('Create attempt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. POST /api/public/exams/attempts/:id/save
router.post('/attempts/:id/save', async (req, res) => {
  try {
    const { answers } = req.body;
    const attemptId = req.params.id;

    const [attempts] = await pool.query('SELECT status, session_expires_at FROM public_exam_attempts WHERE id = ?', [attemptId]);
    if (attempts.length === 0) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempts[0].status !== 'in_progress') {
      return res.status(400).json({ message: 'Exam has already been submitted' });
    }

    // Check expiration
    if (new Date() > new Date(attempts[0].session_expires_at)) {
      return res.status(400).json({ message: 'Exam session expired' });
    }

    await pool.query(
      'UPDATE public_exam_attempts SET answers_json = ? WHERE id = ?',
      [JSON.stringify(answers || [])],
      attemptId
    );

    res.json({ message: 'Answers saved successfully' });
  } catch (error) {
    console.error('Save answers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 6. POST /api/public/exams/attempts/:id/submit
router.post('/attempts/:id/submit', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const attemptId = req.params.id;
    const { answers } = req.body; // Array of { question_id, answer }

    await connection.beginTransaction();

    const [attempts] = await connection.query(`
      SELECT a.*, e.passing_marks, e.total_marks, e.negative_marking, e.pass_percentage
      FROM public_exam_attempts a
      JOIN public_exams e ON a.exam_id = e.id
      WHERE a.id = ?
    `, [attemptId]);

    if (attempts.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const attempt = attempts[0];
    if (attempt.status !== 'in_progress') {
      connection.release();
      return res.status(400).json({ message: 'Attempt already submitted' });
    }

    // Fetch all questions with correct answers to grade
    const [questions] = await connection.query(
      'SELECT id, type, correct_answer, marks FROM public_exam_questions WHERE exam_id = ?',
      [attempt.exam_id]
    );

    const guestAnswers = answers || [];
    let correctAnswersCount = 0;
    let wrongAnswersCount = 0;
    let calculatedScore = 0;

    for (const q of questions) {
      const gAns = guestAnswers.find(ga => ga.question_id === q.id);
      
      if (gAns && gAns.answer !== undefined && gAns.answer !== null && gAns.answer !== '') {
        const isCorrect = gradeQuestion(q.type, q.correct_answer, gAns.answer);
        if (isCorrect) {
          correctAnswersCount++;
          calculatedScore += q.marks;
        } else {
          wrongAnswersCount++;
          // Apply negative marking if configured
          if (attempt.negative_marking > 0) {
            calculatedScore -= parseFloat(attempt.negative_marking);
          }
        }
      } else {
        // Unanswered questions do not incur negative marking in standard exams
        wrongAnswersCount++;
      }
    }

    // Capping score to 0 to avoid negative totals
    calculatedScore = Math.max(0, calculatedScore);

    const totalMarks = attempt.total_marks || 1;
    const percentage = parseFloat(((calculatedScore / totalMarks) * 100).toFixed(2));
    
    // Evaluate pass status based on score or pass percentage
    let passed = false;
    if (attempt.pass_percentage > 0) {
      passed = percentage >= attempt.pass_percentage;
    } else {
      passed = calculatedScore >= attempt.passing_marks;
    }

    // Time Taken calculation
    const startedAt = new Date(attempt.started_at);
    const submittedAt = new Date();
    const timeTakenSec = Math.max(0, Math.floor((submittedAt - startedAt) / 1000));

    // Update attempt
    await connection.query(`
      UPDATE public_exam_attempts 
      SET status = 'submitted', submitted_at = ?, answers_json = ?
      WHERE id = ?
    `, [submittedAt, JSON.stringify(guestAnswers), attemptId]);

    // Create result
    const resultId = uuidv4();
    await connection.query(`
      INSERT INTO public_exam_results (id, attempt_id, exam_id, score, percentage, correct_answers, wrong_answers, time_taken_seconds, passed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      resultId,
      attemptId,
      attempt.exam_id,
      calculatedScore,
      percentage,
      correctAnswersCount,
      wrongAnswersCount,
      timeTakenSec,
      passed
    ]);

    await connection.commit();
    connection.release();

    res.json({
      message: 'Exam submitted successfully',
      result_id: resultId,
      score: calculatedScore,
      percentage,
      passed
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Submit exam error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 7. GET /api/public/exams/attempts/:id/result
router.get('/attempts/:id/result', async (req, res) => {
  try {
    const attemptId = req.params.id;

    // Fetch attempt details and graded results
    const [results] = await pool.query(`
      SELECT r.*, a.guest_name, a.guest_email, a.is_anonymous, a.answers_json, e.name as exam_name, e.passing_marks, e.total_marks, e.duration_minutes,
             e.show_correct_answers, e.show_explanations, e.allow_retake, e.enable_certificate
      FROM public_exam_results r
      JOIN public_exam_attempts a ON r.attempt_id = a.id
      JOIN public_exams e ON r.exam_id = e.id
      WHERE r.attempt_id = ?
    `, [attemptId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Result not found for this attempt' });
    }

    const result = results[0];

    // Fetch questions to render reviews
    const [questions] = await pool.query(`
      SELECT id, question_text, type, options_json, correct_answer, explanation, marks
      FROM public_exam_questions
      WHERE exam_id = ?
      ORDER BY order_index ASC
    `, [result.exam_id]);

    const parsedAnswers = typeof result.answers_json === 'string' ? JSON.parse(result.answers_json) : result.answers_json;

    const reviewQuestions = questions.map(q => {
      const gAns = parsedAnswers.find(ga => ga.question_id === q.id);
      
      const val = {
        id: q.id,
        question_text: q.question_text,
        type: q.type,
        options: q.options_json ? (typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json) : [],
        marks: q.marks,
        guest_answer: gAns?.answer || null,
        is_correct: gradeQuestion(q.type, q.correct_answer, gAns?.answer)
      };

      // Security checking: hide answers and explanations if config specifies it
      if (result.show_correct_answers) {
        val.correct_answer = q.correct_answer;
      }
      if (result.show_explanations) {
        val.explanation = q.explanation;
      }

      return val;
    });

    res.json({
      result_id: result.id,
      attempt_id: result.attempt_id,
      guest_name: result.guest_name,
      is_anonymous: result.is_anonymous,
      exam_name: result.exam_name,
      score: result.score,
      total_marks: result.total_marks,
      percentage: result.percentage,
      correct_answers: result.correct_answers,
      wrong_answers: result.wrong_answers,
      time_taken_seconds: result.time_taken_seconds,
      passed: !!result.passed,
      passing_marks: result.passing_marks,
      allow_retake: !!result.allow_retake,
      enable_certificate: !!result.enable_certificate,
      questions: reviewQuestions
    });
  } catch (error) {
    console.error('Fetch result error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 8. GET /api/public/exams/:id/leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const examId = req.params.id;
    const { filter = 'all' } = req.query;

    let dateConstraint = '';
    if (filter === 'week') {
      dateConstraint = 'AND r.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (filter === 'month') {
      dateConstraint = 'AND r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    const [scores] = await pool.query(`
      SELECT r.score, r.percentage, r.time_taken_seconds, a.guest_name, a.is_anonymous, r.created_at
      FROM public_exam_results r
      JOIN public_exam_attempts a ON r.attempt_id = a.id
      WHERE r.exam_id = ? ${dateConstraint}
      ORDER BY r.score DESC, r.time_taken_seconds ASC, r.created_at ASC
      LIMIT 10
    `, [examId]);

    const leaderboard = scores.map((s, idx) => ({
      rank: idx + 1,
      name: s.is_anonymous ? 'Anonymous User' : s.guest_name,
      score: s.score,
      percentage: s.percentage,
      time_taken_seconds: s.time_taken_seconds,
      date: s.created_at
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 9. GET /api/public/exams/attempts/:id/certificate
router.get('/attempts/:id/certificate', async (req, res) => {
  try {
    const attemptId = req.params.id;

    // Fetch result & attempt details
    const [rows] = await pool.query(`
      SELECT r.*, a.guest_name, e.name as exam_name, e.total_marks, e.enable_certificate
      FROM public_exam_results r
      JOIN public_exam_attempts a ON r.attempt_id = a.id
      JOIN public_exams e ON r.exam_id = e.id
      WHERE r.attempt_id = ?
    `, [attemptId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Attempt result not found' });
    }

    const data = rows[0];
    if (!data.passed) {
      return res.status(400).json({ message: 'Certificate only available for passed exams' });
    }

    if (!data.enable_certificate) {
      return res.status(400).json({ message: 'Certificates are disabled for this exam' });
    }

    // Fetch Custom Certificate Settings
    const [customCerts] = await pool.query('SELECT * FROM public_exam_certificates WHERE exam_id = ?', [data.exam_id]);
    const custom = customCerts[0] || {};

    const pdfDir = path.join(process.cwd(), 'uploads', 'public_certificates');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const pdfFilename = `cert-${attemptId}.pdf`;
    const pdfPathLocal = path.join(pdfDir, pdfFilename);

    // Generate PDF using PDFKit
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const stream = fs.createWriteStream(pdfPathLocal);
    doc.pipe(stream);

    // Styling configuration (harmonious colors)
    const primaryColor = '#5624D0'; // Sleek Udemy Purple
    const goldAccent = '#E59819';   // Premium Gold
    const darkText = '#1A1A2E';

    // Outer premium borders
    doc.rect(15, 15, 811.89, 565.28).fill('#ffffff');
    doc.rect(25, 25, 791.89, 545.28).lineWidth(4).stroke(primaryColor);
    doc.rect(32, 32, 777.89, 531.28).lineWidth(1.5).stroke(goldAccent);

    // Render Custom Logo if present, otherwise default text
    if (custom.logo_url && custom.logo_url.startsWith('data:image')) {
      try {
        const logoData = custom.logo_url.split(',')[1];
        doc.image(Buffer.from(logoData, 'base64'), 395, 45, { width: 50 });
      } catch (err) {
        console.warn('Failed to render base64 logo in PDF:', err.message);
      }
    } else {
      // Default text header watermark
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#C2C2C2')
         .text('AEMS PUBLIC PRACTICE PORTAL · PRACTICE COMPLETION CERTIFICATE', 0, 50, { align: 'center', characterSpacing: 1.5 });
    }

    // Certificate Title
    const certTitle = custom.title || 'Practice Exam Certificate';
    doc.fontSize(36).font('Helvetica-Bold').fillColor(primaryColor)
       .text(certTitle, 0, 110, { align: 'center' });

    // Subtitle warnings
    doc.fontSize(11).font('Helvetica-Oblique').fillColor('#E15241')
       .text('Not Official Certification · Practice Completion Only', 0, 158, { align: 'center' });

    // Decorative line
    doc.moveTo(250, 185).lineTo(591.89, 185).lineWidth(1.5).stroke(goldAccent);

    // Main body text
    doc.fontSize(16).font('Helvetica').fillColor('#666666')
       .text('This is to certify that the public visitor', 0, 220, { align: 'center' });

    // Student/Guest Name
    doc.fontSize(36).font('Helvetica-Bold').fillColor(darkText)
       .text(data.guest_name, 0, 255, { align: 'center' });

    doc.fontSize(16).font('Helvetica').fillColor('#666666')
       .text('has successfully completed the practice entrance exam', 0, 320, { align: 'center' });

    // Exam Name
    doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor)
       .text(data.exam_name, 0, 355, { align: 'center' });

    // Score & Percentage
    doc.fontSize(14).font('Helvetica').fillColor('#444444')
       .text(`Scoring ${data.score} out of ${data.total_marks} marks (${data.percentage}%)`, 0, 395, { align: 'center' });

    // Completed Date
    const completedDate = new Date(data.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.fontSize(13).font('Helvetica').fillColor('#666666')
       .text(`Awarded on ${completedDate}`, 0, 435, { align: 'center' });

    // QR Code for verification
    const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public-exams`;
    const qrBuffer = await QRCode.toBuffer(portalUrl, { width: 90, margin: 1 });
    doc.image(qrBuffer, 690, 435, { width: 75 });
    doc.fontSize(8).font('Helvetica').fillColor('#999999')
       .text('Scan to take exams', 680, 515, { width: 95, align: 'center' });

    // Footer info
    doc.fontSize(9).font('Helvetica').fillColor('#A2A2A2')
       .text(`Attempt Verification ID: ${attemptId}`, 50, 520);

    // Custom Signature image or default signatory text
    if (custom.signature_url && custom.signature_url.startsWith('data:image')) {
      try {
        const sigData = custom.signature_url.split(',')[1];
        doc.image(Buffer.from(sigData, 'base64'), 380, 470, { width: 80 });
      } catch (err) {
        console.warn('Failed to render signature in PDF:', err.message);
      }
    } else {
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkText)
         .text('AEMS Practice Portal Team', 300, 500, { align: 'center' });
    }

    const signatoryLabel = custom.footer_text || 'Authorized Practice Signatory';
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(signatoryLabel, 300, 518, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      res.download(pdfPathLocal, `Practice-Certificate-${attemptId}.pdf`);
    });

    stream.on('error', (err) => {
      console.error('PDF stream error:', err);
      res.status(500).json({ message: 'Error generating PDF certificate' });
    });

  } catch (error) {
    console.error('Certificate error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 10. PUT /api/public/exams/attempts/:id/guest-info
router.put('/attempts/:id/guest-info', async (req, res) => {
  try {
    const { guest_name, guest_email, guest_phone } = req.body;
    const attemptId = req.params.id;

    if (!guest_name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    await pool.query(`
      UPDATE public_exam_attempts 
      SET guest_name = ?, guest_email = ?, guest_phone = ?, is_anonymous = false
      WHERE id = ?
    `, [guest_name, guest_email, guest_phone, attemptId]);

    res.json({ message: 'Guest info updated successfully' });
  } catch (error) {
    console.error('Update guest info error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
