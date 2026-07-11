const fs = require('fs');
const path = require('path');
const dist = path.join(process.cwd(), 'dist');
const studio = path.join(dist, 'studio');
if (!fs.existsSync(dist)) {
  console.error('dist folder does not exist. Run the application build first.');
  process.exit(1);
}
const redirects = path.join(dist, '_redirects');
if (fs.existsSync(redirects)) fs.rmSync(redirects, { force: true });
fs.mkdirSync(studio, { recursive: true });
fs.copyFileSync(path.join(dist, 'index.html'), path.join(studio, 'index.html'));
for (const file of [
  'BUILD_TEST_EVIDENCE_TAS_V70_3_GOLDEN_COMPARE.txt',
  'DELIVERY_MANIFEST_TAS_V70_3_GOLDEN_COMPARE.md',
  'DEPLOYMENT_MARKER_TAS_V70_3_GOLDEN_COMPARE.txt',
  'DEPLOYMENT_MARKER_TAS_V70_10_REDUNDANCY_CLEAN.txt',
  'DEPLOYMENT_MARKER_TAS_V70_18_AURORA_COMMAND_CENTRE.txt',
  'DEPLOYMENT_MARKER_TAS_V70_18_1_FOUNDATION_LOCK.txt',
  'TAS_V70_18_1_FOUNDATION_LOCK_VALIDATION_REPORT.md',
  'BUILD_TEST_EVIDENCE_TAS_V70_18_1_FOUNDATION_LOCK.txt',
  'FOUNDATION_BASELINE_MANIFEST.json',
  'EXPECTED_AURORA_ASSET_HASHES.txt',
  'FOUNDATION_LOCK_HOTFIX_1.txt',
  'FOUNDATION_LOCK_HOTFIX_2.txt',
  'DEPLOYMENT_RUNNER_HOTFIX_2.txt'
]) {
  const src = path.join(process.cwd(), file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dist, file));
}
console.log('Prepared Cloudflare dist with /studio route, inherited AURORA marker and v70.18.1 Foundation Lock evidence.');
