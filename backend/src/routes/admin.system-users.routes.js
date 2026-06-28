import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { authenticateJWT, authorizeRoles, requirePermission } from '../middleware/auth.js';
import emailService from '../services/email.service.js';

const router = express.Router();

// Helper to log audit actions
const logAudit = async (connection, userId, action, target, metadata) => {
  try {
    await connection.query(
      'INSERT INTO audit_logs (id, user_id, action, target, metadata) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, action, target, JSON.stringify(metadata || {})]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

const SYSTEM_ROLES = [
  'super_admin', 'sub_admin', 'crm_agent', 
  'placement_coordinator', 'finance_staff', 
  'exam_manager', 'lms_user'
];

// 1. Get all system users
router.get('/', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, name, email, phone, role, status, last_login_at, created_at, permissions_json 
      FROM users 
      WHERE role IN (?) AND deleted_at IS NULL
      ORDER BY created_at DESC
    `, [SYSTEM_ROLES]);
    
    // Calculate dashboard stats
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const crm = users.filter(u => u.role === 'crm_agent').length;
    const subAdmin = users.filter(u => u.role === 'sub_admin').length;

    res.json({ 
      users,
      stats: { total, active, crm, subAdmin }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Create System User
router.post('/', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  const { name, email, phone, role, permissions_json, password } = req.body;
  
  if (!SYSTEM_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid system role specified' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const id = uuidv4();
    const plainPassword = password || Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const permsStr = permissions_json ? JSON.stringify(permissions_json) : null;

    await connection.query(
      `INSERT INTO users (id, name, email, phone, role, status, password_hash, permissions_json, force_password_change) 
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, TRUE)`,
      [id, name, email, phone, role, hashedPassword, permsStr]
    );

    await connection.query('INSERT INTO user_profiles (user_id) VALUES (?)', [id]);

    await logAudit(connection, req.user.id, 'CREATE_USER', email, { role, permissions_json });

    await connection.commit();

    // Optionally send email with plainPassword
    try {
      await emailService.sendMail({
        to: email,
        subject: 'Your System Account has been created',
        html: `
          <h3>Welcome to the Team, ${name}!</h3>
          <p>Your account has been created with the role: <strong>${role}</strong>.</p>
          <p>Your temporary password is: <strong>${plainPassword}</strong></p>
          <p>Please log in and change your password immediately.</p>
        `
      });
    } catch (e) {
      console.warn('Failed to send welcome email:', e.message);
    }

    res.status(201).json({ message: 'System user created successfully', id });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 3. Update System User
router.put('/:id', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  const { name, phone, role, permissions_json } = req.body;
  const targetId = req.params.id;

  if (role && !SYSTEM_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid system role specified' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT email FROM users WHERE id = ? AND role IN (?)', [targetId, SYSTEM_ROLES]);
    if (existing.length === 0) return res.status(404).json({ message: 'System user not found' });

    const permsStr = permissions_json ? JSON.stringify(permissions_json) : null;

    await connection.query(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), role = COALESCE(?, role), permissions_json = ? WHERE id = ?',
      [name, phone, role, permsStr, targetId]
    );

    await logAudit(connection, req.user.id, 'UPDATE_USER', existing[0].email, { role, permissions_json });

    await connection.commit();
    res.json({ message: 'System user updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 4. Suspend/Activate User
router.put('/:id/status', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  const { status } = req.body;
  const targetId = req.params.id;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT email FROM users WHERE id = ? AND role IN (?)', [targetId, SYSTEM_ROLES]);
    if (existing.length === 0) return res.status(404).json({ message: 'System user not found' });

    await connection.query('UPDATE users SET status = ? WHERE id = ?', [status, targetId]);

    await logAudit(connection, req.user.id, 'CHANGE_STATUS', existing[0].email, { newStatus: status });

    await connection.commit();
    res.json({ message: `System user ${status} successfully` });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 5. Reset Password
router.post('/:id/reset-password', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  const targetId = req.params.id;
  const plainPassword = Math.random().toString(36).slice(-10);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT email, name FROM users WHERE id = ? AND role IN (?)', [targetId, SYSTEM_ROLES]);
    if (existing.length === 0) return res.status(404).json({ message: 'System user not found' });

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await connection.query(
      'UPDATE users SET password_hash = ?, force_password_change = TRUE WHERE id = ?',
      [hashedPassword, targetId]
    );

    await logAudit(connection, req.user.id, 'RESET_PASSWORD', existing[0].email, {});

    await connection.commit();

    try {
      await emailService.sendMail({
        to: existing[0].email,
        subject: 'Password Reset',
        html: `
          <p>Hi ${existing[0].name},</p>
          <p>Your password has been reset by an administrator.</p>
          <p>Your new temporary password is: <strong>${plainPassword}</strong></p>
          <p>Please log in and change your password immediately.</p>
        `
      });
    } catch (e) {
      console.warn('Failed to send reset email:', e.message);
    }

    res.json({ message: 'Password reset successfully', tempPassword: plainPassword });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 6. Delete System User
router.delete('/:id', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT email FROM users WHERE id = ? AND role IN (?)', [targetId, SYSTEM_ROLES]);
    if (existing.length === 0) return res.status(404).json({ message: 'System user not found' });

    const emailSuffix = `.deleted.${Date.now()}`;
    const newEmail = `${existing[0].email}${emailSuffix}`;

    await connection.query(
      "UPDATE users SET deleted_at = NOW(), status = 'inactive', email = ? WHERE id = ?",
      [newEmail, targetId]
    );

    await logAudit(connection, req.user.id, 'DELETE_USER', existing[0].email, {});

    await connection.commit();
    res.json({ message: 'System user deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 7. Get Audit Logs
router.get('/audit-logs', authenticateJWT, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT a.*, u.name as admin_name 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
