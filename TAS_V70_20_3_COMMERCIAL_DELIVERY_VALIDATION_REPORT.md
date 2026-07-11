# TAS v70.20.3 Commercial Delivery Studio Validation Report

## Release scope

- Member Gateway remains the landing page.
- The free AURORA Demo remains a separate synthetic build.
- The customer-supplied TAS v10.0.6 MSI is renamed without byte modification and staged for entitled delivery.
- A scripted guided product tour, selectable subtitles and narration script are included.
- Result-row and Golden-matrix selection update the lower detail pane.
- Results and details scroll independently and the horizontal splitter is resizable.
- All interaction parity changes are additive and do not modify the 13 protected AURORA files.

## Installer identity

- Filename: `TAS_Professional_v10_0_6_x64.msi`
- Size: 57,430,016 bytes
- SHA-256: `F59A8682E78B94EFF561B44DB66FC61089C8F5156F82F5D0A7BF54099B5DA249`
- SHA-512: `A486967F8E3A5BA0787E3C87A1C613BA8DB457B28F96DF5C88EEF7EE42BC6A950D554229B60B9A3CFD058106A4AC1C1668DEB25083EC468A69757347829B8A3F`

## Delivery boundaries

- Public Cloudflare output includes the Member Gateway, synthetic Demo, video, subtitles and licence guidance.
- Public Cloudflare output contains no MSI and no commercial AURORA engine.
- Entitled-vault output contains the verified MSI and hash sidecars.
- Production hosting must enforce server-side account and entitlement checks.
- The installed desktop product separately validates signed licence metadata, machine binding, edition and version entitlement.
