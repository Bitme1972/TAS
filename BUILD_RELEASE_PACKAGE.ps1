param([string]$OutputFolder = "")
$ErrorActionPreference = "Stop"
$PackageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$PackageName = "TAS_v70_20_3_COMMERCIAL_DELIVERY_STUDIO"
if ([string]::IsNullOrWhiteSpace($OutputFolder)) { $OutputFolder = Split-Path -Parent $PackageFolder }
$StageRoot = Join-Path $env:TEMP ("tas-v70-20-3-package-" + [guid]::NewGuid().ToString("N"))
$StagePackage = Join-Path $StageRoot $PackageName
$ZipPath = Join-Path $OutputFolder ($PackageName + ".zip")
function Fail([string]$Message) { Write-Host "[FAIL] $Message" -ForegroundColor Red; exit 1 }
Set-Location $PackageFolder
Write-Host "[1/5] Installing the exact dependency lock..." -ForegroundColor Cyan
npm.cmd ci --no-audit --no-fund --progress=false
if ($LASTEXITCODE -ne 0) { Fail "npm ci failed." }
Write-Host "[2/5] Running complete validation..." -ForegroundColor Cyan
npm.cmd run validate
if ($LASTEXITCODE -ne 0) { Fail "Validation failed. No package was created." }
Write-Host "[3/5] Verifying the staged MSI..." -ForegroundColor Cyan
$hash = (Get-FileHash ".\release-assets\TAS_Professional_v10_0_6_x64.msi" -Algorithm SHA256).Hash.ToLowerInvariant()
if ($hash -ne "f59a8682e78b94eff561b44db66fc61089c8f5156f82f5d0a7bf54099b5da249") { Fail "MSI SHA-256 mismatch." }
Write-Host "[4/5] Creating a clean stage without node_modules or recording scratch data..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $StagePackage -Force | Out-Null
foreach ($folder in @(".github","config","dist","dist-editions","dist-entitled","editions","functions","preview","public","release-assets","scripts","src")) {
  if (Test-Path (Join-Path $PackageFolder $folder)) { Copy-Item (Join-Path $PackageFolder $folder) $StagePackage -Recurse -Force }
}
if (Test-Path ".\demo-automation") {
  Copy-Item ".\demo-automation" $StagePackage -Recurse -Force
  Remove-Item (Join-Path $StagePackage "demo-automation\.recording-work") -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item (Join-Path $StagePackage "demo-automation\video-check") -Recurse -Force -ErrorAction SilentlyContinue
}
Get-ChildItem -Path $PackageFolder -File -Force | Where-Object { $_.Name -notlike "*.zip" -and $_.Name -ne "LOCAL_VALIDATION_PASSED.txt" } | ForEach-Object { Copy-Item $_.FullName $StagePackage -Force }
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Write-Host "[5/5] Compressing $ZipPath..." -ForegroundColor Cyan
Compress-Archive -Path $StagePackage -DestinationPath $ZipPath -CompressionLevel Optimal
Remove-Item $StageRoot -Recurse -Force
Write-Host "[PASS] TAS v70.20.3 Commercial Delivery Studio package created:" -ForegroundColor Green
Write-Host $ZipPath
