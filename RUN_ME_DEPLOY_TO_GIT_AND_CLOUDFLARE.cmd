@echo off
setlocal
cd /d "%~dp0"
title TAS v70.20.2 COMMERCIAL GATEWAY
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1"
endlocal
