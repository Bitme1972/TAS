const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const fail = (message) => {
  console.error(`TAS v70.18.1 repository-copy gate failed: ${message}`);
  process.exit(1);
};
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const runner = fs.readFileSync('RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1', 'utf8');
const manifest = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json', 'utf8'));

const foldersMatch = runner.match(/\$releaseFolders\s*=\s*@\(([^)]+)\)/);
if (!foldersMatch) fail('deployment runner does not declare $releaseFolders');
const releaseFolders = [...foldersMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
for (const requiredFolder of ['src', 'public', 'functions', 'scripts', 'preview']) {
  if (!releaseFolders.includes(requiredFolder)) fail(`deployment folder set omits ${requiredFolder}`);
}

for (const entry of manifest.protectedFiles || []) {
  const topLevel = entry.path.split(/[\\/]/)[0];
  if (!releaseFolders.includes(topLevel)) {
    fail(`protected path ${entry.path} is outside the deployment folder set`);
  }
}

for (const requiredText of [
  'Get-Content -Raw -Path $repoManifestPath | ConvertFrom-Json',
  'foreach ($protectedFile in $repoManifest.protectedFiles)',
  'Missing protected baseline file:',
  'preview/TAS_v70_18_AURORA_Dashboard.png',
  'preview/TAS_v70_18_AURORA_Evidence_Intake.png'
]) {
  if (!runner.includes(requiredText)) fail(`deployment runner is missing protected-copy safeguard: ${requiredText}`);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tas-repository-copy-'));
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
    if (fs.statSync(copied).size !== entry.bytes) fail(`simulated copy changed size for ${entry.path}`);
    if (sha256(copied) !== entry.sha256) fail(`simulated copy changed hash for ${entry.path}`);
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log(`TAS v70.18.1 repository-copy gate passed: ${manifest.protectedFiles.length} protected files survive the deployment copy.`);
