@echo off
setlocal
cd /d "%~dp0"
title TAS v70.20.3 COMMERCIAL DELIVERY STUDIO
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN_ME_DEPLOY_GIT_AND_CLOUDFLARE_DIRECT.ps1"
endlocal
