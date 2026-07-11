const fs = require('fs');
const path = require('path');

const roots = ['src', 'scripts', '.github', 'public', 'functions'];
const files = ['index.html', 'package.json', 'package-lock.json', 'wrangler.toml',
  'RUN_ME_DEPLOY_TO_GIT_AND_CLOUDFLARE.ps1', 'RUN_ME_DEPLOY_GIT_AND_CLOUDFLARE_DIRECT.ps1',
  'RUN_ME_DEPLOY_GIT_ONLY.ps1', 'START_HERE_DAN_V70_18_1.txt',
  'FIRST_TIME_GIT_AND_CLOUDFLARE_SETUP.txt', 'DEPLOYMENT_GUIDE_GITHUB_CLOUDFLARE.txt',
  'RUN_THIS_NOW_DEPLOY_TAS.cmd', 'TAS_V70_18_1_FOUNDATION_LOCK_VALIDATION_REPORT.md'];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (/\.(png|jpg|jpeg|gif|webp|zip)$/i.test(entry.name)) return [];
    return [full];
  });
}

const targets = [...files.filter(fs.existsSync), ...roots.flatMap(walk)];
const otherBrand = ['XI', 'TUX'].join('');
const oldRepo = ['xi', 'tux-tas-cloud-preview'].join('');
const oldRoot = ['C:\\', otherBrand].join('');
const forbidden = [
  { label: 'other-product brand', values: [otherBrand, otherBrand.toLowerCase()] },
  { label: 'old mixed repository', values: [oldRepo] },
  { label: 'old mixed local root', values: [oldRoot] }
];
const hits = [];
for (const file of targets) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.values.some((value) => text.includes(value))) hits.push(`${rule.label} in ${file}`);
  }
}
if (hits.length) {
  console.error('TAS project-separation gate failed:', hits);
  process.exit(1);
}
console.log('TAS project-separation gate passed: no other-product paths, repositories or branding remain.');
