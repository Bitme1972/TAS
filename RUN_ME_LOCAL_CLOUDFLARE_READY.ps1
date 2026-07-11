param(
  [int]$Port = 8787,
  [switch]$CleanInstall
)

$ErrorActionPreference = "Stop"

function Fail($Message) {
  Write-Host ""
  Write-Host "FAILED: $Message" -ForegroundColor Red
  Write-Host "Nothing was committed, pushed or deployed." -ForegroundColor Yellow
  Write-Host ""
  pause
  exit 1
}

$PackageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "============================================================"
Write-Host "TAS v70.20.2 COMMERCIAL GATEWAY - LOCAL PREVIEW"
Write-Host "============================================================"
Write-Host "Package folder: $PackageFolder"
Write-Host "Local port:     $Port"
Write-Host ""
Write-Host "LOCAL ONLY:"
Write-Host "  - no Git commit"
Write-Host "  - no Git push"
Write-Host "  - no Cloudflare deploy"
Write-Host ""
Write-Host "THIS VALIDATES THE REAL CUSTOMER JOURNEY:"
Write-Host "  - Member Gateway at /"
Write-Host "  - synthetic interactive Demo at /demo/"
Write-Host "  - licensed purchase and activation gate at /studio/"
Write-Host "  - Professional and Consultant remain separate protected builds"
Write-Host ""

Set-Location $PackageFolder
foreach ($required in @("src", "scripts", "functions", "public", "config", "editions", "release-assets", "package.json", "package-lock.json", "index.html", "tsconfig.json", "wrangler.toml", "vite.demo.config.ts")) {
  if (!(Test-Path (Join-Path $PackageFolder $required))) { Fail "Missing required package item: $required" }
}

Write-Host "[1/5] Installing dependencies locally in this package folder..."
if ($CleanInstall -and (Test-Path ".\node_modules")) { Remove-Item ".\node_modules" -Recurse -Force }
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
if (Test-Path ".\dist-editions") { Remove-Item ".\dist-editions" -Recurse -Force }
npm.cmd ci --no-audit --no-fund --progress=false
if ($LASTEXITCODE -ne 0) { Fail "Dependency install failed." }

Write-Host "[2/5] Running the production build and every TAS validation gate..."
npm.cmd run build
if ($LASTEXITCODE -ne 0) { Fail "Build or validation gate failed." }

Write-Host "[3/5] Checking the exact public and protected outputs..."
$requiredOutputs = @(
  "dist\index.html",
  "dist\demo\index.html",
  "dist\studio\index.html",
  "dist\member\index.html",
  "dist\member\license-guide.html",
  "dist\member-resources\TAS_LICENSING_AND_DOWNLOADS_README.md",
  "dist\member-resources\TAS_DEMO_SECURITY_BOUNDARY.md",
  "dist\member-resources\TAS_MSI_PUBLISHING_GUIDE.md",
  "dist\TAS_INSTALLER_STATUS.json",
  "dist\TAS_DEPLOYED_EDITION.json",
  "dist\DEPLOYMENT_MARKER_TAS_V70_20_2_COMMERCIAL_GATEWAY.txt",
  "dist-editions\demo\index.html",
  "dist-editions\community\TAS_EDITION_MANIFEST.json",
  "dist-editions\professional\TAS_EDITION_MANIFEST.json",
  "dist-editions\consultant\TAS_EDITION_MANIFEST.json"
)
foreach ($requiredOutput in $requiredOutputs) {
  if (!(Test-Path $requiredOutput)) { Fail "Missing expected output: $requiredOutput" }
}
if (Test-Path ".\dist\assets") { Fail "Commercial AURORA assets were exposed in the public root." }
if (Test-Path ".\dist\member-downloads\TAS_Professional_x64.msi") { Fail "The commercial MSI was exposed publicly." }

Write-Host "[4/5] Writing the local validation marker..."
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
@"
TAS v70.20.2 Commercial Gateway local preview validation passed.
Time: $stamp
Landing: Member Gateway
Demo: synthetic-only interactive AURORA
Commercial Studio: licence controlled
Installer: protected entitlement slot
Mode: Local only
Git: no commit, no push
Cloudflare: no deploy
"@ | Set-Content ".\LOCAL_VALIDATION_PASSED.txt" -Encoding UTF8

Write-Host "[5/5] Starting the built public experience..."
Write-Host ""
Write-Host "Open in Chrome:"
Write-Host "  Member Gateway:  http://localhost:$Port/"
Write-Host "  Free Demo:       http://localhost:$Port/demo/"
Write-Host "  Licensed Studio: http://localhost:$Port/studio/"
Write-Host ""
Write-Host "Press CTRL+C in this window to stop the local server."
Write-Host ""
npm.cmd run preview -- --host 0.0.0.0 --port $Port
