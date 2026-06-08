@echo off
echo VIC Platform — Starting...

cd backend
if not exist .env copy .env.example .env
if not exist node_modules npm install
if not exist vic.db node src/db/seed.js
start "VIC Backend" cmd /k "node src/index.js"

cd ..\frontend
if not exist node_modules npm install
start "VIC Frontend" cmd /k "npm run dev"

echo.
echo VIC Platform is running!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
