const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const engine = fs.readFileSync('src/tasEngine.ts', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const required = [
  ['HTML edit icon button', engine.includes('✏️ Edit report text')],
  ['HTML print icon button', engine.includes('🖨️ Print / save PDF')],
  ['HTML horizontal slider', engine.includes('wideSlider') && engine.includes('Drag the horizontal slider')],
  ['HTML content editable target', engine.includes('reportContent') && engine.includes('contenteditable')],
  ['Word friendly assessment export', app.includes('wordReportFromAssessment') && app.includes('finding cards')],
  ['Output window resize/scrollbars', css.includes('resize: both') && css.includes('TAS v70.11 output friendliness')]
];
const failed = required.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('TAS v70.11 output friendliness gate failed:');
  for (const [name] of failed) console.error('- ' + name);
  process.exit(1);
}
console.log('TAS v70.11 output friendliness, HTML edit/print icon and slider gate passed.');
