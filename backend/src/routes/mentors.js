'use strict';
const router = require('express').Router();
const { db } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/mentors
router.get('/', authenticate, (req, res) => {
  try {
    const { expertise, available, q } = req.query;
    let sql = 'SELECT m.*,u.name,u.email FROM mentors m JOIN users u ON m.user_id=u.id WHERE 1=1';
    const params = [];
    if (available === 'true') { sql += ' AND m.is_available=1'; }
    if (expertise) { sql += ' AND m.expertise LIKE ?'; params.push(`%${expertise}%`); }
    if (q) { sql += ' AND (u.name LIKE ? OR m.expertise LIKE ? OR m.industry LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    sql += ' ORDER BY m.rating DESC';
    const mentors = db.prepare(sql).all(...params);
    res.json({ success: true, data: mentors });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/mentors/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const mentor = db.prepare('SELECT m.*,u.name,u.email FROM mentors m JOIN users u ON m.user_id=u.id WHERE m.id=?').get(req.params.id);
    if (!mentor) return res.status(404).json({ success: false, error: 'Mentor not found' });
    mentor.sessions = db.prepare("SELECT ms.*,s.name as startup_name FROM mentor_sessions ms JOIN startups s ON ms.startup_id=s.id WHERE ms.mentor_id=? AND ms.status='Completed' ORDER BY ms.scheduled_at DESC LIMIT 5").all(mentor.id);
    res.json({ success: true, data: mentor });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PUT /api/mentors/profile — mentor updates own profile
router.put('/profile', authenticate, authorize('mentor'), (req, res) => {
  try {
    const { expertise, industry, experience_years, company, designation, bio, is_available, linkedin_url } = req.body;
    db.prepare('UPDATE mentors SET expertise=?,industry=?,experience_years=?,company=?,designation=?,bio=?,is_available=?,linkedin_url=? WHERE user_id=?').run(expertise,industry,experience_years,company,designation,bio,is_available?1:0,linkedin_url,req.user.id);
    res.json({ success: true, data: { message: 'Profile updated' } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/mentors/sessions — list sessions for logged-in user
router.get('/my/sessions', authenticate, (req, res) => {
  try {
    let sessions;
    if (req.user.role === 'mentor') {
      const mentor = db.prepare('SELECT id FROM mentors WHERE user_id=?').get(req.user.id);
      sessions = db.prepare('SELECT ms.*,u.name as requester_name,s.name as startup_name FROM mentor_sessions ms JOIN users u ON ms.user_id=u.id LEFT JOIN startups s ON ms.startup_id=s.id WHERE ms.mentor_id=? ORDER BY ms.scheduled_at DESC').all(mentor?.id);
    } else {
      sessions = db.prepare('SELECT ms.*,u.name as mentor_name FROM mentor_sessions ms JOIN mentors m ON ms.mentor_id=m.id JOIN users u ON m.user_id=u.id WHERE ms.user_id=? ORDER BY ms.scheduled_at DESC').all(req.user.id);
    }
    res.json({ success: true, data: sessions });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// POST /api/mentors/:id/book
router.post('/:id/book', authenticate, (req, res) => {
  try {
    const { scheduled_at, duration_mins, platform, agenda } = req.body;
    if (!scheduled_at || !agenda) return res.status(400).json({ success: false, error: 'Date/time and agenda required' });
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    const result = db.prepare('INSERT INTO mentor_sessions (startup_id,mentor_id,user_id,scheduled_at,duration_mins,platform,agenda) VALUES (?,?,?,?,?,?,?)').run(startup?.id||null, req.params.id, req.user.id, scheduled_at, duration_mins||60, platform||'Zoom', agenda);
    // Notify mentor
    const mentor = db.prepare('SELECT m.user_id FROM mentors m WHERE m.id=?').get(req.params.id);
    if (mentor) db.prepare('INSERT INTO notifications (user_id,title,message,notif_type) VALUES (?,?,?,?)').run(mentor.user_id, 'New Session Request', `You have a new mentoring session request for ${scheduled_at}.`, 'info');
    res.status(201).json({ success: true, data: db.prepare('SELECT * FROM mentor_sessions WHERE id=?').get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PUT /api/mentors/sessions/:id/status
router.put('/sessions/:id/status', authenticate, (req, res) => {
  try {
    const { status, notes } = req.body;
    db.prepare('UPDATE mentor_sessions SET status=?,notes=? WHERE id=?').run(status, notes||null, req.params.id);
    if (status === 'Completed') {
      const sess = db.prepare('SELECT * FROM mentor_sessions WHERE id=?').get(req.params.id);
      if (sess?.mentor_id) db.prepare('UPDATE mentors SET total_sessions=total_sessions+1 WHERE id=?').run(sess.mentor_id);
    }
    res.json({ success: true, data: { message: `Session status updated to ${status}` } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
