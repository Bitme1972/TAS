# TAS v70.20.3 Browser QA Report

- Passed: **21**
- Failed: **0**
- Browser: Chromium (headless, production static output)
- Viewports: 1440×1000 and 390×844

## Checks

- PASS — Public Member Gateway renders: Telemetry Assurance Studio | Member Gateway
- PASS — Gateway has no horizontal overflow
- PASS — Guided MP4 served correctly: 2230418 bytes
- PASS — Timed subtitle track served: 23 cues
- PASS — Public deployment does not expose MSI
- PASS — Public download vault remains locked
- PASS — Synthetic AURORA Demo loads
- PASS — Workspace parity extension loaded: 70.20.3
- PASS — Golden matrix scrolls independently: {"top": 0, "left": 80, "sh": 256, "ch": 256}
- PASS — Golden result click populates lower details: DEMO-A02
- PASS — Keyboard-resizable pane splitter works: 50 → 55
- PASS — Raw result row click populates lower details: DEMO-A04
- PASS — Top and lower panes have independent scroll containers: {"top": 400, "bottom": 170}
- PASS — Demo has no horizontal page overflow
- PASS — Recognised entitlement metadata unlocks vault download preview
- PASS — Entitled vault serves exact verified MSI: 57430016 bytes
- PASS — Entitled Professional Studio loads actual AURORA app
- PASS — Entitled Consultant Studio loads actual AURORA app
- PASS — Mobile Member Gateway has no horizontal overflow
- PASS — No serious browser console errors
- PASS — No browser page errors

## Captures

- TAS_V70_20_3_MEMBER_GATEWAY.png
- TAS_V70_20_3_DEMO_ROW_DETAILS.png
- TAS_V70_20_3_ENTITLED_VAULT.png
- TAS_V70_20_3_PROFESSIONAL_STUDIO.png
