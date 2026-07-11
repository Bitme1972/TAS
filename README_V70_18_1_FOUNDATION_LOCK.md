# TAS v70.18.1 Foundation Lock

This is the Sprint 0 release of Telemetry Assurance Studio. It preserves the complete v70.18 AURORA application while adding a reproducible and independently verifiable release foundation.

## Safest first action

On Windows, double-click:

`TEST_ALL_CAPABILITIES.cmd`

It performs a clean `npm ci`, production build, Cloudflare output preparation and every inherited TAS regression test. It does not commit, push or deploy anything.


## Windows Node 24 hotfix

Hotfix 1 removes the final `npm.cmd` subprocess lookup from validation-report generation. The npm version is read from the standard `npm run` environment instead, preventing `spawnSync npm.cmd EINVAL` on Windows while leaving TAS itself unchanged.

## Local preview

After validation, double-click:

`RUN_ME_LOCAL_CLOUDFLARE_READY.cmd`

Open:

`http://localhost:8787/studio?localCloudflareReady=1`

Press `Ctrl+C` in the runner window to stop the preview.

## Commands

- `npm run typecheck` — TypeScript validation only
- `npm run build:app` — Vite application build only
- `npm run build:cloudflare` — clean production output and Cloudflare route preparation
- `npm run test:regression` — all inherited gates plus Foundation Lock
- `npm run validate` — complete release gate and report generation
- `npm run build` — compatibility alias for the complete validation gate

## Protected evidence

- `FOUNDATION_BASELINE_MANIFEST.json` records SHA-256 values for the unchanged application, engine, datasets and screenshots.
- `EXPECTED_AURORA_ASSET_HASHES.txt` records the original clean-built AURORA HTML, JavaScript and CSS hashes.
- `TAS_V70_18_1_FOUNDATION_LOCK_VALIDATION_REPORT.md` records the completed validation result.

## Deployment

Deployment runners remain available but are not the default Sprint 0 action. Validate and preview locally first. Run a deployment entry point only when a GitHub or Cloudflare release is explicitly intended.

## Hotfix 2

Use the Hotfix 2 archive for one-click Git or Cloudflare deployment. It preserves the protected preview baseline in the repository and validates every manifest-protected file before any commit or push.
