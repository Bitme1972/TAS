@echo off
setlocal
cd /d "%~dp0"
title TAS v70.18.1 Foundation Lock Validation
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0TEST_ALL_CAPABILITIES.ps1"
exit /b %ERRORLEVEL%
