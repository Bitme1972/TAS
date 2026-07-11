import type { CapabilityKey, TasEdition } from '../editions/entitlements';

export type LicenceState = 'unlicensed' | 'active' | 'expired' | 'suspended' | 'invalid';

export interface ActivationRequest {
  product: 'Telemetry Assurance Studio';
  edition: Exclude<TasEdition, 'community'>;
  machineFingerprint: string;
  requestedAtUtc: string;
  applicationVersion: string;
}

export interface LicenceEntitlement {
  licenceId: string;
  edition: Exclude<TasEdition, 'community'>;
  issuedTo: string;
  issuedAtUtc: string;
  updatesUntilUtc: string;
  perpetualVersion?: string;
  capabilities: CapabilityKey[];
  machineFingerprint?: string;
}

export interface LicenceValidationResult {
  state: LicenceState;
  entitlement?: LicenceEntitlement;
  reason?: string;
}

/**
 * Sprint 1 defines contracts only. Signing, verification, storage and network
 * activation must be implemented behind a trusted boundary in a later sprint.
 */
export interface LicenceProvider {
  validate(serialisedLicence: string, machineFingerprint: string): Promise<LicenceValidationResult>;
  createActivationRequest(request: ActivationRequest): Promise<string>;
}
