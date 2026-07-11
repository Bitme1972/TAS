# TAS v70.20 Community Edition

## Sprint 2 result

TAS Community is now a useful free product rather than a structural preview. It accepts one auditpol text evidence item, assesses one Windows asset against a selected introductory control set and produces a clear browser-local result.

## Community workflow

1. Add one text file, drag and drop it or paste auditpol output.
2. Allow TAS to assist with role and operating-system selection, or override either field.
3. Review the selected assurance score and the Aligned, Partial, Gap and Not found findings.
4. Expand selected Event ID and remediation context.
5. Download a watermarked Community HTML report.
6. Retain the SHA-256 receipt if proof of the exact assessed evidence text is required.

## Privacy behaviour

- No account is required.
- No evidence-upload endpoint is used.
- Evidence is processed in the browser session.
- Raw evidence is not embedded in the generated report.
- The report contains only source metadata, the evidence hash and selected assessment results.
- Refreshing or closing the page clears the active browser state.

## Selected alignment scope

The Community control set uses Microsoft, CIS and NIST CSF labels as selected security-alignment lenses. These labels do not claim certification, full benchmark coverage or a complete framework assessment.

## Product boundary

The Community build remains independently compiled. It does not import:

- `src/App.tsx`
- `src/tasEngine.ts`
- any file under `src/data`
- the premium baseline packs
- the complete Event ID database

Golden comparison, multi-asset assessment, Before and After comparison, complete premium findings, full exports and commercial client-reporting rights remain Professional or Consultant capabilities.

## Truthful upgrade behaviour

Community never displays invented counts for hidden Professional findings. It explains the additional workflows available in Professional while stating that the premium engine and datasets are not present in the Community bundle.

## Build outputs

- `dist` - protected Professional/AURORA Cloudflare output
- `dist-editions/community` - TAS Community v70.20
- `dist-editions/professional` - protected Professional edition
- `dist-editions/consultant` - protected Consultant edition identity

## Exit gate

Sprint 2 passes only when:

- the Community assessment is useful for one real auditpol result
- one-file and one-asset limits are enforced
- the generated report is watermarked and excludes raw evidence
- no premium dataset is present in the Community bundle
- all inherited TAS and Sprint 1 gates pass
- all new Sprint 2 gates pass
- no deployment is performed by validation
