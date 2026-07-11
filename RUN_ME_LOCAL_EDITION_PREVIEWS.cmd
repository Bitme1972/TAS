@echo off
setlocal
cd /d "%~dp0"
title TAS v70.20 Independent Edition Previews
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN_ME_LOCAL_EDITION_PREVIEWS.ps1"
exit /b %ERRORLEVEL%
