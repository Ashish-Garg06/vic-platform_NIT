'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, initDB } = require('./database');

initDB();

const hash = (p) => bcrypt.hashSync(p, 10);

console.log('🌱 Seeding database...');

// ── Users ────────────────────────────────────────────────
const insertUser = db.prepare(`INSERT OR IGNORE INTO users (name,email,password,role,phone,is_active,profile_complete) VALUES (?,?,?,?,?,1,1)`);
const users = [
  [1,'Admin User','admin@vic.in',hash('admin123'),'admin','9876540001'],
  [2,'Amit Sharma','startup@vic.in',hash('startup123'),'startup_founder','9876540002'],
  [3,'Dr. Priya Sharma','mentor@vic.in',hash('mentor123'),'mentor','9876540003'],
  [4,'Arjun Mehta','arjun@sequoia.in',hash('mentor123'),'mentor','9876540004'],
  [5,'Kavita Reddy','kavita@google.in',hash('mentor123'),'mentor','9876540005'],
  [6,'Rajan Anandan','rajan@angel.in',hash('investor123'),'investor','9876540006'],
  [7,'Nexus Ventures','nexus@vc.in',hash('investor123'),'investor','9876540007'],
  [8,'Prof. Kumar','kumar@iima.in',hash('researcher123'),'researcher','9876540008'],
  [9,'Dr. Meera Joshi','meera@iit.in',hash('researcher123'),'researcher','9876540009'],
  [10,'Evaluator One','eval@vic.in',hash('eval123'),'evaluator','9876540010'],
  [11,'Rohit Kumar','rohit@healthsync.in',hash('startup123'),'startup_founder','9876540011'],
  [12,'Sneha Patel','sneha@greenlogix.in',hash('startup123'),'startup_founder','9876540012'],
  [13,'Karan Gupta','karan@techbridge.in',hash('startup123'),'startup_founder','9876540013'],
  [14,'Industry Partner','industry@tata.in',hash('industry123'),'industry','9876540014'],
  [15,'Leadership Head','head@iitd.in',hash('admin123'),'institutional_head','9876540015'],
];
users.forEach(u=>insertUser.run(u[1],u[2],u[3],u[4],u[5]));

// ── Startups ─────────────────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO startups (user_id,name,tagline,sector,stage,team_size,monthly_revenue,total_funding,customers,status,founded_year,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(2,'AgriSense AI','AI-Driven Precision Agriculture','AgriTech','MVP',8,240000,12000000,1240,'Active',2024,'Smart IoT sensors and AI analytics for precision farming.');
db.prepare(`INSERT OR IGNORE INTO startups (user_id,name,tagline,sector,stage,team_size,monthly_revenue,total_funding,customers,status,founded_year,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(11,'HealthSync Pro','Next-Gen Patient Management','HealthTech','Early Revenue',12,680000,30000000,5000,'Active',2023,'Digital health records and telemedicine platform for tier-2 cities.');
db.prepare(`INSERT OR IGNORE INTO startups (user_id,name,tagline,sector,stage,team_size,monthly_revenue,total_funding,customers,status,founded_year,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(12,'GreenLogix','Sustainable Supply Chain Intelligence','CleanTech','MVP',6,180000,7500000,200,'Active',2024,'Carbon tracking and sustainable supply chain management.');
db.prepare(`INSERT OR IGNORE INTO startups (user_id,name,tagline,sector,stage,team_size,monthly_revenue,total_funding,customers,status,founded_year,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(13,'TechBridge','Connecting Rural India to Digital Economy','SaaS','Early Revenue',10,400000,20000000,800,'Graduated',2022,'B2B SaaS for rural digital transformation.');

// ── Mentors ───────────────────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO mentors (user_id,expertise,industry,experience_years,company,designation,bio,is_available,rating,total_sessions) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(3,'FinTech & Banking Strategy','Financial Services',18,'IIT Bombay','Professor & Advisor','Former VP at HDFC Bank. Expert in FinTech regulation and scaling financial products.',1,4.9,342);
db.prepare(`INSERT OR IGNORE INTO mentors (user_id,expertise,industry,experience_years,company,designation,bio,is_available,rating,total_sessions) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(4,'B2B SaaS & GTM Strategy','Technology',15,'Sequoia Capital','Partner','Led 20+ SaaS investments. Expert in go-to-market strategy and PMF.',1,4.8,289);
db.prepare(`INSERT OR IGNORE INTO mentors (user_id,expertise,industry,experience_years,company,designation,bio,is_available,rating,total_sessions) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(5,'AI/ML & Deep Tech','Technology',12,'Google AI','Research Scientist','AI researcher turned investor. Builds tech moats for deep tech startups.',0,4.9,201);

// ── Investors ─────────────────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO investors (user_id,firm_name,investor_type,investment_stage,sectors_focus,min_ticket,max_ticket,portfolio_count,city,bio) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(6,'Self','Angel','Pre-Seed','SaaS,EdTech,HealthTech',2500000,20000000,45,'Bangalore','Early stage angel investor with 45 portfolio companies.');
db.prepare(`INSERT OR IGNORE INTO investors (user_id,firm_name,investor_type,investment_stage,sectors_focus,min_ticket,max_ticket,portfolio_count,city,bio) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(7,'Nexus Venture Partners','VC','Series A / B','SaaS,Consumer,FinTech',50000000,500000000,85,'Mumbai','Leading VC fund with $1.5B AUM focused on Indian tech startups.');

// ── Researchers ───────────────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO researchers (user_id,institution,department,designation,research_areas,patents_count,publications_count,bio) VALUES (?,?,?,?,?,?,?,?)`).run(8,'IIM Ahmedabad','Management','Professor','Business Strategy,Entrepreneurship,BMC',2,45,'22 years of teaching and research in entrepreneurship and business strategy.');
db.prepare(`INSERT OR IGNORE INTO researchers (user_id,institution,department,designation,research_areas,patents_count,publications_count,bio) VALUES (?,?,?,?,?,?,?,?)`).run(9,'IIT Delhi','Computer Science','Associate Professor','Machine Learning,Computer Vision,IoT',7,38,'Expert in applied ML and IoT systems. Multiple patents in sensor fusion technology.');

// ── Courses ───────────────────────────────────────────────
const cstmt = db.prepare(`INSERT OR IGNORE INTO courses (title,description,category,level,duration_hours,total_lessons,instructor,enrolled_count,rating) VALUES (?,?,?,?,?,?,?,?,?)`);
[
  ['Business Model Canvas Mastery','Complete BMC from ideation to validation','Business','Beginner',4.5,12,'Prof. Anand Kumar',1240,4.8],
  ['Pitch Deck That Raises Millions','Craft investor-ready presentations','Fundraising','Intermediate',3.5,10,'Ritu Nanda',2100,4.9],
  ['Financial Modeling for Startups','3-statement models, unit economics, projections','Finance','Advanced',6,18,'CA Meera Joshi',890,4.7],
  ['Growth Hacking & Digital Marketing','Modern growth playbooks for startups','Marketing','Intermediate',5.75,15,'Rahul Bansal',1680,4.8],
  ['Product Management Bootcamp','From idea to product roadmap','Product',  'Intermediate',8,22,'Neha Patel',3400,4.9],
  ['Startup Legal Essentials','Incorporation, compliance, term sheets','Legal','Beginner',3,8,'Adv. Sunita Nair',650,4.6],
  ['Intellectual Property for Founders','Patents, trademarks, copyright strategy','Legal','Beginner',2.5,7,'Adv. Rohit Shah',480,4.7],
  ['Customer Development Framework','Talk to users, validate faster','Research','Intermediate',4,11,'Arjun Mehta',920,4.8],
].forEach(r=>cstmt.run(...r));

// ── Resources ─────────────────────────────────────────────
const rstmt = db.prepare(`INSERT OR IGNORE INTO resources (name,description,category,file_format,file_size,download_count) VALUES (?,?,?,?,?,?)`);
[
  ['Business Plan Master Template','Comprehensive 50-page business plan template','Templates','DOCX','2.4 MB',3420],
  ['Pitch Deck — Investor Ready','15-slide investor pitch deck template','Templates','PPTX','8.1 MB',5680],
  ['3-Year Financial Model','Detailed 3-statement financial model','Finance','XLSX','1.2 MB',2890],
  ['NDA Template (India)','Non-disclosure agreement template','Legal','PDF','0.4 MB',1230],
  ['Founders Agreement','Comprehensive co-founder agreement','Legal','PDF','0.6 MB',980],
  ['ESOP Plan Template','Employee stock option plan template','Legal','DOCX','0.8 MB',670],
  ['Market Research Framework','Structured market analysis guide','Research','PDF','1.5 MB',2100],
  ['OKR Planning Template','Quarterly objectives and key results','Templates','XLSX','0.9 MB',1230],
  ['VC Term Sheet Guide','Understanding VC term sheets','Finance','PDF','1.1 MB',1450],
  ['Startup Legal Checklist','Complete legal compliance checklist','Legal','PDF','0.3 MB',1890],
  ['AWS Activate Credits Guide','Getting cloud credits for startups','Technology','PDF','0.7 MB',890],
  ['Customer Discovery Script','Interview framework for user research','Research','DOCX','0.5 MB',1670],
].forEach(r=>rstmt.run(...r));

// ── Events ────────────────────────────────────────────────
const estmt = db.prepare(`INSERT OR IGNORE INTO events (title,description,event_type,start_date,end_date,location,is_virtual,capacity,registered_count,speakers,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
[
  ['Demo Day — Cohort 8','Annual showcase for Cohort 8 startups','Demo Day','2026-06-20 10:00:00','2026-06-20 17:00:00','IIT Delhi + Virtual',1,500,420,'Rajan Anandan, Kunal Shah','Upcoming'],
  ['HealthTech Hackathon 2026','48-hour health innovation challenge','Hackathon','2026-07-05 09:00:00','2026-07-07 18:00:00','Virtual',1,400,280,'Dr. Devi Shetty, Kavita Reddy','Upcoming'],
  ['Pitch to Investors Masterclass','Expert-led investor pitch workshop','Workshop','2026-06-25 14:00:00','2026-06-25 17:00:00','Zoom',1,200,156,'Arjun Mehta, Ritu Nanda','Upcoming'],
  ['AI & Deep Tech Summit 2026','Annual deep tech innovation summit','Conference','2026-07-15 11:00:00','2026-07-15 18:00:00','Bangalore + Virtual',1,1000,890,'Kavita Reddy, Dr. Priya Sharma','Upcoming'],
  ['Founder Networking Night','Quarterly founder mixer and networking','Networking','2026-06-28 18:00:00','2026-06-28 21:00:00','Bangalore + Virtual',1,500,340,'','Upcoming'],
].forEach(r=>estmt.run(...r));

// ── Funding Schemes ───────────────────────────────────────
const fstmt = db.prepare(`INSERT OR IGNORE INTO funding_schemes (name,authority,scheme_type,min_amount,max_amount,deadline,eligibility,description,status) VALUES (?,?,?,?,?,?,?,?,?)`);
[
  ['Startup India Seed Fund','DPIIT','Seed Fund',200000,500000,'2026-07-31','DPIIT recognized startups < 2 years','Government seed fund for early stage startups','Open'],
  ['BIRAC BIG Grant','BIRAC','BioTech Grant',500000,50000000,'2026-07-15','Bio-innovation startups','Biotechnology Ignition Grant for research-based startups','Open'],
  ['DST NIDHI Grant','DST','Innovation Grant',250000,10000000,'2026-08-05','Tech startups at DST incubators','National Initiative for Developing and Harnessing Innovations','Open'],
  ['MSME Technology Grant','MSME Ministry','Technology Grant',100000,250000,'2026-06-30','MSME registered companies','Technology upgrade grant for MSME sector','Closing Soon'],
  ['Atal Innovation Mission','NITI Aayog','Innovation',10000000,20000000,'2026-09-01','Startups < 5 years with novel solution','AIM grant for transformative innovation','Open'],
  ['SIDBI Fund of Funds','SIDBI','Series A',20000000,200000000,'Rolling','SEBI registered startups, revenue > 1Cr','Fund of funds for growth stage startups','Open'],
].forEach(r=>fstmt.run(...r));

// ── Technologies ──────────────────────────────────────────
const tstmt = db.prepare(`INSERT OR IGNORE INTO technologies (researcher_id,title,description,category,trl_level,status,keywords,valuation) VALUES (?,?,?,?,?,?,?,?)`);
[
  [1,'AI-based Crop Disease Detection','Deep learning model for real-time crop disease identification using smartphone cameras','AgriTech',6,'Available','AI,Computer Vision,AgriTech,IoT',5000000],
  [2,'Federated Learning Framework for Healthcare','Privacy-preserving ML framework for hospital data collaboration','HealthTech',5,'Available','ML,Privacy,Healthcare,Federated',8000000],
  [1,'Smart Irrigation Controller','IoT-based precision irrigation system with soil moisture sensing','AgriTech',7,'Licensed','IoT,Irrigation,Sensors,Water',3000000],
  [2,'Lightweight NLP for Indic Languages','BERT-based model optimized for 12 Indic languages','NLP',4,'Available','NLP,Indic Languages,BERT,ML',4000000],
].forEach(r=>tstmt.run(...r));

// ── Problem Statements ────────────────────────────────────
const pstmt = db.prepare(`INSERT OR IGNORE INTO problem_statements (user_id,company_name,title,description,problem_type,sector,budget_range,deadline,collaboration_type,status) VALUES (?,?,?,?,?,?,?,?,?,?)`);
[
  [14,'TATA Motors','Predictive Maintenance for Fleet Vehicles','We need an AI solution to predict vehicle breakdowns 48-72 hours in advance using OBD data and IoT sensors.','Technology Challenge','Automotive','₹50L - ₹2Cr','2026-08-30','Co-Development','Open'],
  [14,'HDFC Bank','SME Credit Scoring Without Formal Records','Develop an alternative credit scoring model for MSMEs without formal financial records using proxy variables.','Innovation Request','FinTech','₹25L - ₹1Cr','2026-07-31','Licensing','Open'],
  [14,'Mahindra Agri','Cold Chain Monitoring for Rural Markets','Real-time temperature and humidity monitoring for agricultural cold chain in areas with limited connectivity.','R&D Requirement','AgriTech','₹30L - ₹1.5Cr','2026-09-15','Pilot Project','Open'],
].forEach(r=>pstmt.run(...r));

// ── Programs ──────────────────────────────────────────────
const pgstmt = db.prepare(`INSERT OR IGNORE INTO programs (name,program_type,description,duration_months,cohort_size,current_cohort,benefits,eligibility,status,start_date,end_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
[
  ['Idea Stage Bootcamp','Pre-Incubation','Structured 3-month program for idea validation and prototype development',3,20,8,'Mentorship,Co-working,₹5L Seed Grant','Idea or early prototype stage',  'Active','2026-04-01','2026-06-30'],
  ['MVP Accelerator','Incubation','6-month intensive program for MVP development and market entry',6,15,8,'₹25L Grant,Investor Network,Product Support','MVP with initial users','Active','2026-01-01','2026-06-30'],
  ['Growth Catalyst','Acceleration','9-month program for revenue-generating startups to scale',9,10,4,'₹1Cr+ Funding,Market Expansion,IPR Support','Early revenue > ₹5L/month','Active','2025-10-01','2026-06-30'],
  ['HealthTech Fellowship','Fellowship','Domain-specific fellowship for health innovation',6,12,2,'₹20L Stipend,Lab Access,Mentors','HealthTech or MedTech founders','Active','2026-01-01','2026-06-30'],
  ['Innovation Challenge — AgriTech','Innovation Challenge','Open innovation competition for agricultural solutions',3,50,3,'₹10L Prize,Incubation Offer','Open to all','Active','2026-05-01','2026-07-31'],
].forEach(r=>pgstmt.run(...r));

// ── Milestones for startup 1 ──────────────────────────────
const mlstmt = db.prepare(`INSERT OR IGNORE INTO milestones (startup_id,title,description,target_date,progress,is_completed) VALUES (?,?,?,?,?,?)`);
[
  [1,'MVP Launch','Launch first working version of AgriSense app','2026-06-30',100,1],
  [1,'First 100 Paying Customers','Acquire initial paying customer base','2026-07-31',68,0],
  [1,'Seed Round Closure','Close ₹2Cr seed round','2026-08-15',35,0],
  [1,'Team of 10','Hire 2 more engineers and 1 sales manager','2026-09-30',50,0],
  [1,'Patent Application','File patent for core AI model','2026-10-15',20,0],
].forEach(r=>mlstmt.run(...r));

// ── IP Assets ─────────────────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO ip_assets (startup_id,title,ip_type,status,application_number,filing_date,description) VALUES (?,?,?,?,?,?,?)`).run(1,'AI Soil Analysis Algorithm','Patent','Under Examination','IN202611234567','2026-03-15','Machine learning model for real-time soil nutrient analysis using spectroscopy');
db.prepare(`INSERT OR IGNORE INTO ip_assets (startup_id,title,ip_type,status,application_number,filing_date,description) VALUES (?,?,?,?,?,?,?)`).run(1,'AgriSense Brand','Trademark','Filed','TM2026/45678','2026-01-10','Brand name and logo trademark registration');

// ── Community Posts ───────────────────────────────────────
const cpstmt = db.prepare(`INSERT OR IGNORE INTO community_posts (user_id,content,post_type,likes_count,comments_count) VALUES (?,?,?,?,?)`);
[
  [2,'Just closed our Pre-Seed round of ₹1.2Cr! 🎉 The VIC mentors and resources were absolutely instrumental. The pitch deck template and financial model saved weeks of work. Forever grateful to this community!','update',47,12],
  [11,'Looking for co-founders with React Native experience for a HealthTech startup targeting tier-2 cities. We have solid traction — 5K MAU growing 40% MoM. Revenue positive. DM if interested!','opportunity',23,8],
  [12,'Key insight from today\'s mentor session:\n\n"Don\'t chase funding, chase product-market fit. Funding follows traction, not the other way around." — Mentor Vikram Singh\n\nChanged our entire strategy for Q3.','insight',89,21],
  [13,'Graduated from VIC MVP Accelerator! 🎓 In 6 months: 0 → 200 paying customers, ₹40L ARR, 2 patents filed. If you\'re considering applying — DO IT. Applications for Cohort 9 are open!','announcement',112,34],
].forEach(r=>cpstmt.run(...r));

// ── Program Enrollments ───────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO program_enrollments (startup_id,program_id,cohort_number,status) VALUES (?,?,?,?)`).run(1,2,8,'Enrolled');
db.prepare(`INSERT OR IGNORE INTO program_enrollments (startup_id,program_id,cohort_number,status) VALUES (?,?,?,?)`).run(2,3,4,'Enrolled');
db.prepare(`INSERT OR IGNORE INTO program_enrollments (startup_id,program_id,cohort_number,status) VALUES (?,?,?,?)`).run(4,2,6,'Completed');

// ── Funding Applications ──────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO funding_applications (startup_id,scheme_id,app_status,amount_applied) VALUES (?,?,?,?)`).run(1,1,'Under Review',500000);
db.prepare(`INSERT OR IGNORE INTO funding_applications (startup_id,scheme_id,app_status,amount_applied,amount_approved) VALUES (?,?,?,?,?)`).run(1,4,'Approved',250000,200000);
db.prepare(`INSERT OR IGNORE INTO funding_applications (startup_id,scheme_id,app_status,amount_applied) VALUES (?,?,?,?)`).run(2,2,'Submitted',5000000);

// ── Service Requests ──────────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO service_requests (startup_id,user_id,service_type,title,description,priority,status) VALUES (?,?,?,?,?,?,?)`).run(1,2,'Patent Filing','AI Algorithm Patent','Need assistance filing patent for our core AI model for crop disease detection','High','In Progress');
db.prepare(`INSERT OR IGNORE INTO service_requests (startup_id,user_id,service_type,title,description,priority,status) VALUES (?,?,?,?,?,?,?)`).run(1,2,'Investor Readiness','Investor Deck Review','Need comprehensive review of pitch deck before meeting Nexus Ventures','Urgent','Open');
db.prepare(`INSERT OR IGNORE INTO service_requests (startup_id,user_id,service_type,title,description,priority,status) VALUES (?,?,?,?,?,?,?)`).run(2,11,'Legal Review','Vendor Agreement','Review vendor SLA agreement with cloud provider','Medium','Completed');

// ── Assessments ───────────────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO assessments (startup_id,evaluator_id,innovation_score,market_score,team_score,technology_score,revenue_score,scalability_score,overall_score,incubation_score,readiness_score,funding_score,remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(1,10,8,7,8,9,6,7,75,79,68,64,'Strong technology and team. Market size needs better validation. Revenue model requires refinement.');
db.prepare(`INSERT OR IGNORE INTO assessments (startup_id,evaluator_id,innovation_score,market_score,team_score,technology_score,revenue_score,scalability_score,overall_score,incubation_score,readiness_score,funding_score,remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(2,10,7,9,8,7,8,8,82,86,74,72,'Excellent market fit. Strong revenue metrics. Technology differentiation could be stronger.');

// ── Data Rooms ────────────────────────────────────────────
const dr = db.prepare(`INSERT OR IGNORE INTO data_rooms (startup_id,name) VALUES (?,?)`).run(1,'AgriSense AI — Data Room');
const drId = db.prepare(`SELECT id FROM data_rooms WHERE startup_id=1`).get()?.id;
if(drId) {
  const ddstmt = db.prepare(`INSERT OR IGNORE INTO data_room_docs (data_room_id,category,title,file_name,file_size,uploaded_by,view_count) VALUES (?,?,?,?,?,?,?)`);
  [
    [drId,'Legal','Certificate of Incorporation','incorporation.pdf','245 KB',2,12],
    [drId,'Legal','Founders Agreement','founders_agreement.pdf','380 KB',2,8],
    [drId,'Financial','3-Year Financial Model','financial_model_2026.xlsx','1.2 MB',2,15],
    [drId,'Financial','MIS Report Q1 2026','mis_q1_2026.pdf','890 KB',2,6],
    [drId,'Team','Team Overview & CVs','team_cvs.pdf','2.1 MB',2,10],
    [drId,'IP','Patent Application Draft','patent_draft.pdf','650 KB',2,4],
    [drId,'Product','Product Demo Recording','demo_march2026.mp4','45 MB',2,18],
    [drId,'Market','Market Research Report','market_research.pdf','3.2 MB',2,9],
  ].forEach(r=>ddstmt.run(...r));
}

// ── Innovation Circles ────────────────────────────────────
const icstmt = db.prepare(`INSERT OR IGNORE INTO innovation_circles (name,description,circle_type,is_private,created_by,member_count) VALUES (?,?,?,?,?,?)`);
[
  ['FinTech Founders Circle','Exclusive circle for FinTech startup founders','Founder',1,2,24],
  ['AgriTech Research Hub','Researchers and startups working on agricultural innovation','Research',0,8,18],
  ['Series A Ready Startups','Startups preparing for Series A funding','Founder',1,13,12],
  ['Women Founders Network','Supporting women entrepreneurs in STEM','Founder',0,12,45],
  ['Deep Tech Mentors','Expert mentors in AI, ML, and deep tech','Mentor',0,5,16],
].forEach(r=>icstmt.run(...r));

// ── Notifications ─────────────────────────────────────────
const nstmt = db.prepare(`INSERT OR IGNORE INTO notifications (user_id,title,message,notif_type,is_read) VALUES (?,?,?,?,?)`);
[
  [2,'Mentor Session Confirmed','Your session with Dr. Priya Sharma on June 20 at 10:00 AM is confirmed.','success',0],
  [2,'Funding Application Update','Your MSME Technology Grant application has been approved for ₹2L.','success',0],
  [2,'New Investor Interest','Nexus Venture Partners has shown interest in AgriSense AI.','info',0],
  [2,'Assessment Completed','Your startup assessment score: 75/100. Incubation recommended.','info',1],
  [2,'Event Reminder','Demo Day Cohort 8 is tomorrow at 10:00 AM. You are registered.','warning',0],
].forEach(r=>nstmt.run(...r));

// ── Mentor Sessions ───────────────────────────────────────
db.prepare(`INSERT OR IGNORE INTO mentor_sessions (startup_id,mentor_id,user_id,scheduled_at,duration_mins,platform,agenda,status) VALUES (?,?,?,?,?,?,?,?)`).run(1,1,2,'2026-06-20 10:00:00',60,'Zoom','Review pitch deck and fundraising strategy for seed round','Confirmed');
db.prepare(`INSERT OR IGNORE INTO mentor_sessions (startup_id,mentor_id,user_id,scheduled_at,duration_mins,platform,agenda,status) VALUES (?,?,?,?,?,?,?,?)`).run(1,2,2,'2026-06-22 14:00:00',60,'Google Meet','GTM strategy and customer acquisition planning','Pending');
db.prepare(`INSERT OR IGNORE INTO mentor_sessions (startup_id,mentor_id,user_id,scheduled_at,duration_mins,platform,agenda,status) VALUES (?,?,?,?,?,?,?,?)`).run(1,1,2,'2026-06-10 10:00:00',60,'Zoom','Product roadmap Q3 2026','Completed');

console.log('✅ Database seeded successfully!');
console.log('\n📧 Demo Credentials:');
console.log('   Admin:    admin@vic.in        / admin123');
console.log('   Startup:  startup@vic.in      / startup123');
console.log('   Mentor:   mentor@vic.in       / mentor123');
console.log('   Investor: rajan@angel.in      / investor123');
console.log('   Researcher: kumar@iima.in     / researcher123\n');
