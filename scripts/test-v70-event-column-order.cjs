const fs = require('fs');
const src = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const start = src.indexOf('<div className="eventTablePane">');
if (start < 0) throw new Error('eventTablePane not found.');
const section = src.slice(start, src.indexOf('</div>', start) + 6);
const labels = [...section.matchAll(/<SortHeader label="([^"]+)"/g)].map(m => m[1]);
const expected = ['Event ID', 'Name', 'Type', 'Category', 'Subcategory', 'Priority', 'Analyst lane', 'Outcome', 'Key fields', 'Related', 'Collect from'];
for (let i = 0; i < expected.length; i++) {
  if (labels[i] !== expected[i]) throw new Error(`Column ${i + 1} should be ${expected[i]} but found ${labels[i] || 'missing'}. Full order: ${labels.join(' | ')}`);
}
if (!src.includes('<td className="eventNameCell">{e.Name}</td><td><span className="eventTypePill">{e.Source}</span></td>')) throw new Error('Name column must come before Type in row rendering.');
if (!src.includes('<td className="eventCollectionCell">{eventCollectionShort(e)}</td></tr>')) throw new Error('Collect from / data source must be the last visible event table column.');
if (!css.includes('v70.16 analyst Event ID column order final pass')) throw new Error('v70.16 CSS marker missing.');
if (!css.includes('eventNameCell')) throw new Error('eventNameCell styling missing.');
console.log('TAS v70.16 Event ID final column order gate passed.');
