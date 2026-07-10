const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/styles.css', 'utf8');
const data = JSON.parse(fs.readFileSync('src/data/event_id_lookup.json', 'utf8'));
const requiredLabels = [
  'Analyst Event ID Intelligence',
  'Why analysts care',
  'Useful fields to check',
  'Triage questions',
  'Correlate with',
  'Open Ultimate Windows Security event reference',
  'Authentication and session activity',
  'Active Directory object and replication changes',
  'Audit tamper and collection health'
];
const requiredCss = ['eventIntelWorkspace','eventDetailPane','eventQuickNav','priorityPill'];
const requiredEvents = ['4624','4625','4672','4688','4697','4719','4728','4740','4768','4769','4771','4776','5136','5140','5145','5156','5157','6416'];
const missing = [];
for (const label of requiredLabels) if (!app.includes(label)) missing.push(`missing app label: ${label}`);
for (const label of requiredCss) if (!css.includes(label)) missing.push(`missing css class: ${label}`);
if (!data.Events || data.Events.length < 420) missing.push(`expected at least 420 event references, found ${data.Events && data.Events.length}`);
for (const id of requiredEvents) {
  const ev = data.Events.find(e => String(e.EventID) === id);
  if (!ev) missing.push(`missing event ${id}`);
  else for (const field of ['Category','Subcategory','AnalystLane','Priority','AnalystFocus','KeyFields','TriageQuestions','RelatedEvents','ReferenceUrl']) {
    if (!ev[field] || (Array.isArray(ev[field]) && ev[field].length === 0)) missing.push(`event ${id} missing ${field}`);
  }
}
if (!data.SourceNote || !data.SourceNote.includes('Ultimate Windows Security')) missing.push('SourceNote must reference Ultimate Windows Security');
if (missing.length) { console.error('TAS v70.13 event analyst intelligence gate failed:'); for (const m of missing) console.error(' - ' + m); process.exit(1); }
console.log('TAS v70.13 analyst Event ID intelligence gate passed.');
