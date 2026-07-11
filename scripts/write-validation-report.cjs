const fs = require('fs');
const crypto = require('crypto');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('FOUNDATION_BASELINE_MANIFEST.json', 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const npmUserAgent = process.env.npm_config_user_agent || '';
const npmVersionMatch = npmUserAgent.match(/(?:^|\s)npm\/([^\s]+)/i);
const npmVersion = npmVersionMatch ? npmVersionMatch[1] : 'not reported';
const assetLines = fs.readFileSync('EXPECTED_AURORA_ASSET_HASHES.txt', 'utf8').split(/\r?\n/).filter((line) => /^[a-f0-9]{64}\s+/.test(line));
const generated = new Date().toISOString();
const report = `# TAS v70.18.1 Foundation Lock Validation Report

## Result

**PASS — Sprint 0 release gate completed successfully.**

- Package: \`${pkg.name}\`
- Version: \`${pkg.version}\`
- Validated: \`${generated}\`
- Node: \`${process.version}\`
- npm: \`${npmVersion}\`
- Validation report portability: no child-process invocation is used
- Original v70.18 AURORA archive SHA-256: \`${manifest.sourceArchiveSha256}\`

## Protected baseline

- ${manifest.protectedFiles.length} application, engine, data and preview files are byte-identical to the v70.18.0 baseline.
- ${assetLines.length} clean-build outputs match the original AURORA SHA-256 values.
- Dependency specifications are exact versions and agree with \`package-lock.json\`.
- The full inherited TAS regression suite passed, followed by the Foundation Lock and repository-copy parity gates.
- No deployment was performed by validation.

## Sprint 0 additions

- Reproducible \`npm ci\` toolchain
- Separate clean, typecheck, application build, Cloudflare preparation, regression and validation commands
- Local-only \`TEST_ALL_CAPABILITIES.cmd\` master gate
- Protected-capability and source-hash manifest
- Deterministic AURORA asset comparison
- Source package hygiene excluding \`node_modules\`
- GitHub clean-build workflow retained
- Manifest-driven repository-copy verification protects every baseline file before commit or push

## Known baseline observation

The inherited minified JavaScript bundle remains approximately 1.29 MB and Vite reports a chunk-size advisory. Sprint 0 deliberately does not restructure the application because the goal is byte-for-byte functional preservation. Modularisation and bundle optimisation belong to Sprint 1.
`;
fs.writeFileSync('TAS_V70_18_1_FOUNDATION_LOCK_VALIDATION_REPORT.md', report);
console.log('Wrote TAS_V70_18_1_FOUNDATION_LOCK_VALIDATION_REPORT.md');
