# TAS Offline Activation Workflow

## Customer side

1. Install the signed TAS release.
2. Open Product Activation.
3. Create an activation request JSON.
4. Transfer only the request through the approved route. Do not attach audit evidence.

## Vendor side

1. Verify purchase and edition entitlement.
2. Validate product version and installation identifier.
3. Sign the licence response using the private signing service.
4. Return the `.taslic` response through the approved route.

## Customer completion

1. Import the `.taslic` file.
2. Confirm edition, licence state and update-expiry date.
3. Retain the activation response with product records.

## Recovery

For device replacement, submit a reset request. The old activation should be retired before a replacement is issued unless a documented exceptional-support decision is made.
