@echo off
chcp 65001 >nul 2>nul
title Living Kitchen Vote

cd /d "%~dp0"

echo ================================================
echo   Living Kitchen Vote System
echo ================================================
echo.

set PYTHON=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if "%PYTHON%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if "%PYTHON%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
if "%PYTHON%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
if "%PYTHON%"=="" (
    echo [ERROR] Python not found. Please install Python 3.10+
    echo   https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/3] Python: %PYTHON%

echo [2/3] Installing dependencies...
"%PYTHON%" -m pip install flask --quiet 2>nul

echo [3/3] Starting server...
echo.
echo   Vote:   http://localhost:5000
echo   Admin:  http://localhost:5000/admin
echo   Pass:   admin123
echo.
echo   Press Ctrl+C to stop
echo ================================================
echo.
"%PYTHON%" app.py
pause
