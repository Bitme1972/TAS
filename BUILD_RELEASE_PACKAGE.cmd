@echo off
setlocal
cd /d "%~dp0"
title Build TAS v70.20 Community Package
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0BUILD_RELEASE_PACKAGE.ps1"
if errorlevel 1 pause
exit /b %ERRORLEVEL%
