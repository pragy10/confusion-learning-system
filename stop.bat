@echo off
title Confusion Learning System - Stopper
echo ====================================================================
echo                 Confusion Learning System - Stopper
echo ====================================================================
echo.
echo Stopping services running on ports 5000, 8000, and 5173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Terminating process %%a on port 5000...
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Terminating process %%a on port 8000...
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Terminating process %%a on port 5173...
    taskkill /F /PID %%a 2>nul
)

echo.
echo Done! Ports 5000, 8000, and 5173 are now free.
pause
