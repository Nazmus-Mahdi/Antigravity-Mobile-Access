@echo off
title Launch Antigravity
echo ===================================================
echo   Launching Antigravity with Phone Connect support
echo ===================================================
echo.
start "" "C:\Users\mahdi\AppData\Local\Programs\Antigravity IDE\Antigravity IDE.exe" --remote-debugging-port=9000
echo [OK] Antigravity launched. You can close this window.
timeout /t 3 /nobreak >nul
