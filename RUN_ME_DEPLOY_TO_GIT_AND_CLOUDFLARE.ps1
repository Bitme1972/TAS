param(
  [string]$TargetRepo = "",
  [string]$RepoUrl = "https://github.com/Bitme1972/tas.git",
  [string]$ProjectName = "tas",
  [string]$PagesHost = "tas-duo.pages.dev",
  [string]$Branch = "main",
  [string]$CommitMessage = "Deploy TAS v70.18 AURORA Command Centre",
  [switch]$DirectCloudflare,
  [switch]$GitOnly
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"
$script:PushCompleted = $false

function Wait-ForDan {
  Write-Host ""
  [void](Read-Host "Press Enter to close")
}

function Fail([string]$Message) {
  Write-Host ""
  Write-Host "FAILED: $Message" -ForegroundColor Red
  if ($script:PushCompleted) {
    Write-Host "The GitHub push already completed before this failure." -ForegroundColor Yellow
    Write-Host "Cloudflare Git integration may still be deploying that commit." -ForegroundColor Yellow
  } else {
    Write-Host "No Git commit or push was completed." -ForegroundColor Yellow
  }
  Wait-ForDan
  exit 1
}

function Require-Command([string]$Name, [string]$FriendlyName) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Fail "$FriendlyName is not installed or is not available in PATH."
  }
}

function Normalise-RepoUrl([string]$Url) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return "" }
  $normalised = $Url.Trim().ToLowerInvariant()
  $normalised = $normalised -replace '^git@github\.com:', 'https://github.com/'
  $normalised = $normalised -replace '\.git$', ''
  return $normalised.TrimEnd('/')
}

function Get-OriginUrl([string]$Path) {
  if (-not (Test-Path (Join-Path $Path ".git"))) { return "" }
  $output = & git.exe -C $Path remote get-url origin 2>$null
  if ($LASTEXITCODE -ne 0 -or $null -eq $output) { return "" }
  return ([string]($output | Select-Object -First 1)).Trim()
}

function Find-MatchingRepo([string]$SearchRoot, [string]$ExpectedRepoUrl) {
  if (-not (Test-Path $SearchRoot)) { return "" }

  $candidatePaths = New-Object System.Collections.Generic.List[string]
  $candidatePaths.Add((Join-Path $SearchRoot "tas"))

  Get-ChildItem -Path $SearchRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $candidatePaths.Add($_.FullName)
  }

  $expected = Normalise-RepoUrl $ExpectedRepoUrl
  foreach ($candidate in ($candidatePaths | Select-Object -Unique)) {
    if (-not (Test-Path (Join-Path $candidate ".git"))) { continue }
    $origin = Get-OriginUrl $candidate
    if ((Normalise-RepoUrl $origin) -eq $expected) {
      return $candidate
    }
  }
  return ""
}

function Resolve-Repo([string]$RequestedRepo, [string]$SearchRoot, [string]$ExpectedRepoUrl) {
  if (-not [string]::IsNullOrWhiteSpace($RequestedRepo)) {
    if (Test-Path (Join-Path $RequestedRepo ".git")) {
      return $RequestedRepo
    }
    if (Test-Path $RequestedRepo) {
      $existingItems = @(Get-ChildItem -Force -Path $RequestedRepo -ErrorAction SilentlyContinue)
      if ($existingItems.Count -gt 0) {
        Fail "The requested target exists but is not a Git repository: $RequestedRepo"
      }
    }
    return $RequestedRepo
  }

  $found = Find-MatchingRepo $SearchRoot $ExpectedRepoUrl
  if (-not [string]::IsNullOrWhiteSpace($found)) {
    return $found
  }

  return (Join-Path $SearchRoot "tas")
}

$PackageFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$PackageParent = Split-Path -Parent $PackageFolder
$RepoSearchRoot = $PackageParent
if (Test-Path "C:\TAS") { $RepoSearchRoot = "C:\TAS" }

Write-Host "============================================================"
Write-Host "TAS v70.18 AURORA ONE-CLICK RELEASE"
Write-Host "============================================================"
Write-Host "Package folder:  $PackageFolder"
Write-Host "Repository URL:  $RepoUrl"
Write-Host "Cloudflare project: $ProjectName"
Write-Host "Pages address:      $PagesHost"
Write-Host "Branch:          $Branch"
Write-Host "Commit message:  $CommitMessage"
if ($DirectCloudflare) {
  Write-Host "Deploy mode:     GitHub push plus direct Cloudflare deployment"
} elseif ($GitOnly) {
  Write-Host "Deploy mode:     GitHub only for first-time Cloudflare connection"
} else {
  Write-Host "Deploy mode:     GitHub push, then Cloudflare automatic deployment"
}
Write-Host ""

Require-Command "git.exe" "Git"
Require-Command "node.exe" "Node.js"
Require-Command "npm.cmd" "npm"
if ($DirectCloudflare) { Require-Command "npx.cmd" "npx" }

foreach ($required in @("src", "public", "functions", "scripts", "package.json", "package-lock.json", "index.html", "tsconfig.json", "wrangler.toml")) {
  if (-not (Test-Path (Join-Path $PackageFolder $required))) {
    Fail "The package is missing required item: $required"
  }
}

Write-Host "[1/10] Validating the AURORA source package..." -ForegroundColor Cyan
Set-Location $PackageFolder
& npm.cmd ci --no-audit --no-fund --progress=false
if ($LASTEXITCODE -ne 0) { Fail "npm ci failed in the AURORA package." }
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { Fail "The AURORA package build or regression tests failed." }

Write-Host "[2/10] Locating the correct Git repository..." -ForegroundColor Cyan
$ResolvedRepo = Resolve-Repo $TargetRepo $RepoSearchRoot $RepoUrl
Write-Host "Resolved repo:   $ResolvedRepo" -ForegroundColor Green

if (-not (Test-Path (Join-Path $ResolvedRepo ".git"))) {
  Write-Host "No local clone was found. Cloning the correct repository now..." -ForegroundColor Yellow
  $cloneParent = Split-Path -Parent $ResolvedRepo
  if (-not (Test-Path $cloneParent)) {
    New-Item -ItemType Directory -Path $cloneParent -Force | Out-Null
  }
  if (Test-Path $ResolvedRepo) {
    $remaining = @(Get-ChildItem -Force -Path $ResolvedRepo -ErrorAction SilentlyContinue)
    if ($remaining.Count -gt 0) {
      Fail "Cannot clone because the target folder is not empty: $ResolvedRepo"
    }
  }
  & git.exe clone $RepoUrl $ResolvedRepo
  if ($LASTEXITCODE -ne 0) { Fail "Git clone failed. Check GitHub access and the repository URL." }
}

$originUrl = Get-OriginUrl $ResolvedRepo
if ((Normalise-RepoUrl $originUrl) -ne (Normalise-RepoUrl $RepoUrl)) {
  Fail "The resolved folder points to a different GitHub repository. Found origin: $originUrl"
}

Write-Host "[3/10] Protecting any local repo changes and updating $Branch..." -ForegroundColor Cyan
$dirtyState = @(& git.exe -C $ResolvedRepo status --porcelain)
if ($LASTEXITCODE -ne 0) { Fail "Unable to read Git status in $ResolvedRepo" }
if ($dirtyState.Count -gt 0) {
  $backupLabel = "TAS v70.18 automatic backup " + (Get-Date -Format "yyyy-MM-dd_HH-mm-ss")
  Write-Host "Existing local repo changes detected. Saving them safely in Git stash..." -ForegroundColor Yellow
  & git.exe -C $ResolvedRepo stash push --include-untracked -m $backupLabel
  if ($LASTEXITCODE -ne 0) { Fail "Could not protect the existing local repo changes with Git stash." }
  Write-Host "Saved as: $backupLabel" -ForegroundColor Green
}

& git.exe -C $ResolvedRepo fetch origin
if ($LASTEXITCODE -ne 0) { Fail "git fetch failed." }

$remoteBranch = @(& git.exe -C $ResolvedRepo ls-remote --heads origin "refs/heads/$Branch")
$remoteBranchExists = ($LASTEXITCODE -eq 0 -and $remoteBranch.Count -gt 0)
if ($remoteBranchExists) {
  & git.exe -C $ResolvedRepo checkout $Branch
  if ($LASTEXITCODE -ne 0) {
    & git.exe -C $ResolvedRepo checkout -b $Branch "origin/$Branch"
    if ($LASTEXITCODE -ne 0) { Fail "Could not check out branch $Branch." }
  }
  & git.exe -C $ResolvedRepo pull --ff-only origin $Branch
  if ($LASTEXITCODE -ne 0) { Fail "git pull could not fast-forward. The repo was not overwritten." }
} else {
  Write-Host "The GitHub repository has no $Branch branch yet. Creating the first release branch locally..." -ForegroundColor Yellow
  & git.exe -C $ResolvedRepo checkout -B $Branch
  if ($LASTEXITCODE -ne 0) { Fail "Could not create the first $Branch branch." }
}

$packageResolved = (Resolve-Path $PackageFolder).Path.TrimEnd('\')
$repoResolved = (Resolve-Path $ResolvedRepo).Path.TrimEnd('\')
if ($packageResolved -ieq $repoResolved) {
  Fail "The source package folder and Git repository folder must be separate. Keep the package at C:\TAS\TAS_v70_18_AURORA and the repository at C:\TAS\tas."
}

Write-Host "[4/10] Cleaning the repository and installing the TAS-only application..." -ForegroundColor Cyan
Get-ChildItem -Force -Path $ResolvedRepo | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force
foreach ($folder in @("src", "public", "functions", "scripts")) {
  $destination = Join-Path $ResolvedRepo $folder
  Remove-Item $destination -Recurse -Force -ErrorAction SilentlyContinue
  Copy-Item (Join-Path $PackageFolder $folder) $ResolvedRepo -Recurse -Force
}

$githubSource = Join-Path $PackageFolder ".github"
if (Test-Path $githubSource) {
  $githubDestination = Join-Path $ResolvedRepo ".github"
  Remove-Item $githubDestination -Recurse -Force -ErrorAction SilentlyContinue
  Copy-Item $githubSource $ResolvedRepo -Recurse -Force
}

# Copy every root-level release file rather than relying on fragile filename patterns.
# This includes the local preview runner required by the inherited v70.17 regression gate.
Get-ChildItem -Path $PackageFolder -File -Force | ForEach-Object {
  Copy-Item $_.FullName $ResolvedRepo -Force
}

Write-Host "Verifying the deployment-complete root file set..." -ForegroundColor Cyan
$repoRequiredFiles = @(
  "index.html",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "wrangler.toml",
  ".gitignore",
  "RUN_ME_LOCAL_CLOUDFLARE_READY.ps1",
  "RUN_ME_LOCAL_CLOUDFLARE_READY.cmd",
  "RUN_ME_LOCAL_CLEAN_INSTALL.cmd",
  "RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1",
  "RUN_ME_DEPLOY_GIT_ONLY.ps1",
  "RUN_ME_DEPLOY_GIT_AND_CLOUDFLARE_DIRECT.ps1",
  "RUN_ME_FIRST_TIME_GIT_SETUP.cmd"
)
foreach ($requiredFile in $repoRequiredFiles) {
  if (-not (Test-Path (Join-Path $ResolvedRepo $requiredFile))) {
    Fail "The repository copy is incomplete. Missing root file: $requiredFile"
  }
}

Write-Host "[5/10] Rebuilding and regression-testing inside the Git repo..." -ForegroundColor Cyan
Set-Location $ResolvedRepo
& npm.cmd ci --no-audit --no-fund --progress=false
if ($LASTEXITCODE -ne 0) { Fail "npm ci failed in the Git repository. Nothing was committed." }
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { Fail "The repository build or regression tests failed. Nothing was committed." }

Write-Host "[6/10] Preparing the Git commit..." -ForegroundColor Cyan
& git.exe add -A
if ($LASTEXITCODE -ne 0) { Fail "git add failed." }
& git.exe diff --cached --quiet
$hasNoChanges = ($LASTEXITCODE -eq 0)

if ($hasNoChanges) {
  Write-Host "No file changes were detected. The repository is already on this release." -ForegroundColor Yellow
} else {
  Write-Host "[7/10] Committing TAS v70.18 AURORA..." -ForegroundColor Cyan
  & git.exe commit -m $CommitMessage
  if ($LASTEXITCODE -ne 0) { Fail "git commit failed. Check the configured Git name and email." }

  Write-Host "[8/10] Pushing to GitHub..." -ForegroundColor Cyan
  & git.exe push -u origin $Branch
  if ($LASTEXITCODE -ne 0) { Fail "git push failed. Check GitHub authentication and branch permissions." }
  $script:PushCompleted = $true
}

if ($DirectCloudflare) {
  Write-Host "[9/10] Deploying the validated dist folder directly to Cloudflare Pages..." -ForegroundColor Cyan
  & npx.cmd wrangler pages deploy ".\dist" --project-name $ProjectName --branch $Branch
  if ($LASTEXITCODE -ne 0) {
    Fail "The direct Cloudflare command failed. The GitHub push may already have completed."
  }
} elseif ($GitOnly) {
  Write-Host "[9/10] GitHub release completed. Cloudflare has deliberately not been assumed or changed." -ForegroundColor Cyan
  Write-Host "Next: create a new Cloudflare Pages project and connect it to Bitme1972/tas." -ForegroundColor Yellow
} else {
  Write-Host "[9/10] Cloudflare Pages deployment should now start through the connected GitHub integration." -ForegroundColor Cyan
}

Write-Host "[10/10] RELEASE COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Git repository: $ResolvedRepo"
if (-not $GitOnly) {
  Write-Host "Cloudflare:     https://$PagesHost/studio?v=718"
  Write-Host "Release marker: https://$PagesHost/DEPLOYMENT_MARKER_TAS_V70_18_AURORA_COMMAND_CENTRE.txt"
}
Write-Host ""
Write-Host "TAS v70.18 AURORA has passed both package and repository validation." -ForegroundColor Green
Wait-ForDan
