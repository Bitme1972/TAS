const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const edition = process.argv[2];
const allowed = ['community', 'professional', 'consultant'];
if (!allowed.includes(edition)) {
  console.error(`Usage: node scripts/write-edition-manifest.cjs <${allowed.join('|')}>`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync('config/edition-entitlements.json', 'utf8'));
const definition = config.editions[edition];
const output = path.join(process.cwd(), 'dist-editions', edition);
if (!fs.existsSync(path.join(output, 'index.html'))) {
  console.error(`Edition output is missing: ${output}`);
  process.exit(1);
}

const files = [];
function visit(folder) {
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, item.name);
    if (item.isDirectory()) visit(full);
    else {
      const relative = path.relative(output, full).replace(/\\/g, '/');
      if (relative === 'TAS_EDITION_MANIFEST.json' || relative === 'TAS_EDITION_MARKER.txt') continue;
      const bytes = fs.statSync(full).size;
      const sha256 = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
      files.push({ path: relative, bytes, sha256 });
    }
  }
}
visit(output);
files.sort((a, b) => a.path.localeCompare(b.path));

const manifest = {
  schemaVersion: config.schemaVersion,
  release: config.release,
  edition,
  generatedAtUtc: new Date().toISOString(),
  definition,
  buildFiles: files
};
fs.writeFileSync(path.join(output, 'TAS_EDITION_MANIFEST.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(output, 'TAS_EDITION_MARKER.txt'), [
  'Telemetry Assurance Studio',
  `Release: ${config.release}`,
  `Edition: ${definition.displayName}`,
  `Build boundary: ${edition}`,
  'Generated from the Sprint 1 commercial entitlement architecture.'
].join('\n') + '\n');
console.log(`Wrote ${definition.displayName} manifest with ${files.length} build files.`);
