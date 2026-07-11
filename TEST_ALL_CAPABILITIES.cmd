@echo off
setlocal
cd /d "%~dp0"
title TAS v70.20.3 COMMERCIAL GATEWAY
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0TEST_ALL_CAPABILITIES.ps1"
exit /b %ERRORLEVEL%
