# 🏛️ VIC Platform — Virtual Incubation Center

A complete full-stack platform for managing startup incubation, technology transfer, open innovation, mentorship, and institutional reporting.

## Tech Stack
- **Backend**: Node.js · Express · SQLite (better-sqlite3) · JWT Auth
- **Frontend**: React 18 · Vite · Recharts · React Router v6

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ (https://nodejs.org)
- npm 9+

### Step 1 — Clone / Unzip
```bash
unzip vic-platform.zip
cd vic-platform
```

### Step 2 — Setup Backend
```bash
cd backend
cp .env.example .env
npm install
node src/db/seed.js     # Seeds the database with demo data
npm start               # Starts on http://localhost:5000
```

### Step 3 — Setup Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

### Step 4 — Open Browser
Visit: **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | admin@vic.in | admin123 |
| **Startup Founder** | startup@vic.in | startup123 |
| **Expert Mentor** | mentor@vic.in | mentor123 |
| **Investor** | rajan@angel.in | investor123 |
| **Researcher** | kumar@iima.in | researcher123 |

---

## 📋 Modules & Features

### Core Modules (20+)
1. 🚀 **Startup Registration & Dashboard** — Profile, KPIs, milestone tracking, revenue charts
2. 👥 **Mentor Management** — Directory, 1:1 booking, session tracking, ratings
3. 💼 **Investor Connect** — AI-matched investors, connection requests, deal flow
4. 📚 **Learning Academy** — Course catalog, enrollment, progress tracking
5. 📁 **Resource Library** — Templates, legal docs, financial models
6. 💰 **Funding & Grants** — Government schemes, application tracking
7. 📅 **Events & Workshops** — Registration, capacity management
8. 💬 **Community Platform** — Feed, posts, innovation circles
9. 🔬 **Technology Transfer** — TRL tracking, tech marketplace, licensing engine
10. 🎯 **Open Innovation** — Industry problem statements, solution submissions
11. 🛠️ **Service Request System** — Ticketed incubation services with SLA tracking
12. 🏆 **Assessment Engine** — 6-parameter scoring, radar chart, reports
13. 🏛️ **Program Management** — Multi-type programs, cohort management, enrollment
14. 🗄️ **Data Room** — Structured document repository for due diligence
15. 📊 **Admin Dashboard** — Institutional analytics, sector breakdown, audit logs

### Role-Based Access
- **Startup Founder** — Full startup tools, apply for programs/funding/services
- **Mentor** — Profile management, session tracking, availability
- **Investor** — Browse startups, express interest, manage deals
- **Researcher** — List technologies, respond to industry problems
- **Evaluator** — Assess startups, scoring, blind review
- **Administrator** — Full platform control, approvals, reporting
- **Institutional Head** — Leadership dashboard, impact reports
- **Industry Partner** — Post challenges, discover technologies

---

## 🗂️ Project Structure

```
vic-platform/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js    # SQLite schema (35+ tables)
│   │   │   └── seed.js        # Demo data seeder
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT + audit logging
│   │   ├── routes/
│   │   │   ├── auth.js        # Login, register, profile
│   │   │   ├── dashboard.js   # Role-aware dashboard stats
│   │   │   ├── startups.js    # Startup CRUD + milestones
│   │   │   ├── mentors.js     # Mentor directory + booking
│   │   │   └── all.js         # All other routes
│   │   └── index.js           # Express server
│   └── vic.db                 # SQLite database (auto-created)
└── frontend/
    └── src/
        ├── api/index.js        # Axios client
        ├── context/            # React auth context
        ├── components/         # Layout, UI primitives
        └── pages/              # All 15+ page components
```

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Authenticate user |
| POST | /api/auth/register | Register new user |
| GET | /api/dashboard | Role-based dashboard data |
| GET | /api/startups | List / search startups |
| POST | /api/mentors/:id/book | Book mentor session |
| GET | /api/technologies | Browse tech marketplace |
| POST | /api/technologies/:id/license | Request license |
| GET | /api/problems | List industry challenges |
| POST | /api/problems/:id/solutions | Submit solution |
| POST | /api/funding/apply | Apply for grant |
| POST | /api/assessments | Submit startup assessment |
| GET | /api/admin/stats | Platform statistics |

Full API: http://localhost:5000/api/health

---

## ⚙️ Configuration

Edit `backend/.env`:
```env
PORT=5000
JWT_SECRET=your_secure_secret_here
ANTHROPIC_API_KEY=your_key_for_ai_features
NODE_ENV=production
```

---

## 🚢 Production Deployment

### Backend
```bash
npm install --production
NODE_ENV=production npm start
```

### Frontend
```bash
npm run build
# Serve dist/ with nginx or any static host
```

### Using Docker (optional)
```bash
docker-compose up --build
```

---

## 📞 Support
Platform built for VIC — Virtual Incubation Center.
AI Assistant powered by Anthropic Claude API.

© 2026 VIC Platform. All rights reserved.
