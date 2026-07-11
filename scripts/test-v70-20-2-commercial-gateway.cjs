const fs = require('fs');
const crypto = require('crypto');
const fail = m => { console.error(`TAS v70.20.2 commercial-gateway gate failed: ${m}`); process.exit(1); };
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
if (pkg.name !== 'tas-v70-20-2-commercial-gateway' || pkg.version !== '70.20.2') fail('package identity mismatch');
const foundation = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json','utf8'));
for (const item of foundation.protectedFiles) {
  if (!fs.existsSync(item.path)) fail(`protected file missing ${item.path}`);
  const sha = crypto.createHash('sha256').update(fs.readFileSync(item.path)).digest('hex');
  if (sha !== item.sha256) fail(`protected AURORA file changed ${item.path}`);
}
const hub = fs.readFileSync('public/member/index.html','utf8');
for (const text of ['Choose your TAS experience.','TAS Interactive Demo','TAS Professional','£349','£129/year','TAS Consultant','£899','Standalone download vault','MSI not attached']) if (!hub.includes(text)) fail(`gateway missing ${text}`);
const gate = fs.readFileSync('public/studio/index.html','utf8');
for (const text of ['Commercial access is licence controlled.','commercial engine is deliberately absent','secure signature verification still required']) if (!gate.includes(text)) fail(`licensed gate missing ${text}`);
for (const file of ['public/member-resources/TAS_MSI_PUBLISHING_GUIDE.md','public/member-resources/TAS_DEMO_SECURITY_BOUNDARY.md','public/member-resources/TAS_PRICE_AND_EDITION_POLICY.md','vite.demo.config.ts','src/demo/demoEngine.ts']) if (!fs.existsSync(file)) fail(`missing ${file}`);
const allFiles = [];
(function walk(dir){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=`${dir}/${e.name}`; if(e.isDirectory()) walk(p); else allFiles.push(p); }})('.');
if (allFiles.some(f => /\.(msi)$/i.test(f))) fail('an MSI is present but was not supplied and validated');
console.log(`TAS v70.20.2 commercial-gateway gate passed: ${foundation.protectedFiles.length} protected AURORA files unchanged; landing, pricing, licensed gate and honest MSI slot verified.`);
