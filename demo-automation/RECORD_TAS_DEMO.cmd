@echo off
setlocal
cd /d "%~dp0\.."
echo ============================================================
echo TAS v70.20.3 - REPEATABLE GUIDED PRODUCT TOUR
echo ============================================================
echo.
where python >nul 2>&1 || (echo FAILED: Python 3 is required.& pause & exit /b 1)
where ffmpeg >nul 2>&1 || (echo FAILED: FFmpeg is required and must be on PATH.& pause & exit /b 1)
python -c "import playwright" >nul 2>&1 || (
  echo FAILED: Python Playwright is not installed.
  echo Run: python -m pip install -r demo-automation\requirements.txt
  echo Then: playwright install chromium
  pause
  exit /b 1
)
if not exist node_modules call npm ci || (pause & exit /b 1)
call npm run build:demo || (pause & exit /b 1)
python demo-automation\record_tas_demo.py || (pause & exit /b 1)
echo.
echo Guided tour created in public\media
pause
