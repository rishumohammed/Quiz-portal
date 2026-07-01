import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles, requirePermission } from '../middleware/auth.js';
import EmailService from '../services/email.service.js';

const router = express.Router();

// Ensure exams upload directory exists
const __filename = new URL(import.meta.url).pathname;
let __dirname = path.dirname(__filename);
if (process.platform === 'win32' && __dirname.startsWith('/')) __dirname = __dirname.substring(1);
const examsUploadDir = path.join(__dirname, '../../uploads/exams');
if (!fs.existsSync(examsUploadDir)) {
  fs.mkdirSync(examsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, examsUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

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

// Apply admin protection to all routes in this file
router.use(authenticateJWT, requirePermission('exams'));

// POST /api/admin/public-exams/upload-image
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const fileUrl = `/uploads/exams/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
});

// ─── 0. DASHBOARD STATS ────────────────────────────────────────────────────────

// GET /api/admin/public-exams/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [[{ totalExams }]] = await pool.query("SELECT COUNT(*) AS totalExams FROM public_exams WHERE status = 'published'");
    const [[{ totalCandidates }]] = await pool.query('SELECT COUNT(*) AS totalCandidates FROM public_exam_candidates');
    const [[{ totalAttempts }]] = await pool.query('SELECT COUNT(*) AS totalAttempts FROM public_exam_attempts');
    const [[{ passRate }]] = await pool.query('SELECT COALESCE(AVG(percentage), 0) AS passRate FROM public_exam_results');

    // Recent Candidates
    const [recentCandidates] = await pool.query(`
      SELECT c.id, c.name, c.email, c.created_at, e.name as exam_name
      FROM public_exam_candidates c
      JOIN public_exams e ON c.exam_id = e.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // System Health mock (since we are focusing on exam stats, we can keep the basics)
    const systemHealth = {
      diskUsage: 32,
      dbStatus: 'Online',
      redisStatus: 'Online'
    };

    res.json({
      kpis: {
        row1: [
          { title: 'Active Exams', value: totalExams, icon: 'mdi-file-document-multiple-outline', color: 'primary' },
          { title: 'Total Candidates', value: totalCandidates, icon: 'mdi-account-group-outline', color: 'info' },
          { title: 'Total Attempts', value: totalAttempts, icon: 'mdi-check-decagram-outline', color: 'success' },
          { title: 'Average Score', value: Number(passRate).toFixed(1) + '%', icon: 'mdi-chart-line', color: 'warning' }
        ]
      },
      recentCandidates,
      systemHealth
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── 1. CATEGORIES CRUD ────────────────────────────────────────────────────────

// GET /api/admin/public-exams/categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM public_exam_categories ORDER BY name ASC');
    res.json(categories);
  } catch (error) {
    console.error('Fetch admin categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/public-exams/categories
router.post('/categories', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Category Name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const id = uuidv4();

    await pool.query(
      'INSERT INTO public_exam_categories (id, name, slug, description, status) VALUES (?, ?, ?, ?, ?)',
      [id, name, slug, description || null, status || 'active']
    );

    res.status(201).json({ id, message: 'Category created successfully' });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/admin/public-exams/categories/:id
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      fields.push('slug = ?');
      values.push(slug);
    }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) return res.json({ message: 'Nothing to update' });

    values.push(req.params.id);
    await pool.query(`UPDATE public_exam_categories SET ${fields.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/public-exams/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    // Check if any exam is using this category
    const [exams] = await pool.query('SELECT id FROM public_exams WHERE category_id = ?', [req.params.id]);
    if (exams.length > 0) {
      return res.status(400).json({ message: 'Cannot delete category. It is referenced by public exams.' });
    }

    await pool.query('DELETE FROM public_exam_categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── 2. EXAM DUPLICATION ───────────────────────────────────────────────────────

// POST /api/admin/public-exams/:id/duplicate
router.post('/:id/duplicate', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const examId = req.params.id;

    const [exams] = await connection.query('SELECT * FROM public_exams WHERE id = ?', [examId]);
    if (exams.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Exam not found' });
    }
    const exam = exams[0];

    await connection.beginTransaction();

    const newExamId = uuidv4();
    const newName = `${exam.name} Copy`;
    let newSlug = `${exam.slug}-copy`;
    
    // Check slug uniqueness
    const [slugCheck] = await connection.query('SELECT id FROM public_exams WHERE slug = ?', [newSlug]);
    if (slugCheck.length > 0) {
      newSlug = `${newSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Insert duplicated exam
    await connection.query(`
      INSERT INTO public_exams (
        id, name, category_id, description, syllabus, duration_minutes, total_questions, total_marks, passing_marks, difficulty_level, status, slug, instructions, pass_percentage, negative_marking, randomize_questions, randomize_options, show_correct_answers, show_explanations, allow_retake, enable_certificate, anonymous_access, require_name, require_email, require_mobile, enable_proctoring, max_proctoring_warnings, enforce_fullscreen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newExamId, newName, exam.category_id, exam.description, exam.syllabus, exam.duration_minutes, exam.total_questions, exam.total_marks, exam.passing_marks, exam.difficulty_level, 'draft', newSlug,
      exam.instructions, exam.pass_percentage, exam.negative_marking, exam.randomize_questions, exam.randomize_options, exam.show_correct_answers, exam.show_explanations, exam.allow_retake, exam.enable_certificate, exam.anonymous_access, exam.require_name, exam.require_email, exam.require_mobile, exam.enable_proctoring, exam.max_proctoring_warnings, exam.enforce_fullscreen
    ]);

    // Copy questions
    const [questions] = await connection.query('SELECT * FROM public_exam_questions WHERE exam_id = ?', [examId]);
    for (const q of questions) {
      await connection.query(`
        INSERT INTO public_exam_questions (id, exam_id, question_text, type, options_json, correct_answer, explanation, marks, order_index, difficulty_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(), newExamId, q.question_text, q.type, q.options_json, q.correct_answer, q.explanation, q.marks, q.order_index, q.difficulty_level
      ]);
    }

    // Copy certificate settings if exists
    const [certs] = await connection.query('SELECT * FROM public_exam_certificates WHERE exam_id = ?', [examId]);
    if (certs.length > 0) {
      await connection.query(`
        INSERT INTO public_exam_certificates (id, exam_id, title, logo_url, signature_url, footer_text, passing_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), newExamId, certs[0].title, certs[0].logo_url, certs[0].signature_url, certs[0].footer_text, certs[0].passing_percentage]);
    }

    await connection.commit();
    connection.release();

    res.status(201).json({ id: newExamId, message: 'Exam duplicated successfully' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Duplicate exam error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── 3. CERTIFICATE CONFIGURATION ──────────────────────────────────────────────

// GET /api/admin/public-exams/:id/certificate-settings
router.get('/:id/certificate-settings', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM public_exam_certificates WHERE exam_id = ?', [req.params.id]);
    res.json(settings[0] || null);
  } catch (error) {
    console.error('Fetch certificate settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/public-exams/:id/certificate-settings (Upsert)
router.post('/:id/certificate-settings', async (req, res) => {
  try {
    const { title, logo_url, signature_url, footer_text, passing_percentage } = req.body;
    const examId = req.params.id;

    const [existing] = await pool.query('SELECT id FROM public_exam_certificates WHERE exam_id = ?', [examId]);

    if (existing.length > 0) {
      await pool.query(`
        UPDATE public_exam_certificates
        SET title = ?, logo_url = ?, signature_url = ?, footer_text = ?, passing_percentage = ?
        WHERE exam_id = ?
      `, [title, logo_url || null, signature_url || null, footer_text || null, passing_percentage || 50.00, examId]);
    } else {
      await pool.query(`
        INSERT INTO public_exam_certificates (id, exam_id, title, logo_url, signature_url, footer_text, passing_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), examId, title || 'Practice Exam Certificate', logo_url || null, signature_url || null, footer_text || null, passing_percentage || 50.00]);
    }

    res.json({ message: 'Certificate settings saved successfully' });
  } catch (error) {
    console.error('Save certificate settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── 4. ATTEMPTS & RESULTS MANAGEMENT ─────────────────────────────────────────

// GET /api/admin/public-exams/:id/attempts
router.get('/:id/attempts', async (req, res) => {
  try {
    const examId = req.params.id;
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT a.id as attempt_id, a.guest_name, a.guest_email, a.guest_phone, a.is_anonymous, a.started_at, a.status as attempt_status,
             e.name as exam_name, e.slug as exam_slug, r.score, r.percentage, r.passed, r.time_taken_seconds
      FROM public_exam_attempts a
      JOIN public_exams e ON a.exam_id = e.id
      LEFT JOIN public_exam_results r ON a.id = r.attempt_id
      WHERE a.exam_id = ?
    `;
    const params = [examId];

    if (search) {
      query += ' AND (a.guest_name LIKE ? OR a.guest_email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY a.started_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [attempts] = await pool.query(query, params);

    // Get count
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM public_exam_attempts a
      WHERE a.exam_id = ?
    `;
    const countParams = [examId];
    if (search) {
      countQuery += ' AND (a.guest_name LIKE ? OR a.guest_email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [countRow] = await pool.query(countQuery, countParams);

    res.json({
      attempts,
      total: countRow[0].count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch attempts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/public-exams/attempts/:id
router.delete('/attempts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM public_exam_attempts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Attempt deleted successfully' });
  } catch (error) {
    console.error('Delete attempt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/public-exams/:id/attempts/export
router.get('/:id/attempts/export', async (req, res) => {
  try {
    const examId = req.params.id;
    const [rows] = await pool.query(`
      SELECT e.name as exam_name, a.guest_name, a.guest_email, a.guest_phone,
             r.score, r.percentage, r.passed, r.time_taken_seconds, a.started_at
      FROM public_exam_attempts a
      JOIN public_exams e ON a.exam_id = e.id
      LEFT JOIN public_exam_results r ON a.id = r.attempt_id
      WHERE a.exam_id = ?
      ORDER BY a.started_at DESC
    `, [examId]);

    // Output raw CSV
    let csv = 'Exam Name,Candidate Name,Email,Phone,Score,Percentage,Status,Time Taken (sec),Date\n';
    for (const r of rows) {
      const status = r.passed === 1 ? 'Passed' : (r.passed === 0 ? 'Failed' : 'In Progress');
      const timeStr = r.time_taken_seconds || 'N/A';
      const dateStr = new Date(r.started_at).toLocaleDateString();
      csv += `"${r.exam_name}","${r.guest_name}","${r.guest_email || ''}","${r.guest_phone || ''}",${r.score || 0},${r.percentage || 0},"${status}",${timeStr},"${dateStr}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.attachment('public-exam-attempts.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export attempts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── 5. QUESTION BANK CRUD & BULK CSV IMPORT ──────────────────────────────────

// GET /api/admin/public-exams/:id/analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const examId = req.params.id;

    const [totalAttemptsRow] = await pool.query('SELECT COUNT(*) as count FROM public_exam_attempts WHERE exam_id = ?', [examId]);
    
    const [avgScoreRow] = await pool.query(`
      SELECT AVG(r.percentage) as avg_pct 
      FROM public_exam_results r
      JOIN public_exam_attempts a ON r.attempt_id = a.id
      WHERE a.exam_id = ?
    `, [examId]);
    
    const [passPercentageRow] = await pool.query(`
      SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN (SUM(CASE WHEN r.passed = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 
          ELSE 0 
        END as pass_rate 
      FROM public_exam_results r
      JOIN public_exam_attempts a ON r.attempt_id = a.id
      WHERE a.exam_id = ?
    `, [examId]);

    // Question Difficulty Analysis specifically for this exam
    const [questions] = await pool.query(`
      SELECT q.id, q.question_text, q.type, q.correct_answer, q.marks, e.name as exam_name
      FROM public_exam_questions q
      JOIN public_exams e ON q.exam_id = e.id
      WHERE q.exam_id = ?
    `, [examId]);

    const [attempts] = await pool.query(`
      SELECT answers_json
      FROM public_exam_attempts
      WHERE status = 'submitted' AND exam_id = ?
    `, [examId]);

    const questionStats = questions.map(q => {
      let correctCount = 0;
      let totalCount = 0;

      for (const attempt of attempts) {
        try {
          const answers = typeof attempt.answers_json === 'string' ? JSON.parse(attempt.answers_json) : attempt.answers_json;
          if (!Array.isArray(answers)) continue;

          const match = answers.find(a => a.question_id === q.id);
          if (match) {
            totalCount++;
            if (gradeQuestion(q.type, q.correct_answer, match.answer)) {
              correctCount++;
            }
          }
        } catch (err) {
          // ignore parsing error
        }
      }

      const passRate = totalCount > 0 ? parseFloat(((correctCount / totalCount) * 100).toFixed(2)) : 100.0;
      let difficulty = 'Medium';
      if (passRate < 40) difficulty = 'Hard';
      else if (passRate > 75) difficulty = 'Easy';

      return {
        id: q.id,
        question_text: q.question_text,
        type: q.type,
        exam_name: q.exam_name,
        correct_count: correctCount,
        total_answers: totalCount,
        success_rate: passRate,
        perceived_difficulty: difficulty
      };
    });

    res.json({
      totalAttempts: totalAttemptsRow[0].count,
      averageScore: parseFloat(parseFloat(avgScoreRow[0].avg_pct || 0).toFixed(2)),
      passPercentage: parseFloat(parseFloat(passPercentageRow[0].pass_rate || 0).toFixed(2)),
      questionDifficulty: questionStats
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── REGISTRATION STATUS CONTROL ──────────────────────────────────────────────

// PUT /api/admin/public-exams/:id/registration-status
router.put('/:id/registration-status', async (req, res) => {
  try {
    const { status } = req.body; // 'open' or 'closed'
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid registration status. Must be "open" or "closed".' });
    }

    const [exams] = await pool.query('SELECT id, name FROM public_exams WHERE id = ?', [req.params.id]);
    if (exams.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    await pool.query('UPDATE public_exams SET registration_status = ? WHERE id = ?', [status, req.params.id]);

    res.json({
      message: status === 'closed'
        ? 'Registrations have been closed. No new candidates can register.'
        : 'Registrations are now open. Candidates can register again.',
      registration_status: status
    });
  } catch (error) {
    console.error('Registration status update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [exams] = await pool.query(`
      SELECT e.*, c.name as category_name, c.slug as category_slug,
        e.registration_status,
        (SELECT COUNT(*) FROM public_exam_questions WHERE exam_id = e.id) as question_count,
        (SELECT COUNT(*) FROM public_exam_attempts WHERE exam_id = e.id AND status = 'submitted') as attempts_count,
        (SELECT COUNT(*) FROM public_exam_candidates WHERE exam_id = e.id) as candidate_count
      FROM public_exams e
      JOIN public_exam_categories c ON e.category_id = c.id
      WHERE e.deleted_at IS NULL
      ORDER BY e.created_at DESC
    `);
    res.json(exams);
  } catch (error) {
    console.error('Fetch admin exams error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/public-exams
router.post('/', async (req, res) => {
  try {
    const { name, category_id, description, syllabus, duration_minutes, total_questions, total_marks, passing_marks, difficulty_level, status, slug, instructions, pass_percentage, negative_marking, randomize_questions, randomize_options, show_correct_answers, show_explanations, allow_retake, enable_certificate, anonymous_access, require_name, require_email, require_mobile, enable_proctoring, max_proctoring_warnings, enforce_fullscreen, registration_start_date, registration_end_date, exam_start_date, exam_end_date, image_url } = req.body;

    if (!name || !category_id || !slug) {
      return res.status(400).json({ message: 'Name, Category, and SEO Slug are required' });
    }

    const id = uuidv4();
    await pool.query(`
      INSERT INTO public_exams (
        id, name, category_id, description, syllabus, duration_minutes, total_questions, total_marks, passing_marks, difficulty_level, status, slug, instructions, pass_percentage, negative_marking, randomize_questions, randomize_options, show_correct_answers, show_explanations, allow_retake, enable_certificate, anonymous_access, require_name, require_email, require_mobile, enable_proctoring, max_proctoring_warnings, enforce_fullscreen, registration_start_date, registration_end_date, exam_start_date, exam_end_date, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, name, category_id, description || null, syllabus || null,
      duration_minutes || 60, total_questions || 0, total_marks || 0,
      passing_marks || 0, difficulty_level || 'Medium', status || 'draft', slug,
      instructions || null, pass_percentage || 50, negative_marking || 0.00,
      !!randomize_questions, !!randomize_options, show_correct_answers !== false, show_explanations !== false,
      allow_retake !== false, enable_certificate !== false, anonymous_access !== false,
      require_name !== false, !!require_email, !!require_mobile,
      !!enable_proctoring, max_proctoring_warnings !== undefined ? max_proctoring_warnings : 3, !!enforce_fullscreen,
      registration_start_date || null, registration_end_date || null, exam_start_date || null, exam_end_date || null, image_url || null
    ]);

    res.status(201).json({ id, message: 'Exam created successfully' });
  } catch (error) {
    console.error('Create admin exam error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// PUT /api/admin/public-exams/:id
router.put('/:id', async (req, res) => {
  try {
    const fields = [
      'name', 'category_id', 'description', 'syllabus', 'duration_minutes',
      'total_questions', 'total_marks', 'passing_marks', 'difficulty_level', 'status', 'slug',
      'instructions', 'pass_percentage', 'negative_marking', 'randomize_questions', 'randomize_options',
      'show_correct_answers', 'show_explanations', 'allow_retake', 'enable_certificate', 'anonymous_access',
      'require_name', 'require_email', 'require_mobile', 'enable_proctoring', 'max_proctoring_warnings', 'enforce_fullscreen',
      'registration_start_date', 'registration_end_date', 'exam_start_date', 'exam_end_date', 'image_url'
    ];
    const updates = fields.filter(f => req.body[f] !== undefined);
    
    if (updates.length === 0) {
      return res.json({ message: 'Nothing to update' });
    }

    const setClause = updates.map(f => `${f} = ?`).join(', ');
    const values = updates.map(f => {
      if (['randomize_questions', 'randomize_options', 'show_correct_answers', 'show_explanations', 'allow_retake', 'enable_certificate', 'anonymous_access', 'require_name', 'require_email', 'require_mobile', 'enable_proctoring', 'enforce_fullscreen'].includes(f)) {
        return !!req.body[f];
      }
      if (['registration_start_date', 'registration_end_date', 'exam_start_date', 'exam_end_date'].includes(f) && req.body[f] === '') {
        return null;
      }
      return req.body[f];
    });

    await pool.query(`UPDATE public_exams SET ${setClause} WHERE id = ?`, [...values, req.params.id]);
    res.json({ message: 'Exam updated successfully' });
  } catch (error) {
    console.error('Update admin exam error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// DELETE /api/admin/public-exams/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE public_exams SET deleted_at = NOW(), registration_status = "closed" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete admin exam error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/public-exams/:id/questions
router.get('/:id/questions', async (req, res) => {
  try {
    const [questions] = await pool.query(
      'SELECT * FROM public_exam_questions WHERE exam_id = ? ORDER BY order_index ASC',
      [req.params.id]
    );
    
    const formatted = questions.map(q => ({
      ...q,
      options: q.options_json ? (typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json) : []
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch questions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/public-exams/:id/questions
router.post('/:id/questions', async (req, res) => {
  try {
    const { question_text, type, options, correct_answer, explanation, marks, difficulty_level } = req.body;
    const examId = req.params.id;

    if (!question_text || !type || correct_answer === undefined || correct_answer === null) {
      return res.status(400).json({ message: 'Question text, type, and correct answer are required' });
    }

    const [maxOrder] = await pool.query('SELECT COALESCE(MAX(order_index), 0) as max_order FROM public_exam_questions WHERE exam_id = ?', [examId]);
    const id = uuidv4();

    await pool.query(`
      INSERT INTO public_exam_questions (id, exam_id, question_text, type, options_json, correct_answer, explanation, marks, order_index, difficulty_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      examId,
      question_text,
      type,
      options ? JSON.stringify(options) : null,
      typeof correct_answer === 'object' ? JSON.stringify(correct_answer) : correct_answer.toString(),
      explanation || null,
      marks || 1,
      maxOrder[0].max_order + 1,
      difficulty_level || 'Medium'
    ]);

    // Recalculate Exam Totals
    await recalculateExamTotals(examId);

    res.status(201).json({ id, message: 'Question added successfully' });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/admin/public-exams/:id/questions/:qid
router.put('/:id/questions/:qid', async (req, res) => {
  try {
    const { question_text, type, options, correct_answer, explanation, marks, order_index, difficulty_level } = req.body;
    const { id: examId, qid } = req.params;

    const fields = [];
    const values = [];

    if (question_text !== undefined) { fields.push('question_text = ?'); values.push(question_text); }
    if (type !== undefined) { fields.push('type = ?'); values.push(type); }
    if (options !== undefined) { fields.push('options_json = ?'); values.push(options ? JSON.stringify(options) : null); }
    if (correct_answer !== undefined) { fields.push('correct_answer = ?'); values.push(typeof correct_answer === 'object' ? JSON.stringify(correct_answer) : correct_answer.toString()); }
    if (explanation !== undefined) { fields.push('explanation = ?'); values.push(explanation); }
    if (marks !== undefined) { fields.push('marks = ?'); values.push(marks); }
    if (order_index !== undefined) { fields.push('order_index = ?'); values.push(order_index); }
    if (difficulty_level !== undefined) { fields.push('difficulty_level = ?'); values.push(difficulty_level); }

    if (fields.length === 0) {
      return res.json({ message: 'Nothing to update' });
    }

    values.push(qid);
    await pool.query(`UPDATE public_exam_questions SET ${fields.join(', ')} WHERE id = ?`, values);

    // Recalculate Exam Totals
    await recalculateExamTotals(examId);

    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/public-exams/:id/questions/:qid
router.delete('/:id/questions/:qid', async (req, res) => {
  try {
    const { id: examId, qid } = req.params;
    await pool.query('DELETE FROM public_exam_questions WHERE id = ?', [qid]);
    
    // Recalculate Exam Totals
    await recalculateExamTotals(examId);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/public-exams/:id/questions/bulk (JSON Array)
router.post('/:id/questions/bulk', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const examId = req.params.id;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'Invalid questions payload. Must be a non-empty array.' });
    }

    for (const q of questions) {
      if (!q.question_text || !q.type || q.correct_answer === undefined || q.correct_answer === null) {
        connection.release();
        return res.status(400).json({ message: 'Each question must have question_text, type, and correct_answer' });
      }
    }

    await connection.beginTransaction();

    const [maxOrder] = await connection.query('SELECT COALESCE(MAX(order_index), 0) as max_order FROM public_exam_questions WHERE exam_id = ?', [examId]);
    let orderIdx = maxOrder[0].max_order;

    for (const q of questions) {
      orderIdx++;
      const id = uuidv4();
      await connection.query(`
        INSERT INTO public_exam_questions (id, exam_id, question_text, type, options_json, correct_answer, explanation, marks, order_index, difficulty_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        examId,
        q.question_text,
        q.type,
        q.options ? JSON.stringify(q.options) : null,
        typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : q.correct_answer.toString(),
        q.explanation || null,
        q.marks || 1,
        orderIdx,
        q.difficulty_level || 'Medium'
      ]);
    }

    await connection.commit();
    connection.release();

    // Recalculate Exam Totals
    await recalculateExamTotals(examId);

    res.status(201).json({ message: `Successfully imported ${questions.length} questions` });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Bulk import error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// POST /api/admin/public-exams/:id/questions/bulk-csv (CSV parsing)
router.post('/:id/questions/bulk-csv', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const examId = req.params.id;
    const { csvText } = req.body;

    if (!csvText || !csvText.trim()) {
      connection.release();
      return res.status(400).json({ message: 'CSV text is empty' });
    }

    // CSV Parsing
    const lines = csvText.split(/\r?\n/);
    const parsedQuestions = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple parse separating on commas, ignoring ones inside quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cells = matches.map(c => c.replace(/^"|"$/g, '').trim());

      if (cells.length < 3) continue;

      const qText = cells[0];
      const rawOptions = cells[1]; // separated by pipe '|'
      const rawCorrect = cells[2];
      const explanation = cells[3] || '';
      const marks = parseInt(cells[4]) || 4;
      const difficulty = cells[5] || 'Medium';

      const options = rawOptions ? rawOptions.split('|').map(o => o.trim()) : [];
      let type = 'fib';
      let correctVal = rawCorrect;

      if (options.length > 0) {
        if (options.length === 2 && options.includes('True') && options.includes('False')) {
          type = 'truefalse';
        } else if (rawCorrect.includes('|')) {
          type = 'msq';
          correctVal = JSON.stringify(rawCorrect.split('|').map(c => c.trim()));
        } else {
          type = 'mcq';
        }
      }

      parsedQuestions.push({
        question_text: qText,
        type,
        options,
        correct_answer: correctVal,
        explanation,
        marks,
        difficulty_level: difficulty
      });
    }

    if (parsedQuestions.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'Could not parse any valid question rows from CSV' });
    }

    await connection.beginTransaction();

    const [maxOrder] = await connection.query('SELECT COALESCE(MAX(order_index), 0) as max_order FROM public_exam_questions WHERE exam_id = ?', [examId]);
    let orderIdx = maxOrder[0].max_order;

    for (const q of parsedQuestions) {
      orderIdx++;
      const id = uuidv4();
      await connection.query(`
        INSERT INTO public_exam_questions (id, exam_id, question_text, type, options_json, correct_answer, explanation, marks, order_index, difficulty_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        examId,
        q.question_text,
        q.type,
        q.options.length > 0 ? JSON.stringify(q.options) : null,
        q.correct_answer,
        q.explanation || null,
        q.marks,
        orderIdx,
        q.difficulty_level
      ]);
    }

    await connection.commit();
    connection.release();

    // Recalculate Exam Totals
    await recalculateExamTotals(examId);

    res.status(201).json({ message: `Successfully imported ${parsedQuestions.length} questions from CSV` });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Bulk CSV import error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Helper to auto-update total questions and total marks on the exam record
async function recalculateExamTotals(examId) {
  try {
    const [stats] = await pool.query(
      'SELECT COUNT(*) as count, SUM(marks) as total_marks FROM public_exam_questions WHERE exam_id = ?',
      [examId]
    );

    const qCount = stats[0].count || 0;
    const tMarks = stats[0].total_marks || 0;

    await pool.query(
      'UPDATE public_exams SET total_questions = ?, total_marks = ? WHERE id = ?',
      [qCount, tMarks, examId]
    );
  } catch (err) {
    console.error('Recalculate totals failed for exam:', examId, err);
  }
}

// ─── CANDIDATE MANAGEMENT ───────────────────────────────────────────────────

// GET /api/admin/public-exams/:id/candidates
router.get('/:id/candidates', async (req, res) => {
  try {
    const examId = req.params.id;

    // Fetch Candidates and their Attempts
    const [candidates] = await pool.query(`
      SELECT 
        c.id as candidate_id, c.name, c.email, c.phone, c.created_at as registered_at,
        c.registration_status,
        a.id as attempt_id, a.status as exam_status, a.started_at, a.submitted_at,
        r.score, r.percentage, r.passed
      FROM public_exam_candidates c
      LEFT JOIN (
        SELECT a1.*
        FROM public_exam_attempts a1
        JOIN (
          SELECT candidate_id, MAX(id) as max_id
          FROM public_exam_attempts
          WHERE exam_id = ?
          GROUP BY candidate_id
        ) a2 ON a1.id = a2.max_id
      ) a ON c.id = a.candidate_id
      LEFT JOIN public_exam_results r ON a.id = r.attempt_id
      WHERE c.exam_id = ?
      ORDER BY c.created_at DESC
    `, [examId, examId]);

    // Format Data
    const formattedCandidates = candidates.map(c => {
      let status = 'Registered';
      if (c.exam_status === 'in_progress') status = 'Started';
      if (c.exam_status === 'submitted') status = 'Completed';
      
      let result = 'Pending';
      if (c.passed === 1) result = 'Pass';
      if (c.passed === 0) result = 'Fail';

      return {
        id: c.candidate_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        registered_at: c.registered_at,
        registration_status: c.registration_status || 'approved',
        attempt_id: c.attempt_id,
        exam_status: status,
        score: c.score || 0,
        percentage: c.percentage || 0,
        result: result
      };
    });

    // Compute Statistics
    const stats = {
      total_registrations: formattedCandidates.length,
      started: formattedCandidates.filter(c => c.exam_status === 'Started' || c.exam_status === 'Completed').length,
      completed: formattedCandidates.filter(c => c.exam_status === 'Completed').length,
      passed: formattedCandidates.filter(c => c.result === 'Pass').length,
      failed: formattedCandidates.filter(c => c.result === 'Fail').length,
    };

    // Fetch exam details for name/slug reference
    const [exams] = await pool.query('SELECT name, slug FROM public_exams WHERE id = ?', [examId]);
    const exam = exams[0] || null;

    res.json({ candidates: formattedCandidates, stats, exam });
  } catch (error) {
    console.error('Fetch candidates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/public-exams/candidates/:id
router.get('/candidates/:id', async (req, res) => {
  try {
    const candidateId = req.params.id;
    const [candidates] = await pool.query(`
      SELECT c.*, e.name as exam_name
      FROM public_exam_candidates c
      JOIN public_exams e ON c.exam_id = e.id
      WHERE c.id = ?
    `, [candidateId]);

    if (candidates.length === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const [attempts] = await pool.query(`
      SELECT a.id as attempt_id, a.status, a.started_at, a.submitted_at, r.score, r.percentage, r.passed
      FROM public_exam_attempts a
      LEFT JOIN public_exam_results r ON a.id = r.attempt_id
      WHERE a.candidate_id = ?
    `, [candidateId]);

    res.json({ candidate: candidates[0], attempt: attempts[0] || null });
  } catch (error) {
    console.error('Fetch candidate detail error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/public-exams/candidates/:id/attempt
router.get('/candidates/:id/attempt', async (req, res) => {
  try {
    const candidateId = req.params.id;

    const [attempts] = await pool.query(`
      SELECT a.*, r.score, r.percentage, r.passed, r.correct_answers, r.wrong_answers, r.time_taken_seconds
      FROM public_exam_attempts a
      JOIN public_exam_results r ON a.id = r.attempt_id
      WHERE a.candidate_id = ?
    `, [candidateId]);

    if (attempts.length === 0) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    const attempt = attempts[0];

    const [questions] = await pool.query(`
      SELECT id, question_text, type, options_json, correct_answer, explanation, marks
      FROM public_exam_questions
      WHERE exam_id = ?
      ORDER BY order_index ASC
    `, [attempt.exam_id]);

    const parsedAnswers = typeof attempt.answers_json === 'string' ? JSON.parse(attempt.answers_json) : attempt.answers_json;

    const reviewQuestions = questions.map(q => {
      const gAns = parsedAnswers.find(ga => ga.question_id === q.id);
      return {
        id: q.id,
        question_text: q.question_text,
        type: q.type,
        options: q.options_json ? (typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json) : [],
        marks: q.marks,
        guest_answer: gAns?.answer || null,
        correct_answer: q.correct_answer,
        is_correct: gradeQuestion(q.type, q.correct_answer, gAns?.answer)
      };
    });

    res.json({
      attempt_info: attempt,
      questions: reviewQuestions
    });

  } catch (error) {
    console.error('Fetch candidate attempt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/admin/public-exams/candidates/:id/certificate
router.post('/candidates/:id/certificate', async (req, res) => {
  try {
    const candidateId = req.params.id;

    // Fetch candidate and attempt info
    const [attempts] = await pool.query(`
      SELECT a.id as attempt_id, a.exam_id, r.passed
      FROM public_exam_attempts a
      JOIN public_exam_results r ON a.id = r.attempt_id
      WHERE a.candidate_id = ?
    `, [candidateId]);

    if (attempts.length === 0) {
      return res.status(404).json({ message: 'No completed attempt found for this candidate' });
    }

    const attempt = attempts[0];
    if (!attempt.passed) {
      return res.status(400).json({ message: 'Candidate has not passed the exam.' });
    }

    // Check if certificate already exists
    const [existing] = await pool.query('SELECT id FROM certificates WHERE candidate_id = ? AND exam_attempt_id = ?', [candidateId, attempt.attempt_id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Certificate already generated for this candidate.' });
    }

    const certId = uuidv4();
    const certNumber = `CERT-PE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await pool.query(`
      INSERT INTO certificates (id, student_id, candidate_id, course_id, exam_attempt_id, cert_number, status)
      VALUES (?, NULL, ?, NULL, ?, ?, 'active')
    `, [certId, candidateId, attempt.attempt_id, certNumber]);

    res.status(201).json({ message: 'Certificate generated successfully', certificate_id: certId, cert_number: certNumber });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// POST /api/admin/public-exams/:id/notify-candidates
router.post('/:id/notify-candidates', async (req, res) => {
  try {
    const examId = req.params.id;
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

    const [candidates] = await pool.query(
      'SELECT id, name, email FROM public_exam_candidates WHERE exam_id = ? AND registration_status = "approved"',
      [examId]
    );

    if (candidates.length === 0) {
      return res.status(404).json({ message: 'No approved candidates found for this exam' });
    }

    const logId = uuidv4();
    await pool.query(
      'INSERT INTO exam_email_logs (id, exam_id, subject, body, total_candidates, status) VALUES (?, ?, ?, ?, ?, "processing")',
      [logId, examId, subject, body, candidates.length]
    );

    // Immediately return response to avoid timeout
    res.status(202).json({ message: 'Custom email notification process started in the background.', total_candidates: candidates.length });

    // Send emails asynchronously
    setTimeout(async () => {
      let successCount = 0;
      let failCount = 0;
      for (const c of candidates) {
        try {
          const personalizedBody = body.replace(/{{name}}/g, c.name);
          await EmailService.sendEmail({
            to: c.email,
            subject: subject,
            html: personalizedBody
          });
          successCount++;
          await pool.query(
            'INSERT INTO exam_email_log_details (id, log_id, email, status) VALUES (?, ?, ?, ?)',
            [uuidv4(), logId, c.email, 'success']
          );
        } catch (err) {
          console.error(`Failed to send custom email to ${c.email}:`, err);
          failCount++;
          await pool.query(
            'INSERT INTO exam_email_log_details (id, log_id, email, status, error_message) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), logId, c.email, 'failed', err.message || err.toString()]
          );
        }
        
        // Update counts periodically (or every record to keep it simple since it's background)
        await pool.query(
          'UPDATE exam_email_logs SET success_count = ?, fail_count = ? WHERE id = ?',
          [successCount, failCount, logId]
        );
      }

      await pool.query(
        'UPDATE exam_email_logs SET status = "completed", completed_at = NOW() WHERE id = ?',
        [logId]
      );
      
      console.log(`Custom Email Notification for Exam ${examId} Complete. Success: ${successCount}, Failed: ${failCount}`);
    }, 100);

  } catch (error) {
    console.error('Notify candidates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/public-exams/:id/email-logs
router.get('/:id/email-logs', async (req, res) => {
  try {
    const examId = req.params.id;
    const [logs] = await pool.query(
      'SELECT * FROM exam_email_logs WHERE exam_id = ? ORDER BY created_at DESC',
      [examId]
    );
    res.json(logs);
  } catch (error) {
    console.error('Fetch email logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/public-exams/:id/email-logs/:logId/details
router.get('/:id/email-logs/:logId/details', async (req, res) => {
  try {
    const { logId } = req.params;
    const [details] = await pool.query(
      'SELECT id, email, status, error_message, created_at FROM exam_email_log_details WHERE log_id = ? ORDER BY created_at DESC',
      [logId]
    );
    res.json(details);
  } catch (error) {
    console.error('Fetch email log details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/public-exams/:id/email-logs/:logId
router.delete('/:id/email-logs/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    await pool.query('DELETE FROM exam_email_logs WHERE id = ?', [logId]);
    res.json({ message: 'Email log deleted successfully' });
  } catch (error) {
    console.error('Delete email log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
