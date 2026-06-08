'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'vic.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('startup_founder','mentor','investor','researcher','evaluator','admin','institutional_head','industry')),
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      profile_complete INTEGER DEFAULT 0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS startups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      sector TEXT,
      stage TEXT DEFAULT 'Idea' CHECK(stage IN ('Idea','Prototype','MVP','Early Revenue','Growth','Mature')),
      website TEXT,
      founded_year INTEGER,
      team_size INTEGER DEFAULT 1,
      monthly_revenue REAL DEFAULT 0,
      total_funding REAL DEFAULT 0,
      customers INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Under Review','Active','Graduated','Rejected')),
      pitch_deck_url TEXT,
      logo_url TEXT,
      cohort INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mentors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expertise TEXT,
      industry TEXT,
      experience_years INTEGER DEFAULT 0,
      company TEXT,
      designation TEXT,
      bio TEXT,
      is_available INTEGER DEFAULT 1,
      rating REAL DEFAULT 0,
      total_sessions INTEGER DEFAULT 0,
      linkedin_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mentor_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_id INTEGER REFERENCES startups(id),
      mentor_id INTEGER REFERENCES mentors(id),
      user_id INTEGER REFERENCES users(id),
      scheduled_at DATETIME NOT NULL,
      duration_mins INTEGER DEFAULT 60,
      platform TEXT DEFAULT 'Zoom',
      agenda TEXT,
      meeting_link TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Confirmed','Completed','Cancelled')),
      notes TEXT,
      feedback_rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS investors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      firm_name TEXT,
      investor_type TEXT CHECK(investor_type IN ('Angel','VC','Corporate','PE','Family Office')),
      investment_stage TEXT,
      sectors_focus TEXT,
      min_ticket REAL DEFAULT 0,
      max_ticket REAL DEFAULT 0,
      portfolio_count INTEGER DEFAULT 0,
      city TEXT,
      bio TEXT,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS investor_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investor_id INTEGER REFERENCES investors(id),
      startup_id INTEGER REFERENCES startups(id),
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Connected','Declined')),
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(investor_id, startup_id)
    );

    CREATE TABLE IF NOT EXISTS investor_deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investor_id INTEGER REFERENCES investors(id),
      startup_id INTEGER REFERENCES startups(id),
      stage TEXT DEFAULT 'Discovery' CHECK(stage IN ('Discovery','Due Diligence','Term Sheet','Negotiation','Closed','Rejected')),
      proposed_amount REAL,
      final_amount REAL,
      equity_percentage REAL,
      valuation REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS researchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      institution TEXT,
      department TEXT,
      designation TEXT,
      research_areas TEXT,
      patents_count INTEGER DEFAULT 0,
      publications_count INTEGER DEFAULT 0,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      level TEXT DEFAULT 'Beginner' CHECK(level IN ('Beginner','Intermediate','Advanced')),
      duration_hours REAL DEFAULT 1,
      total_lessons INTEGER DEFAULT 1,
      instructor TEXT,
      thumbnail_url TEXT,
      is_published INTEGER DEFAULT 1,
      enrolled_count INTEGER DEFAULT 0,
      rating REAL DEFAULT 4.5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      course_id INTEGER REFERENCES courses(id),
      progress INTEGER DEFAULT 0,
      completed_at DATETIME,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      file_format TEXT,
      file_size TEXT,
      file_url TEXT,
      download_count INTEGER DEFAULT 0,
      uploaded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT,
      start_date DATETIME,
      end_date DATETIME,
      location TEXT DEFAULT 'Virtual',
      is_virtual INTEGER DEFAULT 1,
      capacity INTEGER DEFAULT 100,
      registered_count INTEGER DEFAULT 0,
      speakers TEXT,
      status TEXT DEFAULT 'Upcoming' CHECK(status IN ('Upcoming','Ongoing','Completed','Cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      event_id INTEGER REFERENCES events(id),
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      attended INTEGER DEFAULT 0,
      UNIQUE(user_id, event_id)
    );

    CREATE TABLE IF NOT EXISTS funding_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      authority TEXT,
      scheme_type TEXT,
      min_amount REAL DEFAULT 0,
      max_amount REAL DEFAULT 0,
      deadline DATE,
      eligibility TEXT,
      description TEXT,
      application_url TEXT,
      status TEXT DEFAULT 'Open' CHECK(status IN ('Open','Closing Soon','Closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS funding_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_id INTEGER REFERENCES startups(id),
      scheme_id INTEGER REFERENCES funding_schemes(id),
      app_status TEXT DEFAULT 'Submitted' CHECK(app_status IN ('Draft','Submitted','Under Review','Approved','Rejected','Disbursed')),
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      amount_applied REAL,
      amount_approved REAL,
      UNIQUE(startup_id, scheme_id)
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      post_type TEXT DEFAULT 'update',
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      user_id INTEGER REFERENCES users(id),
      post_id INTEGER REFERENCES community_posts(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      post_id INTEGER REFERENCES community_posts(id),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ip_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_id INTEGER REFERENCES startups(id),
      researcher_id INTEGER REFERENCES researchers(id),
      title TEXT NOT NULL,
      ip_type TEXT DEFAULT 'Patent' CHECK(ip_type IN ('Patent','Trademark','Copyright','Design')),
      status TEXT DEFAULT 'Filed' CHECK(status IN ('Conceived','Filed','Under Examination','Granted','Rejected')),
      application_number TEXT,
      filing_date DATE,
      grant_date DATE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS technologies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      researcher_id INTEGER REFERENCES researchers(id),
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      trl_level INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Available' CHECK(status IN ('Available','Under Negotiation','Licensed','Not Available')),
      keywords TEXT,
      use_cases TEXT,
      valuation REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tech_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technology_id INTEGER REFERENCES technologies(id),
      startup_id INTEGER REFERENCES startups(id),
      license_type TEXT DEFAULT 'Non-Exclusive' CHECK(license_type IN ('Exclusive','Non-Exclusive','Sub-licensable')),
      royalty_rate REAL DEFAULT 0,
      upfront_fee REAL DEFAULT 0,
      duration_years INTEGER DEFAULT 5,
      terms TEXT,
      status TEXT DEFAULT 'Negotiating' CHECK(status IN ('Negotiating','Active','Expired','Terminated')),
      signed_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS problem_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      company_name TEXT,
      title TEXT NOT NULL,
      description TEXT,
      problem_type TEXT,
      sector TEXT,
      budget_range TEXT,
      deadline DATE,
      collaboration_type TEXT,
      status TEXT DEFAULT 'Open' CHECK(status IN ('Open','Closed','Awarded')),
      solutions_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS problem_solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id INTEGER REFERENCES problem_statements(id),
      startup_id INTEGER REFERENCES startups(id),
      researcher_id INTEGER REFERENCES researchers(id),
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      approach TEXT,
      timeline TEXT,
      budget_requested REAL,
      status TEXT DEFAULT 'Submitted' CHECK(status IN ('Submitted','Under Review','Selected','Rejected')),
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_id INTEGER REFERENCES startups(id),
      user_id INTEGER REFERENCES users(id),
      service_type TEXT NOT NULL,
      title TEXT,
      description TEXT,
      priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High','Urgent')),
      status TEXT DEFAULT 'Open' CHECK(status IN ('Open','Assigned','In Progress','Completed','Cancelled')),
      due_date DATE,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_id INTEGER REFERENCES startups(id),
      evaluator_id INTEGER REFERENCES users(id),
      innovation_score INTEGER DEFAULT 5,
      market_score INTEGER DEFAULT 5,
      team_score INTEGER DEFAULT 5,
      technology_score INTEGER DEFAULT 5,
      revenue_score INTEGER DEFAULT 5,
      scalability_score INTEGER DEFAULT 5,
      overall_score REAL DEFAULT 50,
      incubation_score REAL DEFAULT 50,
      readiness_score REAL DEFAULT 50,
      funding_score REAL DEFAULT 50,
      remarks TEXT,
      assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      program_type TEXT CHECK(program_type IN ('Pre-Incubation','Incubation','Acceleration','Fellowship','Innovation Challenge','Venture Studio')),
      description TEXT,
      duration_months INTEGER DEFAULT 3,
      cohort_size INTEGER DEFAULT 20,
      current_cohort INTEGER DEFAULT 1,
      benefits TEXT,
      eligibility TEXT,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Planning','Active','Closed')),
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS program_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_id INTEGER REFERENCES startups(id),
      program_id INTEGER REFERENCES programs(id),
      cohort_number INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Enrolled' CHECK(status IN ('Applied','Enrolled','Completed','Dropped')),
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(startup_id, program_id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_id INTEGER REFERENCES startups(id),
      title TEXT NOT NULL,
      description TEXT,
      target_date DATE,
      completed_at DATE,
      progress INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS data_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_id INTEGER REFERENCES startups(id),
      name TEXT DEFAULT 'Primary Data Room',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS data_room_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_room_id INTEGER REFERENCES data_rooms(id),
      category TEXT CHECK(category IN ('Legal','Financial','Team','IP','Product','Market')),
      title TEXT NOT NULL,
      file_name TEXT,
      file_size TEXT,
      uploaded_by INTEGER REFERENCES users(id),
      view_count INTEGER DEFAULT 0,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS innovation_circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      circle_type TEXT CHECK(circle_type IN ('Founder','Mentor','Investor','Sector','Research')),
      is_private INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      member_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS circle_memberships (
      circle_id INTEGER REFERENCES innovation_circles(id),
      user_id INTEGER REFERENCES users(id),
      role TEXT DEFAULT 'Member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(circle_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT,
      notif_type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Database initialized successfully');
}

module.exports = { db, initDB };
