param(
  [string]$TargetRepo = "",
  [string]$RepoUrl = "https://github.com/Bitme1972/tas.git",
  [string]$Branch = "main",
  [string]$CommitMessage = "Deploy TAS v70.18 AURORA Command Centre"
)

& "$PSScriptRoot\RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1" `
  -TargetRepo $TargetRepo `
  -RepoUrl $RepoUrl `
  -Branch $Branch `
  -CommitMessage $CommitMessage `
  -GitOnly
exit $LASTEXITCODE
