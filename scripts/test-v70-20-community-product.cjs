const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fail = message => { console.error(`TAS v70.20 Community product gate failed: ${message}`); process.exit(1); };
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const config = JSON.parse(fs.readFileSync('config/edition-entitlements.json', 'utf8'));
const foundation = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json', 'utf8'));
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

if (pkg.name !== 'tas-v70-20-3-commercial-delivery-studio' || pkg.version !== '70.20.3') fail('package identity mismatch');
if (config.release !== '70.20.3') fail('entitlement release mismatch');
const community = config.editions.community;
for (const capability of ['singleEvidenceIntake', 'basicAssurance', 'watermarkedHtmlReport', 'evidenceReceipt', 'limitedEventIntelligence', 'professionalUpgradePreview']) {
  if (!community.capabilities[capability]) fail(`Community capability ${capability} is not enabled`);
}
for (const capability of ['multiEvidenceIntake', 'advancedAssurance', 'goldenComparison', 'beforeAfterComparison', 'fullReportExports', 'eventIntelligence', 'commercialClientUse']) {
  if (community.capabilities[capability]) fail(`Community leaked premium capability ${capability}`);
}
for (const file of [
  'src/community/CommunityApp.tsx', 'src/community/communityEngine.ts', 'src/community/communityReport.ts',
  'SPRINT_2_COMMUNITY_EDITION.md', 'SPRINT_2_CHANGELOG.md', 'README_V70_20_COMMUNITY.md',
  'BUILD_TEST_EVIDENCE_TAS_V70_20_COMMUNITY.txt', 'DEPLOYMENT_MARKER_TAS_V70_20_COMMUNITY.txt',
  'dist-editions/community/TAS_EDITION_MANIFEST.json'
]) if (!fs.existsSync(file)) fail(`missing Sprint 2 item ${file}`);

const imports = ['src/community/CommunityApp.tsx', 'src/community/communityEngine.ts', 'src/community/communityReport.ts']
  .map(file => fs.readFileSync(file, 'utf8')).join('\n');
for (const forbiddenImport of ["../App", '../tasEngine', '../data/', 'baseline_advanced_audit', 'event_id_lookup']) {
  if (imports.includes(forbiddenImport)) fail(`Community source imports premium boundary ${forbiddenImport}`);
}

function allText(folder) {
  let output = '';
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, item.name);
    if (item.isDirectory()) output += allText(full);
    else if (/\.(?:html|js|css|json|txt)$/i.test(item.name)) output += fs.readFileSync(full, 'utf8');
  }
  return output;
}
const bundle = allText('dist-editions/community');
for (const required of [
  'COMMUNITY · v70.20', 'No account required', 'Download HTML', 'Evidence receipt',
  'Community does not calculate or invent hidden Professional findings', 'Browser-local',
  'Not licensed for commercial client reporting', 'Windows Server 2025', 'COMM-012'
]) if (!bundle.includes(required)) fail(`Community build is missing ${required}`);
for (const forbidden of [
  'EGoP_10_DCs_multi_auditpol', 'Golden DC audit baseline comparison',
  'Eight DCs against one golden audit baseline matrix', 'commercial-parity-demo-web'
]) if (bundle.includes(forbidden)) fail(`Community build contains premium sentinel ${forbidden}`);

const communityBytes = fs.readdirSync('dist-editions/community/assets').reduce((sum, file) => sum + fs.statSync(path.join('dist-editions/community/assets', file)).size, 0);
const professionalBytes = fs.readdirSync('dist-editions/professional/assets').reduce((sum, file) => sum + fs.statSync(path.join('dist-editions/professional/assets', file)).size, 0);
if (communityBytes >= professionalBytes * 0.4) fail(`Community build is unexpectedly large (${communityBytes} vs ${professionalBytes})`);

for (const entry of foundation.protectedFiles) {
  if (!fs.existsSync(entry.path) || fs.statSync(entry.path).size !== entry.bytes || sha256(entry.path) !== entry.sha256) fail(`protected AURORA file changed: ${entry.path}`);
}
console.log(`TAS v70.20 Community product gate passed. Community assets ${communityBytes} bytes; Professional assets ${professionalBytes} bytes; ${foundation.protectedFiles.length} AURORA files unchanged.`);
