import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool, redis } from '../db/connection.js';
import { authenticateJWT } from '../middleware/auth.js';
import emailService from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';

const router = express.Router();

const generateTokens = (user) => {
  let permissions = {};
  if (typeof user.permissions_json === 'string') {
    try { permissions = JSON.parse(user.permissions_json); } catch(e) {}
  } else if (user.permissions_json) {
    permissions = user.permissions_json;
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email, permissions },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// --- Registration ---

router.post('/register/student', async (req, res) => {
  const { name, email, password, phone, education_level, skills } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create User
    await connection.query(
      'INSERT INTO users (id, name, email, password_hash, phone, role, status) VALUES (?, ?, ?, ?, ?, "student", "active")',
      [id, name, email, hashedPassword, phone]
    );

    // 2. Create Profiles
    await connection.query('INSERT INTO user_profiles (user_id) VALUES (?)', [id]);
    await connection.query(
      'INSERT INTO student_profiles (user_id, education_level, skills) VALUES (?, ?, ?)',
      [id, education_level, JSON.stringify(skills || [])]
    );

    // 3. Log Action
    await connection.query(
      'INSERT INTO auth_logs (user_id, action, ip_address, status, details) VALUES (?, "register", ?, "success", "Student registration")',
      [id, req.ip]
    );

    await connection.commit();

    // Notify admins
    try {
      const [admins] = await pool.query('SELECT id FROM users WHERE role = "super_admin" AND status = "active"');
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'info',
          title: 'New Student Registration',
          message: `${name} (${email}) has just registered as a student.`,
          link: '/dashboard/admin/students',
          emailNotify: false
        });
      }
    } catch (notifError) {
      console.warn('Notification sending failed:', notifError.message);
    }

    res.status(201).json({ message: 'Registration successful. Welcome to the platform!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

router.post('/register/tutor', async (req, res) => {
  const { 
    name, email, password, phone, 
    qualification, specialization, experience, skills,
    linkedin_url, portfolio_url
  } = req.body;
  
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create User (Status: pending_review — awaiting admin approval)
    await connection.query(
      'INSERT INTO users (id, name, email, password_hash, phone, role, status) VALUES (?, ?, ?, ?, ?, "tutor", "pending_review")',
      [id, name, email, hashedPassword, phone]
    );

    // 2. Create Profiles
    await connection.query('INSERT INTO user_profiles (user_id) VALUES (?)', [id]);
    await connection.query(
      `INSERT INTO tutor_profiles (user_id, qualification, specialization, teaching_experience, skills_expertise, linkedin_url, portfolio_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, qualification, specialization, experience, skills, linkedin_url, portfolio_url]
    );

    // 3. Log Action
    await connection.query(
      'INSERT INTO auth_logs (user_id, action, ip_address, status, details) VALUES (?, "register", ?, "success", "Tutor registration submitted")',
      [id, req.ip]
    );

    await connection.commit();

    // 4. Send notifications (after commit — non-blocking)
    try {
      // Notify tutor: application received
      await createNotification({
        userId: id,
        type: 'system',
        title: 'Application Submitted Successfully',
        message: `Welcome ${name}! Your tutor application has been received and is currently under admin review. You will be notified once a decision is made.`,
        link: '/dashboard',
        emailNotify: false
      });

      // Notify all super_admins: new tutor awaiting review
      const [admins] = await pool.query('SELECT id FROM users WHERE role = "super_admin" AND status = "active"');
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'system',
          title: 'New Tutor Application',
          message: `${name} (${email}) has submitted a tutor application and is awaiting your review.`,
          link: '/dashboard/admin/tutor-approvals',
          emailNotify: false
        });
      }
    } catch (notifError) {
      console.warn('Notification sending failed (non-critical):', notifError.message);
    }

    res.status(201).json({ message: 'Registration submitted successfully. Your profile is under admin review.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);
    const [users] = await pool.query(`
      SELECT u.*, up.avatar_url 
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.email = ?
    `, [email]);
    const user = users[0];
    console.log('User search result:', user ? 'User found' : 'User not found');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Hash in DB:', user?.password_hash);
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your tutor application was not approved. Please contact support for more details.' });
    }

    // Allow 'active' users (full access) and 'pending_review' users (limited access — blocker shown in dashboard)
    if (user.status !== 'active' && user.status !== 'pending_review') {
      return res.status(403).json({ message: 'Your account is currently inactive or suspended.' });
    }

    console.log('Generating tokens...');
    const { accessToken, refreshToken } = generateTokens(user);
    const refreshTokenHash = hashToken(refreshToken);
    console.log('Tokens generated.');

    // Store refresh token hash in Redis (simulating sessions table but in Redis for speed)
    // We also keep it in sessions table as per requirement
    const sessionId = uuidv4();
    console.log('Inserting session into DB...');
    await pool.query(
      'INSERT INTO sessions (id, user_id, refresh_token_hash, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)',
      [sessionId, user.id, refreshTokenHash, req.ip, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );
    
    // Update last_login_at
    await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    console.log('Session inserted and last_login_at updated.');

    // Redis: user_id:refresh_token_hash -> true
    try {
      await redis.setex(`refresh_token:${user.id}:${refreshTokenHash}`, 7 * 24 * 60 * 60, 'true');
    } catch (redisError) {
      console.warn('Redis Error (skipping):', redisError.message);
    }

    // Set HttpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: { id: user.id, name: user.name, role: user.role, email: user.email, avatar_url: user.avatar_url, force_password_change: !!user.force_password_change }
    });
  } catch (error) {
    console.error('CRITICAL LOGIN ERROR:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) return res.status(401).json({ message: 'Refresh token missing' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const refreshTokenHash = hashToken(refreshToken);

    let exists = true; // Fallback to true if Redis is down, trust DB sessions
    try {
      const redisExists = await redis.get(`refresh_token:${decoded.id}:${refreshTokenHash}`);
      if (redisExists === 'false') exists = false; // Explicitly revoked
    } catch (redisError) {
      console.warn('Redis Error (skipping check):', redisError.message);
    }
    
    if (!exists) return res.status(403).json({ message: 'Invalid or revoked refresh token' });

    // Rotate tokens
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const user = users[0];

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Revoke old token
    try {
      await redis.del(`refresh_token:${decoded.id}:${refreshTokenHash}`);
    } catch (redisError) {
      console.warn('Redis Error (skipping delete):', redisError.message);
    }
    await pool.query('DELETE FROM sessions WHERE refresh_token_hash = ?', [refreshTokenHash]);

    // Issue new tokens
    const tokens = generateTokens(user);
    const newRefreshTokenHash = hashToken(tokens.refreshToken);

    await pool.query(
      'INSERT INTO sessions (id, user_id, refresh_token_hash, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), user.id, newRefreshTokenHash, req.ip, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );
    try {
      await redis.setex(`refresh_token:${user.id}:${newRefreshTokenHash}`, 7 * 24 * 60 * 60, 'true');
    } catch (redisError) {
      console.warn('Redis Error (skipping setex):', redisError.message);
    }

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: tokens.accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticateJWT, async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    const refreshTokenHash = hashToken(refreshToken);
    try {
      await redis.del(`refresh_token:${req.user.id}:${refreshTokenHash}`);
    } catch (redisError) {
      console.warn('Redis Error (skipping del):', redisError.message);
    }
    await pool.query('DELETE FROM sessions WHERE refresh_token_hash = ?', [refreshTokenHash]);
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.force_password_change, up.avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?
    `, [req.user.id]);
    const user = users[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.force_password_change = !!user.force_password_change;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, we have sent a reset link.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    await pool.query(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
      [token, expires, email]
    );
    
    await emailService.sendPasswordResetEmail(email, token);
    
    res.json({ message: 'If an account with that email exists, we have sent a reset link.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const [users] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()',
      [token]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/force-change-password', authenticateJWT, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  try {
    const [users] = await pool.query('SELECT force_password_change FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!users[0].force_password_change) {
      return res.status(400).json({ message: 'Password change not forced' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, force_password_change = 0, temp_password = NULL WHERE id = ?',
      [hashedPassword, req.user.id]
    );
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Force change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
