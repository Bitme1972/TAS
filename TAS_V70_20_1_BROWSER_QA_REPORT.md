# TAS v70.20.1 AURORA Member Foundation Browser QA

## Result

**PASS — 23 browser-level checks completed with no failed checks.**

The exact production JavaScript, CSS and static member HTML from `dist` were rendered in Chromium at desktop and mobile viewport sizes.

The execution environment blocks URL navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so the exact production assets were injected into Chromium directly rather than accessed through localhost. This still validates rendering, layout, interactions and runtime behaviour of the built files. Local HTTP route existence is verified separately by the build and browser-contract gates.

## AURORA continuity

- The default application remains Telemetry Assurance Studio AURORA.
- The Dashboard headline remains “Turn raw Windows audit evidence into a defensible security story.”
- All nine existing navigation items remain present.
- No member or commercial card appears on the Dashboard.
- No horizontal overflow was detected at 1920 × 1080 or 390 × 844.
- No runtime page error was detected.

## Commercial additions

- The existing Standalone Desktop page receives one full-width AURORA-aligned member and edition card.
- The member card links to `/member/`, the licensing README and customer quick start.
- The old placeholder installer link is disabled and relabelled “Commercial installer slot — not published”.
- The Product Activation page clearly labels its current controls as UAT demonstrations.
- The misleading “Create signed customer licence” wording is removed at runtime and replaced by “Create UAT licence example”.

## Member hub

- Three edition cards render: Community, Professional and Consultant.
- Six download-vault rows render.
- Two commercial binary slots are visibly locked.
- Desktop and mobile layouts have no horizontal overflow.
- Licensing lifecycle and offline activation guidance render correctly.

## Browser artefacts

- `AURORA_ROOT_1920x1080.png`
- `AURORA_STANDALONE_MEMBER_EXTENSION.png`
- `AURORA_ACTIVATION_GUIDE.png`
- `MEMBER_HUB_DESKTOP.png`
- `MEMBER_HUB_MOBILE.png`
- `BROWSER_QA_RESULTS.json`
