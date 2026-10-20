<#
.SYNOPSIS
    Starts all services for Confusion Learning System (Backend Server, AI Microservice, and Frontend Client).
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "                Confusion Learning System - Launcher                " -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting all 3 services:" -ForegroundColor White
Write-Host "  [1] Backend Server (Express)     -> http://localhost:5000" -ForegroundColor Gray
Write-Host "  [2] AI Service (FastAPI + .venv) -> http://localhost:8000" -ForegroundColor Gray
Write-Host "  [3] Frontend Client (Vite)       -> http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan

# 1. Start Backend Server
Write-Host "[1/3] Starting Backend Server on port 5000..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "title Backend Server [Port 5000] && cd /d `"$rootDir\server`" && npm run dev" -WorkingDirectory "$rootDir\server"

# 2. Start AI Service with .venv activation
Write-Host "[2/3] Starting AI Service on port 8000..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "title AI Service [Port 8000] && cd /d `"$rootDir\ai-service`" && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000" -WorkingDirectory "$rootDir\ai-service"

# 3. Start Frontend Client
Write-Host "[3/3] Starting Frontend Client on port 5173..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "title Frontend Client [Port 5173] && cd /d `"$rootDir\client`" && npm run dev" -WorkingDirectory "$rootDir\client"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "  SUCCESS: All 3 services have been launched in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "  - Web App UI:    http://localhost:5173" -ForegroundColor White
Write-Host "  - AI API Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Backend API:   http://localhost:5000" -ForegroundColor White
Write-Host "====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To stop a service, press Ctrl+C or close its terminal window." -ForegroundColor Gray
