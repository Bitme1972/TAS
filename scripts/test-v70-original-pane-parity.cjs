const fs = require('fs');

const app = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');

const requiredApp = [
  'resultsPaneStack',
  'findingsPane',
  'findingDetailsPane',
  'Assurance results grid',
  'Selected finding details pane',
  'HTML report preview',
  'click a row to populate the selected finding details pane',
  'HTML report preview'
];

const requiredCss = [
  '.resultsPage.originalResultLayout',
  '.originalResultLayout .resultsPaneStack',
  '.originalResultLayout .findingsPane',
  '.originalResultLayout .findingDetailsPane',
  '.originalResultLayout .mainResultGrid',
  '.originalResultLayout .rowSplitter',
  'grid-template-rows: minmax(0, 1fr) 8px minmax(0, 1fr)',
  'grid-template-columns: repeat(3, minmax(220px, 1fr))',
  'overflow: scroll',
  'position: sticky'
];

const missing = [];
for (const item of requiredApp) {
  if (!app.includes(item)) missing.push(`App missing ${item}`);
}
for (const item of requiredCss) {
  if (!css.includes(item)) missing.push(`CSS missing ${item}`);
}
if (missing.length) {
  console.error('TAS v70.7 original desktop pane parity gate failed:');
  for (const item of missing) console.error(` - ${item}`);
  process.exit(1);
}

console.log('TAS v70.7 original desktop 50/50 pane parity gate passed.');
