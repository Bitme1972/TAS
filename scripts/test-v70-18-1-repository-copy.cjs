const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const fail = message => { console.error(`TAS v70.20 repository-copy gate failed: ${message}`); process.exit(1); };
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const runner = fs.readFileSync('RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1', 'utf8');
const manifest = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json', 'utf8'));

const foldersMatch = runner.match(/\$releaseFolders\s*=\s*@\(([^)]+)\)/);
if (!foldersMatch) fail('deployment runner does not declare $releaseFolders');
const releaseFolders = [...foldersMatch[1].matchAll(/"([^"]+)"/g)].map(match => match[1]);
for (const requiredFolder of ['src', 'public', 'functions', 'scripts', 'preview', 'config', 'editions']) {
  if (!releaseFolders.includes(requiredFolder)) fail(`deployment folder set omits ${requiredFolder}`);
}
for (const entry of manifest.protectedFiles || []) {
  const topLevel = entry.path.split(/[\\/]/)[0];
  if (!releaseFolders.includes(topLevel)) fail(`protected path ${entry.path} is outside deployment folder set`);
}
for (const requiredText of [
  'Get-Content -Raw -Path $repoManifestPath | ConvertFrom-Json',
  'foreach ($protectedFile in $repoManifest.protectedFiles)',
  'Missing protected baseline file:',
  'config/edition-entitlements.json',
  'editions/community/index.html',
  'dist-editions/',
  'TAS_EDITION_MANIFEST.json'
]) if (!runner.includes(requiredText)) fail(`deployment runner is missing safeguard: ${requiredText}`);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tas-v70-20-repository-copy-'));
try {
  for (const folder of releaseFolders) {
    if (!fs.existsSync(folder)) fail(`source release folder is missing: ${folder}`);
    fs.cpSync(folder, path.join(tempRoot, folder), { recursive: true });
  }
  for (const item of fs.readdirSync('.', { withFileTypes: true })) {
    if (item.isFile()) fs.copyFileSync(item.name, path.join(tempRoot, item.name));
  }
  for (const entry of manifest.protectedFiles || []) {
    const copied = path.join(tempRoot, entry.path);
    if (!fs.existsSync(copied)) fail(`simulated repository copy omitted ${entry.path}`);
    if (fs.statSync(copied).size !== entry.bytes || sha256(copied) !== entry.sha256) fail(`simulated copy changed ${entry.path}`);
  }
  for (const releaseFile of [
    'config/edition-entitlements.json', 'editions/community/index.html', 'editions/professional/index.html',
    'editions/consultant/index.html', 'src/community/CommunityApp.tsx', 'src/community/communityEngine.ts',
    'src/community/communityReport.ts', 'src/editions/entitlements.ts', 'SPRINT_2_COMMUNITY_EDITION.md',
    'BUILD_TEST_EVIDENCE_TAS_V70_20_COMMUNITY.txt', 'DEPLOYMENT_MARKER_TAS_V70_20_COMMUNITY.txt'
  ]) if (!fs.existsSync(path.join(tempRoot, releaseFile))) fail(`simulated repository copy omitted ${releaseFile}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
console.log(`TAS v70.20 repository-copy gate passed: ${manifest.protectedFiles.length} protected files and all Sprint 2 release files survive deployment copy.`);
