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

const entitlements = JSON.parse(fs.readFileSync('config/edition-entitlements.json', 'utf8'));
fs.writeFileSync(path.join(dist, 'TAS_DEPLOYED_EDITION.json'), JSON.stringify({
  release: entitlements.release,
  edition: 'professional',
  definition: entitlements.editions.professional,
  note: 'The protected AURORA Professional application remains the default output. The member and edition hub is available at /member/ without replacing the AURORA frontend.'
}, null, 2));

for (const file of [
  'DEPLOYMENT_MARKER_TAS_V70_3_GOLDEN_COMPARE.txt',
  'DEPLOYMENT_MARKER_TAS_V70_10_REDUNDANCY_CLEAN.txt',
  'DEPLOYMENT_MARKER_TAS_V70_18_AURORA_COMMAND_CENTRE.txt',
  'DEPLOYMENT_MARKER_TAS_V70_18_1_FOUNDATION_LOCK.txt',
  'DEPLOYMENT_MARKER_TAS_V70_19_COMMERCIAL_FOUNDATION.txt',
  'DEPLOYMENT_MARKER_TAS_V70_20_COMMUNITY.txt',
  'DEPLOYMENT_MARKER_TAS_V70_20_1_AURORA_MEMBER_FOUNDATION.txt',
  'TAS_V70_18_1_FOUNDATION_LOCK_VALIDATION_REPORT.md',
  'TAS_V70_19_COMMERCIAL_FOUNDATION_VALIDATION_REPORT.md',
  'TAS_V70_20_COMMUNITY_VALIDATION_REPORT.md',
  'TAS_V70_20_1_AURORA_MEMBER_FOUNDATION_VALIDATION_REPORT.md',
  'BUILD_TEST_EVIDENCE_TAS_V70_18_1_FOUNDATION_LOCK.txt',
  'BUILD_TEST_EVIDENCE_TAS_V70_19_COMMERCIAL_FOUNDATION.txt',
  'BUILD_TEST_EVIDENCE_TAS_V70_20_COMMUNITY.txt',
  'FOUNDATION_BASELINE_MANIFEST.json',
  'EXPECTED_AURORA_ASSET_HASHES.txt',
  'EXPECTED_AURORA_V70_20_1_ASSET_HASHES.txt',
  'FOUNDATION_LOCK_HOTFIX_1.txt',
  'FOUNDATION_LOCK_HOTFIX_2.txt',
  'DEPLOYMENT_RUNNER_HOTFIX_2.txt',
  'SPRINT_1_COMMERCIAL_ARCHITECTURE.md',
  'SPRINT_1_CHANGELOG.md',
  'SPRINT_2_COMMUNITY_EDITION.md',
  'SPRINT_2_CHANGELOG.md',
  'README_V70_20_1_AURORA_MEMBER_FOUNDATION.md',
  'TAS_V70_20_1_BROWSER_QA_REPORT.md',
  'START_HERE_DAN_V70_20_1.txt',
  'RELEASE_MANIFEST_V70_20_1.txt'
]) {
  const source = path.join(process.cwd(), file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(dist, file));
}
for (const required of ['member/index.html','member/license-guide.html','member-resources/TAS_LICENSING_AND_DOWNLOADS_README.md','member-resources/TAS_CUSTOMER_QUICK_START.md','member-resources/TAS_OFFLINE_ACTIVATION_WORKFLOW.md','member-resources/TAS_SHA256_VERIFICATION_GUIDE.txt','tas-member-extension.js']) {
  const target = path.join(dist, required);
  if (!fs.existsSync(target)) { console.error(`Missing member-foundation output: ${required}`); process.exit(1); }
}
console.log('Prepared Cloudflare dist with protected AURORA root, /studio, AURORA-aligned /member hub and v70.20.3 inherited validation evidence.');
