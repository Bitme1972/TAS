# TAS v70.18.1 Foundation Lock — Sprint 0

## Purpose

Protect TAS v70.18 AURORA before commercial editions, licensing, payments or public-site changes are introduced.

## What changed

- Locked every npm dependency to the exact version proven by the v70.18 clean build.
- Split the pipeline into clean, typecheck, application build, Cloudflare preparation, regression and complete validation commands.
- Added `TEST_ALL_CAPABILITIES.cmd` as the local-only master gate.
- Added SHA-256 protection for the application source, assurance engine, embedded datasets and AURORA preview screenshots.
- Added deterministic comparison against the original v70.18 built HTML, JavaScript and CSS output.
- Added an automated validation report and Foundation Lock deployment marker.
- Added a clean release packager which excludes `node_modules`.
- Strengthened the GitHub clean-build gate.
- Updated local and deployment runners to the v70.18.1 release identity.

## What did not change

- No AURORA interface change.
- No assurance-engine change.
- No baseline or Event ID data change.
- No report behaviour change.
- No Community restrictions, licensing, payment or advertising code.
- No Git push or Cloudflare deployment was performed while preparing this package.

## Deferred deliberately

The inherited JavaScript bundle remains approximately 1.29 MB. Modularisation and bundle optimisation are Sprint 1 work because changing module boundaries during the Foundation Lock sprint would weaken the byte-for-byte preservation guarantee.


## Hotfix 1 — Windows Node 24 validation report

- Removed the final `child_process` / `npm.cmd` version lookup from the validation-report writer.
- npm version evidence is now read from the standard environment supplied by `npm run`.
- Added a regression guard preventing subprocess-based npm detection from returning.
- No application, assurance-engine, baseline, report or AURORA interface file changed.

## Hotfix 2 — repository-copy protection

- Included the protected `preview` folder in the Git deployment copy.
- Added manifest-driven protected-file verification before repository build.
- Added a simulated repository-copy regression gate.
- Preserved all protected v70.18 AURORA hashes unchanged.
