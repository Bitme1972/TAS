# Telemetry Assurance Studio v70.19

## Commercial Foundation

This development release completes Sprint 1: Commercial Architecture and Edition Separation.

The proven v70.18 AURORA application remains the protected Professional core. TAS now also has a central entitlement model and independent Community, Professional and Consultant compilation paths.

## Start

On Windows, run `TEST_ALL_CAPABILITIES.cmd`. It performs a clean dependency install, builds the protected Professional Cloudflare output, builds all three independent editions and runs inherited plus Sprint 1 gates. It does not deploy anything.

Use `RUN_ME_LOCAL_CLOUDFLARE_READY.cmd` for the protected Professional preview. Use `RUN_ME_LOCAL_EDITION_PREVIEWS.cmd` to view Community, Professional and Consultant from the independent build folders.

## Safety

- All thirteen Foundation Lock files remain byte-identical.
- Community has no import path to `src/App.tsx`, `src/tasEngine.ts` or `src/data`.
- Professional remains the default `dist` output used by Cloudflare.
- Consultant is independently identified but does not yet expose custom branding controls.
- Payment and production licensing are not included in this sprint.
