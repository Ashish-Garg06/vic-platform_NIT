'use strict';
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'vic_secret', { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ success: false, error: 'All fields required' });
    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (exists) return res.status(409).json({ success: false, error: 'Email already registered' });
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)').run(name, email, hash, role, phone || null);
    const user = db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(result.lastInsertRowid);
    // Create role-specific profile
    if (role === 'mentor') db.prepare('INSERT OR IGNORE INTO mentors (user_id) VALUES (?)').run(user.id);
    if (role === 'investor') db.prepare('INSERT OR IGNORE INTO investors (user_id,firm_name) VALUES (?,?)').run(user.id, name);
    if (role === 'researcher') db.prepare('INSERT OR IGNORE INTO researchers (user_id) VALUES (?)').run(user.id);
    res.status(201).json({ success: true, data: { token: sign(user.id), user } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    if (!user.is_active) return res.status(403).json({ success: false, error: 'Account deactivated' });
    const { password: _, ...safe } = user;
    // Get extra profile data
    if (user.role === 'startup_founder') {
      safe.startup = db.prepare('SELECT id,name,sector,stage,status FROM startups WHERE user_id=? ORDER BY id DESC LIMIT 1').get(user.id);
    }
    res.json({ success: true, data: { token: sign(user.id), user: safe } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id,name,email,role,phone,created_at FROM users WHERE id=?').get(req.user.id);
    if (user.role === 'startup_founder') {
      user.startup = db.prepare('SELECT * FROM startups WHERE user_id=? ORDER BY id DESC LIMIT 1').get(user.id);
    }
    if (user.role === 'mentor') user.mentor = db.prepare('SELECT * FROM mentors WHERE user_id=?').get(user.id);
    if (user.role === 'investor') user.investor = db.prepare('SELECT * FROM investors WHERE user_id=?').get(user.id);
    if (user.role === 'researcher') user.researcher = db.prepare('SELECT * FROM researchers WHERE user_id=?').get(user.id);
    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, phone } = req.body;
    db.prepare('UPDATE users SET name=?,phone=? WHERE id=?').run(name, phone, req.user.id);
    res.json({ success: true, data: { message: 'Profile updated' } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/auth/notifications
router.get('/notifications', authenticate, (req, res) => {
  try {
    const notifs = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
    res.json({ success: true, data: notifs });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PUT /api/auth/notifications/:id/read
router.put('/notifications/:id/read', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
