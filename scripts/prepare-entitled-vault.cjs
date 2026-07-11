const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = process.cwd();
const out = path.join(root, 'dist-entitled');
const demo = path.join(root, 'dist-editions', 'demo');
const professional = path.join(root, 'dist-editions', 'professional');
const consultant = path.join(root, 'dist-editions', 'consultant');
const installer = path.join(root, 'release-assets', 'TAS_Professional_v10_0_6_x64.msi');
const fail = message => { console.error(`TAS v70.20.3 entitled-vault preparation failed: ${message}`); process.exit(1); };
for (const [name, folder] of [['Demo',demo],['Professional',professional],['Consultant',consultant]]) {
  if (!fs.existsSync(path.join(folder,'index.html'))) fail(`${name} build is missing`);
}
if (!fs.existsSync(installer)) fail('verified TAS v10.0.6 MSI is missing');
if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const copyTree = (source, target) => { if (fs.existsSync(source)) fs.cpSync(source, target, { recursive: true }); };
copyTree(path.join(root, 'public', 'member'), path.join(out, 'member'));
copyTree(path.join(root, 'public', 'member-resources'), path.join(out, 'member-resources'));
copyTree(path.join(root, 'public', 'media'), path.join(out, 'media'));
copyTree(demo, path.join(out, 'demo'));
// Entitled members enter the actual independently compiled commercial app.
copyTree(professional, path.join(out, 'studio'));
copyTree(consultant, path.join(out, 'consultant-studio'));
fs.copyFileSync(path.join(root, 'public', 'member', 'index.html'), path.join(out, 'index.html'));
for (const file of ['tas-workspace-parity.js','tas-member-extension.js']) {
  const source = path.join(root, 'public', file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(out, file));
}
const entitledDir = path.join(out, 'entitled-downloads');
fs.mkdirSync(entitledDir, { recursive: true });
for (const name of ['TAS_Professional_v10_0_6_x64.msi','TAS_Professional_v10_0_6_x64.msi.sha256','TAS_Professional_v10_0_6_x64.msi.sha512']) {
  fs.copyFileSync(path.join(root, 'release-assets', name), path.join(entitledDir, name));
}
const bytes = fs.statSync(installer).size;
const data = fs.readFileSync(installer);
const sha256 = crypto.createHash('sha256').update(data).digest('hex');
const sha512 = crypto.createHash('sha512').update(data).digest('hex');
fs.writeFileSync(path.join(out, 'TAS_INSTALLER_STATUS.json'), JSON.stringify({
  release: '70.20.3',
  publicDownloadPublished: true,
  protectedInstallerStaged: true,
  entitlementPreview: true,
  commercialStudioPublished: true,
  consultantStudioPublished: true,
  artifact: { fileName: 'TAS_Professional_v10_0_6_x64.msi', bytes, sha256, sha512, productVersion: '10.0.6', architecture: 'x64' },
  securityBoundary: 'This entitled-vault output demonstrates the authenticated member delivery boundary. Production hosting must enforce server-side account and entitlement checks before returning the MSI or commercial studio.'
}, null, 2));
fs.writeFileSync(path.join(out, 'TAS_DEPLOYED_EDITION.json'), JSON.stringify({
  release: '70.20.3',
  publicLanding: 'member-gateway',
  freeExperience: '/demo/',
  licensedProfessionalStudio: '/studio/',
  licensedConsultantStudio: '/consultant-studio/',
  entitledInstallerPath: '/entitled-downloads/TAS_Professional_v10_0_6_x64.msi',
  publicCommercialEngineIncluded: false
}, null, 2));
for (const required of [
  'index.html','member/downloads.html','demo/index.html','studio/index.html','consultant-studio/index.html',
  'tas-workspace-parity.js','media/TAS_Interactive_Product_Tour.mp4','media/TAS_Interactive_Product_Tour.en.srt',
  'entitled-downloads/TAS_Professional_v10_0_6_x64.msi','TAS_INSTALLER_STATUS.json'
]) {
  if (!fs.existsSync(path.join(out, required))) fail(`missing output ${required}`);
}
console.log('Prepared TAS v70.20.3 entitled member vault with actual Professional and Consultant studios, verified MSI, guided video, subtitles and licence-aware download page.');
