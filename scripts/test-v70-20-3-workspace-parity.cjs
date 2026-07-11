const fs = require('fs');
const crypto = require('crypto');
const fail = m => { console.error(`TAS v70.20.3 workspace-parity gate failed: ${m}`); process.exit(1); };
const source = fs.readFileSync('public/tas-workspace-parity.js','utf8');
for (const marker of ['wireRawRows','wireGoldenRows','clickRawFinding','activateDetailsPane','wireSplitter','premiumGoldenMatrixScroll','desktopTopGrid','Selected finding details pane','aria-valuenow']) {
  if (!source.includes(marker)) fail(`missing parity marker ${marker}`);
}
// The protected AURORA wrapper must remain byte-identical. The additive parity
// loader belongs only to the independently built Demo/Professional/Consultant editions.
if (fs.readFileSync('index.html','utf8').includes('/tas-workspace-parity.js')) fail('protected root index must not load the additive parity extension');
for (const page of ['editions/demo/index.html','editions/professional/index.html','editions/consultant/index.html']) {
  const html = fs.readFileSync(page,'utf8');
  if (!html.includes('/tas-workspace-parity.js')) fail(`${page} does not load workspace parity extension`);
}
for (const page of ['dist-editions/demo/index.html','dist-editions/professional/index.html','dist-editions/consultant/index.html']) {
  if (!fs.existsSync(page)) fail(`missing built edition page ${page}`);
  if (!fs.readFileSync(page,'utf8').includes('/tas-workspace-parity.js')) fail(`${page} lost the workspace parity loader`);
}
const foundation = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json','utf8'));
for (const item of foundation.protectedFiles) {
  const sha = crypto.createHash('sha256').update(fs.readFileSync(item.path)).digest('hex');
  if (sha !== item.sha256) fail(`protected file changed ${item.path}`);
}
console.log('TAS v70.20.3 workspace-parity gate passed: additive edition loaders provide row-to-detail selection, Golden-cell mapping, independent scrolling and resizable panes while protected AURORA files remain unchanged.');
