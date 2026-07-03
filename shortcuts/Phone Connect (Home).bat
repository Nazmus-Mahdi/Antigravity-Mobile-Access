@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
setlocal enabledelayedexpansion
title Phone Connect (Home) - Same Wi-Fi Connection
cd /d "%~dp0.."

echo [1/3] Checking Antigravity...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:9000/json' -UseBasicParsing -TimeoutSec 2; Write-Host '[OK] Antigravity detected.' } catch { Write-Host '[WARNING] Antigravity not detected on port 9000. Run Launch Antigravity.bat first.' }"

echo [2/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    pause
    exit /b 1
)

echo [3/3] Checking dependencies...
if not exist "node_modules" (
    call npm install
)

python launcher.py --mode local
pause
