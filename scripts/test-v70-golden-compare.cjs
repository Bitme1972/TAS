const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const required = [
  'Golden DC audit baseline comparison',
  'Eight DCs against one golden audit baseline matrix',
  'Load up to 8 DC auditpol file/s',
  'compare every DC against the same single golden audit baseline',
  'buildGoldenMatrixRows',
  'limitAssessmentAssets(rawGoldenAssessment, 8)',
  'goldenComparisonCsv',
  'goldenComparisonHtml',
  'Export Golden comparison CSV',
  'Export Golden comparison HTML'
];
const missing = required.filter(x => !app.includes(x));
if (missing.length) {
  console.error('TAS v70.3 Golden comparison gate failed. Missing:');
  missing.forEach(x => console.error(' - ' + x));
  process.exit(1);
}
console.log('TAS v70.3 Golden DC baseline comparison gate passed.');
