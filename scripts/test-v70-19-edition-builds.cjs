const fs = require('fs');
const path = require('path');
const fail = message => { console.error(`TAS v70.20 edition-build gate failed: ${message}`); process.exit(1); };
const config = JSON.parse(fs.readFileSync('config/edition-entitlements.json', 'utf8'));

function allText(folder) {
  let combined = '';
  for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, item.name);
    if (item.isDirectory()) combined += allText(full);
    else if (/\.(?:html|js|css|json|txt)$/i.test(item.name)) combined += fs.readFileSync(full, 'utf8');
  }
  return combined;
}

for (const id of ['community', 'professional', 'consultant']) {
  const folder = path.join('dist-editions', id);
  for (const required of ['index.html', 'TAS_EDITION_MANIFEST.json', 'TAS_EDITION_MARKER.txt']) {
    if (!fs.existsSync(path.join(folder, required))) fail(`${id} build is missing ${required}`);
  }
  const html = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');
  const assetReferences = [...html.matchAll(/(?:src|href)="([^"]+\/assets\/[^"]+)"/g)].map(match => match[1]);
  if (!assetReferences.length) fail(`${id} HTML has no compiled asset references`);
  for (const reference of assetReferences) {
    if (reference.startsWith('/')) fail(`${id} HTML uses a root-absolute asset path: ${reference}`);
    if (!fs.existsSync(path.resolve(folder, reference))) fail(`${id} HTML references a missing local asset: ${reference}`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'TAS_EDITION_MANIFEST.json'), 'utf8'));
  if (manifest.release !== config.release || manifest.edition !== id) fail(`${id} manifest identity mismatch`);
  if (manifest.definition.displayName !== config.editions[id].displayName) fail(`${id} manifest definition drift`);
  if (!Array.isArray(manifest.buildFiles) || manifest.buildFiles.length < 2) fail(`${id} manifest lacks build evidence`);
}

const communityText = allText(path.join('dist-editions', 'community'));
for (const forbidden of [
  'Windows Event Forwarding or Agent Collection Health', 'Audit events have been dropped by the transport',
  'EGoP_10_DCs_multi_auditpol', 'commercial-parity-demo-web', 'Golden DC audit baseline comparison',
  'Eight DCs against one golden audit baseline matrix'
]) if (communityText.includes(forbidden)) fail(`Community bundle contains premium sentinel: ${forbidden}`);
for (const required of ['COMM-001', 'COMM-012', 'Not licensed for commercial client reporting', 'Community does not calculate or invent hidden Professional findings']) {
  if (!communityText.includes(required)) fail(`Community bundle is missing required marker: ${required}`);
}

const communityBytes = fs.readdirSync('dist-editions/community/assets').reduce((total, file) => total + fs.statSync(path.join('dist-editions/community/assets', file)).size, 0);
const professionalBytes = fs.readdirSync('dist-editions/professional/assets').reduce((total, file) => total + fs.statSync(path.join('dist-editions/professional/assets', file)).size, 0);
if (communityBytes >= professionalBytes * 0.4) fail(`Community assets are unexpectedly large (${communityBytes} vs Professional ${professionalBytes})`);
console.log(`TAS v70.20 independent edition-build gate passed. Community assets ${communityBytes} bytes; Professional assets ${professionalBytes} bytes.`);
