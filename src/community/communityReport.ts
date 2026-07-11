import type { CommunityAssessment, CommunityFinding } from './communityEngine';

export interface CommunityEvidenceReceipt {
  sourceName: string;
  sourceBytes: number;
  sourceLastModified: string;
  sha256: string;
  generatedAt: string;
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function findingRow(finding: CommunityFinding): string {
  const events = finding.events.map(event => `${event.id} ${event.name}`).join('; ');
  return `<tr>
    <td><strong>${escapeHtml(finding.subcategory)}</strong><small>${escapeHtml(finding.category)} · ${escapeHtml(finding.id)}</small></td>
    <td>${escapeHtml(finding.expected)}</td>
    <td>${escapeHtml(finding.actual)}</td>
    <td><span class="status ${escapeHtml(finding.status.toLowerCase().replace(/\s/g, '-'))}">${escapeHtml(finding.status)}</span></td>
    <td>${escapeHtml(finding.frameworks.join(', '))}</td>
    <td>${escapeHtml(events)}</td>
    <td>${escapeHtml(finding.remediation)}</td>
  </tr>`;
}

export function createCommunityHtmlReport(assessment: CommunityAssessment, receipt: CommunityEvidenceReceipt): string {
  const generated = new Date(receipt.generatedAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
  const rows = assessment.findings.map(findingRow).join('\n');
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TAS Community Selected Assurance Report - ${escapeHtml(assessment.assetName)}</title>
<style>
:root{font-family:Arial,Helvetica,sans-serif;color:#172033;background:#eef3f9}*{box-sizing:border-box}body{margin:0;background:#eef3f9}.page{position:relative;max-width:1500px;margin:24px auto;background:white;border:1px solid #d6dfeb;box-shadow:0 18px 60px #1b35531f;overflow:hidden}.page:before{content:"TAS COMMUNITY · NON-COMMERCIAL";position:fixed;inset:43% auto auto 8%;transform:rotate(-24deg);font-size:58px;font-weight:800;letter-spacing:.08em;color:#2967aa12;pointer-events:none;z-index:5}.top{padding:28px 34px;background:#0b1b32;color:#fff;display:flex;justify-content:space-between;gap:20px}.top h1{margin:6px 0 0;font-size:25px}.eyebrow{font-size:11px;letter-spacing:.15em;color:#80b8ff;font-weight:700}.badge{align-self:flex-start;border:1px solid #41658e;border-radius:999px;padding:8px 12px;color:#bad6f6;font-size:11px}.content{padding:28px 34px}.notice{border-left:4px solid #2e83f7;background:#eef6ff;padding:13px 15px;margin-bottom:22px;font-size:12px;line-height:1.55}.meta,.kpis{display:grid;gap:10px}.meta{grid-template-columns:repeat(4,1fr);margin-bottom:18px}.meta div,.kpis div,.receipt{border:1px solid #dce4ee;border-radius:9px;padding:12px;background:#f9fbfd}.meta small,.kpis small{display:block;color:#66768b;margin-bottom:5px}.kpis{grid-template-columns:repeat(5,1fr);margin-bottom:22px}.kpis strong{font-size:23px}.tableWrap{overflow:auto;border:1px solid #dce4ee;border-radius:9px}table{border-collapse:collapse;width:100%;font-size:10px;min-width:1180px}th{background:#102640;color:white;text-align:left;padding:10px;position:sticky;top:0}td{padding:10px;vertical-align:top;border-top:1px solid #e3e9f1;line-height:1.45}td small{display:block;color:#75859a;margin-top:3px}.status{font-weight:700;border-radius:999px;padding:4px 7px;white-space:nowrap}.aligned{background:#dff7ed;color:#126447}.partial{background:#fff1c9;color:#755400}.gap,.not-found{background:#ffe0e5;color:#8b2034}.receipt{margin-top:22px}.receipt h2,.scope h2{font-size:16px;margin:0 0 10px}.receiptGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px}.receiptGrid span{overflow-wrap:anywhere}.scope{margin-top:22px;border-top:1px solid #dce4ee;padding-top:18px;font-size:11px;line-height:1.55;color:#526176}.footer{padding:16px 34px;background:#f3f6fa;color:#65768b;font-size:10px;display:flex;justify-content:space-between;gap:20px}@media print{body{background:white}.page{margin:0;border:0;box-shadow:none}.page:before{position:fixed}.tableWrap{overflow:visible}th{position:static}}@media(max-width:800px){.page{margin:0}.top,.content,.footer{padding-left:18px;padding-right:18px}.meta,.kpis,.receiptGrid{grid-template-columns:1fr 1fr}.page:before{font-size:34px;left:2%}}
</style>
</head>
<body>
<article class="page">
<header class="top"><div><div class="eyebrow">TELEMETRY ASSURANCE STUDIO COMMUNITY · v70.20</div><h1>Selected Windows Audit Assurance Report</h1></div><div class="badge">Browser-local assessment</div></header>
<main class="content">
<div class="notice"><strong>Community scope:</strong> This report covers a selected introductory control set for one asset. It is not a complete Microsoft, CIS or NIST assessment and is not licensed for commercial client reporting.</div>
<section class="meta">
<div><small>Asset</small><strong>${escapeHtml(assessment.assetName)}</strong></div>
<div><small>Role</small><strong>${escapeHtml(assessment.role)}</strong></div>
<div><small>Operating system</small><strong>${escapeHtml(assessment.operatingSystem)}</strong></div>
<div><small>Generated</small><strong>${escapeHtml(generated)}</strong></div>
</section>
<section class="kpis">
<div><small>Selected score</small><strong>${assessment.score}%</strong></div>
<div><small>Aligned</small><strong>${assessment.aligned}</strong></div>
<div><small>Partial</small><strong>${assessment.partial}</strong></div>
<div><small>Gap</small><strong>${assessment.gap}</strong></div>
<div><small>Not found</small><strong>${assessment.notFound}</strong></div>
</section>
<div class="tableWrap"><table><thead><tr><th>Selected control</th><th>Expected</th><th>Actual</th><th>Status</th><th>Alignment lenses</th><th>Selected Event IDs</th><th>Community remediation</th></tr></thead><tbody>${rows}</tbody></table></div>
<section class="receipt"><h2>Evidence receipt</h2><div class="receiptGrid">
<span><strong>Source:</strong> ${escapeHtml(receipt.sourceName)}</span>
<span><strong>Size:</strong> ${escapeHtml(receipt.sourceBytes.toLocaleString('en-GB'))} bytes</span>
<span><strong>Last modified:</strong> ${escapeHtml(receipt.sourceLastModified)}</span>
<span><strong>Recognised settings:</strong> ${assessment.parseStats.recognisedSettings}</span>
<span style="grid-column:1/-1"><strong>SHA-256:</strong> ${escapeHtml(receipt.sha256)}</span>
</div></section>
<section class="scope"><h2>Privacy and interpretation</h2><p>The raw evidence was processed locally in the browser and is not embedded in this report. TAS Community does not upload the evidence or require an account. Framework labels indicate selected security-alignment perspectives only. Professional and Consultant editions provide broader control coverage, multi-asset comparison and full reporting capabilities.</p></section>
</main>
<footer class="footer"><span>Generated by TAS Community · Non-commercial use</span><span>Raw evidence excluded · Watermarked output</span></footer>
</article>
</body>
</html>`;
}

export function downloadCommunityHtmlReport(assessment: CommunityAssessment, receipt: CommunityEvidenceReceipt): void {
  const html = createCommunityHtmlReport(assessment, receipt);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeAsset = assessment.assetName.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'COMMUNITY_ASSET';
  anchor.href = url;
  anchor.download = `TAS_Community_${safeAsset}_Selected_Assurance.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
