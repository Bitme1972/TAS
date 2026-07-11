const fs = require('fs');
const crypto = require('crypto');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail = (message) => { console.error(`TAS v70.20 inherited Foundation Lock gate failed: ${message}`); process.exit(1); };

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const manifest = readJson('FOUNDATION_BASELINE_MANIFEST.json');

if (pkg.name !== 'tas-v70-20-2-commercial-gateway') fail(`unexpected package name ${pkg.name}`);
if (pkg.version !== '70.20.2') fail(`unexpected package version ${pkg.version}`);
if (lock.name !== pkg.name || lock.version !== pkg.version) fail('package-lock root identity does not match package.json');
if (lock.packages?.['']?.name !== pkg.name || lock.packages?.['']?.version !== pkg.version) fail('package-lock package identity does not match package.json');

for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, spec] of Object.entries(pkg[section] || {})) {
    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(spec)) fail(`${name} is not pinned to an exact version: ${spec}`);
    const locked = lock.packages?.[`node_modules/${name}`]?.version;
    if (locked !== spec) fail(`${name} package.json version ${spec} does not match lock version ${locked}`);
  }
}

for (const entry of manifest.protectedFiles || []) {
  if (!fs.existsSync(entry.path)) fail(`protected file is missing: ${entry.path}`);
  if (fs.statSync(entry.path).size !== entry.bytes) fail(`protected file size changed: ${entry.path}`);
  if (sha256(entry.path) !== entry.sha256) fail(`protected v70.18 baseline changed: ${entry.path}`);
}

const expectedLines = fs.readFileSync('EXPECTED_AURORA_V70_20_1_ASSET_HASHES.txt', 'utf8')
  .split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
for (const line of expectedLines) {
  const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
  if (!match) fail(`invalid expected asset hash line: ${line}`);
  const [, expected, file] = match;
  if (!fs.existsSync(file)) fail(`expected build output is missing: ${file}`);
  const actual = sha256(file);
  if (actual !== expected) fail(`build output drift detected for ${file}; expected ${expected}, found ${actual}`);
}

const requiredScripts = ['clean', 'typecheck', 'build:app', 'build:cloudflare', 'test:regression', 'validate', 'build'];
for (const script of requiredScripts) if (!pkg.scripts?.[script]) fail(`missing package script: ${script}`);

for (const required of ['TEST_ALL_CAPABILITIES.cmd', 'TEST_ALL_CAPABILITIES.ps1', 'RUN_ME_LOCAL_CLEAN_INSTALL.cmd', 'SPRINT_0_CHANGELOG.md', 'BUILD_TEST_EVIDENCE_TAS_V70_18_1_FOUNDATION_LOCK.txt', 'BUILD_RELEASE_PACKAGE.cmd']) {
  if (!fs.existsSync(required)) fail(`missing Sprint 0 release item: ${required}`);
}

const validationWriter = fs.readFileSync('scripts/write-validation-report.cjs', 'utf8');
if (/child_process|spawnSync|execFileSync|npm\.cmd/.test(validationWriter)) {
  fail('validation report writer must remain subprocess-free for Windows Node 24 portability');
}

console.log(`TAS v70.20 inherited Foundation Lock gate passed: ${manifest.protectedFiles.length} protected files and ${expectedLines.length} deterministic protected AURORA build outputs verified.`);
