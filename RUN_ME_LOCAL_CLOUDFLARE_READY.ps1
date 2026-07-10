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
Write-Host "AuditPol TAS CLOUDFLARE PACKAGE - LOCAL READY RUNNER"
Write-Host "============================================================"
Write-Host "Package folder: $PackageFolder"
Write-Host "Local port:     $Port"
Write-Host ""
Write-Host "LOCAL ONLY:"
Write-Host "  - no Git commit"
Write-Host "  - no Git push"
Write-Host "  - no Cloudflare deploy"
Write-Host ""
Write-Host "CLOUDFLARE READY:"
Write-Host "  - uses the real Cloudflare/Vite package"
Write-Host "  - runs full production build"
Write-Host "  - runs TAS validation gates"
Write-Host "  - serves the built dist locally"
Write-Host ""

Set-Location $PackageFolder

foreach ($required in @("src", "scripts", "functions", "public", "package.json", "package-lock.json", "index.html", "tsconfig.json", "wrangler.toml")) {
  if (!(Test-Path (Join-Path $PackageFolder $required))) {
    Fail "Missing required Cloudflare package item: $required"
  }
}

Write-Host "[1/5] Installing dependencies locally in this package folder..."
if ($CleanInstall) {
  if (Test-Path ".\node_modules") { Remove-Item ".\node_modules" -Recurse -Force }
  if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }
  npm.cmd ci --no-audit --no-fund --progress=false
} else {
  npm.cmd install --no-audit --no-fund --progress=false
}
if ($LASTEXITCODE -ne 0) { Fail "Dependency install failed." }

Write-Host "[2/5] Running production build and all TAS validation gates..."
npm.cmd run build
if ($LASTEXITCODE -ne 0) { Fail "Build or validation gate failed." }

Write-Host "[3/5] Checking Cloudflare build output..."
foreach ($requiredDist in @("dist", "dist\index.html", "dist\studio\index.html", "dist\DEPLOYMENT_MARKER_TAS_V70_3_GOLDEN_COMPARE.txt")) {
  if (!(Test-Path $requiredDist)) {
    Fail "Missing expected Cloudflare dist output: $requiredDist"
  }
}

Write-Host "[4/5] Writing local validation marker..."
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
@"
AuditPol TAS Cloudflare package local validation passed.
Time: $stamp
Mode: Local only
Git: no commit, no push
Cloudflare: no deploy
"@ | Set-Content ".\LOCAL_VALIDATION_PASSED.txt" -Encoding UTF8

Write-Host "[5/5] Starting local preview from built dist..."
Write-Host ""
Write-Host "Open in Chrome:"
Write-Host "  http://localhost:$Port/studio?localCloudflareReady=1"
Write-Host ""
Write-Host "Extra check:"
Write-Host "  http://localhost:$Port/DEPLOYMENT_MARKER_TAS_V70_3_GOLDEN_COMPARE.txt"
Write-Host ""
Write-Host "Press CTRL+C in this window to stop the local server."
Write-Host ""

npm.cmd run preview -- --host 0.0.0.0 --port $Port
