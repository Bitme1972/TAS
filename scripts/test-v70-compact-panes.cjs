const fs = require('fs');
const css = fs.readFileSync('src/styles.css', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const requiredCss = [
  'TAS v70.6 compact workspace layout',
  'grid-template-rows: auto 26px 30px minmax(0, 1fr) minmax(0, 1fr)',
  'compact-result-toolbar',
  'true-half-grid-pane',
  'true-half-detail-pane',
  'sticky-first-column',
  'visible-scrollbars',
  'height: var(--tas-header-height)'
];
const requiredApp = [
  'className="resultsToolbar"',
  'className="mainResultGrid"',
  'FindingDetails finding={props.selected}',
  'Export detailed evidence report',
  'Export Golden baseline pack'
];
const missing = [];
for (const item of requiredCss) if (!css.includes(item)) missing.push(`CSS missing: ${item}`);
for (const item of requiredApp) if (!app.includes(item)) missing.push(`App missing: ${item}`);
if (missing.length) {
  console.error(missing.join('\n'));
  process.exit(1);
}
console.log('TAS v70.6 compact panes and visible results layout gate passed.');
