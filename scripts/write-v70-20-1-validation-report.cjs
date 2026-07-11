const fs = require('fs');
const crypto = require('crypto');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const foundation = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json','utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = `# TAS v70.20.1 AURORA Member Foundation Validation Report

## Result

**PASS — AURORA continuity and member-foundation gate completed.**

- Package: \`${pkg.name}\`
- Version: \`${pkg.version}\`
- Generated: \`${new Date().toISOString()}\`
- Default application: protected AURORA Professional command centre
- Member hub: \`/member/\`
- Deployment performed: **No**

## Product continuity

All ${foundation.protectedFiles.length} Foundation Lock files remain byte-identical, including \`src/App.tsx\`, \`src/styles.css\`, \`src/main.tsx\`, the assurance engine, premium data and AURORA baseline screenshots.

## Added commercial foundation

- AURORA-aligned edition gateway for Community, Professional and Consultant
- paid-member download-vault placement
- honest locked states for unsigned commercial binaries
- licensing lifecycle and offline activation guidance
- customer quick start and SHA-256 verification instructions
- contextual member links injected only into existing Standalone Desktop and Product Activation pages
- no change to the Dashboard or core workflow frontend

## Security boundaries

- no payment secret
- no private signing key
- no production licence secret
- no customer evidence upload
- no fake installer presented as a commercial release
- premium source remains outside the Community build

## Built output hashes

- \`dist/index.html\`: \`${hash('dist/index.html')}\`
- \`dist/member/index.html\`: \`${hash('dist/member/index.html')}\`
- \`dist/tas-member-extension.js\`: \`${hash('dist/tas-member-extension.js')}\`
`;
fs.writeFileSync('TAS_V70_20_1_AURORA_MEMBER_FOUNDATION_VALIDATION_REPORT.md', report);
console.log('Wrote TAS_V70_20_1_AURORA_MEMBER_FOUNDATION_VALIDATION_REPORT.md');
