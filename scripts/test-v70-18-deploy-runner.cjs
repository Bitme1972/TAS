const fs = require('fs');

const main = fs.readFileSync('RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1', 'utf8');
const direct = fs.readFileSync('RUN_ME_DEPLOY_GIT_AND_CLOUDFLARE_DIRECT.ps1', 'utf8');
const gitOnly = fs.readFileSync('RUN_ME_DEPLOY_GIT_ONLY.ps1', 'utf8');
const cmd = fs.readFileSync('RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.cmd', 'utf8');
const firstTime = fs.readFileSync('RUN_ME_FIRST_TIME_GIT_SETUP.cmd', 'utf8');

const requiredMain = [
  'TAS v70.18 AURORA ONE-CLICK RELEASE',
  'https://github.com/Bitme1972/tas.git',
  '[string]$ProjectName = "tas"',
  '[string]$PagesHost = "tas-duo.pages.dev"',
  'Join-Path $SearchRoot "tas"',
  'git.exe clone',
  'ls-remote --heads origin',
  'checkout -B $Branch',
  'Get-ChildItem -Force -Path $ResolvedRepo',
  'Where-Object { $_.Name -ne ".git" }',
  'push -u origin $Branch',
  'DEPLOYMENT_MARKER_TAS_V70_18_AURORA_COMMAND_CENTRE.txt',
  'studio?v=718',
  'npm.cmd ci',
  'npm.cmd run build',
  'stash push --include-untracked',
  'pull --ff-only',
  'Bitme1972/tas',
  'Get-ChildItem -Path $PackageFolder -File -Force',
  'RUN_ME_LOCAL_CLOUDFLARE_READY.ps1',
  'RUN_ME_LOCAL_CLOUDFLARE_READY.cmd',
  'RUN_ME_LOCAL_CLEAN_INSTALL.cmd',
  'The repository copy is incomplete. Missing root file:'
];

const missing = requiredMain.filter((item) => !main.includes(item));
if (missing.length) {
  console.error('TAS v70.18 deployment runner gate failed. Missing:', missing);
  process.exit(1);
}

const forbidden = [
  'TAS716 ONE-CLICK',
  'Deploy TAS v70.16 Event ID final column order',
  'studio?v=716',
  ['xi','tux-tas-cloud-preview'].join(''),
  ['Bitme1972/','xi','tux'].join(''),
  ['C:\\','XI','TUX'].join('')
];
const stale = forbidden.filter((item) => main.includes(item));
if (stale.length) {
  console.error('TAS v70.18 deployment runner still contains stale cross-project defaults:', stale);
  process.exit(1);
}

if (!direct.includes('-DirectCloudflare')) {
  console.error('Direct Cloudflare wrapper does not enable DirectCloudflare mode.');
  process.exit(1);
}
if (!gitOnly.includes('-GitOnly')) {
  console.error('Git-only wrapper does not enable first-time Git-only mode.');
  process.exit(1);
}
if (!firstTime.includes('RUN_ME_DEPLOY_GIT_ONLY.ps1')) {
  console.error('First-time setup entry point is not connected to the Git-only runner.');
  process.exit(1);
}
if (!cmd.includes('TAS v70.18 AURORA')) {
  console.error('CMD entry point is not labelled for v70.18 AURORA.');
  process.exit(1);
}

console.log('TAS v70.18 TAS-only Git and Cloudflare deployment runner gate passed.');
