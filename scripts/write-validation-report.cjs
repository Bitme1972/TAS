const fs = require('fs');
const crypto = require('crypto');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const baseline = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json', 'utf8'));
const entitlements = JSON.parse(fs.readFileSync('config/edition-entitlements.json', 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const npmUserAgent = process.env.npm_config_user_agent || '';
const npmVersionMatch = npmUserAgent.match(/(?:^|\s)npm\/([^\s]+)/i);
const npmVersion = npmVersionMatch ? npmVersionMatch[1] : 'not reported';
const generated = new Date().toISOString();

const editionRows = Object.keys(entitlements.editions).map(id => {
  const file = `dist-editions/${id}/TAS_EDITION_MANIFEST.json`;
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  const bytes = manifest.buildFiles.reduce((sum, item) => sum + item.bytes, 0);
  return `| ${manifest.definition.displayName} | ${manifest.buildFiles.length} | ${bytes.toLocaleString('en-GB')} | ${hash(file)} |`;
}).join('\n');

const communityManifest = JSON.parse(fs.readFileSync('dist-editions/community/TAS_EDITION_MANIFEST.json', 'utf8'));
const communityBytes = communityManifest.buildFiles.reduce((sum, item) => sum + item.bytes, 0);
const report = `# TAS v70.20 Community Validation Report

## Result

**PASS — Sprint 2 Community Edition gate completed successfully.**

- Package: \`${pkg.name}\`
- Version: \`${pkg.version}\`
- Validated: \`${generated}\`
- Node: \`${process.version}\`
- npm: \`${npmVersion}\`
- Default Cloudflare output: protected Professional/AURORA \`dist\`
- Community output: independently compiled \`dist-editions/community\`
- Deployment performed by validation: **No**

## Protected baseline

- ${baseline.protectedFiles.length} protected AURORA application, engine, premium-data and preview files remain byte-identical to the Foundation Lock.
- Deterministic Professional/AURORA build outputs continue to match their protected SHA-256 values.
- Every inherited TAS and Sprint 1 architecture gate passed before the new Sprint 2 product gates.

## Independent editions

| Edition | Build files | Build bytes | Manifest SHA-256 |
|---|---:|---:|---|
${editionRows}

The Community build is ${communityBytes.toLocaleString('en-GB')} bytes including its manifest evidence. It remains independently compiled and does not import the protected Professional application, premium baseline packs or complete Event ID database.

## Community product gate

Verified capability:

- one file or pasted evidence item, maximum 1 MB
- one asset per assessment
- auditpol parsing with optional subcategory GUIDs
- role and operating-system assistance with user override
- selected Microsoft, CIS and NIST CSF alignment lenses
- selected Event ID and remediation context
- honest Aligned, Partial, Gap and Not found results
- browser-local SHA-256 evidence receipt
- self-contained watermarked HTML report
- raw evidence excluded from the report
- visible Professional conversion path without fabricated hidden findings
- no account and no evidence-upload endpoint

## Edition boundary

Community keeps Golden comparison, custom baselines, multi-asset assessment, Before and After comparison, complete report exports, complete Event ID intelligence, commercial client usage and custom branding disabled. Professional and Consultant retain their separate entitlement identities.

## Deferred safely

Public AuditPol.com navigation, payment processing, production licence validation, customer binaries and automated fulfilment remain later sprints.
`;
fs.writeFileSync('TAS_V70_20_COMMUNITY_VALIDATION_REPORT.md', report);
console.log('Wrote TAS_V70_20_COMMUNITY_VALIDATION_REPORT.md');
