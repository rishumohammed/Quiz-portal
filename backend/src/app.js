process.env.TZ = 'Asia/Kolkata';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import publicExamsRoutes from './routes/public-exams.routes.js';
import adminPublicExamsRoutes from './routes/admin.public-exams.routes.js';
import adminConfigRoutes from './routes/admin.config.routes.js';
import adminFaqsRoutes from './routes/admin.faqs.routes.js';
import proctoringRoutes from './routes/proctoring.routes.js';
import { authenticateJWT, authorizeRoles } from './middleware/auth.js';
import { initSocket } from './socket/index.js';
import adminSystemUsersRoutes from './routes/admin.system-users.routes.js';
import adminEmailTemplatesRoutes from './routes/admin.email-templates.routes.js';
import adminBackupsRoutes from './routes/admin.backups.routes.js';
import { initFollowupJob } from './jobs/followup-reminder.job.js';
import { initExamRemindersJob } from './jobs/exam-reminders.job.js';
import { initExamAutocompleteJob } from './jobs/exam-autocomplete.job.js';
import { initBackupJob } from './jobs/backup.job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });


const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
const io = initSocket(httpServer);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static uploads with explicit CORP header
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

import { RedisStore } from 'rate-limit-redis';
import { redis } from './db/connection.js';

// Tiered Rate Limiters for High Concurrency (5,000 Concurrent Users)
const createStore = (prefix) => {
  if (process.env.USE_MOCK_REDIS === 'true') return undefined;
  try {
    return new RedisStore({
      // @ts-ignore
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${prefix}:`
    });
  } catch (err) {
    console.warn(`RedisStore initialization warning for ${prefix}:`, err.message);
    return undefined;
  }
};

// Strict Limiter for Auth Routes (Login, Password Reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  store: createStore('auth'),
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// High-Capacity Limiter for Exam Taking & Proctoring Heartbeats
const examLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50000,
  store: createStore('exam'),
  skip: (req) => process.env.NODE_ENV === 'test' || req.ip === '127.0.0.1' || req.ip === '::1'
});

// General API Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 50000 : 2000,
  store: createStore('general'),
  skip: (req) => process.env.NODE_ENV === 'test' || req.ip === '127.0.0.1' || req.ip === '::1'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/public/candidates/login', authLimiter);
app.use('/api/public/exams', examLimiter);
app.use('/api/proctoring', examLimiter);
app.use('/api/', generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/public/exams', publicExamsRoutes);
app.use('/api/admin/public-exams', adminPublicExamsRoutes);
app.use('/api/admin/config', adminConfigRoutes);
app.use('/api/admin/faqs', adminFaqsRoutes);
app.use('/api/proctoring', proctoringRoutes);
app.use('/api/admin/system-users', adminSystemUsersRoutes);
app.use('/api/admin/email-templates', adminEmailTemplatesRoutes);
app.use('/api/admin/backups', adminBackupsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Stubs for stripped CRM/LMS features to prevent 404s in frontend console
app.get('/api/notifications', (req, res) => res.json([]));
app.get('/api/dashboard/counts', (req, res) => res.json({ followups: 0, unreadMessages: 0, pendingApprovals: 0 }));

const PORT = process.env.PORT || 5000;

// Initialize scheduled jobs
initExamRemindersJob();
initFollowupJob();
initExamAutocompleteJob();
initBackupJob();

httpServer.listen(PORT, () => {
  console.log(`Kefta Talent Hunt Server running on port ${PORT}`);
});

export { app, io };
export default app;
