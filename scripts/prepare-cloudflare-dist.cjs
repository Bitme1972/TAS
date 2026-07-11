const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = process.cwd();
const dist = path.join(root, 'dist');
const demo = path.join(root, 'dist-editions', 'demo');
const fail = message => { console.error(`TAS v70.20.3 public preparation failed: ${message}`); process.exit(1); };
if (!fs.existsSync(demo) || !fs.existsSync(path.join(demo, 'index.html'))) fail('interactive Demo build is missing');
if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const copyTree = (source, target) => { if (fs.existsSync(source)) fs.cpSync(source, target, { recursive: true }); };
copyTree(path.join(root, 'public', 'member'), path.join(dist, 'member'));
copyTree(path.join(root, 'public', 'member-resources'), path.join(dist, 'member-resources'));
copyTree(path.join(root, 'public', 'downloads'), path.join(dist, 'downloads'));
copyTree(path.join(root, 'public', 'media'), path.join(dist, 'media'));
copyTree(path.join(root, 'public', 'studio'), path.join(dist, 'studio'));
copyTree(demo, path.join(dist, 'demo'));
const hubSource = path.join(root, 'public', 'member', 'index.html');
if (!fs.existsSync(hubSource)) fail('member gateway source is missing');
fs.copyFileSync(hubSource, path.join(dist, 'index.html'));
for (const file of ['tas-workspace-parity.js','tas-member-extension.js']) {
  const source = path.join(root, 'public', file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(dist, file));
}
const installer = path.join(root, 'release-assets', 'TAS_Professional_v10_0_6_x64.msi');
const installerStatus = {
  release: '70.20.3',
  publicDownloadPublished: false,
  protectedInstallerStaged: fs.existsSync(installer),
  artifact: null,
  guidedTourPublished: fs.existsSync(path.join(root, 'public', 'media', 'TAS_Interactive_Product_Tour.mp4')),
  securityBoundary: 'The public Cloudflare distribution never includes the MSI. Production delivery requires authenticated server-side entitlement; the installed desktop app separately validates the signed licence.'
};
if (fs.existsSync(installer)) {
  const bytes = fs.statSync(installer).size;
  const data = fs.readFileSync(installer);
  installerStatus.artifact = { fileName: path.basename(installer), bytes, sha256: crypto.createHash('sha256').update(data).digest('hex'), sha512: crypto.createHash('sha512').update(data).digest('hex'), productVersion: '10.0.6', architecture: 'x64' };
}
fs.writeFileSync(path.join(dist, 'TAS_INSTALLER_STATUS.json'), JSON.stringify(installerStatus, null, 2));
fs.writeFileSync(path.join(dist, 'TAS_DEPLOYED_EDITION.json'), JSON.stringify({
  release: '70.20.3',
  publicLanding: 'member-gateway',
  freeExperience: '/demo/',
  licensedGateway: '/studio/',
  memberDownloadVault: '/member/downloads.html',
  publicCommercialEngineIncluded: false,
  publicInstallerIncluded: false,
  note: 'The AURORA Professional and Consultant builds remain in separate protected edition outputs. The verified MSI is staged only for entitled delivery.'
}, null, 2));
for (const file of [
  'DEPLOYMENT_MARKER_TAS_V70_3_GOLDEN_COMPARE.txt','DEPLOYMENT_MARKER_TAS_V70_10_REDUNDANCY_CLEAN.txt',
  'DEPLOYMENT_MARKER_TAS_V70_18_AURORA_COMMAND_CENTRE.txt','DEPLOYMENT_MARKER_TAS_V70_18_1_FOUNDATION_LOCK.txt',
  'DEPLOYMENT_MARKER_TAS_V70_19_COMMERCIAL_FOUNDATION.txt','DEPLOYMENT_MARKER_TAS_V70_20_COMMUNITY.txt',
  'DEPLOYMENT_MARKER_TAS_V70_20_1_AURORA_MEMBER_FOUNDATION.txt','DEPLOYMENT_MARKER_TAS_V70_20_2_COMMERCIAL_GATEWAY.txt',
  'DEPLOYMENT_MARKER_TAS_V70_20_3_COMMERCIAL_DELIVERY.txt','TAS_V70_20_3_COMMERCIAL_DELIVERY_VALIDATION_REPORT.md',
  'README_V70_20_3_COMMERCIAL_DELIVERY.md','START_HERE_DAN_V70_20_3.txt','RELEASE_MANIFEST_V70_20_3.txt'
]) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(dist, file));
}
for (const required of ['index.html','demo/index.html','studio/index.html','member/index.html','member/downloads.html','member/license-guide.html','member-resources/TAS_DEMO_SECURITY_BOUNDARY.md','member-resources/TAS_V70_20_3_CAPABILITY_PARITY_MAP.md','media/TAS_Interactive_Product_Tour.mp4','media/TAS_Interactive_Product_Tour.en.srt','tas-workspace-parity.js','TAS_INSTALLER_STATUS.json']) {
  if (!fs.existsSync(path.join(dist, required))) fail(`missing public output ${required}`);
}
if (fs.existsSync(path.join(dist, 'entitled-downloads'))) fail('public dist contains entitled downloads');
console.log('Prepared TAS v70.20.3 public dist: Member Gateway, synthetic Demo, guided product tour and licence gate; no public commercial engine or MSI.');
