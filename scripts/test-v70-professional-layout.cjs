const fs = require('fs');
const css = fs.readFileSync('src/styles.css', 'utf8');
const required = [
  'TAS v70.5 professional responsive shell refinements',
  '--tas-nav-width: clamp(174px, 13.5vw, 264px)',
  '.resultsPage {',
  'grid-template-rows: auto auto auto auto minmax(0, 1fr) minmax(0, 1fr)',
  '.resultsPage .mainResultGrid',
  '.resultsPage .detailsPane',
  'overflow: scroll',
  'scrollbar-width: auto',
  '--tas-button-bg',
  'box-shadow: var(--tas-button-shadow)'
];
const missing = required.filter(item => !css.includes(item));
if (missing.length) {
  console.error('TAS v70.5 professional layout gate failed. Missing:');
  for (const item of missing) console.error(' - ' + item);
  process.exit(1);
}
console.log('TAS v70.5 professional responsive layout gate passed.');
