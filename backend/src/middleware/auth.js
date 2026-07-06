import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
      if (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
      }

      req.user = user;
      next();
    });
  } else {
    console.log('--- Auth Failure: Missing Token ---');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    // Optionally log headers if needed, but be careful with PII
    res.status(401).json({ message: 'Unauthorized: Missing token' });
  }
};

export const authenticateAnyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    // First try the regular LMS token secret
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user;
        return next();
      }

      // If that fails, try the Public Exam JWT secret
      const publicSecret = process.env.PUBLIC_EXAM_JWT_SECRET || 'aems_public_exam_secret_key_2024';
      jwt.verify(token, publicSecret, (publicErr, candidate) => {
        if (!publicErr && candidate) {
          req.candidate = candidate;
          // You could optionally map candidate to user if other middleware expects req.user
          // req.user = { id: candidate.id, role: 'candidate' };
          return next();
        }

        console.error('JWT Verification Error (Any): Invalid against both secrets');
        return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
      });
    });
  } else {
    res.status(401).json({ message: 'Unauthorized: Missing token' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

export const requirePermission = (module, action = 'view') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Super Admin has full access
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Role-based full access checks
    const role = req.user.role;
    if (role === 'finance_staff' && module === 'finance') return next();
    if (role === 'placement_coordinator' && (module === 'jobs' || module === 'employers')) return next();
    if (role === 'crm_agent' && module === 'crm') return next();
    if (role === 'lms_user' && (module === 'courses' || module === 'students' || module === 'tutors' || module === 'exams')) return next();

    // Check specific sub_admin permissions if present in JWT payload
    // Note: permissions_json should be included in JWT sign payload during login
    const perms = req.user.permissions;
    if (perms && perms[module] && perms[module][action]) {
      return next();
    }

    return res.status(403).json({ message: `Forbidden: Requires ${action} permission for ${module}` });
  };
};
