const fs = require('fs');
const crypto = require('crypto');
const fail = message => { console.error(`TAS v70.20 inherited Sprint 1 architecture gate failed: ${message}`); process.exit(1); };
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json', 'utf8'));
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

if (pkg.name !== 'tas-v70-20-2-commercial-gateway') fail(`unexpected package name ${pkg.name}`);
if (pkg.version !== '70.20.2') fail(`unexpected package version ${pkg.version}`);
for (const script of ['build:community', 'build:professional', 'build:consultant', 'build:editions', 'test:entitlements', 'test:edition-builds', 'test:commercial-foundation']) {
  if (!pkg.scripts?.[script]) fail(`missing inherited Sprint 1 package script ${script}`);
}
for (const file of [
  'config/edition-entitlements.json', 'src/editions/bootstrap.tsx', 'src/editions/community-main.tsx',
  'src/editions/professional-main.tsx', 'src/editions/consultant-main.tsx', 'src/community/CommunityApp.tsx',
  'src/community/communityEngine.ts', 'SPRINT_1_COMMERCIAL_ARCHITECTURE.md', 'README_V70_19_COMMERCIAL_FOUNDATION.md',
  'BUILD_TEST_EVIDENCE_TAS_V70_19_COMMERCIAL_FOUNDATION.txt', 'src/services/index.ts',
  'src/services/evidenceParserService.ts', 'src/services/assuranceService.ts', 'src/services/baselineService.ts',
  'src/services/comparisonService.ts', 'src/services/reportService.ts', 'src/services/eventIntelligenceService.ts',
  'src/services/dashboardService.ts', 'src/services/editionService.ts', 'src/licensing/licensingContracts.ts'
]) if (!fs.existsSync(file)) fail(`missing inherited Sprint 1 item ${file}`);

for (const entry of manifest.protectedFiles || []) {
  if (!fs.existsSync(entry.path)) fail(`protected file missing: ${entry.path}`);
  if (fs.statSync(entry.path).size !== entry.bytes || sha256(entry.path) !== entry.sha256) fail(`protected AURORA baseline changed: ${entry.path}`);
}
console.log(`TAS v70.20 inherited Sprint 1 architecture gate passed with ${manifest.protectedFiles.length} protected AURORA files unchanged.`);
