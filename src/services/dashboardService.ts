import type { Assessment } from '../tasEngine';

export interface PostureSummary {
  score: number;
  assessedAssets: number;
  assessedControls: number;
  aligned: number;
  partial: number;
  gap: number;
  evidenceRequired: number;
  urgentFindings: number;
}

export function buildPostureSummary(assessment: Assessment): PostureSummary {
  return {
    score: assessment.score,
    assessedAssets: assessment.assets.length,
    assessedControls: assessment.findings.length,
    aligned: assessment.aligned,
    partial: assessment.partial,
    gap: assessment.gap,
    evidenceRequired: assessment.evidence,
    urgentFindings: assessment.findings.filter(finding =>
      finding.status === 'Gap' && /critical|high/i.test(finding.priority)
    ).length
  };
}
