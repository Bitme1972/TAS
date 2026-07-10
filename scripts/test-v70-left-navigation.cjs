
const fs = require('fs');
const css = fs.readFileSync('src/styles.css', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const requiredCss = [
  'grid-template-columns: 258px minmax(0, 1fr)',
  'flex-direction: column',
  'desktopTabs::before',
  'grid-column: 2',
  'overflow-y: auto',
  'border-left: 5px solid #ff7a00'
];
const requiredTabs = ['Dashboard','Evidence Intake','Assurance Results','Before / After','Baseline Library','Event IDs','Trust Centre','Standalone Desktop','Product Activation'];
const missingCss = requiredCss.filter(x => !css.includes(x));
const missingTabs = requiredTabs.filter(x => !app.includes(`'${x}'`) && !app.includes(`>${x}<`));
if (missingCss.length || missingTabs.length) {
  console.error('Left navigation validation failed.');
  if (missingCss.length) console.error('Missing CSS markers:', missingCss);
  if (missingTabs.length) console.error('Missing tabs:', missingTabs);
  process.exit(1);
}
console.log('TAS v70.4 left navigation layout gate passed.');
