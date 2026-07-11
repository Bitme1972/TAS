import entitlementConfig from '../../config/edition-entitlements.json';

export type TasEdition = 'community' | 'professional' | 'consultant';
export type CapabilityKey =
  | 'singleEvidenceIntake'
  | 'multiEvidenceIntake'
  | 'basicAssurance'
  | 'advancedAssurance'
  | 'goldenComparison'
  | 'customGoldenBaseline'
  | 'beforeAfterComparison'
  | 'fullReportExports'
  | 'eventIntelligence'
  | 'commercialClientUse'
  | 'customBranding'
  | 'annualUpdates'
  | 'priorityUpdates'
  | 'watermarkedHtmlReport'
  | 'evidenceReceipt'
  | 'limitedEventIntelligence'
  | 'professionalUpgradePreview';

export interface EditionLimits {
  maxEvidenceFilesPerAssessment: number | 'unlimited';
  maxAssetsPerAssessment: number | 'unlimited';
  frameworkDepth: 'selected' | 'full';
  reportWatermark: boolean;
}

export interface EditionDefinition {
  id: TasEdition;
  displayName: string;
  productName: string;
  purpose: string;
  capabilities: Readonly<Record<CapabilityKey, boolean>>;
  limits: Readonly<EditionLimits>;
}

type EntitlementConfig = { schemaVersion: number; release: string; editions: Record<TasEdition, EditionDefinition> };
const typedConfig = entitlementConfig as EntitlementConfig;

export const entitlementSchemaVersion = typedConfig.schemaVersion;
export const entitlementRelease = typedConfig.release;
export const editionDefinitions: Readonly<Record<TasEdition, EditionDefinition>> = Object.freeze(typedConfig.editions);

export function getEditionDefinition(edition: TasEdition): EditionDefinition {
  const definition = editionDefinitions[edition];
  if (!definition) throw new Error(`Unknown TAS edition: ${edition}`);
  return definition;
}

export function hasCapability(edition: TasEdition, capability: CapabilityKey): boolean {
  return Boolean(getEditionDefinition(edition).capabilities[capability]);
}
