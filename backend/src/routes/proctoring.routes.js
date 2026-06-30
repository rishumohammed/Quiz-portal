import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import proctoringService from '../services/proctoring.service.js';

const router = express.Router();

// Setup Multer for saving chunks
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const attemptId = req.body.attempt_id;
    if (!attemptId) return cb(new Error('attempt_id is required in the body BEFORE the file field'));
    const __filename = new URL(import.meta.url).pathname;
    let __dirname = path.dirname(__filename);
    if (process.platform === 'win32' && __dirname.startsWith('/')) __dirname = __dirname.substring(1);
    const dir = path.join(__dirname, '../../uploads/recordings', attemptId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const chunkIndex = req.body.chunk_index || '0';
    cb(null, `chunk-${chunkIndex}.webm`);
  }
});
const upload = multer({ storage });

// Setup Multer for saving screenshots
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const attemptId = req.body.attempt_id;
    if (!attemptId) return cb(new Error('attempt_id is required in the body BEFORE the file field'));
    const __filename = new URL(import.meta.url).pathname;
    let __dirname = path.dirname(__filename);
    if (process.platform === 'win32' && __dirname.startsWith('/')) __dirname = __dirname.substring(1);
    const dir = path.join(__dirname, '../../uploads/screenshots', attemptId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `screenshot-${timestamp}.jpg`);
  }
});
const uploadScreenshot = multer({ storage: screenshotStorage });

// POST /api/proctoring/events
router.post('/events', authenticateJWT, async (req, res) => {
  try {
    const { attempt_id, type, ...metadata } = req.body;
    if (!attempt_id || !type) {
      return res.status(400).json({ message: 'attempt_id and type required' });
    }
    const event = await proctoringService.logEvent(attempt_id, type, metadata);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/proctoring/recording-chunk
router.post('/recording-chunk', authenticateJWT, upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }
    res.json({ message: 'Chunk saved successfully', filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/proctoring/violation-screenshot
router.post('/violation-screenshot', authenticateJWT, uploadScreenshot.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const url = `/uploads/screenshots/${req.body.attempt_id}/${req.file.filename}`;
    res.json({ message: 'Screenshot saved successfully', url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ────────────────────────────────────────────────────────────────────────────────
const isAdminOrTutor = authorizeRoles('super_admin', 'lms_user', 'tutor');

// GET /api/proctoring/admin/attempts
router.get('/admin/attempts', authenticateJWT, isAdminOrTutor, async (req, res) => {
  try {
    const attempts = await proctoringService.getAttemptsWithViolations(req.user.id, req.user.role);
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/proctoring/admin/violations
router.get('/admin/violations', authenticateJWT, isAdminOrTutor, async (req, res) => {
  try {
    const data = await proctoringService.getViolationsGroupedByExam(req.user.id, req.user.role);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/proctoring/admin/public-violations
router.get('/admin/public-violations', authenticateJWT, isAdminOrTutor, async (req, res) => {
  try {
    const data = await proctoringService.getPublicViolationsGroupedByExam(req.user.id, req.user.role);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/proctoring/admin/:attemptId (Note: mount point in app.js may vary, but let's keep it clean here)
router.get('/admin/:attemptId', authenticateJWT, isAdminOrTutor, async (req, res) => {
  try {
    const events = await proctoringService.getEventsForAttempt(req.params.attemptId);
    const recordings = await proctoringService.getRecordingsForAttempt(req.params.attemptId);
    res.json({ events, recordings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/proctoring/admin/:attemptId/clear-violations
router.post('/admin/:attemptId/clear-violations', authenticateJWT, isAdminOrTutor, async (req, res) => {
  try {
    await proctoringService.clearViolations(req.params.attemptId);
    res.json({ message: 'Violations cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
