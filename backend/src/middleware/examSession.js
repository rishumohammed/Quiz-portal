import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db/connection.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Middleware: validates the short-lived exam session token.
 * Expects header: X-Exam-Session: <token>
 * Attaches req.examSession = { attemptId, studentId, examId }
 */
export const validateExamSession = async (req, res, next) => {
  const token = req.headers['x-exam-session'];
  if (!token) {
    return res.status(401).json({ message: 'Exam session token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET + '_exam');
    const tokenHash = hashToken(token);

    // Verify against attempt record
    const [attempts] = await pool.query(
      'SELECT id, student_id, exam_id, status, session_expires_at FROM exam_attempts WHERE id = ? AND exam_session_token_hash = ?',
      [decoded.attemptId, tokenHash]
    );

    if (attempts.length === 0) {
      return res.status(403).json({ message: 'Invalid exam session' });
    }

    const attempt = attempts[0];

    if (new Date(attempt.session_expires_at) < new Date()) {
      return res.status(403).json({ message: 'Exam session expired' });
    }

    if (attempt.status === 'submitted' || attempt.status === 'graded') {
      return res.status(400).json({ message: 'Exam already submitted' });
    }

    req.examSession = {
      attemptId: attempt.id,
      studentId: attempt.student_id,
      examId: attempt.exam_id,
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired exam session token' });
  }
};
