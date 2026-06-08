'use strict';
const router = require('express').Router();
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  try {
    const u = req.user;
    if (u.role === 'admin' || u.role === 'institutional_head') {
      const stats = {
        totalStartups: db.prepare('SELECT COUNT(*) as c FROM startups').get().c,
        activeStartups: db.prepare("SELECT COUNT(*) as c FROM startups WHERE status='Active'").get().c,
        graduatedStartups: db.prepare("SELECT COUNT(*) as c FROM startups WHERE status='Graduated'").get().c,
        pendingStartups: db.prepare("SELECT COUNT(*) as c FROM startups WHERE status='Pending' OR status='Under Review'").get().c,
        totalMentors: db.prepare('SELECT COUNT(*) as c FROM mentors').get().c,
        availableMentors: db.prepare('SELECT COUNT(*) as c FROM mentors WHERE is_available=1').get().c,
        totalSessions: db.prepare('SELECT COUNT(*) as c FROM mentor_sessions').get().c,
        totalInvestors: db.prepare('SELECT COUNT(*) as c FROM investors').get().c,
        totalFunding: db.prepare('SELECT COALESCE(SUM(total_funding),0) as s FROM startups').get().s,
        totalJobs: db.prepare('SELECT COALESCE(SUM(team_size),0) as s FROM startups').get().s,
        totalPatents: db.prepare('SELECT COUNT(*) as c FROM ip_assets').get().c,
        totalCourses: db.prepare('SELECT COUNT(*) as c FROM courses').get().c,
        totalEnrollments: db.prepare('SELECT COUNT(*) as c FROM enrollments').get().c,
        openProblems: db.prepare("SELECT COUNT(*) as c FROM problem_statements WHERE status='Open'").get().c,
        totalTechnologies: db.prepare('SELECT COUNT(*) as c FROM technologies').get().c,
        pendingServices: db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE status='Open'").get().c,
        recentStartups: db.prepare('SELECT s.*,u.name as founder_name FROM startups s JOIN users u ON s.user_id=u.id ORDER BY s.created_at DESC LIMIT 5').all(),
        sectorBreakdown: db.prepare("SELECT sector, COUNT(*) as count FROM startups GROUP BY sector ORDER BY count DESC").all(),
        stageBreakdown: db.prepare("SELECT stage, COUNT(*) as count FROM startups GROUP BY stage ORDER BY count DESC").all(),
        monthlyRevenue: db.prepare("SELECT COALESCE(SUM(monthly_revenue),0) as total FROM startups WHERE status='Active'").get().total,
      };
      return res.json({ success: true, data: stats });
    }
    if (u.role === 'startup_founder') {
      const startup = db.prepare('SELECT * FROM startups WHERE user_id=? ORDER BY id DESC LIMIT 1').get(u.id);
      if (!startup) return res.json({ success: true, data: { hasStartup: false } });
      const stats = {
        hasStartup: true,
        startup,
        milestones: db.prepare('SELECT * FROM milestones WHERE startup_id=? ORDER BY target_date ASC').all(startup.id),
        recentSessions: db.prepare('SELECT ms.*,u.name as mentor_name FROM mentor_sessions ms JOIN mentors m ON ms.mentor_id=m.id JOIN users u ON m.user_id=u.id WHERE ms.startup_id=? ORDER BY ms.created_at DESC LIMIT 3').all(startup.id),
        fundingApps: db.prepare('SELECT fa.*,fs.name as scheme_name,fs.authority FROM funding_applications fa JOIN funding_schemes fs ON fa.scheme_id=fs.id WHERE fa.startup_id=?').all(startup.id),
        assessment: db.prepare('SELECT * FROM assessments WHERE startup_id=? ORDER BY assessed_at DESC LIMIT 1').get(startup.id),
        serviceRequests: db.prepare("SELECT * FROM service_requests WHERE startup_id=? AND status != 'Completed' ORDER BY created_at DESC LIMIT 3").all(startup.id),
        programEnrollments: db.prepare('SELECT pe.*,p.name as program_name,p.program_type FROM program_enrollments pe JOIN programs p ON pe.program_id=p.id WHERE pe.startup_id=?').all(startup.id),
        notifications: db.prepare('SELECT * FROM notifications WHERE user_id=? AND is_read=0 ORDER BY created_at DESC LIMIT 5').all(u.id),
      };
      return res.json({ success: true, data: stats });
    }
    if (u.role === 'mentor') {
      const mentor = db.prepare('SELECT * FROM mentors WHERE user_id=?').get(u.id);
      const stats = {
        mentor,
        upcomingSessions: db.prepare("SELECT ms.*,s.name as startup_name FROM mentor_sessions ms JOIN startups s ON ms.startup_id=s.id WHERE ms.mentor_id=? AND ms.status IN ('Pending','Confirmed') ORDER BY ms.scheduled_at ASC LIMIT 5").all(mentor?.id),
        totalSessions: db.prepare('SELECT COUNT(*) as c FROM mentor_sessions WHERE mentor_id=?').get(mentor?.id)?.c || 0,
        completedSessions: db.prepare("SELECT COUNT(*) as c FROM mentor_sessions WHERE mentor_id=? AND status='Completed'").get(mentor?.id)?.c || 0,
      };
      return res.json({ success: true, data: stats });
    }
    if (u.role === 'investor') {
      const investor = db.prepare('SELECT * FROM investors WHERE user_id=?').get(u.id);
      const stats = {
        investor,
        deals: db.prepare('SELECT id.*,s.name as startup_name FROM investor_deals id JOIN startups s ON id.startup_id=s.id WHERE id.investor_id=? ORDER BY id.created_at DESC').all(investor?.id),
        connections: db.prepare('SELECT ic.*,s.name as startup_name FROM investor_connections ic JOIN startups s ON ic.startup_id=s.id WHERE ic.investor_id=?').all(investor?.id),
      };
      return res.json({ success: true, data: stats });
    }
    if (u.role === 'researcher') {
      const researcher = db.prepare('SELECT * FROM researchers WHERE user_id=?').get(u.id);
      const stats = {
        researcher,
        technologies: db.prepare('SELECT * FROM technologies WHERE researcher_id=?').all(researcher?.id),
        ipAssets: db.prepare('SELECT * FROM ip_assets WHERE researcher_id=?').all(researcher?.id),
        solutions: db.prepare('SELECT ps.*,p.title as problem_title FROM problem_solutions ps JOIN problem_statements p ON ps.problem_id=p.id WHERE ps.researcher_id=?').all(researcher?.id),
      };
      return res.json({ success: true, data: stats });
    }
    res.json({ success: true, data: { role: u.role } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
