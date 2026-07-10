const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(process.cwd(), 'src', 'styles.css'), 'utf8');
const required = [
  'v70-8-desktop-viewport',
  'no-outer-page-scroll',
  'compact-command-strip',
  'immediate-visible-result-rows',
  'true-equal-panes',
  'grid-template-rows: 58px 24px 28px minmax(0, 1fr)',
  'grid-template-rows: minmax(0, 1fr) 7px minmax(0, 1fr)',
  'overflow: hidden !important',
  'overflow: scroll !important'
];
const missing = required.filter(x => !css.includes(x));
if (missing.length) {
  console.error('TAS v70.8 desktop viewport gate failed. Missing:', missing.join(', '));
  process.exit(1);
}
console.log('TAS v70.8 desktop viewport and visible rows gate passed.');
