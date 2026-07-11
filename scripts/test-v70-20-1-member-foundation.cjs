const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const fail = message => { console.error(`TAS v70.20.1 member-foundation gate failed: ${message}`); process.exit(1); };
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
if (pkg.name !== 'tas-v70-20-2-commercial-gateway' || pkg.version !== '70.20.2') fail('package identity mismatch');
const foundation = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json','utf8'));
for (const item of foundation.protectedFiles) {
  if (!fs.existsSync(item.path)) fail(`missing protected file ${item.path}`);
  const sha = crypto.createHash('sha256').update(fs.readFileSync(item.path)).digest('hex');
  if (sha !== item.sha256) fail(`protected file changed: ${item.path}`);
}
const required = [
  'public/member/index.html',
  'public/member/license-guide.html',
  'public/tas-member-extension.js',
  'public/member-resources/TAS_LICENSING_AND_DOWNLOADS_README.md',
  'public/member-resources/TAS_CUSTOMER_QUICK_START.md',
  'public/member-resources/TAS_OFFLINE_ACTIVATION_WORKFLOW.md',
  'public/member-resources/TAS_SHA256_VERIFICATION_GUIDE.txt',
  'public/member-resources/TAS_MEMBER_DOWNLOAD_MANIFEST.json',
  'DEPLOYMENT_MARKER_TAS_V70_20_1_AURORA_MEMBER_FOUNDATION.txt'
];
for (const file of required) if (!fs.existsSync(file) || fs.statSync(file).size < 40) fail(`missing or empty member foundation file ${file}`);
const index = fs.readFileSync('index.html','utf8');
if (!index.includes('/src/main.tsx') || !index.includes('/tas-member-extension.js')) fail('AURORA entry or extension link missing');
const hub = fs.readFileSync('public/member/index.html','utf8');
for (const phrase of ['One command centre. Three controlled ways to use it.','Paid-member download vault','TAS Professional','TAS Consultant','TAS Community']) if (!hub.includes(phrase)) fail(`hub missing ${phrase}`);
if (/TAS_.*\.(msi|exe)/i.test(hub)) fail('hub must not expose a fake commercial installer');
const manifest = JSON.parse(fs.readFileSync('public/member-resources/TAS_MEMBER_DOWNLOAD_MANIFEST.json','utf8'));
if (manifest.commercialBinariesPublished !== false) fail('commercial binaries must remain unpublished');
if (JSON.stringify(manifest).match(/secret|private.?key/i) && !manifest.securityNote) fail('manifest secret handling unclear');
console.log(`TAS v70.20.1 member-foundation gate passed: ${foundation.protectedFiles.length} protected AURORA files unchanged; hub, member vault and licensing resources verified.`);
