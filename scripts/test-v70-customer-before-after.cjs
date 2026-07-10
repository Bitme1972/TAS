const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const required = [
  '1 Load BEFORE auditpol',
  '2 Load AFTER auditpol',
  '3 Run comparison',
  '4 Export comparison report',
  'Load demo pair',
  'Clear both',
  'Paste CUSTOMER BEFORE auditpol output here',
  'Paste CUSTOMER AFTER auditpol output here',
  "props.readFiles(e.currentTarget.files, 'before')",
  "props.readFiles(e.currentTarget.files, 'after')",
  'v70-9-customer-before-after-load',
  'customer-before-file',
  'customer-after-file',
  'before-after-own-auditpol',
  'customerCompareInputs',
  'comparisonGrid'
];
const missing = required.filter(x => !app.includes(x) && !css.includes(x));
if (missing.length) {
  console.error('TAS v70.9 customer before/after file loading gate failed. Missing:');
  missing.forEach(x => console.error(' - ' + x));
  process.exit(1);
}
console.log('TAS v70.9 customer Before / After auditpol loading gate passed.');
