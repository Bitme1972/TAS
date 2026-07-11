const fs = require('fs');
const main = fs.readFileSync('RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1', 'utf8');
const direct = fs.readFileSync('RUN_ME_DEPLOY_GIT_AND_CLOUDFLARE_DIRECT.ps1', 'utf8');
const gitOnly = fs.readFileSync('RUN_ME_DEPLOY_GIT_ONLY.ps1', 'utf8');
const cmd = fs.readFileSync('RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.cmd', 'utf8');
const firstTime = fs.readFileSync('RUN_ME_FIRST_TIME_GIT_SETUP.cmd', 'utf8');

const requiredMain = [
  'TAS v70.20 COMMUNITY ONE-CLICK RELEASE', 'https://github.com/Bitme1972/tas.git', '[string]$ProjectName = "tas"',
  '[string]$PagesHost = "tas-duo.pages.dev"', 'Join-Path $SearchRoot "tas"', 'git.exe clone',
  'ls-remote --heads origin', 'checkout -B $Branch', 'Get-ChildItem -Force -Path $ResolvedRepo',
  'Where-Object { $_.Name -ne ".git" }', 'push -u origin $Branch', 'DEPLOYMENT_MARKER_TAS_V70_20_COMMUNITY.txt',
  'studio?v=70200', 'npm.cmd ci', 'npm.cmd run build', 'stash push --include-untracked', 'pull --ff-only',
  'Bitme1972/tas', 'Get-ChildItem -Path $PackageFolder -File -Force', 'RUN_ME_LOCAL_CLOUDFLARE_READY.ps1',
  'RUN_ME_LOCAL_EDITION_PREVIEWS.cmd', 'TEST_ALL_CAPABILITIES.cmd', 'FOUNDATION_BASELINE_MANIFEST.json',
  'config/edition-entitlements.json', 'editions/community/index.html', 'editions/professional/index.html',
  'editions/consultant/index.html', '$releaseFolders = @("src", "public", "functions", "scripts", "preview", "config", "editions")',
  'foreach ($protectedFile in $repoManifest.protectedFiles)', 'dist-editions/', 'TAS_EDITION_MANIFEST.json',
  'preview/TAS_v70_18_AURORA_Dashboard.png', 'preview/TAS_v70_18_AURORA_Evidence_Intake.png',
  'C:\\TAS\\TAS_v70_20_COMMUNITY'
];
const missing = requiredMain.filter(item => !main.includes(item));
if (missing.length) {
  console.error('TAS v70.20 deployment runner gate failed. Missing:', missing);
  process.exit(1);
}
const forbidden = [
  'TAS716 ONE-CLICK', 'Deploy TAS v70.16 Event ID final column order', 'studio?v=716',
  ['xi','tux-tas-cloud-preview'].join(''), ['Bitme1972/','xi','tux'].join(''), ['C:\\','XI','TUX'].join(''),
  'TAS_v70_19_COMMERCIAL_FOUNDATION'
];
const stale = forbidden.filter(item => main.includes(item));
if (stale.length) {
  console.error('TAS v70.20 deployment runner contains stale defaults:', stale);
  process.exit(1);
}
if (!direct.includes('-DirectCloudflare')) throw new Error('Direct wrapper does not enable DirectCloudflare mode.');
if (!gitOnly.includes('-GitOnly')) throw new Error('Git-only wrapper does not enable GitOnly mode.');
if (!firstTime.includes('RUN_ME_DEPLOY_GIT_ONLY.ps1')) throw new Error('First-time setup is not connected to Git-only runner.');
if (!cmd.includes('TAS v70.20 Community')) throw new Error('CMD entry point is not labelled for v70.20.');
console.log('TAS v70.20 TAS-only Git, Cloudflare and independent-edition deployment runner gate passed.');
