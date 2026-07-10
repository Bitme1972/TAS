const fs = require('fs');
const src = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const required = [
  'type EventSortKey',
  "const [sortKey, setSortKey]",
  "const [sortDirection, setSortDirection]",
  'function SortHeader',
  'SortHeader label="Type" sortKey="Source"',
  '<td><span className="eventTypePill">{e.Source}</span></td>',
  'Click any column header to sort',
  'eventSortValue',
  'localeCompare'
];
const missing = required.filter(token => !src.includes(token));
const cssRequired = ['.sortableHeader', '.eventTypePill', '.eventSortStatus'];
const missingCss = cssRequired.filter(token => !css.includes(token));
if (missing.length || missingCss.length) {
  console.error('TAS v70.14 sortable Event ID table gate failed.');
  console.error('Missing App tokens:', missing);
  console.error('Missing CSS tokens:', missingCss);
  process.exit(1);
}
console.log('TAS v70.14 sortable Event ID table and separate Type column gate passed.');
