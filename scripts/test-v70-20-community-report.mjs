import { assessCommunityEvidence, communitySample } from '../src/community/communityEngine.ts';
import { createCommunityHtmlReport } from '../src/community/communityReport.ts';

const fail = message => { console.error(`TAS v70.20 Community report gate failed: ${message}`); process.exit(1); };
const result = assessCommunityEvidence(communitySample, 'Auto', 'Auto');
if (!result.assessment) fail('safe demonstration could not produce a report assessment');
const rawSentinel = 'RAW-EVIDENCE-MUST-NOT-APPEAR';
const html = createCommunityHtmlReport(result.assessment, {
  sourceName: 'demo<unsafe>.txt',
  sourceBytes: 1234,
  sourceLastModified: '11/07/2026, 13:00:00',
  sha256: 'a'.repeat(64),
  generatedAt: '2026-07-11T13:00:00.000Z'
});
for (const required of [
  'TAS COMMUNITY · NON-COMMERCIAL',
  'Selected Windows Audit Assurance Report',
  'Evidence receipt',
  'Browser-local assessment',
  'Raw evidence excluded',
  'COMM-001',
  '4624',
  'Watermarked output'
]) if (!html.includes(required)) fail(`report is missing ${required}`);
if (html.includes(rawSentinel)) fail('report embedded raw evidence');
if (html.includes('demo<unsafe>.txt')) fail('report did not escape evidence metadata');
if (!html.includes('demo&lt;unsafe&gt;.txt')) fail('escaped evidence source was not retained');
if ((html.match(/<tr>/g) || []).length < result.assessment.findings.length) fail('report omitted selected finding rows');
console.log('TAS v70.20 Community report gate passed: self-contained watermarked HTML, receipt and raw-evidence exclusion verified.');
