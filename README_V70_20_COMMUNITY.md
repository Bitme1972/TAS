# Telemetry Assurance Studio v70.20 Community

This package completes Sprint 2 of the TAS commercial roadmap. It preserves the full v70.18 AURORA Professional application while delivering a genuinely useful, independently compiled Community edition.

## Start here on Windows

1. Double-click `TEST_ALL_CAPABILITIES.cmd`.
2. Wait for the green PASS result.
3. Double-click `RUN_ME_LOCAL_EDITION_PREVIEWS.cmd`.
4. Open `http://localhost:8790/community/`.
5. Use `http://localhost:8790/community/?demo=1` to open the safe demonstration immediately.

Nothing is deployed by either command.

## Community capability

- one file or pasted evidence item
- one asset per assessment
- role and operating-system assistance
- selected audit assurance
- selected Microsoft, CIS and NIST CSF lenses
- selected Event ID and remediation context
- browser-local SHA-256 evidence receipt
- watermarked HTML report
- no account and no upload endpoint

## Protected editions

Professional and Consultant remain independently compiled. The default `dist` output remains the protected Professional/AURORA application. Community does not contain the premium engine or datasets.

## Full validation

```text
npm ci --no-audit --no-fund --progress=false
npm run validate
```

The validation command builds all editions, runs inherited and Sprint 2 gates, writes the validation report and prepares the local Cloudflare output. It does not commit, push or deploy.
