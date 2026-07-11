param(
  [switch]$KeepDependencies
)

$ErrorActionPreference = "Stop"
$PackageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PackageFolder

function Fail([string]$Message) {
  Write-Host ""
  Write-Host "[FAIL] $Message" -ForegroundColor Red
  Write-Host "No Git push or Cloudflare deployment was attempted." -ForegroundColor Yellow
  Write-Host ""
  [void](Read-Host "Press Enter to close")
  exit 1
}

Write-Host "============================================================"
Write-Host "TAS v70.20 COMMUNITY - FULL CAPABILITY VALIDATION"
Write-Host "============================================================"
Write-Host "Local validation only. Nothing will be deployed."
Write-Host ""

foreach ($required in @("src", "scripts", "functions", "public", "preview", "config", "editions", "package.json", "package-lock.json", "FOUNDATION_BASELINE_MANIFEST.json", "EXPECTED_AURORA_ASSET_HASHES.txt")) {
  if (!(Test-Path (Join-Path $PackageFolder $required))) { Fail "Missing required package item: $required" }
}

if (!(Get-Command node.exe -ErrorAction SilentlyContinue)) { Fail "Node.js is not installed or is not available in PATH." }
if (!(Get-Command npm.cmd -ErrorAction SilentlyContinue)) { Fail "npm is not installed or is not available in PATH." }

if (-not $KeepDependencies) {
  Write-Host "[1/4] Removing previous dependency and build output..." -ForegroundColor Cyan
  if (Test-Path ".\node_modules") { Remove-Item ".\node_modules" -Recurse -Force }
  if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
  if (Test-Path ".\dist-editions") { Remove-Item ".\dist-editions" -Recurse -Force }
} else {
  Write-Host "[1/4] Keeping the existing dependency folder as requested..." -ForegroundColor Cyan
  if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
  if (Test-Path ".\dist-editions") { Remove-Item ".\dist-editions" -Recurse -Force }
}

Write-Host "[2/4] Installing the exact dependency lock..." -ForegroundColor Cyan
npm.cmd ci --no-audit --no-fund --progress=false
if ($LASTEXITCODE -ne 0) { Fail "npm ci failed." }

Write-Host "[3/4] Building TAS and running every protected regression gate..." -ForegroundColor Cyan
npm.cmd run validate
if ($LASTEXITCODE -ne 0) { Fail "Build or validation failed." }

Write-Host "[4/4] Recording the local pass marker..." -ForegroundColor Cyan
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
@"
TAS v70.20.2 Commercial Gateway validation passed.
Time: $stamp
Mode: Local only
Git: no commit, no push
Cloudflare: no deployment
Command: npm ci + npm run validate
"@ | Set-Content ".\LOCAL_VALIDATION_PASSED.txt" -Encoding UTF8

Write-Host ""
Write-Host "[PASS] TAS v70.20.2 Commercial Gateway and all three editions are clean-build validated." -ForegroundColor Green
Write-Host "Report: TAS_V70_20_COMMUNITY_VALIDATION_REPORT.md"
Write-Host "Professional preview: double-click RUN_ME_LOCAL_CLOUDFLARE_READY.cmd
Edition previews: double-click RUN_ME_LOCAL_EDITION_PREVIEWS.cmd"
Write-Host ""
[void](Read-Host "Press Enter to close")
