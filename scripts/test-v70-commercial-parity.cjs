const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const engine = fs.readFileSync('src/tasEngine.ts', 'utf8');
const required = [
  'Dashboard KPIs',
  'Manual auditpol paste input',
  'Static auditpol txt file import',
  'Multi asset auditpol bundle import',
  'Matrix tabular auditpol import',
  'Parser diagnostics and unsafe evidence blocking',
  'Parsed asset review grid',
  'Role and OS selection',
  'Basic audit assessment generation',
  'Advanced Plus assessment generation',
  'Live local audit collector handoff',
  'Local machine context guidance',
  'Evidence provenance receipt hash metadata',
  'Assurance results grid',
  'Selected finding details pane',
  'Event ID names and context lookup',
  'Event detection value model',
  'ATT&CK mapping integrity model',
  'Microsoft DC overlay',
  'CSV action register export',
  'PDF table report export',
  'Word report export',
  'Detailed evidence HTML report pack',
  'Golden baseline report pack',
  'Golden DC matrix',
  'Golden remediation plan and governance rationale',
  'Before After auditpol comparison workflow',
  'Product activation and vendor licence workflow'
];
const missingBlocks = required.filter(x => !app.includes(x));
if (missingBlocks.length) {
  console.error('Commercial parity 28-block gate failed. Missing blocks:');
  missingBlocks.forEach(x => console.error(' - ' + x));
  process.exit(1);
}
const requiredImplementation = [
  ['multi-file intake', 'multiple ref={props.fileRef}'],
  ['before batch intake', "readFiles(e.currentTarget.files, 'before')"],
  ['after batch intake', "readFiles(e.currentTarget.files, 'after')"],
  ['matrix parser', 'tryParseAuditpolMatrix'],
  ['unsafe scoring block', 'BLOCKING PARTIAL_AUDITPOL_INPUT'],
  ['golden matrix export', 'goldenMatrixCsv'],
  ['golden remediation export', 'goldenRemediationHtml'],
  ['comparison engine', 'compare(beforeInput, afterInput'],
  ['activation request', 'activationRequest'],
  ['event lookup', 'eventLookup']
];
const failed = requiredImplementation.filter(([name, needle]) => !(app.includes(needle) || engine.includes(needle)));
if (failed.length) {
  console.error('Commercial parity implementation gate failed:');
  failed.forEach(([name]) => console.error(' - ' + name));
  process.exit(1);
}
console.log('TAS v70 commercial parity 28-block gate passed.');
