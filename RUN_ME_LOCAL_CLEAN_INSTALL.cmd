@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN_ME_LOCAL_CLOUDFLARE_READY.ps1" -CleanInstall
