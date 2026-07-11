param([int]$Port = 8788, [switch]$SkipValidation)
$ErrorActionPreference = "Stop"
function Fail($Message) { Write-Host "FAILED: $Message" -ForegroundColor Red; Write-Host "Nothing was deployed." -ForegroundColor Yellow; pause; exit 1 }
$PackageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PackageFolder
Write-Host "============================================================"
Write-Host "TAS v70.20.3 ENTITLED MEMBER VAULT - LOCAL FULFILMENT PREVIEW"
Write-Host "============================================================"
Write-Host "This local preview contains the real MSI and commercial Studio builds."
Write-Host "DO NOT upload dist-entitled as a public static website. Production delivery requires server-side authentication and entitlement checks." -ForegroundColor Yellow
Write-Host ""
if (!$SkipValidation) {
  if (!(Test-Path ".\node_modules")) {
    Write-Host "[1/3] Installing exact dependencies..."
    npm.cmd ci --no-audit --no-fund --progress=false
    if ($LASTEXITCODE -ne 0) { Fail "Dependency install failed." }
  }
  Write-Host "[2/3] Running the full validation and preparing the entitled vault..."
  npm.cmd run validate
  if ($LASTEXITCODE -ne 0) { Fail "Validation failed." }
} else {
  Write-Host "Skipping validation by explicit request."
}
foreach ($f in @(
  ".\dist-entitled\index.html",
  ".\dist-entitled\studio\index.html",
  ".\dist-entitled\consultant-studio\index.html",
  ".\dist-entitled\member\downloads.html",
  ".\dist-entitled\entitled-downloads\TAS_Professional_v10_0_6_x64.msi"
)) { if (!(Test-Path $f)) { Fail "Missing entitled output: $f" } }
$hash = (Get-FileHash ".\dist-entitled\entitled-downloads\TAS_Professional_v10_0_6_x64.msi" -Algorithm SHA256).Hash.ToLowerInvariant()
if ($hash -ne "f59a8682e78b94eff561b44db66fc61089c8f5156f82f5d0a7bf54099b5da249") { Fail "MSI SHA-256 mismatch." }
Write-Host "[3/3] Starting entitled local preview..." -ForegroundColor Green
Write-Host "Gateway:           http://localhost:$Port/"
Write-Host "Download vault:    http://localhost:$Port/member/downloads.html"
Write-Host "Professional:      http://localhost:$Port/studio/"
Write-Host "Consultant:        http://localhost:$Port/consultant-studio/"
Write-Host ""
Write-Host "The browser licence-file check is a UI preview. The installed desktop application remains responsible for signed licence and machine-binding validation." -ForegroundColor Cyan
Write-Host "Press CTRL+C to stop."
node.exe scripts/serve-output.cjs --dir=dist-entitled --port=$Port
