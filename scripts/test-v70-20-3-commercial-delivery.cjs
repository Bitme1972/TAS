const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fail = m => { console.error(`TAS v70.20.3 commercial-delivery gate failed: ${m}`); process.exit(1); };
for (const file of [
  'release-assets/TAS_Professional_v10_0_6_x64.msi',
  'release-assets/TAS_Professional_v10_0_6_x64.msi.sha256',
  'release-assets/TAS_Professional_v10_0_6_x64.msi.sha512',
  'public/media/TAS_Interactive_Product_Tour.mp4',
  'public/media/TAS_Interactive_Product_Tour.en.srt',
  'public/media/TAS_Interactive_Product_Tour.en.vtt',
  'public/member/downloads.html',
  'demo-automation/record_tas_demo.py',
  'demo-automation/RECORD_TAS_DEMO.cmd',
  'scripts/serve-output.cjs',
  'RUN_ME_LOCAL_CLOUDFLARE_READY.cmd',
  'RUN_ME_LOCAL_ENTITLED_VAULT.cmd',
  'RUN_ME_LOCAL_ENTITLED_VAULT.ps1',
  'dist-entitled/entitled-downloads/TAS_Professional_v10_0_6_x64.msi',
  'dist-entitled/TAS_INSTALLER_STATUS.json'
]) if (!fs.existsSync(file)) fail(`missing ${file}`);
const source = fs.readFileSync('release-assets/TAS_Professional_v10_0_6_x64.msi');
const entitled = fs.readFileSync('dist-entitled/entitled-downloads/TAS_Professional_v10_0_6_x64.msi');
if (!source.equals(entitled)) fail('entitled MSI differs from verified staged MSI');
if (source.length !== 57430016) fail(`unexpected MSI size ${source.length}`);
const sha256 = crypto.createHash('sha256').update(source).digest('hex');
const sha512 = crypto.createHash('sha512').update(source).digest('hex');
if (sha256 !== 'f59a8682e78b94eff561b44db66fc61089c8f5156f82f5d0a7bf54099b5da249') fail('MSI SHA-256 mismatch');
if (sha512 !== 'a486967f8e3a5ba0787e3c87a1c613ba8db457b28f96df5c88eef7ee42bc6a950d554229b60b9a3cfd058106a4ac1c1668deb25083ec468a69757347829b8a3f') fail('MSI SHA-512 mismatch');
const gatewayHtml = fs.readFileSync('public/member/index.html','utf8');
if (/signed Windows MSI/i.test(gatewayHtml)) fail('gateway makes an unverified code-signing claim');
if (!/hash-verified Windows MSI/i.test(gatewayHtml)) fail('gateway does not describe the verified installer accurately');
const publicRunner = fs.readFileSync('RUN_ME_LOCAL_CLOUDFLARE_READY.ps1','utf8');
const entitledRunner = fs.readFileSync('RUN_ME_LOCAL_ENTITLED_VAULT.ps1','utf8');
if (!publicRunner.includes('dist\\media\\TAS_Interactive_Product_Tour.mp4') || !publicRunner.includes('dist-entitled\\studio\\index.html')) fail('public local runner does not verify both output boundaries');
if (!entitledRunner.includes('dist-entitled') || !entitledRunner.includes('TAS_Professional_v10_0_6_x64.msi')) fail('entitled local runner is incomplete');
const videoBytes = fs.statSync('public/media/TAS_Interactive_Product_Tour.mp4').size;
if (videoBytes < 500000) fail(`guided video is unexpectedly small (${videoBytes} bytes)`);
const subtitles = fs.readFileSync('public/media/TAS_Interactive_Product_Tour.en.srt','utf8');
if ((subtitles.match(/-->/g)||[]).length < 8) fail('guided subtitles do not cover the full journey');
const publicStatus = JSON.parse(fs.readFileSync('dist/TAS_INSTALLER_STATUS.json','utf8'));
const entitledStatus = JSON.parse(fs.readFileSync('dist-entitled/TAS_INSTALLER_STATUS.json','utf8'));
if (publicStatus.publicDownloadPublished !== false) fail('public status exposes installer');
if (entitledStatus.publicDownloadPublished !== true) fail('entitled vault does not publish installer');
if (entitledStatus.commercialStudioPublished !== true) fail('entitled vault does not publish the Professional studio');
if (entitledStatus.consultantStudioPublished !== true) fail('entitled vault does not publish the Consultant studio');
for (const file of [
  'dist-entitled/studio/index.html',
  'dist-entitled/studio/TAS_EDITION_MANIFEST.json',
  'dist-entitled/consultant-studio/index.html',
  'dist-entitled/consultant-studio/TAS_EDITION_MANIFEST.json',
  'dist-entitled/tas-workspace-parity.js'
]) if (!fs.existsSync(file)) fail(`missing entitled commercial artefact ${file}`);
const professionalManifest = JSON.parse(fs.readFileSync('dist-entitled/studio/TAS_EDITION_MANIFEST.json','utf8'));
const consultantManifest = JSON.parse(fs.readFileSync('dist-entitled/consultant-studio/TAS_EDITION_MANIFEST.json','utf8'));
if (professionalManifest.edition !== 'professional') fail('Professional studio manifest has the wrong edition');
if (consultantManifest.edition !== 'consultant') fail('Consultant studio manifest has the wrong edition');
const professionalAssets = fs.readdirSync('dist-entitled/studio/assets').reduce((total,name)=>total+fs.statSync(path.join('dist-entitled/studio/assets',name)).size,0);
const consultantAssets = fs.readdirSync('dist-entitled/consultant-studio/assets').reduce((total,name)=>total+fs.statSync(path.join('dist-entitled/consultant-studio/assets',name)).size,0);
if (professionalAssets < 1000000) fail(`Professional studio assets are unexpectedly small (${professionalAssets})`);
if (consultantAssets < 1000000) fail(`Consultant studio assets are unexpectedly small (${consultantAssets})`);
let publicMsi=false;
(function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.msi$/i.test(e.name)) publicMsi=true;}})('dist');
if (publicMsi) fail('public dist includes MSI');
console.log(`TAS v70.20.3 commercial-delivery gate passed: ${source.length} byte MSI verified, ${videoBytes} byte guided tour published, public and entitled boundaries separated.`);
