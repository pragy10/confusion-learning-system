@echo off
title Confusion Learning System - Launcher
cls
echo ====================================================================
echo                 Confusion Learning System - Launcher
echo ====================================================================
echo.
echo Starting all 3 services:
echo   [1] Backend Server (Express)        -^> http://localhost:5000
echo   [2] AI Microservice (FastAPI+.venv) -^> http://localhost:8000
echo   [3] Frontend Client (React 19+Vite) -^> http://localhost:5173
echo.
echo ====================================================================

set ROOT_DIR=%~dp0

:: 1. Start Backend Server (Express + MongoDB)
echo [1/3] Starting Backend Server on port 5000...
start "Confusion Learning - Backend Server [Port 5000]" cmd /k "title Backend Server [Port 5000] && cd /d "%ROOT_DIR%server" && echo Starting Express server on port 5000... && npm run dev"

:: 2. Start AI Microservice (FastAPI + Python virtual environment)
echo [2/3] Starting AI Service on port 8000...
start "Confusion Learning - AI Service [Port 8000]" cmd /k "title AI Service [Port 8000] && cd /d "%ROOT_DIR%ai-service" && echo Activating Python virtual environment (.venv)... && call .venv\Scripts\activate.bat && echo Starting Uvicorn on port 8000... && uvicorn main:app --reload --port 8000"

:: 3. Start Frontend Client (Vite)
echo [3/3] Starting Frontend Client on port 5173...
start "Confusion Learning - Frontend Client [Port 5173]" cmd /k "title Frontend Client [Port 5173] && cd /d "%ROOT_DIR%client" && echo Starting Vite dev server on port 5173... && npm run dev"

echo.
echo ====================================================================
echo   SUCCESS: All 3 services have been launched in separate windows!
echo.
echo   - Web App UI:    http://localhost:5173
echo   - AI API Docs:   http://localhost:8000/docs
echo   - Backend API:   http://localhost:5000
echo ====================================================================
echo.
echo Press Ctrl+C in any window or close its terminal to stop that service.
echo You may close this launcher window now.
pause
