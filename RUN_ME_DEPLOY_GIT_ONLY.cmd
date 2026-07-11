@echo off
setlocal
cd /d "%~dp0"
title TAS v70.18.1 Foundation Lock Git Release
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN_ME_DEPLOY_GIT_ONLY.ps1"
endlocal
