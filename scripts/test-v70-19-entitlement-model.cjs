const fs = require('fs');
const fail = message => { console.error(`TAS v70.20 entitlement gate failed: ${message}`); process.exit(1); };
const config = JSON.parse(fs.readFileSync('config/edition-entitlements.json', 'utf8'));
if (config.schemaVersion !== 1) fail('unexpected entitlement schema version');
if (config.release !== '70.20.1') fail(`unexpected entitlement release ${config.release}`);
const editions = config.editions || {};
for (const id of ['community', 'professional', 'consultant']) {
  if (!editions[id] || editions[id].id !== id) fail(`missing or mismatched edition ${id}`);
}
const { community, professional, consultant } = editions;
for (const key of ['goldenComparison', 'customGoldenBaseline', 'beforeAfterComparison', 'fullReportExports', 'eventIntelligence', 'commercialClientUse', 'customBranding']) {
  if (community.capabilities[key]) fail(`Community must not enable ${key}`);
}
for (const key of ['singleEvidenceIntake', 'basicAssurance', 'watermarkedHtmlReport', 'evidenceReceipt', 'limitedEventIntelligence', 'professionalUpgradePreview']) {
  if (!community.capabilities[key]) fail(`Community must enable ${key}`);
}
for (const key of ['goldenComparison', 'customGoldenBaseline', 'beforeAfterComparison', 'fullReportExports', 'eventIntelligence', 'evidenceReceipt']) {
  if (!professional.capabilities[key]) fail(`Professional must enable ${key}`);
}
if (professional.capabilities.commercialClientUse || professional.capabilities.customBranding) fail('Professional must not inherit Consultant commercial rights');
for (const key of ['commercialClientUse', 'customBranding', 'priorityUpdates', 'evidenceReceipt']) {
  if (!consultant.capabilities[key]) fail(`Consultant must enable ${key}`);
}
if (community.limits.maxEvidenceFilesPerAssessment !== 1 || community.limits.maxAssetsPerAssessment !== 1) fail('Community single-file/single-asset limits changed');
if (!community.limits.reportWatermark) fail('Community watermark must remain enabled');
if (professional.limits.reportWatermark || consultant.limits.reportWatermark) fail('Paid editions must not be watermarked');
console.log('TAS v70.20 central entitlement model gate passed for Community, Professional and Consultant.');
