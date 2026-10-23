@echo off
title Smart Traffic Management System
echo ===================================================
echo   Starting Smart Traffic Management System (STMS)
echo ===================================================
echo.

echo 1. Starting Backend Server on http://localhost:5500...
start "STMS Backend Server (Port 5500)" cmd /k "cd server && npm start"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo 2. Starting STMS Dashboard on http://localhost:3001...
start "STMS Dashboard (Port 3001)" cmd /k "cd Dashboard && npm start"

echo 3. Starting STMS Client Website on http://localhost:3000...
start "STMS Client Website (Port 3000)" cmd /k "cd client && npm start"

echo.
echo ===================================================
echo   All STMS services are launching:
echo   - Client Website:    http://localhost:3000
echo   - Traffic Dashboard: http://localhost:3001
echo   - Backend API:       http://localhost:5500/api
echo.
echo   Login Credentials:
echo   Email:    admin@stms.ai
echo   Password: Admin@1234
echo ===================================================
pause
