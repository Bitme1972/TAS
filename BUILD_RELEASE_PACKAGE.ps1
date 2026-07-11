param(
  [string]$OutputFolder = ""
)

$ErrorActionPreference = "Stop"
$PackageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$PackageName = "TAS_v70_20_COMMUNITY"
if ([string]::IsNullOrWhiteSpace($OutputFolder)) { $OutputFolder = Split-Path -Parent $PackageFolder }
$StageRoot = Join-Path $env:TEMP ("tas-v70-20-community-package-" + [guid]::NewGuid().ToString("N"))
$StagePackage = Join-Path $StageRoot $PackageName
$ZipPath = Join-Path $OutputFolder ($PackageName + ".zip")

function Fail([string]$Message) {
  Write-Host "[FAIL] $Message" -ForegroundColor Red
  exit 1
}

Set-Location $PackageFolder
Write-Host "[1/4] Installing the exact dependency lock..." -ForegroundColor Cyan
npm.cmd ci --no-audit --no-fund --progress=false
if ($LASTEXITCODE -ne 0) { Fail "npm ci failed." }

Write-Host "[2/4] Running the complete Sprint 2 Community gate..." -ForegroundColor Cyan
npm.cmd run validate
if ($LASTEXITCODE -ne 0) { Fail "Validation failed. No package was created." }

Write-Host "[3/4] Creating clean staging content without node_modules..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $StagePackage -Force | Out-Null
foreach ($folder in @(".github", "config", "dist", "dist-editions", "editions", "functions", "preview", "public", "scripts", "src")) {
  if (Test-Path (Join-Path $PackageFolder $folder)) { Copy-Item (Join-Path $PackageFolder $folder) $StagePackage -Recurse -Force }
}
Get-ChildItem -Path $PackageFolder -File -Force | Where-Object {
  $_.Name -notlike "*.zip" -and $_.Name -ne "LOCAL_VALIDATION_PASSED.txt"
} | ForEach-Object { Copy-Item $_.FullName $StagePackage -Force }

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Write-Host "[4/4] Compressing $ZipPath..." -ForegroundColor Cyan
Compress-Archive -Path $StagePackage -DestinationPath $ZipPath -CompressionLevel Optimal
Remove-Item $StageRoot -Recurse -Force
Write-Host "[PASS] Clean TAS v70.20 Community package created:" -ForegroundColor Green
Write-Host $ZipPath
