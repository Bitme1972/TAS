# TAS MSI publishing guide

## Current state

No TAS MSI was present in the attachment supplied for v70.20.2. The uploaded ZIP contains no TAS `.msi` file.

TAS therefore shows a realistic but disabled installer card. No fake executable has been created.

## Approved installer location

Place the approved, hash-verified installer here before running the release build:

`release-assets/TAS_Professional_x64.msi`

The release process must then:

1. verify that the file is a genuine Windows Installer package
2. record its byte size, product version and SHA-256 hash
3. copy it only into the protected member-download release area
4. keep it out of the public Community and Demo bundles
5. require the correct Professional or Consultant entitlement before delivery
6. publish release notes and the matching hash beside the MSI

## Licence boundary

The MSI may be downloadable only after purchase, but the installed application must still validate the signed `.taslic` entitlement. A guessed download URL must never be treated as the licence control.
