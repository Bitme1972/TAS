# TAS v70.20.2 Commercial Gateway — Browser QA Report

## Result

**PASS — the Member Gateway, synthetic AURORA Demo and Licensed Studio gate rendered and operated without browser runtime errors in the tested journeys.**

## Visual and responsive checks

Chromium checks were completed at:

- Member Gateway desktop: 1440 × 1000
- Member Gateway mobile: 390 × 844
- Interactive Demo desktop: 1440 × 1000
- Interactive Demo mobile: 390 × 844
- Licensed Studio desktop: 1440 × 1000

No tested page produced horizontal document overflow. No browser console error or page runtime error was recorded.

## Interactive Demo checks

The Demo opened with a fixed synthetic two-asset evidence set and no customer file upload requirement.

Verified behaviour:

- two synthetic assets recognised
- 114 synthetic audit rows parsed
- 24 Basic Demo finding rows generated
- meaningful mixed posture: Aligned, Partial and Gap results
- 69% demonstration assurance score
- Evidence Intake navigation
- Basic assurance generation
- Golden comparison interaction using only synthetic controls
- detailed finding pane
- HTML report preview
- CSV, HTML, Word and printable PDF output paths
- output pack population
- Before / After workflow with improvement context
- free-Demo ribbon and synthetic-data warning
- commercial Golden baseline identifiers absent from the Demo bundle

The Demo report and control pack are explicitly illustrative and must not be represented as customer security conclusions.

## HTTP and MIME checks

The actual generated `dist` folder was served locally. The following returned HTTP 200:

- `/`
- `/demo/`
- `/studio/`
- `/member/`
- `/TAS_INSTALLER_STATUS.json`
- generated Demo JavaScript
- generated Demo CSS

Observed content types were correct: HTML, JSON, JavaScript and CSS were not replaced by fallback HTML.

## Installer result

The attachment supplied for this iteration contained no TAS MSI, EXE, MSIX or App Installer package. The Member Gateway therefore renders an honest disabled installer position. The package contains a staging contract and SHA-256 workflow for a future signed `TAS_Professional_x64.msi`, but no fake installer is published.

## Security boundary

The public `dist` contains only:

- Member Gateway
- synthetic Demo
- purchase and activation gateway
- public guides and installer status metadata

The Professional and Consultant AURORA builds remain under `dist-editions` for controlled fulfilment and are not copied into the public Cloudflare output.
