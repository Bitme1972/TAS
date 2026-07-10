const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
const requiredAppLabels = [
  'v70-10-redundancy-clean',
  '1 Load BEFORE auditpol',
  '2 Load AFTER auditpol',
  'Load demo pair',
  'Clear both',
  '4 Export comparison report'
];
const requiredCssMarkers = [
  'TAS v70.10: redundancy sanitisation',
  'redundancy-clean-action-strip',
  'comparison-results-visibility',
  '.beforeAfterPage.sanitisedBeforeAfter',
  'grid-template-rows: 58px minmax(132px, 22vh) 27px minmax(0, 1fr)'
];
const forbiddenDuplicateLabels = [
  '1 Load BEFORE auditpol file/s | YOUR file/s',
  '2 Load AFTER auditpol file/s | YOUR file/s',
  'Load customer BEFORE auditpol',
  'Load customer AFTER auditpol',
  'Load sample before',
  'Load sample after',
  'Clear before',
  'Clear after'
];
const missing = [];
for (const label of requiredAppLabels) if (!app.includes(label)) missing.push(`missing app label: ${label}`);
for (const marker of requiredCssMarkers) if (!css.includes(marker)) missing.push(`missing css marker: ${marker}`);
for (const label of forbiddenDuplicateLabels) if (app.includes(label)) missing.push(`duplicate/redundant label still present: ${label}`);
const beforeChooseCount = (app.match(/1 Load BEFORE auditpol/g) || []).length;
const afterChooseCount = (app.match(/2 Load AFTER auditpol/g) || []).length;
if (beforeChooseCount !== 1) missing.push(`expected exactly one BEFORE load control, found ${beforeChooseCount}`);
if (afterChooseCount !== 1) missing.push(`expected exactly one AFTER load control, found ${afterChooseCount}`);
if (missing.length) {
  console.error('TAS v70.10 redundancy sanitisation gate failed:');
  for (const item of missing) console.error(' - ' + item);
  process.exit(1);
}
console.log('TAS v70.10 redundancy sanitisation and comparison visibility gate passed.');
