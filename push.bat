@echo off
chcp 65001 >nul 2>nul
cd /d "%~dp0"

git status --porcelain >nul 2>nul
if errorlevel 1 (
    echo [Error] Not a git repository
    pause
    exit /b 1
)

set CHANGES=
for /f %%a in ('git status --porcelain') do set CHANGES=1
if not defined CHANGES (
    echo No changes to push.
    timeout /t 2 >nul
    exit /b 0
)

echo Changes detected:
git status --porcelain
echo.

git add -A
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set D=%%a-%%b-%%c
for /f "tokens=1-2 delims=:" %%a in ('time /t') do set T=%%a%%b
git commit -m "Update %D% %T%" --quiet
git push origin main --quiet

if %errorlevel% equ 0 (
    echo Pushed successfully.
) else (
    echo Push failed. Check your network and try again.
)
timeout /t 3 >nul
