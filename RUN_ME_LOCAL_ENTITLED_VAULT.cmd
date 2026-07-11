@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN_ME_LOCAL_ENTITLED_VAULT.ps1"
