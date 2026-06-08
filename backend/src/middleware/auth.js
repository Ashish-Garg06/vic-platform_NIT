'use strict';
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vic_secret');
    const user = db.prepare('SELECT id,name,email,role,is_active FROM users WHERE id=?').get(decoded.id);
    if (!user || !user.is_active) return res.status(401).json({ success: false, error: 'User not found or inactive' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

function auditLog(action, entityType) {
  return (req, res, next) => {
    const orig = res.json.bind(res);
    res.json = (data) => {
      if (data.success !== false && req.user) {
        try {
          db.prepare('INSERT INTO audit_logs (user_id,action,entity_type,entity_id,ip_address) VALUES (?,?,?,?,?)').run(
            req.user.id, action, entityType, data.data?.id || null,
            req.ip || req.connection?.remoteAddress || 'unknown'
          );
        } catch (_) {}
      }
      return orig(data);
    };
    next();
  };
}

module.exports = { authenticate, authorize, auditLog };
