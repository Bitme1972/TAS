const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const fail = m => { console.error(`TAS v70.20.3 commercial-gateway gate failed: ${m}`); process.exit(1); };
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
if (pkg.name !== 'tas-v70-20-3-commercial-delivery-studio' || pkg.version !== '70.20.3') fail('package identity mismatch');
const foundation = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json','utf8'));
for (const item of foundation.protectedFiles) {
  if (!fs.existsSync(item.path)) fail(`protected file missing ${item.path}`);
  const sha = crypto.createHash('sha256').update(fs.readFileSync(item.path)).digest('hex');
  if (sha !== item.sha256) fail(`protected AURORA file changed ${item.path}`);
}
const hub = fs.readFileSync('public/member/index.html','utf8');
for (const text of ['Choose your TAS experience.','TAS Interactive Demo','TAS Professional','£349','£129/year','TAS Consultant','£899','Standalone download vault','INSTALLER VERIFIED','Watch TAS from gateway to report pack']) if (!hub.includes(text)) fail(`gateway missing ${text}`);
const gate = fs.readFileSync('public/studio/index.html','utf8');
for (const text of ['Commercial access is licence controlled.','commercial engine is deliberately absent','secure signature verification still required','TAS v10.0.6 x64 MSI']) if (!gate.includes(text)) fail(`licensed gate missing ${text}`);
for (const file of ['public/member/downloads.html','public/member-resources/TAS_V70_20_3_CAPABILITY_PARITY_MAP.md','public/member-resources/TAS_V10_0_6_CUSTOMER_INSTALL_AND_ACTIVATE.md','public/tas-workspace-parity.js','vite.demo.config.ts','src/demo/demoEngine.ts']) if (!fs.existsSync(file)) fail(`missing ${file}`);
const msi = 'release-assets/TAS_Professional_v10_0_6_x64.msi';
if (!fs.existsSync(msi)) fail('verified customer MSI not staged');
const data = fs.readFileSync(msi);
if (data.length !== 57430016) fail(`unexpected MSI size ${data.length}`);
if (crypto.createHash('sha256').update(data).digest('hex') !== 'f59a8682e78b94eff561b44db66fc61089c8f5156f82f5d0a7bf54099b5da249') fail('MSI SHA-256 mismatch');
if (crypto.createHash('sha512').update(data).digest('hex') !== 'a486967f8e3a5ba0787e3c87a1c613ba8db457b28f96df5c88eef7ee42bc6a950d554229b60b9a3cfd058106a4ac1c1668deb25083ec468a69757347829b8a3f') fail('MSI SHA-512 mismatch');
if (fs.existsSync(path.join('public','entitled-downloads'))) fail('MSI exposed beneath public source');
console.log(`TAS v70.20.3 commercial-gateway gate passed: ${foundation.protectedFiles.length} protected AURORA files unchanged; verified MSI, video vault and licence boundary present.`);
