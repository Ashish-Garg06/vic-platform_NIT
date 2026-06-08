'use strict';
// This file exports multiple route modules
const { db } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');
const R = require('express').Router;

// ═══════════════════════════════════════════════════════════
// INVESTORS
// ═══════════════════════════════════════════════════════════
const investors = R();
investors.get('/', authenticate, (req,res) => {
  try {
    const { q, type } = req.query;
    let sql = 'SELECT i.*,u.name,u.email FROM investors i JOIN users u ON i.user_id=u.id WHERE 1=1';
    const p = [];
    if (q) { sql += ' AND (u.name LIKE ? OR i.firm_name LIKE ? OR i.sectors_focus LIKE ?)'; p.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    if (type) { sql += ' AND i.investor_type=?'; p.push(type); }
    res.json({ success:true, data: db.prepare(sql).all(...p) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
investors.get('/:id', authenticate, (req,res) => {
  try {
    const inv = db.prepare('SELECT i.*,u.name,u.email FROM investors i JOIN users u ON i.user_id=u.id WHERE i.id=?').get(req.params.id);
    if (!inv) return res.status(404).json({ success:false, error:'Not found' });
    inv.deals = db.prepare('SELECT id.*,s.name as startup_name FROM investor_deals id JOIN startups s ON id.startup_id=s.id WHERE id.investor_id=?').all(inv.id);
    res.json({ success:true, data:inv });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
investors.post('/:id/connect', authenticate, (req,res) => {
  try {
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    if (!startup) return res.status(400).json({ success:false, error:'No startup profile found' });
    db.prepare('INSERT OR IGNORE INTO investor_connections (investor_id,startup_id,message) VALUES (?,?,?)').run(req.params.id, startup.id, req.body.message||'');
    res.json({ success:true, data:{ message:'Connection request sent' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
investors.post('/deals', authenticate, authorize('investor'), (req,res) => {
  try {
    const inv = db.prepare('SELECT id FROM investors WHERE user_id=?').get(req.user.id);
    const { startup_id, stage, proposed_amount, equity_percentage, valuation, notes } = req.body;
    const result = db.prepare('INSERT INTO investor_deals (investor_id,startup_id,stage,proposed_amount,equity_percentage,valuation,notes) VALUES (?,?,?,?,?,?,?)').run(inv.id, startup_id, stage, proposed_amount, equity_percentage, valuation, notes);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM investor_deals WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
investors.put('/deals/:id', authenticate, (req,res) => {
  try {
    const { stage, final_amount, notes } = req.body;
    db.prepare('UPDATE investor_deals SET stage=?,final_amount=?,notes=? WHERE id=?').run(stage,final_amount,notes,req.params.id);
    res.json({ success:true, data:{ message:'Deal updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// RESEARCHERS
// ═══════════════════════════════════════════════════════════
const researchers = R();
researchers.get('/', authenticate, (req,res) => {
  try {
    const rows = db.prepare('SELECT r.*,u.name,u.email FROM researchers r JOIN users u ON r.user_id=u.id ORDER BY r.patents_count DESC').all();
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
researchers.put('/profile', authenticate, authorize('researcher'), (req,res) => {
  try {
    const { institution,department,designation,research_areas,bio } = req.body;
    db.prepare('UPDATE researchers SET institution=?,department=?,designation=?,research_areas=?,bio=? WHERE user_id=?').run(institution,department,designation,research_areas,bio,req.user.id);
    res.json({ success:true, data:{ message:'Profile updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
researchers.get('/my/technologies', authenticate, authorize('researcher'), (req,res) => {
  try {
    const r = db.prepare('SELECT id FROM researchers WHERE user_id=?').get(req.user.id);
    res.json({ success:true, data: db.prepare('SELECT * FROM technologies WHERE researcher_id=?').all(r?.id) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// COURSES
// ═══════════════════════════════════════════════════════════
const courses = R();
courses.get('/', authenticate, (req,res) => {
  try {
    const { category, level, q } = req.query;
    let sql = 'SELECT c.*, COALESCE(e.progress,0) as my_progress, CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END as enrolled FROM courses c LEFT JOIN enrollments e ON c.id=e.course_id AND e.user_id=? WHERE c.is_published=1';
    const p = [req.user.id];
    if (category) { sql += ' AND c.category=?'; p.push(category); }
    if (level) { sql += ' AND c.level=?'; p.push(level); }
    if (q) { sql += ' AND (c.title LIKE ? OR c.description LIKE ?)'; p.push(`%${q}%`,`%${q}%`); }
    sql += ' ORDER BY c.enrolled_count DESC';
    res.json({ success:true, data: db.prepare(sql).all(...p) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
courses.post('/:id/enroll', authenticate, (req,res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO enrollments (user_id,course_id) VALUES (?,?)').run(req.user.id, req.params.id);
    db.prepare('UPDATE courses SET enrolled_count=enrolled_count+1 WHERE id=?').run(req.params.id);
    res.json({ success:true, data:{ message:'Enrolled successfully' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
courses.put('/:id/progress', authenticate, (req,res) => {
  try {
    const { progress } = req.body;
    const completed_at = progress >= 100 ? new Date().toISOString() : null;
    db.prepare('UPDATE enrollments SET progress=?,completed_at=? WHERE user_id=? AND course_id=?').run(Math.min(100,progress), completed_at, req.user.id, req.params.id);
    res.json({ success:true, data:{ message:'Progress updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
courses.get('/my/enrollments', authenticate, (req,res) => {
  try {
    const rows = db.prepare('SELECT c.*,e.progress,e.completed_at,e.enrolled_at FROM enrollments e JOIN courses c ON e.course_id=c.id WHERE e.user_id=? ORDER BY e.enrolled_at DESC').all(req.user.id);
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
courses.post('/', authenticate, authorize('admin'), (req,res) => {
  try {
    const { title,description,category,level,duration_hours,total_lessons,instructor } = req.body;
    const result = db.prepare('INSERT INTO courses (title,description,category,level,duration_hours,total_lessons,instructor) VALUES (?,?,?,?,?,?,?)').run(title,description,category,level,duration_hours,total_lessons,instructor);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM courses WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════
const events = R();
events.get('/', authenticate, (req,res) => {
  try {
    const { type, status } = req.query;
    let sql = 'SELECT e.*, CASE WHEN er.id IS NOT NULL THEN 1 ELSE 0 END as registered FROM events e LEFT JOIN event_registrations er ON e.id=er.event_id AND er.user_id=? WHERE 1=1';
    const p = [req.user.id];
    if (type) { sql += ' AND e.event_type=?'; p.push(type); }
    if (status) { sql += ' AND e.status=?'; p.push(status); }
    sql += ' ORDER BY e.start_date ASC';
    res.json({ success:true, data: db.prepare(sql).all(...p) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
events.post('/:id/register', authenticate, (req,res) => {
  try {
    const ev = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
    if (!ev) return res.status(404).json({ success:false, error:'Event not found' });
    if (ev.registered_count >= ev.capacity) return res.status(400).json({ success:false, error:'Event is full' });
    db.prepare('INSERT OR IGNORE INTO event_registrations (user_id,event_id) VALUES (?,?)').run(req.user.id, req.params.id);
    db.prepare('UPDATE events SET registered_count=registered_count+1 WHERE id=?').run(req.params.id);
    res.json({ success:true, data:{ message:'Registered successfully' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
events.delete('/:id/register', authenticate, (req,res) => {
  try {
    db.prepare('DELETE FROM event_registrations WHERE user_id=? AND event_id=?').run(req.user.id, req.params.id);
    db.prepare('UPDATE events SET registered_count=MAX(0,registered_count-1) WHERE id=?').run(req.params.id);
    res.json({ success:true, data:{ message:'Registration cancelled' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
events.post('/', authenticate, authorize('admin'), (req,res) => {
  try {
    const { title,description,event_type,start_date,end_date,location,is_virtual,capacity,speakers } = req.body;
    const result = db.prepare('INSERT INTO events (title,description,event_type,start_date,end_date,location,is_virtual,capacity,speakers) VALUES (?,?,?,?,?,?,?,?,?)').run(title,description,event_type,start_date,end_date,location,is_virtual?1:0,capacity,speakers);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM events WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// FUNDING
// ═══════════════════════════════════════════════════════════
const funding = R();
funding.get('/schemes', authenticate, (req,res) => {
  try {
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    const sql = `SELECT fs.*, COALESCE(fa.app_status,'not_applied') as my_status, fa.amount_applied, fa.amount_approved, fa.applied_at FROM funding_schemes fs LEFT JOIN funding_applications fa ON fs.id=fa.scheme_id AND fa.startup_id=? ORDER BY fs.created_at DESC`;
    res.json({ success:true, data: db.prepare(sql).all(startup?.id||0) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
funding.post('/apply', authenticate, authorize('startup_founder'), (req,res) => {
  try {
    const { scheme_id, amount_applied, notes } = req.body;
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    if (!startup) return res.status(400).json({ success:false, error:'No startup profile' });
    db.prepare('INSERT OR REPLACE INTO funding_applications (startup_id,scheme_id,app_status,amount_applied,notes) VALUES (?,?,?,?,?)').run(startup.id, scheme_id, 'Submitted', amount_applied, notes);
    res.json({ success:true, data:{ message:'Application submitted successfully' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
funding.get('/my/applications', authenticate, (req,res) => {
  try {
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    const apps = db.prepare('SELECT fa.*,fs.name as scheme_name,fs.authority,fs.max_amount FROM funding_applications fa JOIN funding_schemes fs ON fa.scheme_id=fs.id WHERE fa.startup_id=? ORDER BY fa.applied_at DESC').all(startup?.id||0);
    res.json({ success:true, data:apps });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
funding.put('/applications/:id', authenticate, authorize('admin'), (req,res) => {
  try {
    const { app_status, amount_approved, notes } = req.body;
    db.prepare('UPDATE funding_applications SET app_status=?,amount_approved=?,notes=? WHERE id=?').run(app_status, amount_approved, notes, req.params.id);
    const app = db.prepare('SELECT fa.*,s.user_id,fs.name FROM funding_applications fa JOIN startups s ON fa.startup_id=s.id JOIN funding_schemes fs ON fa.scheme_id=fs.id WHERE fa.id=?').get(req.params.id);
    if (app) db.prepare('INSERT INTO notifications (user_id,title,message,notif_type) VALUES (?,?,?,?)').run(app.user_id, `Grant Update: ${app.name}`, `Your application status: ${app_status}. ${notes||''}`, app_status==='Approved'?'success':'info');
    res.json({ success:true, data:{ message:'Application updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
funding.post('/schemes', authenticate, authorize('admin'), (req,res) => {
  try {
    const { name,authority,scheme_type,min_amount,max_amount,deadline,eligibility,description } = req.body;
    const result = db.prepare('INSERT INTO funding_schemes (name,authority,scheme_type,min_amount,max_amount,deadline,eligibility,description) VALUES (?,?,?,?,?,?,?,?)').run(name,authority,scheme_type,min_amount,max_amount,deadline,eligibility,description);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM funding_schemes WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// COMMUNITY
// ═══════════════════════════════════════════════════════════
const community = R();
community.get('/posts', authenticate, (req,res) => {
  try {
    const posts = db.prepare(`SELECT cp.*,u.name as author_name,u.role as author_role, CASE WHEN pl.user_id IS NOT NULL THEN 1 ELSE 0 END as liked_by_me FROM community_posts cp JOIN users u ON cp.user_id=u.id LEFT JOIN post_likes pl ON cp.id=pl.post_id AND pl.user_id=? ORDER BY cp.created_at DESC LIMIT 50`).all(req.user.id);
    res.json({ success:true, data:posts });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
community.post('/posts', authenticate, (req,res) => {
  try {
    const { content, post_type } = req.body;
    if (!content?.trim()) return res.status(400).json({ success:false, error:'Content required' });
    const result = db.prepare('INSERT INTO community_posts (user_id,content,post_type) VALUES (?,?,?)').run(req.user.id, content, post_type||'update');
    const post = db.prepare('SELECT cp.*,u.name as author_name FROM community_posts cp JOIN users u ON cp.user_id=u.id WHERE cp.id=?').get(result.lastInsertRowid);
    res.status(201).json({ success:true, data:post });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
community.post('/posts/:id/like', authenticate, (req,res) => {
  try {
    const existing = db.prepare('SELECT 1 FROM post_likes WHERE user_id=? AND post_id=?').get(req.user.id, req.params.id);
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE user_id=? AND post_id=?').run(req.user.id, req.params.id);
      db.prepare('UPDATE community_posts SET likes_count=MAX(0,likes_count-1) WHERE id=?').run(req.params.id);
      return res.json({ success:true, data:{ liked:false } });
    }
    db.prepare('INSERT INTO post_likes (user_id,post_id) VALUES (?,?)').run(req.user.id, req.params.id);
    db.prepare('UPDATE community_posts SET likes_count=likes_count+1 WHERE id=?').run(req.params.id);
    res.json({ success:true, data:{ liked:true } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
community.get('/posts/:id/comments', authenticate, (req,res) => {
  try {
    const comments = db.prepare('SELECT pc.*,u.name as author_name FROM post_comments pc JOIN users u ON pc.user_id=u.id WHERE pc.post_id=? ORDER BY pc.created_at ASC').all(req.params.id);
    res.json({ success:true, data:comments });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
community.post('/posts/:id/comments', authenticate, (req,res) => {
  try {
    const { content } = req.body;
    db.prepare('INSERT INTO post_comments (user_id,post_id,content) VALUES (?,?,?)').run(req.user.id, req.params.id, content);
    db.prepare('UPDATE community_posts SET comments_count=comments_count+1 WHERE id=?').run(req.params.id);
    res.status(201).json({ success:true, data:{ message:'Comment added' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
community.get('/circles', authenticate, (req,res) => {
  try {
    const circles = db.prepare(`SELECT ic.*, CASE WHEN cm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member FROM innovation_circles ic LEFT JOIN circle_memberships cm ON ic.id=cm.circle_id AND cm.user_id=? ORDER BY ic.member_count DESC`).all(req.user.id);
    res.json({ success:true, data:circles });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
community.post('/circles/:id/join', authenticate, (req,res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO circle_memberships (circle_id,user_id) VALUES (?,?)').run(req.params.id, req.user.id);
    db.prepare('UPDATE innovation_circles SET member_count=member_count+1 WHERE id=?').run(req.params.id);
    res.json({ success:true, data:{ message:'Joined circle' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// TECHNOLOGY TRANSFER
// ═══════════════════════════════════════════════════════════
const technologies = R();
technologies.get('/', authenticate, (req,res) => {
  try {
    const { category, status, trl_min, trl_max, q } = req.query;
    let sql = 'SELECT t.*,u.name as researcher_name,r.institution FROM technologies t JOIN researchers r ON t.researcher_id=r.id JOIN users u ON r.user_id=u.id WHERE 1=1';
    const p = [];
    if (category) { sql += ' AND t.category=?'; p.push(category); }
    if (status) { sql += ' AND t.status=?'; p.push(status); }
    if (trl_min) { sql += ' AND t.trl_level>=?'; p.push(Number(trl_min)); }
    if (trl_max) { sql += ' AND t.trl_level<=?'; p.push(Number(trl_max)); }
    if (q) { sql += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.keywords LIKE ?)'; p.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    sql += ' ORDER BY t.created_at DESC';
    res.json({ success:true, data: db.prepare(sql).all(...p) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
technologies.get('/:id', authenticate, (req,res) => {
  try {
    const tech = db.prepare('SELECT t.*,u.name as researcher_name,r.institution,r.research_areas FROM technologies t JOIN researchers r ON t.researcher_id=r.id JOIN users u ON r.user_id=u.id WHERE t.id=?').get(req.params.id);
    if (!tech) return res.status(404).json({ success:false, error:'Not found' });
    tech.licenses = db.prepare('SELECT tl.*,s.name as startup_name FROM tech_licenses tl JOIN startups s ON tl.startup_id=s.id WHERE tl.technology_id=?').all(tech.id);
    res.json({ success:true, data:tech });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
technologies.post('/', authenticate, authorize('researcher'), (req,res) => {
  try {
    const r = db.prepare('SELECT id FROM researchers WHERE user_id=?').get(req.user.id);
    if (!r) return res.status(400).json({ success:false, error:'Researcher profile required' });
    const { title,description,category,trl_level,keywords,use_cases,valuation } = req.body;
    const result = db.prepare('INSERT INTO technologies (researcher_id,title,description,category,trl_level,keywords,use_cases,valuation) VALUES (?,?,?,?,?,?,?,?)').run(r.id,title,description,category,trl_level||1,keywords,use_cases,valuation);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM technologies WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
technologies.put('/:id', authenticate, (req,res) => {
  try {
    const { title,description,trl_level,status,valuation } = req.body;
    db.prepare('UPDATE technologies SET title=?,description=?,trl_level=?,status=?,valuation=? WHERE id=?').run(title,description,trl_level,status,valuation,req.params.id);
    res.json({ success:true, data:{ message:'Updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
technologies.post('/:id/license', authenticate, authorize('startup_founder'), (req,res) => {
  try {
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    if (!startup) return res.status(400).json({ success:false, error:'No startup profile' });
    const { license_type,royalty_rate,upfront_fee,duration_years,terms } = req.body;
    const result = db.prepare('INSERT INTO tech_licenses (technology_id,startup_id,license_type,royalty_rate,upfront_fee,duration_years,terms) VALUES (?,?,?,?,?,?,?)').run(req.params.id,startup.id,license_type,royalty_rate,upfront_fee,duration_years,terms);
    db.prepare("UPDATE technologies SET status='Under Negotiation' WHERE id=?").run(req.params.id);
    res.status(201).json({ success:true, data:{ message:'License request submitted' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
technologies.get('/my/ip', authenticate, (req,res) => {
  try {
    const u = req.user;
    if (u.role === 'researcher') {
      const r = db.prepare('SELECT id FROM researchers WHERE user_id=?').get(u.id);
      return res.json({ success:true, data: db.prepare('SELECT * FROM ip_assets WHERE researcher_id=?').all(r?.id) });
    }
    const s = db.prepare('SELECT id FROM startups WHERE user_id=?').get(u.id);
    return res.json({ success:true, data: db.prepare('SELECT * FROM ip_assets WHERE startup_id=?').all(s?.id) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
technologies.post('/ip', authenticate, (req,res) => {
  try {
    const { title,ip_type,status,application_number,filing_date,description } = req.body;
    const u = req.user;
    let startup_id = null, researcher_id = null;
    if (u.role === 'startup_founder') { startup_id = db.prepare('SELECT id FROM startups WHERE user_id=?').get(u.id)?.id; }
    if (u.role === 'researcher') { researcher_id = db.prepare('SELECT id FROM researchers WHERE user_id=?').get(u.id)?.id; }
    const result = db.prepare('INSERT INTO ip_assets (startup_id,researcher_id,title,ip_type,status,application_number,filing_date,description) VALUES (?,?,?,?,?,?,?,?)').run(startup_id,researcher_id,title,ip_type,status,application_number,filing_date,description);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM ip_assets WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// INDUSTRY PROBLEMS
// ═══════════════════════════════════════════════════════════
const problems = R();
problems.get('/', authenticate, (req,res) => {
  try {
    const { sector, status, type, q } = req.query;
    let sql = 'SELECT ps.*,u.name as posted_by FROM problem_statements ps JOIN users u ON ps.user_id=u.id WHERE 1=1';
    const p = [];
    if (sector) { sql += ' AND ps.sector=?'; p.push(sector); }
    if (status) { sql += ' AND ps.status=?'; p.push(status); }
    if (type) { sql += ' AND ps.problem_type=?'; p.push(type); }
    if (q) { sql += ' AND (ps.title LIKE ? OR ps.description LIKE ?)'; p.push(`%${q}%`,`%${q}%`); }
    sql += ' ORDER BY ps.created_at DESC';
    res.json({ success:true, data: db.prepare(sql).all(...p) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
problems.get('/:id', authenticate, (req,res) => {
  try {
    const prob = db.prepare('SELECT ps.*,u.name as posted_by FROM problem_statements ps JOIN users u ON ps.user_id=u.id WHERE ps.id=?').get(req.params.id);
    if (!prob) return res.status(404).json({ success:false, error:'Not found' });
    prob.solutions = db.prepare('SELECT pso.*,u.name as submitter_name FROM problem_solutions pso JOIN users u ON pso.user_id=u.id WHERE pso.problem_id=? ORDER BY pso.submitted_at DESC').all(prob.id);
    res.json({ success:true, data:prob });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
problems.post('/', authenticate, (req,res) => {
  try {
    const { company_name,title,description,problem_type,sector,budget_range,deadline,collaboration_type } = req.body;
    const result = db.prepare('INSERT INTO problem_statements (user_id,company_name,title,description,problem_type,sector,budget_range,deadline,collaboration_type) VALUES (?,?,?,?,?,?,?,?,?)').run(req.user.id,company_name,title,description,problem_type,sector,budget_range,deadline,collaboration_type);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM problem_statements WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
problems.post('/:id/solutions', authenticate, (req,res) => {
  try {
    const { title,description,approach,timeline,budget_requested } = req.body;
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    const researcher = db.prepare('SELECT id FROM researchers WHERE user_id=?').get(req.user.id);
    const result = db.prepare('INSERT INTO problem_solutions (problem_id,startup_id,researcher_id,user_id,title,description,approach,timeline,budget_requested) VALUES (?,?,?,?,?,?,?,?,?)').run(req.params.id,startup?.id,researcher?.id,req.user.id,title,description,approach,timeline,budget_requested);
    db.prepare('UPDATE problem_statements SET solutions_count=solutions_count+1 WHERE id=?').run(req.params.id);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM problem_solutions WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
problems.put('/solutions/:id/status', authenticate, (req,res) => {
  try {
    db.prepare('UPDATE problem_solutions SET status=? WHERE id=?').run(req.body.status, req.params.id);
    res.json({ success:true, data:{ message:'Status updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// SERVICE REQUESTS
// ═══════════════════════════════════════════════════════════
const services = R();
services.get('/', authenticate, (req,res) => {
  try {
    if (['admin','institutional_head'].includes(req.user.role)) {
      const { status, service_type } = req.query;
      let sql = 'SELECT sr.*,s.name as startup_name,u.name as requester_name FROM service_requests sr LEFT JOIN startups s ON sr.startup_id=s.id JOIN users u ON sr.user_id=u.id WHERE 1=1';
      const p = [];
      if (status) { sql += ' AND sr.status=?'; p.push(status); }
      if (service_type) { sql += ' AND sr.service_type=?'; p.push(service_type); }
      return res.json({ success:true, data: db.prepare(sql+' ORDER BY sr.created_at DESC').all(...p) });
    }
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    res.json({ success:true, data: db.prepare('SELECT * FROM service_requests WHERE user_id=? ORDER BY created_at DESC').all(req.user.id) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
services.post('/', authenticate, (req,res) => {
  try {
    const { service_type,title,description,priority,due_date } = req.body;
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    const result = db.prepare('INSERT INTO service_requests (startup_id,user_id,service_type,title,description,priority,due_date) VALUES (?,?,?,?,?,?,?)').run(startup?.id,req.user.id,service_type,title,description,priority||'Medium',due_date);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM service_requests WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
services.put('/:id', authenticate, authorize('admin','institutional_head'), (req,res) => {
  try {
    const { status, resolution_notes } = req.body;
    db.prepare('UPDATE service_requests SET status=?,resolution_notes=? WHERE id=?').run(status, resolution_notes, req.params.id);
    res.json({ success:true, data:{ message:'Updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// ASSESSMENTS
// ═══════════════════════════════════════════════════════════
const assessments = R();
assessments.get('/', authenticate, authorize('admin','evaluator','institutional_head'), (req,res) => {
  try {
    const rows = db.prepare('SELECT a.*,s.name as startup_name,u.name as evaluator_name FROM assessments a JOIN startups s ON a.startup_id=s.id LEFT JOIN users u ON a.evaluator_id=u.id ORDER BY a.assessed_at DESC').all();
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
assessments.post('/', authenticate, (req,res) => {
  try {
    const { startup_id,innovation_score,market_score,team_score,technology_score,revenue_score,scalability_score,remarks } = req.body;
    const overall = ((Number(innovation_score)*0.20)+(Number(market_score)*0.15)+(Number(team_score)*0.20)+(Number(technology_score)*0.15)+(Number(revenue_score)*0.15)+(Number(scalability_score)*0.15))*10;
    const result = db.prepare('INSERT INTO assessments (startup_id,evaluator_id,innovation_score,market_score,team_score,technology_score,revenue_score,scalability_score,overall_score,incubation_score,readiness_score,funding_score,remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(startup_id,req.user.id,innovation_score,market_score,team_score,technology_score,revenue_score,scalability_score,overall,Math.min(99,overall*1.05),overall*0.9,overall*0.85,remarks);
    const assessment = db.prepare('SELECT * FROM assessments WHERE id=?').get(result.lastInsertRowid);
    // Notify founder
    const startup = db.prepare('SELECT user_id,name FROM startups WHERE id=?').get(startup_id);
    if (startup) db.prepare('INSERT INTO notifications (user_id,title,message,notif_type) VALUES (?,?,?,?)').run(startup.user_id,'Assessment Completed',`Your startup assessment is complete. Overall score: ${Math.round(overall)}/100.`,'info');
    res.status(201).json({ success:true, data:assessment });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
assessments.get('/startup/:id', authenticate, (req,res) => {
  try {
    const rows = db.prepare('SELECT a.*,u.name as evaluator_name FROM assessments a LEFT JOIN users u ON a.evaluator_id=u.id WHERE a.startup_id=? ORDER BY a.assessed_at DESC').all(req.params.id);
    res.json({ success:true, data:rows });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// PROGRAMS
// ═══════════════════════════════════════════════════════════
const programs = R();
programs.get('/', authenticate, (req,res) => {
  try {
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    const sql = `SELECT p.*, COALESCE(pe.status,'not_enrolled') as enrollment_status FROM programs p LEFT JOIN program_enrollments pe ON p.id=pe.program_id AND pe.startup_id=? WHERE p.status != 'Planning' ORDER BY p.created_at DESC`;
    res.json({ success:true, data: db.prepare(sql).all(startup?.id||0) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
programs.post('/:id/apply', authenticate, authorize('startup_founder'), (req,res) => {
  try {
    const startup = db.prepare('SELECT id FROM startups WHERE user_id=?').get(req.user.id);
    if (!startup) return res.status(400).json({ success:false, error:'No startup profile' });
    const program = db.prepare('SELECT * FROM programs WHERE id=?').get(req.params.id);
    if (!program) return res.status(404).json({ success:false, error:'Program not found' });
    db.prepare('INSERT OR IGNORE INTO program_enrollments (startup_id,program_id,cohort_number,status) VALUES (?,?,?,?)').run(startup.id, req.params.id, program.current_cohort, 'Applied');
    res.json({ success:true, data:{ message:'Application submitted for review' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
programs.post('/', authenticate, authorize('admin'), (req,res) => {
  try {
    const { name,program_type,description,duration_months,cohort_size,benefits,eligibility,start_date,end_date } = req.body;
    const result = db.prepare('INSERT INTO programs (name,program_type,description,duration_months,cohort_size,benefits,eligibility,start_date,end_date) VALUES (?,?,?,?,?,?,?,?,?)').run(name,program_type,description,duration_months,cohort_size,benefits,eligibility,start_date,end_date);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM programs WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
programs.put('/enrollments/:id', authenticate, authorize('admin'), (req,res) => {
  try {
    db.prepare('UPDATE program_enrollments SET status=? WHERE id=?').run(req.body.status, req.params.id);
    res.json({ success:true, data:{ message:'Updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// DATA ROOM
// ═══════════════════════════════════════════════════════════
const dataroom = R();
dataroom.get('/:startup_id', authenticate, (req,res) => {
  try {
    const room = db.prepare('SELECT * FROM data_rooms WHERE startup_id=?').get(req.params.startup_id);
    if (!room) return res.status(404).json({ success:false, error:'Data room not found' });
    const docs = db.prepare('SELECT d.*,u.name as uploaded_by_name FROM data_room_docs d JOIN users u ON d.uploaded_by=u.id WHERE d.data_room_id=? ORDER BY d.uploaded_at DESC').all(room.id);
    res.json({ success:true, data:{ ...room, documents: docs } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
dataroom.post('/:startup_id/documents', authenticate, (req,res) => {
  try {
    const room = db.prepare('SELECT id FROM data_rooms WHERE startup_id=?').get(req.params.startup_id);
    if (!room) return res.status(404).json({ success:false, error:'Data room not found' });
    const { category,title,file_name,file_size } = req.body;
    const result = db.prepare('INSERT INTO data_room_docs (data_room_id,category,title,file_name,file_size,uploaded_by) VALUES (?,?,?,?,?,?)').run(room.id,category,title,file_name,file_size,req.user.id);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM data_room_docs WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
dataroom.delete('/documents/:id', authenticate, (req,res) => {
  try {
    db.prepare('DELETE FROM data_room_docs WHERE id=?').run(req.params.id);
    res.json({ success:true, data:{ message:'Document deleted' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// RESOURCES
// ═══════════════════════════════════════════════════════════
const resources = R();
resources.get('/', authenticate, (req,res) => {
  try {
    const { category, q } = req.query;
    let sql = 'SELECT * FROM resources WHERE 1=1';
    const p = [];
    if (category) { sql += ' AND category=?'; p.push(category); }
    if (q) { sql += ' AND (name LIKE ? OR description LIKE ?)'; p.push(`%${q}%`,`%${q}%`); }
    sql += ' ORDER BY download_count DESC';
    res.json({ success:true, data: db.prepare(sql).all(...p) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
resources.post('/:id/download', authenticate, (req,res) => {
  try {
    db.prepare('UPDATE resources SET download_count=download_count+1 WHERE id=?').run(req.params.id);
    res.json({ success:true, data:{ message:'Download tracked' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
resources.post('/', authenticate, authorize('admin'), (req,res) => {
  try {
    const { name,description,category,file_format,file_size } = req.body;
    const result = db.prepare('INSERT INTO resources (name,description,category,file_format,file_size,uploaded_by) VALUES (?,?,?,?,?,?)').run(name,description,category,file_format,file_size,req.user.id);
    res.status(201).json({ success:true, data:db.prepare('SELECT * FROM resources WHERE id=?').get(result.lastInsertRowid) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════
const admin = R();
admin.get('/stats', authenticate, authorize('admin','institutional_head'), (req,res) => {
  try {
    const stats = {
      startups:{ total: db.prepare('SELECT COUNT(*) c FROM startups').get().c, active: db.prepare("SELECT COUNT(*) c FROM startups WHERE status='Active'").get().c, graduated: db.prepare("SELECT COUNT(*) c FROM startups WHERE status='Graduated'").get().c, pending: db.prepare("SELECT COUNT(*) c FROM startups WHERE status='Pending' OR status='Under Review'").get().c },
      mentors:{ total: db.prepare('SELECT COUNT(*) c FROM mentors').get().c, available: db.prepare('SELECT COUNT(*) c FROM mentors WHERE is_available=1').get().c, sessions: db.prepare('SELECT COUNT(*) c FROM mentor_sessions').get().c },
      investors:{ total: db.prepare('SELECT COUNT(*) c FROM investors').get().c, deals: db.prepare('SELECT COUNT(*) c FROM investor_deals').get().c },
      financial:{ totalFunding: db.prepare('SELECT COALESCE(SUM(total_funding),0) s FROM startups').get().s, monthlyRevenue: db.prepare("SELECT COALESCE(SUM(monthly_revenue),0) s FROM startups WHERE status='Active'").get().s, approvedGrants: db.prepare("SELECT COALESCE(SUM(amount_approved),0) s FROM funding_applications WHERE app_status='Approved'").get().s },
      jobs:{ total: db.prepare('SELECT COALESCE(SUM(team_size),0) s FROM startups').get().s },
      ip:{ total: db.prepare('SELECT COUNT(*) c FROM ip_assets').get().c, patents: db.prepare("SELECT COUNT(*) c FROM ip_assets WHERE ip_type='Patent'").get().c },
      technologies:{ total: db.prepare('SELECT COUNT(*) c FROM technologies').get().c, available: db.prepare("SELECT COUNT(*) c FROM technologies WHERE status='Available'").get().c },
      problems:{ open: db.prepare("SELECT COUNT(*) c FROM problem_statements WHERE status='Open'").get().c },
      services:{ pending: db.prepare("SELECT COUNT(*) c FROM service_requests WHERE status='Open' OR status='Assigned'").get().c },
      programs:{ total: db.prepare('SELECT COUNT(*) c FROM programs').get().c, enrollments: db.prepare("SELECT COUNT(*) c FROM program_enrollments WHERE status='Enrolled'").get().c },
      sectors: db.prepare("SELECT sector, COUNT(*) as count FROM startups GROUP BY sector ORDER BY count DESC").all(),
      stages: db.prepare("SELECT stage, COUNT(*) as count FROM startups GROUP BY stage ORDER BY count DESC").all(),
      recentActivity: db.prepare('SELECT al.*,u.name FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id ORDER BY al.timestamp DESC LIMIT 10').all(),
    };
    res.json({ success:true, data:stats });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
admin.get('/users', authenticate, authorize('admin'), (req,res) => {
  try {
    const { role, q } = req.query;
    let sql = 'SELECT id,name,email,role,phone,is_active,created_at FROM users WHERE 1=1';
    const p = [];
    if (role) { sql += ' AND role=?'; p.push(role); }
    if (q) { sql += ' AND (name LIKE ? OR email LIKE ?)'; p.push(`%${q}%`,`%${q}%`); }
    sql += ' ORDER BY created_at DESC';
    res.json({ success:true, data: db.prepare(sql).all(...p) });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
admin.put('/users/:id/status', authenticate, authorize('admin'), (req,res) => {
  try {
    db.prepare('UPDATE users SET is_active=? WHERE id=?').run(req.body.is_active?1:0, req.params.id);
    res.json({ success:true, data:{ message:'User status updated' } });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});
admin.get('/audit-logs', authenticate, authorize('admin'), (req,res) => {
  try {
    const logs = db.prepare('SELECT al.*,u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id ORDER BY al.timestamp DESC LIMIT 100').all();
    res.json({ success:true, data:logs });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

module.exports = { investors, researchers, courses, events, funding, community, technologies, problems, services, assessments, programs, dataroom, resources, admin };
