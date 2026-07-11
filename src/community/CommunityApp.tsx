import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck2,
  FileInput,
  FileText,
  Fingerprint,
  Info,
  LockKeyhole,
  MonitorCog,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  XCircle
} from 'lucide-react';
import { getEditionDefinition } from '../editions/entitlements';
import {
  COMMUNITY_MAX_EVIDENCE_BYTES,
  assessCommunityEvidence,
  communitySample,
  sha256Evidence,
  type CommunityOperatingSystemChoice,
  type CommunityRoleChoice
} from './communityEngine';
import { downloadCommunityHtmlReport, type CommunityEvidenceReceipt } from './communityReport';

const edition = getEditionDefinition('community');
const demoRequested = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';

function formatBytes(bytes: number): string {
  if (!bytes) return 'Pasted text';
  if (bytes < 1024) return `${bytes} bytes`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function CommunityApp() {
  const [input, setInput] = useState(demoRequested ? communitySample : '');
  const [role, setRole] = useState<CommunityRoleChoice>('Auto');
  const [operatingSystem, setOperatingSystem] = useState<CommunityOperatingSystemChoice>('Auto');
  const [sourceName, setSourceName] = useState(demoRequested ? 'TAS safe demonstration' : 'Pasted auditpol evidence');
  const [sourceBytes, setSourceBytes] = useState(demoRequested ? new TextEncoder().encode(communitySample).byteLength : 0);
  const [sourceLastModified, setSourceLastModified] = useState(demoRequested ? 'Built-in safe demonstration' : 'Not supplied');
  const [receiptHash, setReceiptHash] = useState('');
  const [fileMessage, setFileMessage] = useState('');

  const result = useMemo(() => input.trim() ? assessCommunityEvidence(input, role, operatingSystem) : null, [input, role, operatingSystem]);
  const assessment = result?.assessment ?? null;

  useEffect(() => {
    let active = true;
    if (!input.trim()) {
      setReceiptHash('');
      return () => { active = false; };
    }
    setReceiptHash('Calculating…');
    sha256Evidence(input).then(hash => { if (active) setReceiptHash(hash); });
    return () => { active = false; };
  }, [input]);

  function setEvidence(value: string, name: string, bytes: number, lastModified: string): void {
    setInput(value);
    setSourceName(name);
    setSourceBytes(bytes);
    setSourceLastModified(lastModified);
    setFileMessage('');
  }

  async function loadFile(file: File | undefined): Promise<void> {
    if (!file) return;
    if (file.size > COMMUNITY_MAX_EVIDENCE_BYTES) {
      setFileMessage('This file is larger than the 1 MB Community limit.');
      return;
    }
    if (file.type && !file.type.startsWith('text/') && !/\.(txt|log|csv)$/i.test(file.name)) {
      setFileMessage('Choose a plain-text auditpol file (.txt, .log or .csv).');
      return;
    }
    const text = await file.text();
    setEvidence(text, file.name, file.size, new Date(file.lastModified).toLocaleString('en-GB'));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    void loadFile(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    if ((event.dataTransfer.files?.length ?? 0) > 1) {
      setFileMessage('Community accepts one evidence file per assessment.');
      return;
    }
    void loadFile(event.dataTransfer.files?.[0]);
  }

  function loadDemo(): void {
    setEvidence(communitySample, 'TAS safe demonstration', new TextEncoder().encode(communitySample).byteLength, 'Built-in safe demonstration');
    setRole('Auto');
    setOperatingSystem('Auto');
  }

  function clearEvidence(): void {
    setEvidence('', 'Pasted auditpol evidence', 0, 'Not supplied');
    setRole('Auto');
    setOperatingSystem('Auto');
  }

  function receipt(): CommunityEvidenceReceipt {
    return {
      sourceName,
      sourceBytes: sourceBytes || new TextEncoder().encode(input).byteLength,
      sourceLastModified,
      sha256: receiptHash,
      generatedAt: new Date().toISOString()
    };
  }

  return (
    <div className="communityShell">
      <header className="communityHeader">
        <div className="communityBrand">
          <ShieldCheck size={29} />
          <div><strong>Telemetry Assurance Studio</strong><span>COMMUNITY · v70.20</span></div>
        </div>
        <div className="communityHeaderMeta">
          <span><LockKeyhole size={15} /> Browser-local</span>
          <span><FileCheck2 size={15} /> No account required</span>
        </div>
      </header>

      <main className="communityMain">
        <section className="communityHero">
          <div className="communityHeroCopy">
            <span className="communityEyebrow"><Sparkles size={15} /> Free selected Windows audit assurance</span>
            <h1>Turn one auditpol result into a clear, defensible first view.</h1>
            <p>{edition.purpose} Evidence stays in your browser, the selected result is explained and the downloadable Community report excludes the raw evidence.</p>
            <div className="communityHeroBadges"><span>One evidence file</span><span>One asset</span><span>Selected controls</span><span>Watermarked HTML</span></div>
          </div>
          <aside className="communityTrustCard">
            <LockKeyhole size={23} />
            <div><b>Privacy by default</b><span>No upload endpoint is used. Closing or refreshing this page clears the active assessment.</span></div>
          </aside>
        </section>

        <section className="communityWorkspace">
          <article className="communityPanel communityIntakePanel">
            <div className="communityPanelTitle"><FileInput size={20} /><div><b>1. Add evidence</b><span>Plain text from auditpol /get /category:*</span></div></div>

            <label className="communityDropzone" onDragOver={event => event.preventDefault()} onDrop={handleDrop}>
              <UploadCloud size={28} />
              <b>Drop one text file here</b>
              <span>or click to browse · maximum 1 MB</span>
              <input type="file" accept=".txt,.log,.csv,text/plain" onChange={handleFileChange} />
            </label>
            {fileMessage && <div className="communityInlineError"><XCircle size={15} />{fileMessage}</div>}

            <div className="communityDivider"><span>or paste evidence</span></div>
            <textarea
              value={input}
              onChange={event => setEvidence(event.target.value, 'Pasted auditpol evidence', new TextEncoder().encode(event.target.value).byteLength, 'Not supplied')}
              placeholder="Paste one auditpol /get /category:* result here…"
              aria-label="Auditpol evidence"
            />

            <div className="communitySelectors">
              <label>Asset role<select value={role} onChange={event => setRole(event.target.value as CommunityRoleChoice)}>
                <option value="Auto">Detect or use a safe default</option><option value="Workstation">Windows workstation</option><option value="Server">Member server</option><option value="DC">Domain Controller</option>
              </select></label>
              <label>Operating system<select value={operatingSystem} onChange={event => setOperatingSystem(event.target.value as CommunityOperatingSystemChoice)}>
                <option value="Auto">Detect or use a safe default</option><option value="Windows 10">Windows 10</option><option value="Windows 11">Windows 11</option><option value="Windows Server 2016">Windows Server 2016</option><option value="Windows Server 2019">Windows Server 2019</option><option value="Windows Server 2022">Windows Server 2022</option><option value="Windows Server 2025">Windows Server 2025</option><option value="Windows (unspecified)">Windows, version unspecified</option>
              </select></label>
            </div>

            <div className="communityActions">
              <button onClick={loadDemo}><Sparkles size={16} /> Load safe demo</button>
              <button className="secondary" onClick={clearEvidence}><RotateCcw size={16} /> Clear</button>
            </div>
          </article>

          <article className="communityPanel communityResultsPanel">
            <div className="communityPanelTitle"><BarChart3 size={20} /><div><b>2. Selected assurance</b><span>Microsoft, CIS and NIST security-alignment lenses</span></div></div>

            {!input.trim() && <div className="communityEmpty"><ShieldCheck size={42} /><b>Evidence has not been assessed</b><span>Add one file, paste evidence or load the safe demonstration.</span></div>}

            {result?.errors.map(error => <div className="communityResultError" key={error}><XCircle size={19} /><div><b>Assessment stopped</b><span>{error}</span></div></div>)}

            {assessment && <>
              <div className="communityAssetSummary">
                <div><small>Asset</small><b>{assessment.assetName}</b></div>
                <div><small>Role</small><b>{assessment.role}</b></div>
                <div><small>Operating system</small><b>{assessment.operatingSystem}</b></div>
                <div><small>Coverage</small><b>{assessment.findings.length} selected controls</b></div>
              </div>

              {(result?.warnings.length ?? 0) > 0 && <div className="communityWarnings">{result?.warnings.map(warning => <span key={warning}><Info size={14} />{warning}</span>)}</div>}

              <div className="communityKpis">
                <div className="score"><b>{assessment.score}%</b><span>Selected score</span></div>
                <div><b>{assessment.aligned}</b><span>Aligned</span></div>
                <div><b>{assessment.partial}</b><span>Partial</span></div>
                <div><b>{assessment.gap + assessment.notFound}</b><span>Gaps / missing</span></div>
              </div>

              <div className="communityTableWrap"><table><thead><tr><th>Selected control</th><th>Expected</th><th>Actual</th><th>Status</th><th>Selected intelligence</th></tr></thead><tbody>{assessment.findings.map(item => <tr key={item.id}>
                <td><b>{item.subcategory}</b><small>{item.category} · {item.id}</small><div className="frameworkTags">{item.frameworks.map(framework => <span key={framework}>{framework}</span>)}</div></td>
                <td>{item.expected}</td><td>{item.actual}</td><td><span className={`communityStatus ${item.status.toLowerCase().replace(/\s/g, '-')}`}>{item.status}</span></td>
                <td><b>{item.events.map(event => event.id).join(', ')}</b><small>{item.why}</small><details><summary>Remediation</summary><p>{item.remediation}</p></details></td>
              </tr>)}</tbody></table></div>

              <div className="communityReportBar">
                <div><FileText size={20} /><span><b>Watermarked Community report</b><small>Selected findings and evidence receipt; raw evidence excluded</small></span></div>
                <button disabled={receiptHash === 'Calculating…'} onClick={() => downloadCommunityHtmlReport(assessment, receipt())}><Download size={16} /> Download HTML</button>
              </div>
            </>}
          </article>
        </section>

        {assessment && <section className="communityEvidenceAndUpgrade">
          <article className="communityReceiptCard">
            <div className="communityPanelTitle"><Fingerprint size={20} /><div><b>3. Evidence receipt</b><span>Local proof of the assessed text without embedding it in the report</span></div></div>
            <dl><div><dt>Source</dt><dd>{sourceName}</dd></div><div><dt>Size</dt><dd>{formatBytes(sourceBytes || new TextEncoder().encode(input).byteLength)}</dd></div><div><dt>Recognised settings</dt><dd>{assessment.parseStats.recognisedSettings}</dd></div><div><dt>Categories seen</dt><dd>{assessment.parseStats.categoriesSeen}</dd></div><div className="hash"><dt>SHA-256</dt><dd>{receiptHash}</dd></div></dl>
            <p><LockKeyhole size={14} /> The hash identifies this exact evidence text. TAS Community does not transmit or retain the evidence.</p>
          </article>

          <article className="communityUpgradeCard">
            <div className="upgradeHeading"><MonitorCog size={23} /><div><span>TAS PROFESSIONAL PREVIEW</span><h2>Community shows the first layer. Professional completes the assurance workflow.</h2></div></div>
            <div className="upgradeGrid">
              {['Unlimited assets and evidence files', 'Golden baseline comparison', 'Before and After validation', 'Complete premium control coverage', 'Full management and technical exports', 'Advanced Event ID intelligence'].map(item => <div key={item}><CheckCircle2 size={16} />{item}</div>)}
            </div>
            <div className="upgradeTruth"><Info size={16} /><span>Community does not calculate or invent hidden Professional findings. The complete premium engine is absent from this bundle and runs only inside the entitled edition.</span></div>
            <button disabled>Professional purchase opens in the commerce sprint <ArrowUpRight size={16} /></button>
          </article>
        </section>}

        <section className="communityScopeStrip">
          <div><b>What this result means</b><span>A selected, introductory view of Windows audit coverage for one asset.</span></div><ChevronRight size={18} />
          <div><b>What it does not mean</b><span>Certification, a complete benchmark assessment or permission for client-facing commercial use.</span></div>
        </section>
      </main>
      <footer>Generated by TAS Community · Browser-local · Watermarked output · Not licensed for commercial client reporting</footer>
    </div>
  );
}
