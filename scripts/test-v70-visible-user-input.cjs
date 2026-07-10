const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const required = [
  'USER INPUT CENTRE | Customer auditpol evidence',
  'Select auditpol txt file/s',
  'PASTE CUSTOMER AUDITPOL OUTPUT HERE',
  '1 Load BEFORE auditpol',
  '2 Load AFTER auditpol',
  'visibleFilePicker',
  "type=\"file\" accept=\".txt,.log,.auditpol,.csv,.tsv\"",
  "props.readFiles(e.currentTarget.files, 'input')",
  "props.readFiles(e.currentTarget.files, 'before')",
  "props.readFiles(e.currentTarget.files, 'after')"
];
const missing = required.filter(x => !app.includes(x) && !css.includes(x));
if (missing.length) {
  console.error('TAS v70.2 visible user input gate failed:');
  missing.forEach(x => console.error(' - ' + x));
  process.exit(1);
}
if (app.includes('<input hidden multiple ref={props.fileRef}')) {
  console.error('TAS v70.2 visible user input gate failed: main customer file input is hidden.');
  process.exit(1);
}
console.log('TAS v70.2 visible customer user input gate passed.');
