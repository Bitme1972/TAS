# TAS v70.20.3 Commercial Delivery Studio

This iteration keeps the v70.20 AURORA product identity and adds the commercial customer-delivery layer without exposing the commercial engine or Golden datasets publicly.

## Delivered

- Member Gateway remains the public landing page.
- Separate synthetic AURORA Demo remains free and browser-local.
- Real customer MSI staged as `TAS_Professional_v10_0_6_x64.msi` without modifying its bytes.
- SHA-256 and SHA-512 verification files supplied.
- Public Cloudflare build contains no MSI and no commercial AURORA engine.
- Separate entitled-vault output demonstrates the authenticated download boundary.
- Professional and Consultant licence metadata is recognised by the member-vault preview.
- Scripted guided product tour supplied as MP4, SRT, WebVTT, poster and reusable automation.
- Result rows update the lower details pane.
- Golden matrix rows resolve to matching finding details.
- Top and bottom assurance panes scroll independently.
- Keyboard-accessible horizontal splitter adjusts pane proportions.

## Installer identity

- Product: Telemetry Assurance Studio customer MSI
- Published name: `TAS_Professional_v10_0_6_x64.msi`
- Size: 57,430,016 bytes
- SHA-256: `f59a8682e78b94eff561b44db66fc61089c8f5156f82f5d0a7bf54099b5da249`
- SHA-512: `a486967f8e3a5ba0787e3c87a1c613ba8db457b28f96df5c88eef7ee42bc6a950d554229b60b9a3cfd058106a4ac1c1668deb25083ec468a69757347829b8a3f`

The filename changed; the MSI bytes did not.

## Output boundaries

- `dist/` — public Member Gateway, synthetic Demo, guided tour and licence information. No MSI.
- `dist-editions/` — independently compiled Community, Professional, Consultant and Demo editions.
- `dist-entitled/` — local fulfilment preview containing the verified MSI. Production hosting must enforce authenticated server-side entitlement before returning this file.

## Local use

Run `RUN_ME_LOCAL_CLOUDFLARE_READY.cmd` to validate and preview the public Cloudflare-ready distribution. No deployment occurs.

The guided tour can be regenerated with `demo-automation\RECORD_TAS_DEMO.cmd` after installing its documented Python and FFmpeg prerequisites.

## Local previews

- `RUN_ME_LOCAL_CLOUDFLARE_READY.cmd` performs a clean validation and serves only the public customer journey on port 8787.
- `RUN_ME_LOCAL_ENTITLED_VAULT.cmd` validates and serves the local fulfilment preview on port 8788, including the actual Professional and Consultant builds and the verified MSI.

`dist-entitled` is not a production authentication system and must never be deployed as an unprotected public static directory. It is the prepared output that a future authenticated fulfilment service will protect.

## Reproducible guided tour

`demo-automation\RECORD_TAS_DEMO.cmd` drives the real synthetic Demo in Chromium, captures the defined interaction sequence and regenerates the MP4, SRT, WebVTT, poster and manifest. OBS is not required, which makes the tour repeatable after future UI changes.
