'use strict';
const router = require('express').Router();
const { db } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/startups — list all (admin) or own (founder)
router.get('/', authenticate, (req, res) => {
  try {
    let startups;
    if (['admin','institutional_head','evaluator'].includes(req.user.role)) {
      const { status, sector, stage, q } = req.query;
      let sql = 'SELECT s.*,u.name as founder_name,u.email as founder_email FROM startups s JOIN users u ON s.user_id=u.id WHERE 1=1';
      const params = [];
      if (status) { sql += ' AND s.status=?'; params.push(status); }
      if (sector) { sql += ' AND s.sector=?'; params.push(sector); }
      if (stage) { sql += ' AND s.stage=?'; params.push(stage); }
      if (q) { sql += ' AND (s.name LIKE ? OR u.name LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
      sql += ' ORDER BY s.created_at DESC';
      startups = db.prepare(sql).all(...params);
    } else {
      startups = db.prepare('SELECT * FROM startups WHERE user_id=?').all(req.user.id);
    }
    res.json({ success: true, data: startups });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// POST /api/startups — register a startup
router.post('/', authenticate, authorize('startup_founder'), (req, res) => {
  try {
    const { name, tagline, description, sector, stage, website, founded_year } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Startup name is required' });
    const existing = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    if (existing) return res.status(409).json({ success: false, error: 'You already have a registered startup' });
    const result = db.prepare('INSERT INTO startups (user_id,name,tagline,description,sector,stage,website,founded_year) VALUES (?,?,?,?,?,?,?,?)').run(req.user.id, name, tagline, description, sector, stage||'Idea', website, founded_year);
    const startup = db.prepare('SELECT * FROM startups WHERE id=?').get(result.lastInsertRowid);
    // Create data room automatically
    db.prepare('INSERT INTO data_rooms (startup_id) VALUES (?)').run(startup.id);
    res.status(201).json({ success: true, data: startup });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/startups/:id — get single startup
router.get('/:id', authenticate, (req, res) => {
  try {
    const startup = db.prepare('SELECT s.*,u.name as founder_name,u.email as founder_email,u.phone as founder_phone FROM startups s JOIN users u ON s.user_id=u.id WHERE s.id=?').get(req.params.id);
    if (!startup) return res.status(404).json({ success: false, error: 'Startup not found' });
    startup.milestones = db.prepare('SELECT * FROM milestones WHERE startup_id=? ORDER BY target_date ASC').all(startup.id);
    startup.assessments = db.prepare('SELECT a.*,u.name as evaluator_name FROM assessments a LEFT JOIN users u ON a.evaluator_id=u.id WHERE a.startup_id=? ORDER BY a.assessed_at DESC').all(startup.id);
    startup.programs = db.prepare('SELECT pe.*,p.name as program_name,p.program_type FROM program_enrollments pe JOIN programs p ON pe.program_id=p.id WHERE pe.startup_id=?').all(startup.id);
    res.json({ success: true, data: startup });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PUT /api/startups/:id — update startup
router.put('/:id', authenticate, (req, res) => {
  try {
    const startup = db.prepare('SELECT * FROM startups WHERE id=?').get(req.params.id);
    if (!startup) return res.status(404).json({ success: false, error: 'Not found' });
    if (startup.user_id !== req.user.id && !['admin'].includes(req.user.role)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const fields = ['name','tagline','description','sector','stage','website','founded_year','team_size','monthly_revenue','total_funding','customers'];
    const updates = [];
    const vals = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ success: false, error: 'No fields to update' });
    vals.push(req.params.id);
    db.prepare(`UPDATE startups SET ${updates.join(',')} WHERE id=?`).run(...vals);
    res.json({ success: true, data: db.prepare('SELECT * FROM startups WHERE id=?').get(req.params.id) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PUT /api/startups/:id/status — admin status update
router.put('/:id/status', authenticate, authorize('admin','institutional_head'), (req, res) => {
  try {
    const { status, notes } = req.body;
    db.prepare('UPDATE startups SET status=? WHERE id=?').run(status, req.params.id);
    // Notify founder
    const startup = db.prepare('SELECT user_id,name FROM startups WHERE id=?').get(req.params.id);
    if (startup) {
      db.prepare('INSERT INTO notifications (user_id,title,message,notif_type) VALUES (?,?,?,?)').run(startup.user_id, `Application ${status}`, `Your startup "${startup.name}" status has been updated to: ${status}. ${notes||''}`, status==='Active'?'success':'info');
    }
    res.json({ success: true, data: { message: `Status updated to ${status}` } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Milestones
router.get('/:id/milestones', authenticate, (req, res) => {
  try {
    const ms = db.prepare('SELECT * FROM milestones WHERE startup_id=? ORDER BY target_date ASC').all(req.params.id);
    res.json({ success: true, data: ms });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/:id/milestones', authenticate, (req, res) => {
  try {
    const { title, description, target_date, progress } = req.body;
    const result = db.prepare('INSERT INTO milestones (startup_id,title,description,target_date,progress) VALUES (?,?,?,?,?)').run(req.params.id, title, description, target_date, progress||0);
    res.status(201).json({ success: true, data: db.prepare('SELECT * FROM milestones WHERE id=?').get(result.lastInsertRowid) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/milestones/:mid', authenticate, (req, res) => {
  try {
    const { progress, is_completed } = req.body;
    const completed_at = is_completed ? new Date().toISOString().split('T')[0] : null;
    db.prepare('UPDATE milestones SET progress=?,is_completed=?,completed_at=? WHERE id=?').run(progress, is_completed?1:0, completed_at, req.params.mid);
    res.json({ success: true, data: db.prepare('SELECT * FROM milestones WHERE id=?').get(req.params.mid) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
