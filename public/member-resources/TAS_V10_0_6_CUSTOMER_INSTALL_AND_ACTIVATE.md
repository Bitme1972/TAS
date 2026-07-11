# TAS Professional v10.0.6 — Install and Activate

## Delivered installer

- File: `TAS_Professional_v10_0_6_x64.msi`
- Original customer-package name: `TAS_v10_CUSTOMER_RELEASE.msi`
- Size: 57,430,016 bytes
- SHA-256: `F59A8682E78B94EFF561B44DB66FC61089C8F5156F82F5D0A7BF54099B5DA249`
- SHA-512: `A486967F8E3A5BA0787E3C87A1C613BA8DB457B28F96DF5C88EEF7EE42BC6A950D554229B60B9A3CFD058106A4AC1C1668DEB25083EC468A69757347829B8A3F`

The filename was changed for the member vault. The MSI bytes were not modified.

## Verify before installation

Open Command Prompt in the download folder and run:

```cmd
certutil -hashfile TAS_Professional_v10_0_6_x64.msi SHA512
```

The result must match the SHA-512 value above and the supplied `.sha512` sidecar.

## Install

1. Run `TAS_Professional_v10_0_6_x64.msi`.
2. Open **Telemetry Assurance Studio** from the Desktop shortcut or Start Menu.
3. Confirm the product opens in demo mode.
4. Open **Product Activation**.
5. Click **Create activation request**.
6. Send the generated `tas_activation_request_*.json` file to the vendor.

## Activate

1. The vendor verifies the order, edition, permitted use and machine fingerprint.
2. The vendor returns a signed `.taslic` file and hash sidecar.
3. In TAS, open **Product Activation** and click **Activate product**.
4. Select the returned `.taslic` file.
5. Confirm the current licence panel shows the correct customer, edition, licence ID, machine binding, expiry or update entitlement, assessed-computer allowance and report allowance.

No MSI rebuild or reinstall is required after the licence is issued.

## Licence storage

After activation TAS stores the licence under:

```text
%APPDATA%\TelemetryAssuranceStudio\Licensing\license.taslic
```

Offline report usage is stored under:

```text
%APPDATA%\TelemetryAssuranceStudio\Licensing\usage_state.json
```

Do not manually copy licence files into `C:\Program Files`.

## Edition behaviour

- **Professional**: internal organisational assessments. The purchased version remains usable after the included update period expires.
- **Consultant**: adds paid client-assessment rights and requires an active Consultant term for commercial client use.
- The desktop application validates the signed licence, machine binding, edition, version entitlement and protected report actions.
