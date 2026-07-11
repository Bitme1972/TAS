# TAS v70.19 Commercial Foundation

## Sprint 1 result

TAS now has one central entitlement model and three independently compiled editions:

- **TAS Community** — one evidence file, one asset, selected controls and a watermarked/non-commercial boundary.
- **TAS Professional** — the complete protected AURORA capability for individual security-engineering use.
- **TAS Consultant** — the protected AURORA capability with a separate entitlement identity for future commercial client-reporting and branding functions.

## Safety model

The v70.18 AURORA application, assurance engine, premium baseline JSON, Event ID database, samples and preview screenshots remain protected by the original Foundation Lock hashes. Sprint 1 adds files beside that core rather than rewriting it.

Community is not a JavaScript switch inside the Professional application. It has:

- its own HTML entry point
- its own React entry point
- its own lightweight parser
- its own selected Community controls
- its own stylesheet
- its own output folder and machine-readable manifest

The Community build does not import `src/App.tsx`, `src/tasEngine.ts` or any file under `src/data`.

## Canonical entitlement source

`config/edition-entitlements.json` is the single product-definition source used by all edition builds and regression tests. Product restrictions must be changed there, not scattered throughout the interface.

## Protected service boundaries

Sprint 1 adds non-invasive typed facades for evidence parsing, assurance, baselines, comparison, reporting, Event ID intelligence, dashboard posture and edition entitlements. Future sprints can consume these boundaries without directly coupling new commercial code to the large protected AURORA files. Licensing contracts are defined separately with no signing key, validation secret or production activation implementation in browser code.

## Build outputs

- `dist` — protected AURORA/Professional Cloudflare deployment output
- `dist-editions/community` — independent Community architecture build
- `dist-editions/professional` — edition-labelled Professional build
- `dist-editions/consultant` — edition-labelled Consultant build

Each edition output includes `TAS_EDITION_MANIFEST.json`, hashes for every generated file and `TAS_EDITION_MARKER.txt`.

## Commands

- `npm run build:community`
- `npm run build:professional`
- `npm run build:consultant`
- `npm run build:editions`
- `npm run validate`

`TEST_ALL_CAPABILITIES.cmd` remains local-only and deploys nothing.

## Deferred deliberately

Sprint 1 establishes secure product boundaries. It does not yet add payment processing, production licence validation, custom Consultant branding or the final Community conversion journey. Those remain later sprints.
