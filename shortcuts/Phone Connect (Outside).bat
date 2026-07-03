@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
setlocal enabledelayedexpansion
title Phone Connect (Outside) - Remote Access via Internet
cd /d "%~dp0.."

taskkill /f /im ngrok.exe >nul 2>&1
taskkill /f /im cloudflared.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

if not exist "node_modules" (
    call npm install
)

python launcher.py --mode web
exit
