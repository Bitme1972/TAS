const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const pkg = fs.readFileSync('package.json', 'utf8');
const directWrapper = fs.readFileSync('RUN_ME_DEPLOY_GIT_AND_CLOUDFLARE_DIRECT.ps1', 'utf8');
const centralDeploy = fs.readFileSync('RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1', 'utf8');
const local = fs.readFileSync('RUN_ME_LOCAL_CLOUDFLARE_READY.ps1', 'utf8');
const tabsMatch = app.match(/const tabs: Tab\[\] = \[(.*?)\];/s);
if (!tabsMatch) { console.error('Could not find tabs array.'); process.exit(1); }
const tabs = tabsMatch[1];
const required = [
  'Standalone Desktop',
  'Standalone commercial desktop capability',
  'TAS Desktop Commercial Standalone',
  'The browser web studio does not run auditpol.exe',
  'TAS_DESKTOP_COMMERCIAL_PLACEHOLDER.txt',
  'wrangler pages deploy',
  'git.exe clone',
  'tas',
  '-DirectCloudflare'
];
const all = app + '\n' + directWrapper + '\n' + centralDeploy + '\n' + local + '\n' + pkg;
const missing = required.filter(x => !all.includes(x));
if (missing.length) { console.error('v70.17 standalone/direct deploy gate failed. Missing:', missing); process.exit(1); }
if (tabs.includes('Local Audit')) { console.error('v70.17 gate failed. Local Audit is still in the visible web tabs.'); process.exit(1); }
if (!fs.existsSync('public/downloads/TAS_DESKTOP_COMMERCIAL_PLACEHOLDER.txt')) { console.error('Missing standalone desktop placeholder download file.'); process.exit(1); }
console.log('TAS v70.17 standalone desktop and direct Cloudflare deployment gate passed.');
