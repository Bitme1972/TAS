const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const requiredApp = [
  'Premium Golden comparison matrix',
  'Load Golden auditpol',
  'Export premium Golden HTML',
  'Export premium Golden CSV',
  'Golden audit setting',
  'Role expected',
  'buildPremiumGoldenCompare',
  'premiumGoldenHtml',
  'server/DC auditpol output(s) left-to-right against one Golden audit baseline'
];
const requiredCss = [
  'v70-12-premium-golden-assurance',
  'premiumGoldenMatrixScroll',
  'premiumGoldenTable',
  'goldenHorizontalHint',
  'stickyControl',
  'stickyArea'
];
const missing = [...requiredApp.filter(x => !app.includes(x)), ...requiredCss.filter(x => !css.includes(x))];
if (missing.length) {
  console.error('TAS v70.12 Premium Golden Assurance gate failed. Missing:', missing.join(', '));
  process.exit(1);
}
console.log('TAS v70.12 Premium Golden Assurance matrix gate passed.');
