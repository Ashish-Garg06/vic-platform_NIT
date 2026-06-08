#!/bin/bash
echo "🏛️  VIC Platform — Starting..."
echo ""

# Backend
cd backend
if [ ! -f .env ]; then cp .env.example .env; fi
if [ ! -d node_modules ]; then echo "Installing backend dependencies..."; npm install; fi
if [ ! -f vic.db ]; then echo "Seeding database..."; node src/db/seed.js; fi
echo "Starting backend on http://localhost:5000"
node src/index.js &
BACKEND_PID=$!

cd ../frontend
if [ ! -d node_modules ]; then echo "Installing frontend dependencies..."; npm install; fi
echo "Starting frontend on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ VIC Platform is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
wait
