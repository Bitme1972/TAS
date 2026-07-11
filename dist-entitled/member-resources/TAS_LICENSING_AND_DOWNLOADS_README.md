# TAS Licensing and Downloads README

## Purpose

The TAS member area separates product entitlement from customer audit evidence. Licensing never needs or receives auditpol evidence.

## Editions

- **Community**: free, single-asset, selected controls, watermarked report, no commercial client usage rights.
- **Professional**: full standalone AURORA capability, Golden comparison, Before and After validation and unrestricted product reporting under the licence terms.
- **Consultant**: Professional capability plus commercial client-assessment rights and consultant report identity.

## How activation works

1. A purchase or vendor approval creates an entitlement.
2. TAS generates a machine-bound activation request locally.
3. The request is sent to the vendor through an online or approved offline route.
4. A private service signs the `.taslic` response. The private key is never included in TAS browser code or customer packages.
5. TAS imports and validates the signed response locally.
6. The member area exposes only the edition and updates covered by the entitlement.

## Downloads

A paid download should contain:

- release-approved installer or protected product ZIP
- release notes
- SHA-256 hashes
- customer quick start
- EULA and privacy documents
- support-bundle instructions

The v70.20.1 foundation creates the download vault and customer guidance. It deliberately does not claim that an unsigned placeholder is a commercial installer.

## Update entitlement

Professional customers keep using the version they purchased after the included update period expires. Renewal provides access to newer versions; it does not remove access to existing customer-created reports.

## Device replacement

A controlled reset process retires the previous activation and issues a replacement. Vendor override should be audited and rate-limited.
