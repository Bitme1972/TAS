const fs = require('fs');
const path = require('path');
const dist = path.join(process.cwd(), 'dist');
if (!fs.existsSync(dist)) { console.error('dist folder does not exist.'); process.exit(1); }
fs.writeFileSync(path.join(dist, '_redirects'), '/* /index.html 200\n');
const entitlements = JSON.parse(fs.readFileSync('config/edition-entitlements.json', 'utf8'));
fs.writeFileSync(path.join(dist, 'TAS_DEPLOYED_EDITION.json'), JSON.stringify({
  release: '70.21.0', edition: 'public-experience',
  publicRoutes: ['/', '/community', '/studio', '/professional', '/consultant', '/assessments', '/pricing', '/trust', '/downloads', '/knowledge', '/support-development', '/legal'],
  community: entitlements.editions.community,
  note: 'AuditPol.com public shell. /studio runs the isolated Community application. Professional and Consultant remain separate protected builds.'
}, null, 2));
for (const file of fs.readdirSync(process.cwd())) {
  if (/^(DEPLOYMENT_MARKER|TAS_V70|BUILD_TEST_EVIDENCE|SPRINT_[0-3]|RELEASE_MANIFEST|START_HERE_DAN)/.test(file) && fs.statSync(file).isFile()) fs.copyFileSync(file,path.join(dist,file));
}
for (const file of ['FOUNDATION_BASELINE_MANIFEST.json','EXPECTED_AURORA_ASSET_HASHES.txt','FOUNDATION_LOCK_HOTFIX_1.txt','FOUNDATION_LOCK_HOTFIX_2.txt','DEPLOYMENT_RUNNER_HOTFIX_2.txt']) if(fs.existsSync(file)) fs.copyFileSync(file,path.join(dist,file));
console.log('Prepared Cloudflare dist for TAS v70.21 Public Experience with SPA routing and Community Studio.');
