$ErrorActionPreference = "Stop"
$PackageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PackageFolder

function Fail([string]$Message) {
  Write-Host "[FAIL] $Message" -ForegroundColor Red
  [void](Read-Host "Press Enter to close")
  exit 1
}

Write-Host "============================================================"
Write-Host "TAS v70.20 INDEPENDENT EDITION PREVIEWS"
Write-Host "============================================================"
Write-Host "Local only. Nothing will be deployed."
Write-Host ""

if (!(Get-Command npm.cmd -ErrorAction SilentlyContinue)) { Fail "npm is not available in PATH." }
if (!(Test-Path ".\node_modules")) {
  Write-Host "Installing exact dependencies..." -ForegroundColor Cyan
  & npm.cmd ci --no-audit --no-fund --progress=false
  if ($LASTEXITCODE -ne 0) { Fail "npm ci failed." }
}
Write-Host "Building Community, Professional and Consultant..." -ForegroundColor Cyan
& npm.cmd run build:editions
if ($LASTEXITCODE -ne 0) { Fail "Edition build failed." }

Write-Host ""
Write-Host "Community:    http://localhost:8790/community/" -ForegroundColor Green
Write-Host "Professional: http://localhost:8790/professional/" -ForegroundColor Green
Write-Host "Consultant:   http://localhost:8790/consultant/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the local preview server." -ForegroundColor Yellow
& npm.cmd run preview:editions
