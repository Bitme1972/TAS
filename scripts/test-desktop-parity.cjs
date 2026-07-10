const fs = require('fs');
const src = fs.readFileSync('src/App.tsx', 'utf8');
const required = [
  'Dashboard','Evidence Intake','Assurance Results','Before / After','Baseline Library','Standalone Desktop','Product Activation',
  'Load auditpol file','Parse pasted evidence','Clear','Generate Basic from manual','Generate Advanced Plus from manual','Basic + export pack','Advanced + export pack','Open output folder',
  'Run live local Basic audit','Run live local Advanced Plus audit','Generate Basic Assurance','Generate Advanced Plus','Export CSV action register','Export PDF table report','Export Word report','Export detailed evidence report','Export Golden baseline pack',
  '1 Load BEFORE auditpol','2 Load AFTER auditpol','3 Run comparison','4 Export comparison report','Activate product','Refresh','Create activation request','Copy machine fingerprint','Open licence folder','Create UAT licence template','Browse','Create signed customer licence'
];
const missing = required.filter(x => !src.includes(x));
if (missing.length) {
  console.error('Desktop parity label gate failed. Missing labels:');
  for (const x of missing) console.error(' - ' + x);
  process.exit(1);
}
const forbidden = ['Assess, compare and export from the website.','Integrated from the attached TAS package'];
const present = forbidden.filter(x => src.includes(x));
if (present.length) {
  console.error('Desktop parity label gate failed. Forbidden marketing hero text still present:');
  for (const x of present) console.error(' - ' + x);
  process.exit(1);
}
console.log('Desktop parity label gate passed.');
