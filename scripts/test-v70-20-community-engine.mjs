import {
  COMMUNITY_MAX_EVIDENCE_BYTES,
  assessCommunityEvidence,
  communitySample,
  sha256Evidence
} from '../src/community/communityEngine.ts';

const fail = message => { console.error(`TAS v70.20 Community engine gate failed: ${message}`); process.exit(1); };

const sample = assessCommunityEvidence(communitySample, 'Auto', 'Auto');
if (!sample.assessment || sample.errors.length) fail(`safe demonstration did not assess: ${sample.errors.join('; ')}`);
if (sample.assessment.role !== 'Server') fail(`safe demonstration role was ${sample.assessment.role}`);
if (sample.assessment.operatingSystem !== 'Windows Server 2022') fail(`safe demonstration OS was ${sample.assessment.operatingSystem}`);
if (sample.assessment.findings.length !== 11) fail(`non-DC demonstration should assess 11 controls, found ${sample.assessment.findings.length}`);
if (sample.assessment.gap < 1 || sample.assessment.partial < 1) fail('safe demonstration must prove real Gap and Partial handling');
if (sample.assessment.parseStats.recognisedSettings !== 11) fail('safe demonstration recognised-setting count drifted');

const dcWithGuids = `Asset: DC-LAB-01\nOperating System: Windows Server 2025\nRole: Domain Controller\nSystem\n  System Integrity {12345678-1234-1234-1234-123456789012} Success and Failure\nDS Access\n  Directory Service Changes {22345678-1234-1234-1234-123456789012} Success`;
const dc = assessCommunityEvidence(dcWithGuids, 'Auto', 'Auto');
if (!dc.assessment || dc.assessment.role !== 'DC') fail('Domain Controller auto-detection failed');
if (dc.assessment.operatingSystem !== 'Windows Server 2025') fail('Windows Server 2025 auto-detection failed');
const dsChange = dc.assessment.findings.find(item => item.id === 'COMM-012');
if (!dsChange || dsChange.status !== 'Aligned') fail('GUID-bearing Directory Service Changes row was not parsed');

const multiAsset = assessCommunityEvidence(`Asset: ONE\nSystem\n System Integrity  Success\nAsset: TWO\nSystem\n System Integrity  Success`, 'Server', 'Windows Server 2022');
if (!multiAsset.errors.some(error => /one asset/i.test(error))) fail('multi-asset Community limit was not enforced');

const invalid = assessCommunityEvidence('This is not auditpol evidence.', 'Auto', 'Auto');
if (!invalid.errors.some(error => /No recognisable/i.test(error))) fail('invalid evidence was not rejected');

const oversized = assessCommunityEvidence('x'.repeat(COMMUNITY_MAX_EVIDENCE_BYTES + 1), 'Auto', 'Auto');
if (!oversized.errors.some(error => /1 MB/i.test(error))) fail('1 MB evidence limit was not enforced');

const hash = await sha256Evidence('abc');
if (hash !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') fail(`SHA-256 receipt drifted: ${hash}`);

console.log('TAS v70.20 Community engine gate passed: parsing, one-asset limit, role/OS assistance, selected findings and SHA-256 receipt verified.');
