param(
  [int]$Port = 8787,
  [switch]$CleanInstall
)
$ErrorActionPreference = "Stop"
function Fail($Message) {
  Write-Host ""; Write-Host "FAILED: $Message" -ForegroundColor Red
  Write-Host "Nothing was committed, pushed or deployed." -ForegroundColor Yellow
  Write-Host ""; pause; exit 1
}
$PackageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PackageFolder
Write-Host "============================================================"
Write-Host "TAS v70.20.3 COMMERCIAL DELIVERY STUDIO - PUBLIC PREVIEW"
Write-Host "============================================================"
Write-Host "Package folder: $PackageFolder"
Write-Host "Local port:     $Port"
Write-Host ""
Write-Host "LOCAL ONLY: no Git commit, no Git push and no Cloudflare deployment."
Write-Host "This preview intentionally contains the Member Gateway, synthetic Demo and tour, but no MSI or commercial engine."
Write-Host ""
foreach ($required in @("src","scripts","functions","public","config","editions","release-assets","demo-automation","package.json","package-lock.json","index.html","tsconfig.json","wrangler.toml","vite.demo.config.ts")) {
  if (!(Test-Path (Join-Path $PackageFolder $required))) { Fail "Missing required package item: $required" }
}
Write-Host "[1/5] Installing exact dependencies..."
if ($CleanInstall -and (Test-Path ".\node_modules")) { Remove-Item ".\node_modules" -Recurse -Force }
npm.cmd ci --no-audit --no-fund --progress=false
if ($LASTEXITCODE -ne 0) { Fail "Dependency install failed." }
Write-Host "[2/5] Building and running every inherited and commercial-delivery gate..."
npm.cmd run validate
if ($LASTEXITCODE -ne 0) { Fail "Build or validation gate failed." }
Write-Host "[3/5] Checking public and entitled outputs..."
$publicRequired = @(
  "dist\index.html","dist\demo\index.html","dist\studio\index.html","dist\member\downloads.html",
  "dist\media\TAS_Interactive_Product_Tour.mp4","dist\media\TAS_Interactive_Product_Tour.en.srt",
  "dist\TAS_INSTALLER_STATUS.json","dist\DEPLOYMENT_MARKER_TAS_V70_20_3_COMMERCIAL_DELIVERY.txt"
)
$entitledRequired = @(
  "dist-entitled\studio\index.html","dist-entitled\consultant-studio\index.html",
  "dist-entitled\member\downloads.html","dist-entitled\entitled-downloads\TAS_Professional_v10_0_6_x64.msi",
  "dist-entitled\TAS_INSTALLER_STATUS.json"
)
foreach ($f in $publicRequired + $entitledRequired) { if (!(Test-Path $f)) { Fail "Missing expected output: $f" } }
if (Get-ChildItem ".\dist" -Recurse -File -Filter "*.msi" -ErrorAction SilentlyContinue) { Fail "The MSI was exposed in the public distribution." }
$msiHash = (Get-FileHash ".\dist-entitled\entitled-downloads\TAS_Professional_v10_0_6_x64.msi" -Algorithm SHA256).Hash.ToLowerInvariant()
if ($msiHash -ne "f59a8682e78b94eff561b44db66fc61089c8f5156f82f5d0a7bf54099b5da249") { Fail "Entitled MSI SHA-256 mismatch." }
Write-Host "[4/5] Writing local validation marker..."
@"
TAS v70.20.3 Commercial Delivery Studio validation passed.
Time: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Public: Member Gateway, synthetic Demo and guided tour
Private output: Professional Studio, Consultant Studio and verified MSI
Mode: Local only
Git: no commit, no push
Cloudflare: no deploy
"@ | Set-Content ".\LOCAL_VALIDATION_PASSED.txt" -Encoding UTF8
Write-Host "[5/5] Starting the PUBLIC customer journey..."
Write-Host "Member Gateway:  http://localhost:$Port/"
Write-Host "Free Demo:       http://localhost:$Port/demo/"
Write-Host "Guided tour:     http://localhost:$Port/member/downloads.html"
Write-Host ""
Write-Host "To inspect the licensed local fulfilment preview afterwards, run RUN_ME_LOCAL_ENTITLED_VAULT.cmd." -ForegroundColor Cyan
Write-Host "Press CTRL+C to stop."
node.exe scripts/serve-output.cjs --dir=dist --port=$Port
