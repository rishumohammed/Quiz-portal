

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
import proctoringRoutes from './routes/proctoring.routes.js';
import { authenticateJWT, authorizeRoles } from './middleware/auth.js';
import { initSocket } from './socket/index.js';
import adminSystemUsersRoutes from './routes/admin.system-users.routes.js';
import adminEmailTemplatesRoutes from './routes/admin.email-templates.routes.js';
import { initFollowupJob } from './jobs/followup-reminder.job.js';
import { initExamRemindersJob } from './jobs/exam-reminders.job.js';

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

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  skip: (req) => {
    return process.env.NODE_ENV === 'test' || 
           req.ip === '127.0.0.1' || 
           req.ip === '::1';
  }
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/public/exams', publicExamsRoutes);
app.use('/api/admin/public-exams', adminPublicExamsRoutes);
app.use('/api/admin/config', adminConfigRoutes);
app.use('/api/proctoring', proctoringRoutes);
app.use('/api/admin/system-users', adminSystemUsersRoutes);
app.use('/api/admin/email-templates', adminEmailTemplatesRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

// Initialize scheduled jobs
initExamRemindersJob();
initFollowupJob();

httpServer.listen(PORT, () => {
  console.log(`Kefta Talent Hunt Server running on port ${PORT}`);
});

export { app, io };
export default app;
