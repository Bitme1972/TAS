const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const engine = fs.readFileSync('src/tasEngine.ts', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const wrangler = fs.readFileSync('wrangler.toml', 'utf8');
const checks = [
  ['TAS v70 Cloudflare branding', app.includes('TAS v70 Cloudflare embedded')],
  ['multi-file main intake', app.includes('multiple ref={props.fileRef}') && app.includes("props.readFiles(e.currentTarget.files, 'input')")],
  ['multi-file before intake', app.includes("readFiles(e.currentTarget.files, 'before')")],
  ['multi-file after intake', app.includes("readFiles(e.currentTarget.files, 'after')")],
  ['static auditpol bundle wrapper', app.includes('buildStaticAuditpolBundle') && app.includes('Source file:')],
  ['matrix parser embedded', engine.includes('tryParseAuditpolMatrix') && engine.includes('parseDelimitedMatrix')],
  ['partial input scoring block', engine.includes('BLOCKING PARTIAL_AUDITPOL_INPUT') && engine.includes('scoringBlocked')],
  ['Cloudflare output dir', wrangler.includes('pages_build_output_dir = "dist"')],
  ['v70 package name', ['tas-v70-20-community','tas-v70-21-public-experience'].includes(pkg.name)]
];
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('TAS v70 Cloudflare gate failed:');
  for (const [name] of failed) console.error(' - ' + name);
  process.exit(1);
}
console.log('TAS v70 Cloudflare static auditpol gate passed.');
