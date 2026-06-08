'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/database');

const app = express();
initDB();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
const { investors, researchers, courses, events, funding, community, technologies, problems, services, assessments, programs, dataroom, resources, admin } = require('./routes/all');
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/startups',     require('./routes/startups'));
app.use('/api/mentors',      require('./routes/mentors'));
app.use('/api/investors',    investors);
app.use('/api/researchers',  researchers);
app.use('/api/courses',      courses);
app.use('/api/events',       events);
app.use('/api/funding',      funding);
app.use('/api/community',    community);
app.use('/api/technologies', technologies);
app.use('/api/problems',     problems);
app.use('/api/services',     services);
app.use('/api/assessments',  assessments);
app.use('/api/programs',     programs);
app.use('/api/dataroom',     dataroom);
app.use('/api/resources',    resources);
app.use('/api/admin',        admin);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ success: false, error: 'Internal server error' }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 VIC Backend running on http://localhost:${PORT}`);
  console.log(`📊 API docs: http://localhost:${PORT}/api/health\n`);
});
