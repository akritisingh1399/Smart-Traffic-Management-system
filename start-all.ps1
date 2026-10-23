Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting Smart Traffic Management System (STMS)  " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Starting Backend Server on http://localhost:5500..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"

Start-Sleep -Seconds 3

Write-Host "2. Starting STMS Dashboard on http://localhost:3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Dashboard; npm start"

Write-Host "3. Starting STMS Client Website on http://localhost:3000..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm start"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  All services launched successfully!" -ForegroundColor Green
Write-Host "  - Client Website:    http://localhost:3000"
Write-Host "  - Traffic Dashboard: http://localhost:3001"
Write-Host "  - Backend API:       http://localhost:5500/api"
Write-Host ""
Write-Host "  Credentials:"
Write-Host "  Email:    admin@stms.ai"
Write-Host "  Password: Admin@1234"
Write-Host "===================================================" -ForegroundColor Cyan
