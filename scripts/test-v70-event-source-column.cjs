const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
const requiredApp = [
  'function eventCollectionSource',
  'function eventCollectionShort',
  "| provider Microsoft-Windows-Security-Auditing",
  'SortHeader label="Collect from" sortKey="CollectionSource"',
  'className="eventIdCell"',
  'className="eventCollectionCell"',
  '<b>Collect from / data source</b>',
  'eventCollectionSource(selected)',
  'eventCollectionShort(e)'
];
const requiredCss = [
  'v70.15 analyst Event ID rendering fix',
  '.eventTablePane .eventIdCell span',
  'font-size: 16px',
  '.eventCollectionCell',
  'min-width: 310px'
];
const missing = [];
for (const item of requiredApp) if (!app.includes(item)) missing.push(`App.tsx missing ${item}`);
for (const item of requiredCss) if (!css.includes(item)) missing.push(`styles.css missing ${item}`);
if (missing.length) {
  console.error(missing.join('\n'));
  process.exit(1);
}
console.log('TAS v70.15 Event ID source column and visible Event ID gate passed.');
