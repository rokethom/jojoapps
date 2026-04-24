@echo off
REM Script to automate GitHub Actions secrets setup for Windows
REM Usage: setup-secrets.bat

setlocal enabledelayedexpansion

echo.
echo ====== GitHub Actions Secrets Setup ======
echo.

REM Check if gh CLI is installed
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: GitHub CLI (gh) not installed
    echo Install from: https://cli.github.com/
    exit /b 1
)

REM Check if authenticated
gh auth status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Not authenticated with GitHub CLI
    echo Run: gh auth login
    exit /b 1
)

echo Enter production server details:
echo.

set /p PROD_HOST="Production Host (IP/hostname): "
set /p PROD_USER="Production SSH User: "
set /p PROD_PORT="Production SSH Port (default 22): "
if "!PROD_PORT!"=="" set PROD_PORT=22
set /p PROD_PATH="Production Deployment Path (e.g., C:\deploy\app): "
set /p PROD_KEY_PATH="Path to production SSH private key: "

REM Validate SSH key file exists
if not exist "!PROD_KEY_PATH!" (
    echo Error: SSH key file not found: !PROD_KEY_PATH!
    exit /b 1
)

echo.
echo Adding production secrets...
echo.

REM Add production secrets
gh secret set PRODUCTION_HOST --body "!PROD_HOST!"
echo [OK] PRODUCTION_HOST

gh secret set PRODUCTION_USER --body "!PROD_USER!"
echo [OK] PRODUCTION_USER

gh secret set PRODUCTION_SSH_PORT --body "!PROD_PORT!"
echo [OK] PRODUCTION_SSH_PORT

gh secret set PRODUCTION_DEPLOY_PATH --body "!PROD_PATH!"
echo [OK] PRODUCTION_DEPLOY_PATH

for /f "delims=" %%i in ('type "!PROD_KEY_PATH!"') do gh secret set PRODUCTION_SSH_KEY --body "%%i"
echo [OK] PRODUCTION_SSH_KEY

echo.
echo Setup complete! All production secrets added.
echo.
echo Run next: git push (to trigger CI)
