const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredApp = [
  'v70.18 AURORA command-centre build',
  'Assurance command centre',
  'Telemetry risk radar',
  'Priority action queue',
  'Evidence confidence',
  'Evidence orchestration',
  'Drop evidence files anywhere on this ribbon',
  'CommandPalette',
  'workspaceStorageKey',
  'Autosaved',
  'Ctrl K'
];
const requiredCss = [
  'TAS v70.18 AURORA',
  '.commandDashboard',
  '.dashboardHero',
  '.postureOrb',
  '.riskBands',
  '.nextIntake',
  '.confidenceDial',
  '.commandPalette',
  '.navCompact'
];
const missing = [...requiredApp.filter(x => !app.includes(x)), ...requiredCss.filter(x => !css.includes(x))];
if (missing.length) {
  console.error('TAS v70.18 AURORA innovation gate failed. Missing:', missing);
  process.exit(1);
}
if (!['70.20.0','70.21.0'].includes(pkg.version)) throw new Error(`Expected supported package version, found ${pkg.version}`);
console.log('TAS v70.18 AURORA command-centre innovation gate passed unchanged inside v70.20 Community.');
