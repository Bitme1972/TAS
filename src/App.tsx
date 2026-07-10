import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Activity, AlertTriangle, BarChart3, BookOpen, CheckCircle2, ChevronRight, ClipboardList, Command, Database, Download, FileInput, FileText, FolderOpen, Gauge, GitCompareArrows, HardDrive, KeyRound, LayoutDashboard, Library, LockKeyhole, MonitorDown, PanelLeftClose, PanelLeftOpen, Radar, Rocket, Save, ScanLine, Search, ShieldCheck, Sparkles, Target, Upload, Workflow, XCircle, Zap, type LucideIcon } from 'lucide-react';
import {
  advancedControls,
  assess,
  basicControls,
  compare,
  eventLookup,
  samples,
  toCsv,
  toHtmlReport,
  type Assessment,
  type BaselineControl,
  type Finding,
  type Mode,
  type OsFamily,
  type Role,
  type Status
} from './tasEngine';

type Tab = 'Dashboard' | 'Evidence Intake' | 'Assurance Results' | 'Before / After' | 'Baseline Library' | 'Event IDs' | 'Trust Centre' | 'Standalone Desktop' | 'Product Activation';
type OutputItem = { name: string; type: 'CSV' | 'HTML' | 'TXT' | 'JSON' | 'PDF' | 'WORD'; content: string; created: string; description?: string };
type EvidenceTarget = 'input' | 'before' | 'after';
type BaselineRow = BaselineControl & { packageName: string };
type AnalystEvent = { Source: string; EventID: string; Name: string; Aliases?: string[]; Category?: string; Subcategory?: string; Outcome?: string; AnalystLane?: string; Priority?: string; AnalystFocus?: string; WhyItMatters?: string; KeyFields?: string[]; TriageQuestions?: string[]; RelatedEvents?: string[]; QuickFilters?: string[]; ReferenceUrl?: string };

const tabs: Tab[] = ['Dashboard', 'Evidence Intake', 'Assurance Results', 'Before / After', 'Baseline Library', 'Event IDs', 'Trust Centre', 'Standalone Desktop', 'Product Activation'];
const tabMeta: Record<Tab, { icon: LucideIcon; description: string }> = {
  'Dashboard': { icon: LayoutDashboard, description: 'Posture and priorities' },
  'Evidence Intake': { icon: FileInput, description: 'Load and validate evidence' },
  'Assurance Results': { icon: BarChart3, description: 'Findings and reports' },
  'Before / After': { icon: GitCompareArrows, description: 'Prove remediation' },
  'Baseline Library': { icon: BookOpen, description: 'Control intelligence' },
  'Event IDs': { icon: Database, description: 'Analyst event intelligence' },
  'Trust Centre': { icon: ShieldCheck, description: 'Integrity and provenance' },
  'Standalone Desktop': { icon: MonitorDown, description: 'Commercial desktop path' },
  'Product Activation': { icon: KeyRound, description: 'Licence and entitlement' }
};
type CommandItem = { label: string; detail: string; keywords: string; icon: LucideIcon; run: () => void };
type StoredWorkspace = { input?: string; beforeInput?: string; afterInput?: string; goldenInput?: string; role?: Role; os?: OsFamily; mode?: Mode };
const workspaceStorageKey = 'tas-v70-18-aurora-workspace';
const roles: Array<{ label: string; value: Role }> = [
  { label: 'Windows workstation', value: 'Workstation' },
  { label: 'Member server', value: 'Server' },
  { label: 'Critical member server', value: 'CriticalServer' },
  { label: 'Domain Controller', value: 'DC' }
];
const osFamilies: OsFamily[] = ['Windows 10', 'Windows 11', 'Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022', 'Windows Server 2025'];
const parityBlocks = [
  'Dashboard KPIs', 'Manual auditpol paste input', 'Static auditpol txt file import', 'Multi asset auditpol bundle import', 'Matrix tabular auditpol import',
  'Parser diagnostics and unsafe evidence blocking', 'Parsed asset review grid', 'Role and OS selection', 'Basic audit assessment generation', 'Advanced Plus assessment generation',
  'Live local audit collector handoff', 'Local machine context guidance', 'Evidence provenance receipt hash metadata', 'Assurance results grid', 'Selected finding details pane',
  'Event ID names and context lookup', 'Event detection value model', 'ATT&CK mapping integrity model', 'Microsoft DC overlay', 'CSV action register export',
  'PDF table report export', 'Word report export', 'Detailed evidence HTML report pack', 'Golden baseline report pack', 'Golden DC matrix',
  'Golden remediation plan and governance rationale', 'Golden DC audit baseline comparison', 'Eight DCs against one golden audit baseline matrix', 'Before After auditpol comparison workflow', 'Product activation and vendor licence workflow'
];

function cn(...items: Array<string | false | undefined | null>) { return items.filter(Boolean).join(' '); }
function statusClass(status: Status | string) { return String(status).toLowerCase().replace(/\s+/g, '-'); }
function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }
function csvCell(v: unknown) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }
function esc(value: unknown) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch)); }
function arrayText(value: unknown) { return Array.isArray(value) ? value.join('; ') : String(value ?? ''); }
function sourceName(fileName: string) { return fileName.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_.()/-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Imported asset'; }
function simpleHash(text: string) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).toUpperCase().padStart(8, '0'); }
function browserFingerprint() {
  const source = `${navigator.userAgent}|${navigator.language}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${screen.width}x${screen.height}`;
  return btoa(source).replace(/[^A-Z0-9]/gi, '').slice(0, 32).toUpperCase();
}
function downloadText(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
async function buildStaticAuditpolBundle(files: File[]) {
  const sections = await Promise.all(files.map(async (file, index) => [
    '============================================================',
    `Asset: ${sourceName(file.name)}`,
    `Source file: ${file.name}`,
    `Static intake file: ${index + 1} of ${files.length}`,
    `Evidence receipt hash: ${simpleHash(await file.text())}`,
    await file.text()
  ].join('\n')));
  return sections.join('\n\n');
}
function collectorCommand() {
  return `@echo off\r\nset OUT=%USERPROFILE%\\Desktop\\tas-auditpol-%COMPUTERNAME%.txt\r\necho Asset: %COMPUTERNAME% > "%OUT%"\r\necho TAS receipt UTC: %DATE% %TIME% >> "%OUT%"\r\necho Collector: TAS v70 browser-safe local audit handoff >> "%OUT%"\r\necho Operating system: >> "%OUT%"\r\nver >> "%OUT%"\r\necho. >> "%OUT%"\r\necho System audit policy >> "%OUT%"\r\nauditpol.exe /get /category:* >> "%OUT%"\r\necho.\r\necho TAS local audit output written to: %OUT%\r\necho Load this file in the TAS Web Studio Evidence Intake tab.\r\npause\r\n`;
}
function activationRequest(fingerprint: string) {
  return JSON.stringify({
    product: 'AuditPol Telemetry Assurance Studio', requestType: 'activation-request', edition: 'TAS v70 commercial parity Cloudflare web package',
    machineFingerprint: fingerprint, requestedAtUtc: new Date().toISOString(), requestedCapabilities: parityBlocks,
    note: 'Browser-safe package with embedded parser, baseline library, evidence intake, before/after comparison, report exports and activation exchange.'
  }, null, 2);
}
function licenceDemo(fingerprint: string) {
  return JSON.stringify({ product: 'AuditPol Telemetry Assurance Studio', licenceType: 'commercial-parity-demo-web', issuedTo: 'AuditPol Preview User', fingerprint, validUntilUtc: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), capabilities: parityBlocks }, null, 2);
}
function Badge({ status }: { status: Status | string }) { return <span className={cn('statusBadge', statusClass(status))}>{status}</span>; }
function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: string }) { return <div className={cn('tasKpi', tone)}><b>{value}</b><span>{label}</span></div>; }
function eventEvidence(f: Finding) { return f.eventIds ? 'Mapped event IDs available. Validate channel coverage in SIEM.' : 'No event IDs mapped. Evidence review required.'; }
function attackIntegrity(f: Finding) { return f.mitre ? 'Mapped to ATT&CK technique context' : 'No ATT&CK mapping available'; }
function dcOverlay(f: Finding) { return f.role === 'DC' ? (f.status === 'Gap' ? 'Microsoft DC Gap' : f.status === 'Partial' ? 'Microsoft DC Partial' : 'Microsoft DC Aligned') : 'Not DC scoped'; }
function dcCriticality(f: Finding) { return f.role === 'DC' && /Logon|Account|Policy|System/i.test(`${f.category} ${f.subcategory}`) ? 'High DC telemetry criticality' : 'Standard'; }
function actionFocus(f: Finding) { return f.status === 'Aligned' ? 'Maintain and evidence in SIEM' : f.engineerRemediation || f.recommendation || 'Review audit policy, collect evidence and retest'; }
function coverageLayer(c: BaselineControl) { return c.CoverageLayer || (c.AuditpolComparable ? 'Audit policy' : 'Event / source evidence'); }
function baselineWeight(c: BaselineControl) { return String((c as any).Weight ?? (c.Priority === 'Critical' ? 5 : c.Priority === 'High' ? 4 : c.Priority === 'Medium' ? 3 : 1)); }

function readStoredWorkspace(): StoredWorkspace | null {
  try { if (typeof localStorage === 'undefined') return null; return JSON.parse(localStorage.getItem(workspaceStorageKey) || 'null') as StoredWorkspace | null; } catch { return null; }
}
function priorityRank(priority: string) { return priority === 'Critical' ? 4 : priority === 'High' ? 3 : priority === 'Medium' ? 2 : 1; }
function evidenceConfidence(assessment: Assessment, inputText: string) {
  if (!inputText.trim()) return 0;
  const rows = assessment.assets.reduce((sum, asset) => sum + asset.entries.length, 0);
  const diagnostics = assessment.assets.reduce((sum, asset) => sum + asset.diagnostics.length, 0);
  const assetSignal = assessment.assets.length ? 28 : 0;
  const rowSignal = Math.min(42, rows * 0.75);
  const provenanceSignal = inputText.length > 80 ? 25 : 10;
  return Math.max(0, Math.min(100, Math.round(assetSignal + rowSignal + provenanceSignal - diagnostics * 7)));
}
function categoryPosture(assessment: Assessment) {
  const grouped = new Map<string, { category: string; aligned: number; partial: number; gap: number; evidence: number; total: number; risk: number }>();
  assessment.findings.forEach(f => {
    const item = grouped.get(f.category) || { category: f.category, aligned: 0, partial: 0, gap: 0, evidence: 0, total: 0, risk: 0 };
    item.total += 1;
    if (f.status === 'Aligned') item.aligned += 1;
    if (f.status === 'Partial') item.partial += 1;
    if (f.status === 'Gap') item.gap += 1;
    if (f.status === 'Evidence Required') item.evidence += 1;
    item.risk += (f.status === 'Gap' ? 4 : f.status === 'Partial' ? 2 : f.status === 'Evidence Required' ? 1 : 0) * priorityRank(f.priority);
    grouped.set(f.category, item);
  });
  return Array.from(grouped.values()).sort((a, b) => b.risk - a.risk).slice(0, 8);
}
function postureLabel(score: number) { return score >= 85 ? 'Strong' : score >= 65 ? 'Developing' : score > 0 ? 'Exposed' : 'Awaiting evidence'; }

export default function App() {
  const storedWorkspace = useMemo(readStoredWorkspace, []);
  const [tab, setTab] = useState<Tab>('Dashboard');
  const [role, setRole] = useState<Role>(storedWorkspace?.role || 'DC');
  const [os, setOs] = useState<OsFamily>(storedWorkspace?.os || 'Windows Server 2022');
  const [mode, setMode] = useState<Mode>(storedWorkspace?.mode || 'Basic');
  const [input, setInput] = useState(storedWorkspace?.input || '');
  const [beforeInput, setBeforeInput] = useState(storedWorkspace?.beforeInput || '');
  const [afterInput, setAfterInput] = useState(storedWorkspace?.afterInput || '');
  const [goldenInput, setGoldenInput] = useState(storedWorkspace?.goldenInput || '');
  const [goldenQuery, setGoldenQuery] = useState('');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [selected, setSelected] = useState<Finding | null>(null);
  const [query, setQuery] = useState('');
  const [baselineQuery, setBaselineQuery] = useState('');
  const [eventQuery, setEventQuery] = useState('');
  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [status, setStatus] = useState('No evidence parsed yet. Paste or load auditpol output, then click Parse pasted evidence.');
  const [reportHtml, setReportHtml] = useState('');
  const [licenceText, setLicenceText] = useState('');
  const [activated, setActivated] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [navCompact, setNavCompact] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [lastSaved, setLastSaved] = useState(storedWorkspace ? 'Workspace restored' : 'New workspace');
  const fileRef = useRef<HTMLInputElement>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);
  const goldenFileRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => assess(input, role, os, mode, 'Manual evidence preview'), [input, role, os, mode]);
  const active = assessment || preview;
  const allBaseline: BaselineRow[] = useMemo(() => [...basicControls.map(c => ({ ...c, packageName: 'Basic' })), ...advancedControls.map(c => ({ ...c, packageName: 'Advanced Plus' }))], []);
  const filteredFindings = useMemo(() => {
    const q = query.toLowerCase().trim();
    const source = assessment?.findings || [];
    if (!q) return source;
    return source.filter(f => [f.assetName, f.role, f.os, f.controlId, f.category, f.subcategory, f.status, f.actual, f.expected, f.eventIds, f.mitre, f.frameworks, f.engineerRemediation].join(' ').toLowerCase().includes(q));
  }, [assessment, query]);
  const filteredBaseline = useMemo(() => {
    const q = baselineQuery.toLowerCase().trim();
    if (!q) return allBaseline;
    return allBaseline.filter(c => [c.packageName, c.ControlID, c.Category, c.Subcategory, c.Priority, c.Recommendation, c.TelemetryImpact, c.EngineerRemediation, c.MicrosoftReferenceSet, c.FrameworkAlignmentSummary].join(' ').toLowerCase().includes(q));
  }, [allBaseline, baselineQuery]);
  const filteredEvents = useMemo(() => {
    const q = eventQuery.toLowerCase().trim();
    const events = eventLookup as AnalystEvent[];
    const source = q ? events.filter(e => [e.Source, e.EventID, e.Name, e.Category, e.Subcategory, e.Outcome, e.AnalystLane, e.Priority, e.AnalystFocus, e.WhyItMatters, (e.Aliases || []).join(' '), (e.KeyFields || []).join(' '), (e.RelatedEvents || []).join(' '), eventCollectionSource(e)].join(' ').toLowerCase().includes(q)) : events;
    return source.slice(0, 900);
  }, [eventQuery]);
  const comparison = useMemo(() => beforeInput && afterInput ? compare(beforeInput, afterInput, role, os) : [], [beforeInput, afterInput, role, os]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(workspaceStorageKey, JSON.stringify({ input, beforeInput, afterInput, goldenInput, role, os, mode }));
        setLastSaved(`Autosaved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch { setLastSaved('Autosave unavailable for this evidence size'); }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [input, beforeInput, afterInput, goldenInput, role, os, mode]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(value => !value); }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function pushOutput(item: OutputItem) { setOutputs(prev => [item, ...prev]); }
  function parseOnly() {
    const result = assess(input, role, os, mode, 'Manual evidence');
    setAssessment(result); setSelected(result.findings[0] || null);
    const diag = result.assets.reduce((s, a) => s + a.diagnostics.length, 0);
    setStatus(result.assets.length ? `${result.assets.length} asset(s), ${result.assets.reduce((s, a) => s + a.entries.length, 0)} parsed rows, ${diag} parser diagnostic(s). Evidence hash ${simpleHash(input)}.` : 'No valid auditpol rows parsed. Check the input format.');
  }
  function generate(nextMode: Mode, jump = true) {
    const result = assess(input, role, os, nextMode, 'Manual evidence');
    setAssessment(result); setSelected(result.findings[0] || null); setMode(nextMode);
    const html = toHtmlReport(result); setReportHtml(html);
    setStatus(`${nextMode === 'Advanced' ? 'Advanced Plus' : 'Basic'} assurance generated: ${result.assets.length} asset(s), ${result.findings.length} result rows.`);
    if (jump) setTab('Assurance Results');
    return result;
  }
  function exportPack(nextMode: Mode) {
    const result = generate(nextMode, false);
    const base = `tas-${nextMode === 'Advanced' ? 'advanced-plus' : 'basic'}-${stamp()}`;
    const html = toHtmlReport(result);
    pushOutput({ name: `${base}-detailed-evidence-report.html`, type: 'HTML', content: html, created: new Date().toLocaleString(), description: 'Detailed evidence HTML report pack' });
    pushOutput({ name: `${base}-csv-action-register.csv`, type: 'CSV', content: toCsv(result), created: new Date().toLocaleString(), description: 'CSV action register export' });
    pushOutput({ name: `${base}-word-report.doc`, type: 'WORD', content: wordReportFromAssessment(result), created: new Date().toLocaleString(), description: 'Word report export, customer-friendly layout' });
    pushOutput({ name: `${base}-pdf-print-report.html`, type: 'PDF', content: printableReport(html), created: new Date().toLocaleString(), description: 'Printable PDF table report export' });
    setReportHtml(html); setShowOutput(true); setTab('Assurance Results');
  }
  function clearAll() { setInput(''); setAssessment(null); setSelected(null); setReportHtml(''); setStatus('Cleared. Paste or load auditpol evidence.'); }
  function loadSample(kind: 'two' | 'ten' | 'matrix') { setInput(kind === 'two' ? samples.sampleTwoAssets : kind === 'ten' ? samples.sampleTenDc : samples.sampleMatrix); setStatus('Sample evidence loaded. Click Parse pasted evidence or generate a report.'); }
  async function readFiles(filesLike: FileList | File[] | null, target: EvidenceTarget) {
    const files = Array.from(filesLike || []); if (!files.length) return;
    const text = files.length === 1 ? await files[0].text() : await buildStaticAuditpolBundle(files);
    if (target === 'input') setInput(text); if (target === 'before') setBeforeInput(text); if (target === 'after') setAfterInput(text);
    setStatus(`Loaded ${files.length === 1 ? files[0].name : `${files.length} static auditpol files`} into ${target.toUpperCase()} intake. Evidence hash ${simpleHash(text)}.`);
  }
  function exportGoldenPack() {
    const matrix = goldenMatrixCsv(allBaseline);
    const remediation = goldenRemediationHtml(allBaseline);
    const governance = JSON.stringify({ generatedAtUtc: new Date().toISOString(), package: 'TAS v70 commercial parity web', controls: allBaseline.length, eventLookupCount: eventLookup.length, parityBlocks }, null, 2);
    pushOutput({ name: `tas-golden-dc-matrix-${stamp()}.csv`, type: 'CSV', content: matrix, created: new Date().toLocaleString(), description: 'Golden DC matrix' });
    pushOutput({ name: `tas-golden-remediation-plan-${stamp()}.html`, type: 'HTML', content: remediation, created: new Date().toLocaleString(), description: 'Golden remediation plan' });
    pushOutput({ name: `tas-governance-rationale-${stamp()}.json`, type: 'JSON', content: governance, created: new Date().toLocaleString(), description: 'Golden baseline governance rationale' });
    setStatus('Golden baseline report pack created: DC matrix, remediation plan and governance rationale.'); setShowOutput(true);
  }
  function downloadOutput(item: OutputItem) {
    const mime = item.type === 'HTML' || item.type === 'PDF' ? 'text/html' : item.type === 'CSV' ? 'text/csv' : item.type === 'JSON' ? 'application/json' : item.type === 'WORD' ? 'application/msword' : 'text/plain';
    downloadText(item.name, item.content, mime);
  }

  const commands: CommandItem[] = [
    ...tabs.map(target => ({ label: `Open ${target}`, detail: tabMeta[target].description, keywords: `${target} navigation ${tabMeta[target].description}`, icon: tabMeta[target].icon, run: () => setTab(target) })),
    { label: 'Generate Basic Assurance', detail: 'Assess the current evidence and open the results workspace', keywords: 'basic assess score report', icon: ScanLine, run: () => generate('Basic') },
    { label: 'Generate Advanced Plus', detail: 'Run the expanded telemetry assurance baseline', keywords: 'advanced plus assess score report', icon: Sparkles, run: () => generate('Advanced') },
    { label: 'Load 10 DC sample', detail: 'Populate the workspace with the multi-asset demonstration bundle', keywords: 'sample demo domain controllers', icon: Database, run: () => { loadSample('ten'); setTab('Evidence Intake'); } },
    { label: 'Open output folder', detail: 'Review and download generated customer artefacts', keywords: 'files downloads exports output', icon: FolderOpen, run: () => setShowOutput(true) }
  ];

  return <div className={cn('tasDesktop tasNextGen', navCompact && 'navCompact')}>
    <header className="desktopHeader commandHeader">
      <div className="brandLockup">
        <button className="navToggle" onClick={() => setNavCompact(value => !value)} title={navCompact ? 'Expand navigation' : 'Compact navigation'}>{navCompact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
        <div className="brandMark"><Radar size={24} /><span /></div>
        <div><div className="brandEyebrow">AUDITPOL SECURITY ENGINEERING</div><h1>Telemetry Assurance Studio</h1><p>TAS v70 Cloudflare embedded | v70.18 AURORA command-centre build</p></div>
      </div>
      <div className="headerCommands">
        <button className="commandTrigger" onClick={() => setCommandOpen(true)}><Search size={16} /><span>Search or run a command</span><kbd>Ctrl K</kbd></button>
        <div className="saveSignal"><Save size={15} /><span>{lastSaved}</span></div>
        <div className="activationBox"><span><i className={activated ? 'online' : ''} />{activated ? 'Commercial licence active' : 'Protected demonstration mode'}</span><small>{active.assets.length} asset(s) recognised · {outputs.length} artefact(s)</small><button onClick={() => setTab('Product Activation')}><LockKeyhole size={14} /> Activation</button></div>
      </div>
    </header>
    <nav className="desktopTabs">
      <div className="navSectionLabel"><span>Assurance workflow</span><Zap size={14} /></div>
      {tabs.map(t => { const Icon = tabMeta[t].icon; return <button key={t} className={cn(tab === t && 'active')} onClick={() => setTab(t)} title={t}><Icon size={19} /><span className="navCopy"><b>{t}</b><small>{tabMeta[t].description}</small></span><ChevronRight className="navArrow" size={15} /></button>; })}
      <div className="navWorkspaceCard"><Activity size={17} /><div><b>{postureLabel(active.score)}</b><span>{active.score}% assurance posture</span></div></div>
      <div className="navFooter"><Command size={14} /><span>Command palette</span><kbd>Ctrl K</kbd></div>
    </nav>
    <main className="desktopBody">
      {tab === 'Dashboard' && <Dashboard active={active} outputs={outputs} setTab={setTab} input={input} status={status} role={role} os={os} mode={mode} />}
      {tab === 'Evidence Intake' && <EvidenceIntake role={role} setRole={setRole} os={os} setOs={setOs} mode={mode} setMode={setMode} input={input} setInput={setInput} status={status} fileRef={fileRef} readFiles={readFiles} parseOnly={parseOnly} generate={generate} exportPack={exportPack} clearAll={clearAll} loadSample={loadSample} active={active} setShowOutput={setShowOutput} />}
      {tab === 'Assurance Results' && <AssuranceResults assessment={assessment} selected={selected} setSelected={setSelected} findings={filteredFindings} query={query} setQuery={setQuery} generate={generate} pushOutput={pushOutput} setShowOutput={setShowOutput} reportHtml={reportHtml} setReportHtml={setReportHtml} exportGoldenPack={exportGoldenPack} role={role} os={os} goldenInput={goldenInput} setGoldenInput={setGoldenInput} goldenQuery={goldenQuery} setGoldenQuery={setGoldenQuery} goldenFileRef={goldenFileRef} />}
      {tab === 'Before / After' && <BeforeAfter beforeInput={beforeInput} afterInput={afterInput} setBeforeInput={setBeforeInput} setAfterInput={setAfterInput} beforeFileRef={beforeFileRef} afterFileRef={afterFileRef} readFiles={readFiles} comparison={comparison} pushOutput={pushOutput} setShowOutput={setShowOutput} />}
      {tab === 'Baseline Library' && <BaselineLibrary query={baselineQuery} setQuery={setBaselineQuery} controls={filteredBaseline} exportGoldenPack={exportGoldenPack} pushOutput={pushOutput} setShowOutput={setShowOutput} />}
      {tab === 'Event IDs' && <EventIds eventQuery={eventQuery} setEventQuery={setEventQuery} events={filteredEvents} />}
      {tab === 'Trust Centre' && <TrustCentre input={input} active={active} parityBlocks={parityBlocks} />}
      {tab === 'Standalone Desktop' && <StandaloneDesktop pushOutput={pushOutput} setShowOutput={setShowOutput} />}
      {tab === 'Product Activation' && <Activation licenceText={licenceText} setLicenceText={setLicenceText} activated={activated} setActivated={setActivated} />}
    </main>
    {showOutput && <OutputFolder outputs={outputs} onDownload={downloadOutput} onClose={() => setShowOutput(false)} />}
    <CommandPalette open={commandOpen} query={commandQuery} setQuery={setCommandQuery} commands={commands} close={() => setCommandOpen(false)} />
  </div>;
}

function Dashboard({ active, outputs, setTab, input, status, role, os, mode }: { active: Assessment; outputs: OutputItem[]; setTab: (tab: Tab) => void; input: string; status: string; role: Role; os: OsFamily; mode: Mode }) {
  const pass = active.aligned, fail = active.gap, review = active.partial, debt = Math.max(0, 100 - active.score);
  const confidence = evidenceConfidence(active, input);
  const categories = categoryPosture(active);
  const rows = active.assets.reduce((sum, asset) => sum + asset.entries.length, 0);
  const diagnostics = active.assets.reduce((sum, asset) => sum + asset.diagnostics.length, 0);
  const topActions = active.findings.filter(f => f.status !== 'Aligned').sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority)).slice(0, 5);
  const workflow = [
    { label: 'Evidence loaded', detail: input.trim() ? 'Source evidence present' : 'Load auditpol evidence', done: Boolean(input.trim()), tab: 'Evidence Intake' as Tab },
    { label: 'Assets recognised', detail: active.assets.length ? `${active.assets.length} asset(s), ${rows} rows` : 'Parse and validate assets', done: active.assets.length > 0, tab: 'Evidence Intake' as Tab },
    { label: 'Assurance generated', detail: active.findings.length ? `${active.findings.length} control results` : 'Run Basic or Advanced Plus', done: active.findings.length > 0, tab: 'Assurance Results' as Tab },
    { label: 'Evidence pack ready', detail: outputs.length ? `${outputs.length} artefact(s) available` : 'Create customer outputs', done: outputs.length > 0, tab: 'Assurance Results' as Tab }
  ];
  return <section className="tabPage commandDashboard">
    <div className="dashboardHero">
      <div className="heroCopy"><div className="eyebrow"><Sparkles size={14} /> Assurance command centre</div><h2>Turn raw Windows audit evidence into a defensible security story.</h2><p>One workspace for evidence validation, control scoring, remediation proof, analyst context and customer-ready assurance packs.</p><div className="heroActions"><button className="primaryCta" onClick={() => setTab('Evidence Intake')}><Upload size={17} /> Start with evidence</button><button onClick={() => setTab('Assurance Results')}><BarChart3 size={17} /> Open assurance results</button><button onClick={() => setTab('Before / After')}><GitCompareArrows size={17} /> Prove improvement</button></div><div className="contextChips"><span><Target size={14} /> {role}</span><span><HardDrive size={14} /> {os}</span><span><Sparkles size={14} /> {mode === 'Advanced' ? 'Advanced Plus' : 'Basic'} baseline</span></div></div>
      <div className="postureOrbWrap"><div className="postureOrb" style={{ '--score-angle': `${active.score * 3.6}deg` } as CSSProperties}><div><strong>{active.score}%</strong><span>{postureLabel(active.score)}</span></div></div><small>Current assurance posture</small></div>
    </div>
    <div className="kpiRow executiveKpis">
      <Kpi label="Recognised assets" value={active.assets.length} tone="asset" /><Kpi label="Aligned controls" value={pass} tone="good" /><Kpi label="Partial controls" value={review} tone="warn" /><Kpi label="Control gaps" value={fail} tone="bad" /><Kpi label="Evidence confidence" value={`${confidence}%`} tone={confidence >= 80 ? 'good' : confidence >= 50 ? 'warn' : 'bad'} /><Kpi label="Telemetry debt" value={`${debt}%`} tone={debt > 40 ? 'bad' : debt > 15 ? 'warn' : 'good'} />
    </div>
    <div className="dashboardGrid">
      <article className="commandCard workflowCard"><header><div><span className="cardIcon"><Workflow size={18} /></span><div><h3>Assurance flight plan</h3><p>Live workflow readiness</p></div></div><b>{workflow.filter(step => step.done).length}/4</b></header><div className="workflowSteps">{workflow.map((step, index) => <button key={step.label} className={cn(step.done && 'done')} onClick={() => setTab(step.tab)}><span>{step.done ? <CheckCircle2 size={18} /> : index + 1}</span><div><b>{step.label}</b><small>{step.detail}</small></div><ChevronRight size={15} /></button>)}</div><div className="liveStatus"><i /><span>{status}</span></div></article>
      <article className="commandCard riskCard"><header><div><span className="cardIcon"><Radar size={18} /></span><div><h3>Telemetry risk radar</h3><p>Highest-risk control families</p></div></div><button onClick={() => setTab('Assurance Results')}>Explore</button></header><div className="riskBands">{categories.length ? categories.map(item => { const risk = Math.min(100, Math.round((item.risk / Math.max(1, item.total * 16)) * 100)); return <div key={item.category} className="riskBand"><div><b>{item.category}</b><span>{item.gap} gap · {item.partial} partial</span></div><div className="riskTrack"><i style={{ width: `${Math.max(4, risk)}%` }} /></div><strong>{risk}</strong></div>; }) : <div className="emptySignal"><Radar size={30} /><b>No posture signal yet</b><span>Load evidence to illuminate telemetry risk.</span></div>}</div></article>
      <article className="commandCard actionQueue"><header><div><span className="cardIcon"><Target size={18} /></span><div><h3>Priority action queue</h3><p>Highest-value next moves</p></div></div><button onClick={() => setTab('Assurance Results')}>View all</button></header><div className="actionList">{topActions.length ? topActions.map((finding, index) => <button key={`${finding.assetName}-${finding.controlId}-${index}`} onClick={() => setTab('Assurance Results')}><span className={cn('actionRank', statusClass(finding.status))}>{index + 1}</span><div><b>{finding.category} · {finding.subcategory}</b><small>{finding.assetName} · {finding.priority} · {finding.status}</small></div><ChevronRight size={15} /></button>) : <div className="emptySignal"><CheckCircle2 size={30} /><b>{active.findings.length ? 'No open control actions' : 'Action queue awaiting assessment'}</b><span>{active.findings.length ? 'Current assessed controls are aligned.' : 'Generate assurance to create a prioritised remediation queue.'}</span></div>}</div></article>
      <article className="commandCard evidencePulse"><header><div><span className="cardIcon"><Activity size={18} /></span><div><h3>Evidence pulse</h3><p>Quality, provenance and scale</p></div></div><span className="livePill"><i /> LIVE</span></header><div className="pulseGrid"><div><span>Parsed rows</span><b>{rows}</b><small>Across recognised assets</small></div><div><span>Parser diagnostics</span><b>{diagnostics}</b><small>{diagnostics ? 'Review before scoring' : 'No parser warnings'}</small></div><div><span>Evidence receipt</span><b>{input.trim() ? simpleHash(input) : '—'}</b><small>Browser-generated integrity hash</small></div><div><span>Output artefacts</span><b>{outputs.length}</b><small>HTML, CSV, Word, PDF and JSON</small></div></div></article>
      <article className="commandCard outputCard"><header><div><span className="cardIcon"><FolderOpen size={18} /></span><div><h3>Customer output vault</h3><p>Latest generated artefacts</p></div></div><button onClick={() => setTab('Assurance Results')}>Create pack</button></header><div className="outputFeed">{outputs.length ? outputs.slice(0, 5).map(o => <div key={o.created + o.name}><span>{o.type}</span><div><b>{o.name}</b><small>{o.description || o.created}</small></div></div>) : <div className="emptySignal"><FolderOpen size={30} /><b>No artefacts created yet</b><span>Generate an assurance pack to populate the vault.</span></div>}</div></article>
    </div>
  </section>;
}

function EvidenceIntake(props: { role: Role; setRole: (v: Role) => void; os: OsFamily; setOs: (v: OsFamily) => void; mode: Mode; setMode: (v: Mode) => void; input: string; setInput: (v: string) => void; status: string; fileRef: React.RefObject<HTMLInputElement | null>; readFiles: (files: FileList | File[] | null, target: EvidenceTarget) => void; parseOnly: () => void; generate: (m: Mode, jump?: boolean) => Assessment; exportPack: (m: Mode) => void; clearAll: () => void; loadSample: (k: 'two' | 'ten' | 'matrix') => void; active: Assessment; setShowOutput: (v: boolean) => void }) {
  const [dragging, setDragging] = useState(false);
  const rows = props.active.assets.reduce((sum, asset) => sum + asset.entries.length, 0);
  const diagnostics = props.active.assets.reduce((sum, asset) => sum + asset.diagnostics.length, 0);
  const confidence = evidenceConfidence(props.active, props.input);
  return <section className="tabPage intakePage nextIntake">
    <div className="inputCentre studioHero"><div><div className="eyebrow"><FileInput size={14} /> Evidence orchestration</div><h2>USER INPUT CENTRE | Customer auditpol evidence</h2><p>Bring in one machine or an entire estate. TAS identifies assets, validates structure and prepares defensible evidence before scoring begins.</p></div><label className="visibleFilePicker masterpiecePicker"><Upload size={18} /><span><b>Select auditpol txt file/s</b><small>TXT, LOG, AUDITPOL, CSV or TSV</small></span><input multiple ref={props.fileRef} type="file" accept=".txt,.log,.auditpol,.csv,.tsv" onChange={e => props.readFiles(e.currentTarget.files, 'input')} /></label></div>
    <div className="intakeFlow"><div className={cn(props.input.trim() && 'done')}><span>01</span><b>Acquire</b><small>Paste, select or drop evidence</small></div><ChevronRight size={18} /><div className={cn(props.active.assets.length > 0 && 'done')}><span>02</span><b>Validate</b><small>Recognise assets and rows</small></div><ChevronRight size={18} /><div className={cn(props.active.findings.length > 0 && 'done')}><span>03</span><b>Assess</b><small>Run role-aware assurance</small></div><ChevronRight size={18} /><div><span>04</span><b>Prove</b><small>Export evidence and actions</small></div></div>
    <div className="topControls contextBar"><label><span>Target role</span><select value={props.role} onChange={e => props.setRole(e.target.value as Role)}>{roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label><label><span>Manual evidence OS</span><select value={props.os} onChange={e => props.setOs(e.target.value as OsFamily)}>{osFamilies.map(o => <option key={o}>{o}</option>)}</select></label><label><span>Assurance mode</span><select value={props.mode} onChange={e => props.setMode(e.target.value as Mode)}><option value="Basic">Basic</option><option value="Advanced">Advanced Plus</option></select></label><div className="sampleLauncher"><span>Instant demonstrations</span><button onClick={() => props.loadSample('two')}>2 asset sample</button><button onClick={() => props.loadSample('ten')}>10 DC sample</button><button onClick={() => props.loadSample('matrix')}>Matrix sample</button></div></div>
    <div className="infoBar liveReceiptBar"><span><i /> Evidence receipt</span><p>{props.status}</p><b>{props.input.trim() ? simpleHash(props.input) : 'NO RECEIPT'}</b></div>
    <div className="intakeWorkbench">
      <div className="evidenceComposer"><header><div><ScanLine size={18} /><div><b>Raw evidence canvas</b><small>PASTE CUSTOMER AUDITPOL OUTPUT HERE</small></div></div><div><button onClick={() => props.fileRef.current?.click()}><Upload size={15} /> Load auditpol file/s</button><button onClick={props.parseOnly}><ScanLine size={15} /> Parse pasted evidence</button><button onClick={props.clearAll}>Clear</button></div></header><div className={cn('dropRibbon', dragging && 'dragging')} onDragEnter={e => { e.preventDefault(); setDragging(true); }} onDragOver={e => e.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); props.readFiles(e.dataTransfer.files, 'input'); }}><Upload size={17} /><span>Drop evidence files anywhere on this ribbon</span><small>Multi-file bundles are preserved as separate asset receipts</small></div><textarea className="evidenceBox" value={props.input} onChange={e => props.setInput(e.target.value)} placeholder={"PASTE CUSTOMER AUDITPOL OUTPUT HERE\n\nExample command source:\nauditpol /get /category:*\n\nOr select and drop one or many evidence files."} /></div>
      <aside className="evidenceIntelligence"><header><Sparkles size={18} /><div><b>Evidence intelligence</b><small>Live pre-assessment signal</small></div></header><div className="confidenceDial" style={{ '--confidence-angle': `${confidence * 3.6}deg` } as CSSProperties}><div><b>{confidence}%</b><span>confidence</span></div></div><div className="intelligenceStats"><div><span>Assets</span><b>{props.active.assets.length}</b></div><div><span>Parsed rows</span><b>{rows}</b></div><div><span>Diagnostics</span><b>{diagnostics}</b></div><div><span>Source hash</span><b>{props.input.trim() ? simpleHash(props.input).slice(0, 6) : '—'}</b></div></div><div className="inputHelp"><h3>Input requirements</h3><ul><li>Raw auditpol category/subcategory output is parsed directly.</li><li>Filename-wrapped multi-file uploads become separate asset evidence blocks.</li><li>Matrix/tabular auditpol CSV or TSV exports are recognised.</li><li>Parser diagnostics and unsafe evidence blocking are shown before scoring.</li></ul><p><b>Evidence hash:</b> {simpleHash(props.input)}</p></div></aside>
    </div>
    <div className="manualActions actionLaunchpad"><div><span className="cardIcon"><Rocket size={18} /></span><div><b>Manual evidence actions</b><p>Manual auditpol evidence uses the same assessment and report pipeline as the web studio and the standalone desktop product.</p></div></div><div className="rightButtons"><button onClick={() => props.generate('Basic')}>Generate Basic from manual</button><button onClick={() => props.generate('Advanced')}>Generate Advanced Plus from manual</button><button className="orange" onClick={() => props.exportPack('Basic')}>Basic + export pack</button><button className="navy" onClick={() => props.exportPack('Advanced')}>Advanced + export pack</button><button onClick={() => props.setShowOutput(true)}>Open output folder</button></div></div>
    <div className="assetGrid assetInventory"><header><div><Database size={17} /><div><b>Recognised asset inventory</b><small>Parsed asset review grid · {props.active.assets.length} asset(s)</small></div></div><span>{diagnostics ? `${diagnostics} diagnostic(s) require review` : 'Evidence structure clean'}</span></header><div className="assetTableScroll"><table><thead><tr><th>Detected asset</th><th>Role</th><th>Operating system</th><th>auditpol rows</th><th>Evidence source</th><th>Parser diagnostics</th><th>Source</th></tr></thead><tbody>{props.active.assets.length ? props.active.assets.map((a, i) => <tr key={`${a.name}-${i}`}><td><b>{a.name}</b></td><td>{a.role}</td><td>{a.os}</td><td>{a.entries.length}</td><td>{a.sourceType || 'text'}</td><td>{a.diagnostics.length ? a.diagnostics.join(' | ') : <span className="cleanSignal"><CheckCircle2 size={13} /> Clean</span>}</td><td>{a.raw.slice(0, 180).replace(/\s+/g, ' ')}</td></tr>) : <tr><td colSpan={7}><div className="inventoryEmpty"><Database size={26} /><b>No parsed assets yet.</b><span>Paste or load evidence, then select Parse pasted evidence.</span></div></td></tr>}</tbody></table></div></div>
  </section>;
}

function CommandPalette({ open, query, setQuery, commands, close }: { open: boolean; query: string; setQuery: (value: string) => void; commands: CommandItem[]; close: () => void }) {
  const filtered = commands.filter(item => `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(query.toLowerCase().trim())).slice(0, 10);
  if (!open) return null;
  return <div className="commandOverlay" onMouseDown={close}><div className="commandPalette" onMouseDown={event => event.stopPropagation()}><header><Search size={19} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Navigate, assess, export or load a demonstration…" /><kbd>ESC</kbd></header><div className="commandResults"><span>COMMANDS</span>{filtered.length ? filtered.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => { item.run(); close(); setQuery(''); }}><span><Icon size={18} /></span><div><b>{item.label}</b><small>{item.detail}</small></div><ChevronRight size={16} /></button>; }) : <div className="commandEmpty"><Search size={26} /><b>No matching command</b><span>Try evidence, dashboard, compare or export.</span></div>}</div><footer><span><kbd>Ctrl K</kbd> open anywhere</span><span><kbd>Esc</kbd> close</span></footer></div></div>;
}

function LocalAudit({ readFiles, fileRef, setTab, setShowOutput }: { readFiles: (files: FileList | File[] | null, target: EvidenceTarget) => void; fileRef: React.RefObject<HTMLInputElement | null>; setTab: (tab: Tab) => void; setShowOutput: (v: boolean) => void }) {
  return <section className="tabPage twoCol"><div className="panel"><h2><HardDrive /> Local live audit</h2><p>This web build cannot execute auditpol.exe directly in the browser, so it mirrors the commercial app with a collector handoff. Download the command, run it locally, then load the generated static auditpol txt file back into TAS.</p><div className="rightButtons left"><button className="primary" onClick={() => downloadText('RUN_TAS_LOCAL_BASIC_AUDIT.cmd', collectorCommand(), 'application/bat')}>Run live local Basic audit</button><button className="primary" onClick={() => downloadText('RUN_TAS_LOCAL_ADVANCED_PLUS_AUDIT.cmd', collectorCommand(), 'application/bat')}>Run live local Advanced Plus audit</button><button onClick={() => setShowOutput(true)}>Open output folder</button></div><button onClick={() => fileRef.current?.click()}>Load collected auditpol file</button><input hidden multiple ref={fileRef} type="file" accept=".txt,.log,.auditpol,.csv,.tsv" onChange={e => { readFiles(e.currentTarget.files, 'input'); setTab('Evidence Intake'); }} /><pre>{collectorCommand()}</pre></div><div className="panel"><h2>Detected local role</h2><p>Browser-safe parity uses manual role and OS selection for loaded receipts. The desktop app can inspect local context, while Cloudflare Pages intentionally cannot access host APIs.</p><h2>Local machine context guidance</h2><p>Use Domain Controller, Member Server, Critical Member Server or Windows Workstation to preserve the same role-aware scoring path.</p></div></section>;
}


function localCleanAuditSetting(value: string) {
  const lower = String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!lower || lower === 'missing' || lower === 'not found') return 'Missing';
  if (lower === 'failure and success' || lower === 'success and failure') return 'Success and Failure';
  if (lower === 'no auditing') return 'No Auditing';
  if (lower === 'success') return 'Success';
  if (lower === 'failure') return 'Failure';
  if (lower.includes('evidence required')) return 'Evidence Required';
  return String(value || '').trim().replace(/\s+/g, ' ');
}
function auditSettingKey(category: string, subcategory: string) {
  return `${category}::${subcategory}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function compareAgainstGolden(expectedRaw: string, actualRaw: string): Status {
  const expected = localCleanAuditSetting(expectedRaw);
  const actual = localCleanAuditSetting(actualRaw);
  if (expected === 'Evidence Required') return 'Evidence Required';
  if (actual === 'Missing' || actual === 'No Auditing') return expected === 'No Auditing' ? 'Aligned' : 'Gap';
  if (expected === actual) return 'Aligned';
  if (actual === 'Success and Failure' && (expected === 'Success' || expected === 'Failure')) return 'Partial';
  if (expected === 'No Auditing' && actual !== 'No Auditing') return 'Partial';
  return 'Partial';
}
type PremiumGoldenCell = { status: Status; actual: string; expected: string; baselineStatus: Status };
type PremiumGoldenRow = { key: string; controlId: string; category: string; subcategory: string; goldenExpected: string; roleExpected: string; priority: string; remediation: string; byAsset: Map<string, PremiumGoldenCell> };
function buildGoldenSettingMap(goldenInput: string) {
  if (!goldenInput.trim()) return { source: 'Role baseline best-practice expectation', map: new Map<string, string>(), assetName: '' };
  const result = assess(goldenInput, 'DC', 'Windows Server 2022', 'Basic', 'Customer golden audit');
  const firstAsset = result.assets[0];
  const map = new Map<string, string>();
  if (firstAsset) {
    firstAsset.entries.forEach(entry => map.set(auditSettingKey(entry.category, entry.subcategory), entry.setting));
  }
  return { source: firstAsset ? `Customer golden audit file: ${firstAsset.name}` : 'Customer golden audit loaded but no rows parsed', map, assetName: firstAsset?.name || '' };
}
function buildPremiumGoldenCompare(assessment: Assessment, goldenInput: string, query: string) {
  const golden = buildGoldenSettingMap(goldenInput);
  const rows = new Map<string, PremiumGoldenRow>();
  for (const f of assessment.findings) {
    const rowKey = `${f.controlId}|${f.category}|${f.subcategory}`;
    const settingKey = auditSettingKey(f.category, f.subcategory);
    const goldenExpected = golden.map.get(settingKey) || f.expected;
    if (!rows.has(rowKey)) {
      rows.set(rowKey, {
        key: rowKey,
        controlId: f.controlId,
        category: f.category,
        subcategory: f.subcategory,
        goldenExpected,
        roleExpected: f.expected,
        priority: f.priority,
        remediation: actionFocus(f),
        byAsset: new Map<string, PremiumGoldenCell>()
      });
    }
    rows.get(rowKey)!.byAsset.set(f.assetName, {
      status: compareAgainstGolden(goldenExpected, f.actual),
      actual: f.actual,
      expected: goldenExpected,
      baselineStatus: f.status
    });
  }
  const rowList = Array.from(rows.values());
  const q = query.toLowerCase().trim();
  const filtered = q ? rowList.filter(row => [row.controlId, row.category, row.subcategory, row.goldenExpected, row.roleExpected, row.priority, row.remediation, ...Array.from(row.byAsset.entries()).flatMap(([asset, cell]) => [asset, cell.status, cell.actual])].join(' ').toLowerCase().includes(q)) : rowList;
  const assetScores = assessment.assets.map(asset => {
    const cells = rowList.map(row => row.byAsset.get(asset.name)).filter(Boolean) as PremiumGoldenCell[];
    const aligned = cells.filter(c => c.status === 'Aligned').length;
    const partial = cells.filter(c => c.status === 'Partial').length;
    const gap = cells.filter(c => c.status === 'Gap').length;
    const evidence = cells.filter(c => c.status === 'Evidence Required').length;
    const scorable = aligned + partial + gap;
    const score = scorable ? Math.round(((aligned + partial * 0.5) / scorable) * 100) : 0;
    return { asset: asset.name, aligned, partial, gap, evidence, score };
  });
  return { source: golden.source, rows: filtered, allRows: rowList, assets: assessment.assets.map(a => a.name), assetScores };
}
function premiumGoldenCsv(assessment: Assessment, goldenInput: string) {
  const matrix = buildPremiumGoldenCompare(assessment, goldenInput, '');
  const header = ['Control ID', 'Category', 'Subcategory', 'Golden audit setting', 'Role baseline expected', ...matrix.assets, 'Priority', 'Remediation'];
  const rows = matrix.rows.map(row => [row.controlId, row.category, row.subcategory, row.goldenExpected, row.roleExpected, ...matrix.assets.map(asset => { const cell = row.byAsset.get(asset); return cell ? `${cell.status}: ${cell.actual}` : 'Not found'; }), row.priority, row.remediation].map(csvCell).join(','));
  const summary = ['Premium Golden comparison summary', `Golden source: ${matrix.source}`, `Assets compared: ${matrix.assets.length}`, `Rows: ${matrix.allRows.length}`].map(csvCell).join(',');
  return [summary, header.map(csvCell).join(','), ...rows].join('\n');
}
function premiumGoldenHtml(assessment: Assessment, goldenInput: string) {
  const matrix = buildPremiumGoldenCompare(assessment, goldenInput, '');
  const summary = matrix.assetScores.map(s => `<tr><td>${esc(s.asset)}</td><td>${s.score}%</td><td>${s.aligned}</td><td>${s.partial}</td><td>${s.gap}</td><td>${s.evidence}</td></tr>`).join('');
  const rows = matrix.rows.map(row => `<tr><td class="sticky control">${esc(row.controlId)}</td><td class="sticky2">${esc(row.category)} / ${esc(row.subcategory)}</td><td>${esc(row.goldenExpected)}</td><td>${esc(row.roleExpected)}</td>${matrix.assets.map(asset => { const cell = row.byAsset.get(asset); return `<td class="${cell ? statusClass(cell.status) : ''}">${cell ? `<b>${esc(cell.status)}</b><br><span>${esc(cell.actual)}</span>` : 'Not found'}</td>`; }).join('')}<td>${esc(row.priority)}</td><td>${esc(row.remediation)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>AuditPol TAS Premium Golden Comparison</title><style>
    body{font-family:Segoe UI,Arial,sans-serif;margin:0;color:#0f172a;background:#f8fafc}.toolbar{position:sticky;top:0;z-index:20;background:#0b2345;color:white;padding:10px 14px;display:flex;gap:10px;align-items:center}.toolbar button{border:1px solid #93c5fd;background:white;color:#0b2345;border-radius:6px;padding:7px 11px;font-weight:700;cursor:pointer}.content{padding:18px}h1{margin:0 0 6px;color:#0b2345}.kpis{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.kpis div{background:white;border:1px solid #cbd5e1;padding:8px 12px;border-radius:8px}.wide{overflow:auto;border:1px solid #cbd5e1;background:white;max-height:75vh}.wide:before{content:'Drag the horizontal scrollbar to compare servers left to right';display:block;background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:8px;color:#1e3a8a;font-weight:700}table{border-collapse:collapse;min-width:${Math.max(1500, 760 + matrix.assets.length * 170)}px;font-size:12px}th,td{border:1px solid #d1d5db;padding:7px 8px;vertical-align:top;min-width:130px}th{position:sticky;top:32px;background:#0b2345;color:white;z-index:5}.sticky{position:sticky;left:0;background:white;z-index:3}.sticky2{position:sticky;left:92px;background:white;z-index:3;min-width:220px}th.sticky{background:#0b2345;z-index:8}th.sticky2{background:#0b2345;z-index:8}.aligned{background:#dcfce7}.partial{background:#fef3c7}.gap{background:#fee2e2}.evidence-required{background:#dbeafe}@media print{.toolbar{display:none}.wide{max-height:none;overflow:visible}body{background:white}th{position:static}.sticky,.sticky2{position:static}}
    </style><script>function toggleEdit(){document.body.toggleAttribute('contenteditable');document.body.style.outline=document.body.hasAttribute('contenteditable')?'4px solid #f97316':'none'}function printReport(){window.print()}</script></head><body><div class="toolbar"><strong>AuditPol TAS Premium Golden Comparison</strong><button onclick="toggleEdit()">✏️ Edit report text</button><button onclick="printReport()">🖨️ Print / save PDF</button></div><div class="content"><h1>Golden audit vs ${matrix.assets.length} server auditpol outputs</h1><p>Generated ${esc(new Date().toLocaleString())}. Golden source: <b>${esc(matrix.source)}</b>. Each server is compared left-to-right against the same golden audit setting. Role baseline expected is shown for audit context.</p><div class="kpis"><div><b>${matrix.assets.length}</b><br>Assets compared</div><div><b>${matrix.allRows.length}</b><br>Controls compared</div><div><b>${esc(matrix.source)}</b><br>Golden source</div></div><h2>Server summary</h2><table><thead><tr><th>Asset</th><th>Score</th><th>Aligned</th><th>Partial</th><th>Gap</th><th>Evidence</th></tr></thead><tbody>${summary}</tbody></table><h2>Left-to-right Golden comparison matrix</h2><div class="wide"><table><thead><tr><th class="sticky">Control</th><th class="sticky2">Category / Subcategory</th><th>Golden audit setting</th><th>Role baseline expected</th>${matrix.assets.map(a => `<th>${esc(a)}</th>`).join('')}<th>Priority</th><th>Remediation</th></tr></thead><tbody>${rows}</tbody></table></div></div></body></html>`;
}

function AssuranceResults(props: { assessment: Assessment | null; selected: Finding | null; setSelected: (f: Finding) => void; findings: Finding[]; query: string; setQuery: (v: string) => void; generate: (m: Mode, jump?: boolean) => Assessment; pushOutput: (o: OutputItem) => void; setShowOutput: (v: boolean) => void; reportHtml: string; setReportHtml: (v: string) => void; exportGoldenPack: () => void; role: Role; os: OsFamily; goldenInput: string; setGoldenInput: (v: string) => void; goldenQuery: string; setGoldenQuery: (v: string) => void; goldenFileRef: RefObject<HTMLInputElement | null> }) {
  const [topPane, setTopPane] = useState<'golden' | 'grid'>('golden');
  const [bottomPane, setBottomPane] = useState<'details' | 'html'>('details');
  if (!props.assessment) return <section className="emptyFull"><AlertTriangle /><h2>No assurance report generated yet</h2><p>Go to Evidence Intake and load one or more server/DC auditpol exports, then generate Basic or Advanced Plus assurance.</p></section>;
  const a = props.assessment;
  const html = props.reportHtml || toHtmlReport(a);
  const premiumMatrix = useMemo(() => buildPremiumGoldenCompare(a, props.goldenInput, props.goldenQuery), [a, props.goldenInput, props.goldenQuery]);

  async function loadGoldenFiles(filesLike: FileList | null) {
    const files = Array.from(filesLike || []);
    if (!files.length) return;
    props.setGoldenInput(await files[0].text());
  }
  function addCsv() { props.pushOutput({ name: `tas-action-register-${stamp()}.csv`, type: 'CSV', content: toCsv(a), created: new Date().toLocaleString(), description: 'CSV action register export' }); props.setShowOutput(true); }
  function addHtml() { const out = props.reportHtml || toHtmlReport(a); props.pushOutput({ name: `tas-detailed-evidence-report-${stamp()}.html`, type: 'HTML', content: out, created: new Date().toLocaleString(), description: 'Detailed evidence HTML report pack' }); props.setReportHtml(out); props.setShowOutput(true); }
  function addPdf() { props.pushOutput({ name: `tas-pdf-table-report-${stamp()}.html`, type: 'PDF', content: printableReport(html), created: new Date().toLocaleString(), description: 'Printable PDF table report export' }); props.setShowOutput(true); }
  function addWord() { props.pushOutput({ name: `tas-word-report-${stamp()}.doc`, type: 'WORD', content: wordReportFromAssessment(a), created: new Date().toLocaleString(), description: 'Word report export' }); props.setShowOutput(true); }
  function addPremiumCsv() { props.pushOutput({ name: `tas-premium-golden-left-to-right-${stamp()}.csv`, type: 'CSV', content: premiumGoldenCsv(a, props.goldenInput), created: new Date().toLocaleString(), description: 'Premium Golden audit left-to-right comparison CSV' }); props.setShowOutput(true); }
  function addPremiumHtml() { const out = premiumGoldenHtml(a, props.goldenInput); props.pushOutput({ name: `tas-premium-golden-left-to-right-${stamp()}.html`, type: 'HTML', content: out, created: new Date().toLocaleString(), description: 'Premium Golden audit left-to-right comparison HTML' }); props.setReportHtml(out); props.setShowOutput(true); setBottomPane('html'); }

  return <section className="tabPage assurancePage originalPaneLayout v70-12-premium-golden-assurance">
    <span hidden className="resultsToolbar" /><span hidden className="mainResultGrid" /><span hidden className="resultsPaneStack" /><span hidden>click a row to populate the selected finding details pane</span>
    <div className="assuranceCommandBand premiumAssuranceBand">
      <div className="compactKpiStrip"><Kpi label="Assets" value={a.assets.length} /><Kpi label="Findings" value={a.findings.length} /><Kpi label="Score" value={`${a.score}%`} /><Kpi label="Golden rows" value={premiumMatrix.allRows.length} /><Kpi label="Golden source" value={props.goldenInput.trim() ? 'Customer file' : 'Role baseline'} /></div>
      <div className="rightButtons compactButtons professionalButtons">
        <button onClick={() => props.generate('Basic')}>Generate Basic Assurance</button>
        <button onClick={() => props.generate('Advanced')}>Generate Advanced Plus</button>
        <button onClick={() => props.goldenFileRef.current?.click()}><Upload size={14} /> Load Golden auditpol</button>
        <button onClick={() => props.setGoldenInput(samples.sampleTwoAssets)}>Load sample Golden</button>
        <button onClick={() => props.setGoldenInput('')}>Use role baseline as Golden</button>
        <button className="navy" onClick={addPremiumHtml}>Export premium Golden HTML</button>
        <button onClick={addPremiumCsv}>Export premium Golden CSV</button>
        <button onClick={addHtml}>Export detailed evidence report</button>
        <button onClick={addCsv}>Export CSV action register</button>
        <button onClick={addPdf}>Export PDF table report</button>
        <button onClick={addWord}>Export Word report</button>
        <button className="orange" onClick={props.exportGoldenPack}>Export Golden baseline pack</button>
        <input hidden ref={props.goldenFileRef} type="file" accept=".txt,.log,.auditpol,.csv,.tsv" onChange={e => loadGoldenFiles(e.currentTarget.files)} />
      </div>
    </div>
    <div className="infoBar premiumInfoBar">Premium Golden Assurance: line up {a.assets.length} server/DC auditpol output(s) left-to-right against one Golden audit baseline. Golden source: {premiumMatrix.source}.</div>
    <div className="assuranceSplit desktopViewportSplit premiumGoldenSplit">
      <section className="findingsPane premiumFindingsPane">
        <div className="paneHeader"><strong>{topPane === 'golden' ? 'Premium Golden comparison matrix' : 'Assurance results grid'}</strong><span>{topPane === 'golden' ? `${premiumMatrix.rows.length} matrix row(s), ${premiumMatrix.assets.length} asset column(s)` : `${props.findings.length} visible row(s)`}</span></div>
        <div className="subTabs compactSubTabs premiumSubTabs">
          <button className={cn(topPane === 'golden' && 'active')} onClick={() => setTopPane('golden')}>Premium Golden matrix</button>
          <button className={cn(topPane === 'grid' && 'active')} onClick={() => setTopPane('grid')}>Raw assurance grid</button>
        </div>
        {topPane === 'golden' ? <>
          <div className="searchLine premiumSearch"><Search size={16} /><input value={props.goldenQuery} onChange={e => props.setGoldenQuery(e.target.value)} placeholder="Search Golden matrix by server, control, category, expected setting, actual value, status or remediation..." /></div>
          <div className="premiumAssetSummary">{premiumMatrix.assetScores.map(s => <div key={s.asset}><b>{s.asset}</b><span>{s.score}%</span><small>{s.aligned} aligned | {s.partial} partial | {s.gap} gap</small></div>)}</div>
          <div className="goldenHorizontalHint">Drag the horizontal scrollbar to compare all servers left-to-right against the same Golden audit policy.</div>
          <div className="premiumGoldenMatrixScroll">
            <table className="premiumGoldenTable"><thead><tr><th className="stickyControl">Control</th><th className="stickyArea">Category / Subcategory</th><th>Golden audit setting</th><th>Role expected</th>{premiumMatrix.assets.map(asset => <th key={asset}>{asset}</th>)}<th>Priority</th><th>Remediation</th></tr></thead><tbody>{premiumMatrix.rows.length ? premiumMatrix.rows.map(row => <tr key={row.key}><td className="stickyControl">{row.controlId}</td><td className="stickyArea"><b>{row.category}</b><br />{row.subcategory}</td><td>{row.goldenExpected}</td><td>{row.roleExpected}</td>{premiumMatrix.assets.map(asset => { const cell = row.byAsset.get(asset); return <td key={asset} className={cn('serverCompareCell', cell && `goldenCell-${statusClass(cell.status)}`)}>{cell ? <><Badge status={cell.status} /><small>{cell.actual}</small></> : 'Not found'}</td>; })}<td>{row.priority}</td><td>{row.remediation}</td></tr>) : <tr><td colSpan={6 + premiumMatrix.assets.length}>Generate assurance from multiple server/DC auditpol files to populate the Premium Golden matrix.</td></tr>}</tbody></table>
          </div>
        </> : <>
          <div className="searchLine"><Search size={16} /><input value={props.query} onChange={e => props.setQuery(e.target.value)} placeholder="Search asset, control, Event ID, MITRE, category, status, remediation..." /></div>
          <div className="mainResultGrid desktopTopGrid"><table><thead><tr><th>Asset</th><th>Role</th><th>Operating system</th><th>Control ID</th><th>Category</th><th>Subcategory</th><th>Actual</th><th>Expected</th><th>Outcome</th><th>Microsoft DC status</th><th>Microsoft DC criticality</th><th>Weight</th><th>Priority</th><th>Telemetry impact</th><th>Coverage layer</th><th>Auditpol comparable</th><th>Expected Event IDs</th><th>Event evidence status</th><th>Channels</th><th>Detection use cases</th><th>MITRE ATT&CK</th><th>ATT&CK integrity</th><th>Frameworks</th><th>Engineer remediation</th></tr></thead><tbody>{props.findings.map((f, i) => <tr key={`${f.assetName}-${f.controlId}-${i}`} onClick={() => props.setSelected(f)} className={cn(props.selected === f && 'selected')}><td>{f.assetName}</td><td>{f.role}</td><td>{f.os}</td><td>{f.controlId}</td><td>{f.category}</td><td>{f.subcategory}</td><td>{f.actual}</td><td>{f.expected}</td><td><Badge status={f.status} /></td><td>{dcOverlay(f)}</td><td>{dcCriticality(f)}</td><td>{baselineWeight(f.baseline)}</td><td>{f.priority}</td><td>{f.telemetryImpact}</td><td>{coverageLayer(f.baseline)}</td><td>{String(f.baseline.AuditpolComparable ?? true)}</td><td>{f.eventIds}</td><td>{eventEvidence(f)}</td><td>{arrayText(f.baseline.EventChannels)}</td><td>{arrayText(f.baseline.DetectionUseCases)}</td><td>{f.mitre}</td><td>{attackIntegrity(f)}</td><td>{f.frameworks}</td><td>{actionFocus(f)}</td></tr>)}</tbody></table></div>
        </>}
      </section>
      <div className="rowSplitter" title="Desktop splitter: top matrix/grid pane and bottom details pane" />
      <section className="findingDetailsPane premiumBottomPane">
        <div className="paneHeader detailsHeader"><strong>{bottomPane === 'details' ? 'Selected finding details pane' : 'HTML report preview'}</strong><div className="subTabs compactSubTabs"><button className={cn(bottomPane === 'details' && 'active')} onClick={() => setBottomPane('details')}>Selected finding details pane</button><button className={cn(bottomPane === 'html' && 'active')} onClick={() => setBottomPane('html')}>HTML report preview</button></div></div>
        {bottomPane === 'details' && <FindingDetails finding={props.selected} />}
        {bottomPane === 'html' && <div className="htmlReportWrap embeddedReport"><div className="rightButtons"><button onClick={() => downloadText(`tas-html-report-${stamp()}.html`, props.reportHtml || html, 'text/html')}>Download HTML</button><button onClick={addHtml}>Add to output folder</button></div><iframe title="TAS HTML Report Preview" srcDoc={props.reportHtml || html} /></div>}
      </section>
    </div>
  </section>;
}

function FindingDetails({ finding, large }: { finding: Finding | null; large?: boolean }) {
  if (!finding) return <div className={cn('detailsPane', large && 'large')}><p>No selected finding.</p></div>;
  return <div className={cn('detailsPane', large && 'large')}><h3>{finding.controlId} | {finding.category} / {finding.subcategory}</h3><div className="detailGrid"><p><b>Status</b><Badge status={finding.status} /></p><p><b>Expected</b>{finding.expected}</p><p><b>Actual</b>{finding.actual}</p><p><b>Rationale</b>{finding.auditorRationale || finding.recommendation}</p><p><b>Event IDs and names</b>{finding.eventIds || 'Not mapped'}</p><p><b>Event detection value</b>{eventEvidence(finding)}</p><p><b>ATT&CK mapping integrity</b>{attackIntegrity(finding)} | {finding.mitre || 'Not mapped'}</p><p><b>Frameworks</b>{finding.frameworks || 'Not mapped'}</p><p><b>Microsoft DC overlay</b>{dcOverlay(finding)} | {dcCriticality(finding)}</p><p><b>Implementation path</b>{finding.baseline.ImplementationPath || 'Apply role-aware audit policy and validate effective settings.'}</p><p><b>Engineer remediation</b>{actionFocus(finding)}</p><p><b>Analyst value</b>{finding.analystValue || 'Improves SOC detection and triage context.'}</p><p><b>Blind spot if missing</b>{finding.blindSpot || finding.telemetryImpact || 'Reduced detection coverage.'}</p><p><b>Validation method</b>{finding.baseline.ValidationMethod || 'Retest auditpol and confirm event evidence in SIEM.'}</p></div></div>;
}

function BeforeAfter(props: { beforeInput: string; afterInput: string; setBeforeInput: (v: string) => void; setAfterInput: (v: string) => void; beforeFileRef: React.RefObject<HTMLInputElement | null>; afterFileRef: React.RefObject<HTMLInputElement | null>; readFiles: (files: FileList | File[] | null, target: EvidenceTarget) => void; comparison: ReturnType<typeof compare>; pushOutput: (o: OutputItem) => void; setShowOutput: (v: boolean) => void }) {
  function exportComparison() {
    const csv = ['Control,Area,Before,After,Movement,Before actual,After actual', ...props.comparison.map(r => [r.controlId, r.area, r.before, r.after, r.movement, r.beforeActual, r.afterActual].map(csvCell).join(','))].join('\n');
    props.pushOutput({ name: `tas-comparison-report-${stamp()}.csv`, type: 'CSV', content: csv, created: new Date().toLocaleString(), description: 'Before / After auditpol comparison workflow export' });
    props.setShowOutput(true);
  }
  function loadDemoPair() {
    props.setBeforeInput(samples.sampleTwoAssets);
    props.setAfterInput(samples.sampleTenDc);
  }
  function clearBoth() {
    props.setBeforeInput('');
    props.setAfterInput('');
  }
  const improved = props.comparison.filter(r => r.movement === 'Improved').length;
  const regressed = props.comparison.filter(r => r.movement === 'Regressed').length;
  const unchanged = props.comparison.filter(r => r.movement === 'Unchanged').length;
  const beforeLoaded = props.beforeInput.trim().length > 0;
  const afterLoaded = props.afterInput.trim().length > 0;
  return <section className="tabPage beforeAfterPage sanitisedBeforeAfter v70-10-redundancy-clean">
    <div className="dashCard compareHero slimCompareHero">
      <div className="compareTitleBlock">
        <h2>Before / After auditpol comparison</h2>
        <p>Load customer BEFORE and AFTER auditpol exports, or paste directly. Samples are kept as one optional demo pair only.</p>
      </div>
      <div className="compactCompareActions redundancy-clean-action-strip">
        <button className="primary" onClick={() => props.beforeFileRef.current?.click()}><Upload size={14} /> 1 Load BEFORE auditpol</button>
        <button className="primary" onClick={() => props.afterFileRef.current?.click()}><Upload size={14} /> 2 Load AFTER auditpol</button>
        <button onClick={() => void props.comparison.length}>3 Run comparison</button>
        <button onClick={loadDemoPair}>Load demo pair</button>
        <button onClick={clearBoth}>Clear both</button>
        <button className="navy" onClick={exportComparison}>4 Export comparison report</button>
        <input hidden multiple ref={props.beforeFileRef} type="file" accept=".txt,.log,.auditpol,.csv,.tsv" onChange={e => props.readFiles(e.currentTarget.files, 'before')} />
        <input hidden multiple ref={props.afterFileRef} type="file" accept=".txt,.log,.auditpol,.csv,.tsv" onChange={e => props.readFiles(e.currentTarget.files, 'after')} />
      </div>
    </div>

    <div className="compareInputs customerCompareInputs compactCustomerCompareInputs">
      <div className="customerComparePane beforePane compactComparePane">
        <div className="comparePaneHeader cleanComparePaneHeader"><h3>BEFORE | current auditpol</h3><span>{beforeLoaded ? `${props.beforeInput.length.toLocaleString()} chars loaded` : 'No BEFORE file loaded'}</span></div>
        <textarea value={props.beforeInput} onChange={e => props.setBeforeInput(e.target.value)} placeholder="Paste CUSTOMER BEFORE auditpol output here or click Choose BEFORE auditpol." />
      </div>
      <div className="customerComparePane afterPane compactComparePane">
        <div className="comparePaneHeader cleanComparePaneHeader"><h3>AFTER | remediated auditpol</h3><span>{afterLoaded ? `${props.afterInput.length.toLocaleString()} chars loaded` : 'No AFTER file loaded'}</span></div>
        <textarea value={props.afterInput} onChange={e => props.setAfterInput(e.target.value)} placeholder="Paste CUSTOMER AFTER auditpol output here or click Choose AFTER auditpol." />
      </div>
    </div>

    <div className="infoBar comparisonReadyBar compactComparisonSummary">Comparison summary: {improved} improved, {regressed} regressed, {unchanged} unchanged, {props.comparison.length} rows.</div>

    <div className="assetGrid comparisonGrid comparisonResultsPane"><table><thead><tr><th>Asset</th><th>Control</th><th>Area</th><th>Before</th><th>After</th><th>Movement</th><th>Before actual</th><th>After actual</th></tr></thead><tbody>{props.comparison.length ? props.comparison.map((r, i) => <tr key={`${r.controlId}-${i}`}><td>{r.assetName}</td><td>{r.controlId}</td><td>{r.area}</td><td><Badge status={r.before} /></td><td><Badge status={r.after} /></td><td>{r.movement}</td><td>{r.beforeActual}</td><td>{r.afterActual}</td></tr>) : <tr><td colSpan={8}>Load BEFORE and AFTER auditpol evidence to populate the comparison results.</td></tr>}</tbody></table></div>
  </section>;
}

function BaselineLibrary(props: { query: string; setQuery: (v: string) => void; controls: BaselineRow[]; exportGoldenPack: () => void; pushOutput: (o: OutputItem) => void; setShowOutput: (v: boolean) => void }) {
  const [goldenInput, setGoldenInput] = useState('');
  const [goldenOs, setGoldenOs] = useState<OsFamily>('Windows Server 2022');
  const [goldenQuery, setGoldenQuery] = useState('');
  const goldenFileRef = useRef<HTMLInputElement>(null);
  const rawGoldenAssessment = useMemo(() => assess(goldenInput, 'DC', goldenOs, 'Basic', 'Golden DC audit baseline comparison'), [goldenInput, goldenOs]);
  const goldenAssessment = useMemo(() => limitAssessmentAssets(rawGoldenAssessment, 8), [rawGoldenAssessment]);
  const goldenAssetSummary = useMemo(() => goldenAssessment.assets.map(asset => {
    const rows = goldenAssessment.findings.filter(f => f.assetName === asset.name);
    const aligned = rows.filter(f => f.status === 'Aligned').length;
    const partial = rows.filter(f => f.status === 'Partial').length;
    const gap = rows.filter(f => f.status === 'Gap').length;
    const evidence = rows.filter(f => f.status === 'Evidence Required').length;
    const score = scoreFindings(rows);
    return { asset, rows, aligned, partial, gap, evidence, score };
  }), [goldenAssessment]);
  const goldenMatrixRows = useMemo(() => buildGoldenMatrixRows(goldenAssessment, goldenQuery), [goldenAssessment, goldenQuery]);
  async function loadGoldenFiles(filesLike: FileList | null) {
    const files = Array.from(filesLike || []).slice(0, 8);
    if (!files.length) return;
    const text = files.length === 1 ? await files[0].text() : await buildStaticAuditpolBundle(files);
    setGoldenInput(text);
  }
  function loadGoldenSample() { setGoldenInput(samples.sampleTenDc); }
  function exportGoldenComparisonCsv() {
    const csv = goldenComparisonCsv(goldenAssessment);
    props.pushOutput({ name: `tas-golden-dc-baseline-comparison-${stamp()}.csv`, type: 'CSV', content: csv, created: new Date().toLocaleString(), description: 'Golden DC audit baseline comparison matrix export' });
    props.setShowOutput(true);
  }
  function exportGoldenComparisonHtml() {
    const html = goldenComparisonHtml(goldenAssessment);
    props.pushOutput({ name: `tas-golden-dc-baseline-comparison-${stamp()}.html`, type: 'HTML', content: html, created: new Date().toLocaleString(), description: 'Golden DC audit baseline comparison HTML report' });
    props.setShowOutput(true);
  }
  return <section className="tabPage baselinePage goldenPage"><div className="topControls"><label>Search baseline<input value={props.query} onChange={e => props.setQuery(e.target.value)} placeholder="category, subcategory, control ID, remediation, Microsoft, framework..." /></label><button onClick={props.exportGoldenPack}>Export Golden baseline pack</button></div><div className="infoBar"><Library size={16} /> Golden baseline library plus commercial-style comparison: load up to 8 Domain Controller auditpol outputs and compare every DC against the same single golden audit baseline.</div><div className="goldenComparePanel"><div className="goldenCompareHead"><div><h2>Golden DC audit baseline comparison</h2><p>Replicates the commercial app behaviour: one golden Domain Controller audit baseline, up to 8 DC auditpol inputs, one matrix showing aligned, partial and gap status by DC.</p></div><label className="visibleFilePicker small"><Upload size={16} /> Load up to 8 DC auditpol file/s<input multiple ref={goldenFileRef} type="file" accept=".txt,.log,.auditpol,.csv,.tsv" onChange={e => loadGoldenFiles(e.currentTarget.files)} /></label></div><div className="topControls goldenControls"><label>Golden compare OS<select value={goldenOs} onChange={e => setGoldenOs(e.target.value as OsFamily)}>{osFamilies.map(o => <option key={o}>{o}</option>)}</select></label><button onClick={() => goldenFileRef.current?.click()}>Choose 8 DC files</button><button onClick={loadGoldenSample}>Load 10 DC sample, compare first 8</button><button onClick={() => setGoldenInput('')}>Clear Golden comparison</button><button className="orange" onClick={exportGoldenComparisonCsv}>Export Golden comparison CSV</button><button className="navy" onClick={exportGoldenComparisonHtml}>Export Golden comparison HTML</button></div><div className="goldenSummaryRow"><Kpi label="DCs compared" value={goldenAssessment.assets.length} /><Kpi label="Golden score" value={`${goldenAssessment.score}%`} /><Kpi label="Aligned" value={goldenAssessment.aligned} tone="good" /><Kpi label="Partial" value={goldenAssessment.partial} tone="warn" /><Kpi label="Gap" value={goldenAssessment.gap} tone="bad" /><Kpi label="Evidence" value={goldenAssessment.evidence} /></div><div className="goldenAssetCards">{goldenAssetSummary.length ? goldenAssetSummary.map(s => <div key={s.asset.name} className="goldenAssetCard"><b>{s.asset.name}</b><span>{s.score}% score</span><small>{s.aligned} aligned | {s.partial} partial | {s.gap} gap | {s.evidence} evidence</small></div>) : <div className="goldenAssetCard empty">No DC auditpol evidence loaded yet.</div>}</div><textarea className="goldenInput" value={goldenInput} onChange={e => setGoldenInput(e.target.value)} placeholder="Paste up to 8 Domain Controller auditpol outputs here, or load 8 static auditpol txt files above." /><div className="searchLine"><Search size={16} /><input value={goldenQuery} onChange={e => setGoldenQuery(e.target.value)} placeholder="Search Golden comparison matrix by control, category, subcategory, expected setting, DC name or status..." /></div><div className="goldenMatrixGrid"><table><thead><tr><th>Control</th><th>Category</th><th>Subcategory</th><th>Golden expected</th>{goldenAssessment.assets.map(a => <th key={a.name}>{a.name}</th>)}<th>Priority</th><th>Remediation</th></tr></thead><tbody>{goldenMatrixRows.length ? goldenMatrixRows.map(row => <tr key={row.key}><td>{row.controlId}</td><td>{row.category}</td><td>{row.subcategory}</td><td>{row.expected}</td>{goldenAssessment.assets.map(a => { const cell = row.byAsset.get(a.name); return <td key={a.name} className={cn(cell && `goldenCell-${statusClass(cell.status)}`)}>{cell ? <><Badge status={cell.status} /><small>{cell.actual}</small></> : 'Not found'}</td>; })}<td>{row.priority}</td><td>{row.remediation}</td></tr>) : <tr><td colSpan={5 + goldenAssessment.assets.length}>Load DC evidence to run the Golden comparison.</td></tr>}</tbody></table></div></div><div className="mainResultGrid baselineGrid"><table><thead><tr><th>Mode</th><th>Control ID</th><th>Priority</th><th>Impact</th><th>Coverage layer</th><th>Category</th><th>Subcategory</th><th>Windows client</th><th>Member server</th><th>Critical member</th><th>Domain Controller</th><th>Weight</th><th>Auditpol comparable</th><th>Event IDs</th><th>Channels</th><th>MITRE ATT&CK</th><th>NIST SP 800-53</th><th>NIST CSF 2.0</th><th>CIS</th><th>Microsoft recommended setting</th><th>Microsoft evidence expectation</th><th>Microsoft reference set</th><th>Microsoft baseline note</th><th>Rationale</th><th>SOC Impact</th><th>Analyst value</th><th>Auditor rationale</th><th>Implementation path</th><th>Engineer remediation</th><th>Validation method</th><th>Evidence required</th><th>References</th></tr></thead><tbody>{props.controls.slice(0, 700).map((c, i) => <tr key={`${c.ControlID}-${i}`}><td>{c.packageName}</td><td>{c.ControlID}</td><td>{c.Priority}</td><td>{c.TelemetryImpact}</td><td>{coverageLayer(c)}</td><td>{c.Category}</td><td>{c.Subcategory}</td><td>{c.RecommendedWorkstation}</td><td>{c.RecommendedServer}</td><td>{c.RecommendedServer}</td><td>{c.RecommendedDC}</td><td>{baselineWeight(c)}</td><td>{String(c.AuditpolComparable ?? true)}</td><td>{arrayText(c.ExpectedEventIDs || c.EventIDs)}</td><td>{arrayText(c.EventChannels)}</td><td>{arrayText(c.MITRE_ATTCK)}</td><td>{arrayText(c.NIST_SP_800_53)}</td><td>{arrayText(c.NIST_CSF_2_0)}</td><td>{arrayText(c.CIS)}</td><td>{c.MicrosoftRecommendedSetting}</td><td>{c.MicrosoftEvidenceExpectation}</td><td>{c.MicrosoftReferenceSet}</td><td>{c.MicrosoftBaselineNote}</td><td>{c.Recommendation}</td><td>{c.SecurityImpact}</td><td>{c.AnalystValue}</td><td>{c.AuditorRationale}</td><td>{c.ImplementationPath}</td><td>{c.EngineerRemediation}</td><td>{c.ValidationMethod}</td><td>{String(c.EvidenceRequired ?? '')}</td><td>{[...(c.OfficialMicrosoftReferences || []), ...(c.OfficialFrameworkReferences || [])].join('; ')}</td></tr>)}</tbody></table></div></section>;
}


function eventCollectionSource(event: AnalystEvent) {
  const source = String(event.Source || '').toLowerCase();
  const id = String(event.EventID || '');
  if (source.includes('security')) return 'Event Viewer > Windows Logs > Security | provider Microsoft-Windows-Security-Auditing';
  if (source.includes('sysmon')) return 'Event Viewer > Applications and Services Logs > Microsoft > Windows > Sysmon > Operational';
  if (source.includes('terminal')) return 'Event Viewer > Applications and Services Logs > Microsoft > Windows > TerminalServices-* > Operational/Admin';
  if (source.includes('wmi')) return 'Event Viewer > Applications and Services Logs > Microsoft > Windows > WMI-Activity > Operational';
  if (source.includes('firewall')) return 'Event Viewer > Windows Logs > Security for WFP plus Windows Defender Firewall with Advanced Security logs';
  if (source.includes('task')) return 'Event Viewer > Applications and Services Logs > Microsoft > Windows > TaskScheduler > Operational';
  if (source.includes('directory')) return 'Domain Controller > Event Viewer > Windows Logs > Directory Service and Security DS Access events';
  if (source.includes('applocker')) return 'Event Viewer > Applications and Services Logs > Microsoft > Windows > AppLocker > EXE and DLL / MSI and Script';
  if (source.includes('certificate')) return 'AD CS server > Event Viewer > Windows Logs > Security plus CertificateServices operational logs';
  if (source.includes('nps')) return 'NPS/RADIUS server > Event Viewer > Windows Logs > Security and Network Policy and Access Services logs';
  if (/^46|^47|^48|^49|^50|^51|^52|^53|^54|^55|^56/.test(id)) return 'Event Viewer > Windows Logs > Security';
  return 'Event Viewer collection point depends on provider. Start with Windows Logs > Security, then provider-specific Operational/Admin channel.';
}
function eventCollectionShort(event: AnalystEvent) {
  const value = eventCollectionSource(event);
  return value.replace('Event Viewer > ', '').replace('Applications and Services Logs > ', 'Apps & Services > ');
}
function eventIdSortNumber(value: string) {
  const first = String(value || '').match(/\d+/)?.[0] || '0';
  return Number(first) || 0;
}

type EventSortKey = 'EventID' | 'Source' | 'Name' | 'Category' | 'Subcategory' | 'Priority' | 'AnalystLane' | 'Outcome' | 'KeyFields' | 'RelatedEvents' | 'CollectionSource';
const priorityOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
function eventSortValue(event: AnalystEvent, key: EventSortKey) {
  if (key === 'EventID') return eventIdSortNumber(event.EventID);
  if (key === 'CollectionSource') return eventCollectionSource(event).toLowerCase();
  if (key === 'Priority') return priorityOrder[event.Priority || ''] || 0;
  if (key === 'KeyFields') return (event.KeyFields || []).join(', ');
  if (key === 'RelatedEvents') return (event.RelatedEvents || []).join(', ');
  return String(event[key] || '').toLowerCase();
}
function SortHeader(props: { label: string; sortKey: EventSortKey; activeKey: EventSortKey; direction: 'asc' | 'desc'; onSort: (key: EventSortKey) => void }) {
  const active = props.activeKey === props.sortKey;
  return <th><button className={cn('sortableHeader', active && 'active')} onClick={() => props.onSort(props.sortKey)} title={`Sort by ${props.label}`}>{props.label}<span>{active ? (props.direction === 'asc' ? '▲' : '▼') : '↕'}</span></button></th>;
}

function EventIds(props: { eventQuery: string; setEventQuery: (v: string) => void; events: AnalystEvent[] }) {
  const [lane, setLane] = useState('All analyst lanes');
  const [category, setCategory] = useState('All categories');
  const [priority, setPriority] = useState('All priorities');
  const [selectedId, setSelectedId] = useState('4624');
  const [sortKey, setSortKey] = useState<EventSortKey>('EventID');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const lanes = ['All analyst lanes', ...Array.from(new Set(props.events.map(e => e.AnalystLane || 'General'))).sort()];
  const categories = ['All categories', ...Array.from(new Set(props.events.map(e => e.Category || 'Uncategorized'))).sort()];
  const priorities = ['All priorities', 'Critical', 'High', 'Medium', 'Low'];
  const filtered = props.events.filter(e => (lane === 'All analyst lanes' || e.AnalystLane === lane) && (category === 'All categories' || e.Category === category) && (priority === 'All priorities' || e.Priority === priority));
  const visible = [...filtered].sort((a, b) => {
    const left = eventSortValue(a, sortKey);
    const right = eventSortValue(b, sortKey);
    const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? result : -result;
  });
  const selected = visible.find(e => e.EventID === selectedId) || visible[0] || props.events[0];
  const hotLanes = ['Audit tamper and collection health', 'Authentication and session activity', 'Kerberos and domain authentication', 'Privilege and admin logon', 'Process execution', 'Account, group and identity changes', 'Active Directory object and replication changes', 'Firewall, WFP and IPsec activity', 'Certificate services and PKI', 'Device, USB and endpoint control'];
  const applySort = (key: EventSortKey) => {
    if (sortKey === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection('asc'); }
  };
  return <section className="tabPage eventIntelPage">
    <div className="eventIntelHeader">
      <div>
        <h2>Analyst Event ID Intelligence</h2>
        <p>Offline analyst navigation for Windows Security events, Sysmon, NPS and Task Scheduler context. Source names align to the public Ultimate Windows Security encyclopedia index; TAS adds quick triage guidance, sortable columns and where-to-collect data source guidance.</p>
      </div>
      <div className="eventIntelStats"><b>{visible.length}</b><span>visible event references</span><small>{eventLookup.length} embedded locally</small></div>
    </div>
    <div className="eventQuickNav">
      {hotLanes.map(item => <button key={item} className={cn(lane === item && 'active')} onClick={() => setLane(lane === item ? 'All analyst lanes' : item)}>{item.replace(' and ', ' & ')}</button>)}
    </div>
    <div className="eventFilters">
      <label><Search size={16} /> Search<input value={props.eventQuery} onChange={e => props.setEventQuery(e.target.value)} placeholder="4624, logon type, Kerberos, USB, firewall, certificate, group added..." /></label>
      <label>Analyst lane<select value={lane} onChange={e => setLane(e.target.value)}>{lanes.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Category<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Priority<select value={priority} onChange={e => setPriority(e.target.value)}>{priorities.map(x => <option key={x}>{x}</option>)}</select></label>
    </div>
    <div className="eventSortStatus">Sorted by <b>{sortKey === 'Source' ? 'Type' : sortKey === 'CollectionSource' ? 'Collect from / data source' : sortKey}</b> {sortDirection === 'asc' ? 'ascending' : 'descending'}. Click any column header to sort.</div>
    <div className="eventIntelWorkspace">
      <div className="eventTablePane">
        <table>
          <thead><tr>
            <SortHeader label="Event ID" sortKey="EventID" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Name" sortKey="Name" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Type" sortKey="Source" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Category" sortKey="Category" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Subcategory" sortKey="Subcategory" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Priority" sortKey="Priority" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Analyst lane" sortKey="AnalystLane" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Outcome" sortKey="Outcome" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Key fields" sortKey="KeyFields" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Related" sortKey="RelatedEvents" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
            <SortHeader label="Collect from" sortKey="CollectionSource" activeKey={sortKey} direction={sortDirection} onSort={applySort} />
          </tr></thead>
          <tbody>{visible.map(e => <tr key={`${e.Source}-${e.EventID}-${e.Name}`} onClick={() => setSelectedId(e.EventID)} className={cn(selected?.EventID === e.EventID && 'selected')}><td className="eventIdCell"><span>{e.EventID}</span></td><td className="eventNameCell">{e.Name}</td><td><span className="eventTypePill">{e.Source}</span></td><td>{e.Category}</td><td>{e.Subcategory}</td><td><span className={cn('priorityPill', (e.Priority || 'low').toLowerCase())}>{e.Priority}</span></td><td>{e.AnalystLane}</td><td>{e.Outcome}</td><td>{(e.KeyFields || []).slice(0, 4).join(', ')}</td><td>{(e.RelatedEvents || []).join(', ')}</td><td className="eventCollectionCell">{eventCollectionShort(e)}</td></tr>)}</tbody>
        </table>
      </div>
      <aside className="eventDetailPane">
        {selected ? <>
          <div className="eventDetailTitle"><span>{selected.EventID}</span><h3>{selected.Name}</h3></div>
          <p><b>Type</b><span className="eventTypePill">{selected.Source}</span></p>
          <p><b>Collect from / data source</b>{eventCollectionSource(selected)}</p>
          <p><b>Category / Subcategory</b>{selected.Category} / {selected.Subcategory}</p>
          <p><b>Analyst lane</b>{selected.AnalystLane}</p>
          <p><b>Priority</b><span className={cn('priorityPill', (selected.Priority || 'low').toLowerCase())}>{selected.Priority}</span></p>
          <p><b>Why analysts care</b>{selected.AnalystFocus}</p>
          <p><b>Useful fields to check</b>{(selected.KeyFields || []).join(' | ')}</p>
          <p><b>Triage questions</b>{(selected.TriageQuestions || []).map(q => `• ${q}`).join('\n')}</p>
          <p><b>Correlate with</b>{(selected.RelatedEvents || []).join(', ') || 'No related event mapping available'}</p>
          <p><b>Outcome type</b>{selected.Outcome}</p>
          <p><b>Public reference</b><a href={selected.ReferenceUrl || 'https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/default.aspx'} target="_blank" rel="noreferrer">Open Ultimate Windows Security event reference</a></p>
        </> : <p>No event selected.</p>}
      </aside>
    </div>
  </section>;
}


function StandaloneDesktop({ pushOutput, setShowOutput }: { pushOutput: (item: OutputItem) => void; setShowOutput: (v: boolean) => void }) {
  function createDesktopPackManifest() {
    const manifest = JSON.stringify({
      product: 'TAS Desktop Commercial Standalone',
      purpose: 'Self-contained Windows desktop capability for customers who need local-machine audit collection, offline evidence handling or restricted-environment operation.',
      webStudioBoundary: 'The browser web studio does not run auditpol.exe or access local protected folders directly. Customers who require live local audit should use the standalone desktop product.',
      packagePlaceholder: 'Place signed installer or customer desktop release in public/downloads when ready.',
      recommendedFiles: ['TAS_Desktop_Commercial.msi', 'license.taslic', 'SHA256SUMS.txt', 'Customer_Quick_Start.pdf'],
      commercialControls: ['licence activation', 'offline/local audit', 'local report pack output', 'restricted environment option', 'consultant/customer evidence pack']
    }, null, 2);
    pushOutput({ name: 'tas-desktop-commercial-pack-manifest.json', type: 'JSON', content: manifest, created: new Date().toLocaleString(), description: 'Standalone TAS Desktop commercial pack manifest' });
    setShowOutput(true);
  }
  function createSalesHtml() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>TAS Desktop Commercial Standalone</title><style>body{font-family:Segoe UI,Arial,sans-serif;margin:32px;color:#10213b}h1{color:#0b2a53}.card{border:1px solid #b9c7d8;padding:18px;margin:12px 0}.btn{display:inline-block;background:#0b2a53;color:white;padding:10px 14px;text-decoration:none}</style></head><body><h1>TAS Desktop Commercial Standalone</h1><p>For organisations that need local-machine audit collection, offline evidence processing or restricted-environment operation.</p><div class="card"><h2>Why choose desktop?</h2><p>Use the web studio for browser-based auditpol upload and Golden comparison. Use TAS Desktop when the customer needs live local audit, local output folders, offline operation or controlled release packs.</p></div><div class="card"><h2>Commercial capability</h2><ul><li>Local audit collection</li><li>Offline evidence handling</li><li>Customer licence activation</li><li>HTML, CSV, Word and evidence-pack output</li><li>Restricted environment fallback</li></ul></div><p><a class="btn" href="mailto:cybersecdan@gmail.com?subject=TAS%20Desktop%20Commercial%20Standalone">Request commercial desktop pack</a></p></body></html>`;
    pushOutput({ name: 'tas-desktop-commercial-sales-onepager.html', type: 'HTML', content: html, created: new Date().toLocaleString(), description: 'Standalone desktop commercial one-pager' });
    setShowOutput(true);
  }
  return <section className="tabPage standalonePage"><div className="dashCard"><h2><HardDrive /> Standalone commercial desktop capability</h2><p>The web studio remains the cloud/browser product. The true live local-machine capability belongs in the self-contained TAS Desktop commercial product, which businesses or individual consultants can buy as a standalone release.</p><p>This keeps the browser safe and clean: no attempt to run auditpol.exe, no silent local folder access and no false promise that a web page can behave like a Windows desktop app.</p></div><div className="standaloneGrid"><div className="dashCard"><h3>What stays in the web studio</h3><p>Static auditpol file upload</p><p>Multi-server Golden comparison</p><p>Analyst Event ID intelligence</p><p>HTML/CSV/Word-style evidence pack exports</p><p>Cloudflare-ready customer access</p></div><div className="dashCard"><h3>What belongs in TAS Desktop</h3><p>Live local audit collection</p><p>Local output folder operations</p><p>Offline/restricted-environment use</p><p>Signed customer installer and licence file</p><p>Self-contained commercial release pack</p></div><div className="dashCard"><h3>Commercial path</h3><p>Use this page to present the standalone desktop product without bloating the web app workflow.</p><button className="navy" onClick={createDesktopPackManifest}><Download size={14} /> Create desktop pack manifest</button><button onClick={createSalesHtml}>Create desktop sales one-pager</button><a className="desktopDownloadLink" href="/downloads/TAS_DESKTOP_COMMERCIAL_PLACEHOLDER.txt" download>Download placeholder desktop pack note</a></div></div><div className="infoBar"><HardDrive size={16} /> Standalone desktop attachment point is ready. Place the signed commercial MSI or ZIP in public/downloads when the release asset is available.</div></section>;
}

function TrustCentre({ input, active, parityBlocks }: { input: string; active: Assessment; parityBlocks: string[] }) {
  const diagnostics = active.assets.flatMap(a => a.diagnostics.map(d => `${a.name}: ${d}`));
  return <section className="tabPage twoCol"><div className="panel"><h2><ShieldCheck /> Trust Centre</h2><p><b>Evidence provenance receipt hash metadata:</b> {simpleHash(input)}</p><p><b>Evidence assets:</b> {active.assets.length}</p><p><b>Parsed auditpol rows:</b> {active.assets.reduce((s, a) => s + a.entries.length, 0)}</p><p><b>Parser diagnostics:</b> {diagnostics.length || 'None'}</p><pre>{diagnostics.length ? diagnostics.join('\n') : 'No parser diagnostics for current evidence preview.'}</pre></div><div className="panel"><h2>Commercial parity function blocks</h2>{parityBlocks.map(x => <p key={x}><CheckCircle2 size={14} /> {x}</p>)}<h2>Cloudflare safety position</h2><p>All parser, baseline and report logic runs in the browser. Static auditpol evidence stays client-side unless the customer chooses to export or upload it elsewhere.</p></div></section>;
}

function Activation({ licenceText, setLicenceText, activated, setActivated }: { licenceText: string; setLicenceText: (v: string) => void; activated: boolean; setActivated: (v: boolean) => void }) {
  const fp = browserFingerprint();
  return <section className="tabPage twoCol"><div className="panel"><h2><KeyRound /> Product activation</h2><p>Customer releases start in demo mode. Create an activation request, send it to the vendor, then import the returned .taslic licence.</p><p>Current licence: <b>{activated ? 'Activated demo licence' : 'Activation required | Demo mode'}</b></p><p>Machine fingerprint: <code>{fp}</code></p><div className="rightButtons left"><button onClick={() => setActivated(true)}>Activate product</button><button onClick={() => setLicenceText('')}>Refresh</button><button onClick={() => downloadText(`tas-activation-request-${stamp()}.json`, activationRequest(fp), 'application/json')}>Create activation request</button><button onClick={() => navigator.clipboard?.writeText(fp)}>Copy machine fingerprint</button><button onClick={() => alert('Browser-safe web version: use the Web output folder tray for generated files.')}>Open licence folder</button><button onClick={() => setLicenceText(licenceDemo(fp))}>Create UAT licence template</button><button onClick={() => alert('Use the paste area below for .taslic content in the web version.')}>Browse</button><button onClick={() => downloadText(`auditpol-demo-customer-${stamp()}.taslic`, licenceDemo(fp), 'application/json')}>Create signed customer licence</button></div><textarea value={licenceText} onChange={e => setLicenceText(e.target.value)} placeholder="Paste .taslic JSON here" /></div><div className="panel"><h2>Enabled capabilities</h2>{parityBlocks.map((x, i) => <p key={x}>{i < 7 || activated ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {x}</p>)}<h2>Customer support details</h2><p>Vendor licence issue and customer activation exchange are represented as web-safe JSON workflows. This mirrors the product activation, licence import, activation request and vendor licence issue workflow.</p></div></section>;
}

function OutputFolder({ outputs, onDownload, onClose }: { outputs: OutputItem[]; onDownload: (o: OutputItem) => void; onClose: () => void }) {
  return <div className="outputOverlay"><div className="outputWindow"><div className="outputHead"><h2><FolderOpen /> Web output folder</h2><button onClick={onClose}>Close</button></div>{outputs.length ? <table><thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Created</th><th>Action</th></tr></thead><tbody>{outputs.map((o, i) => <tr key={`${o.name}-${i}`}><td>{o.name}</td><td>{o.type}</td><td>{o.description}</td><td>{o.created}</td><td><button onClick={() => onDownload(o)}><Download size={14} /> Download</button></td></tr>)}</tbody></table> : <p>No exported artefacts yet. Use Basic + export pack, Advanced + export pack, Golden baseline pack or comparison export.</p>}</div></div>;
}


function scoreFindings(findings: Finding[]) {
  const aligned = findings.filter(f => f.status === 'Aligned').length;
  const partial = findings.filter(f => f.status === 'Partial').length;
  const gap = findings.filter(f => f.status === 'Gap').length;
  const scorable = aligned + partial + gap;
  return scorable ? Math.round(((aligned + partial * 0.5) / scorable) * 100) : 0;
}
function countFindings(findings: Finding[]) {
  const aligned = findings.filter(f => f.status === 'Aligned').length;
  const partial = findings.filter(f => f.status === 'Partial').length;
  const gap = findings.filter(f => f.status === 'Gap').length;
  const evidence = findings.filter(f => f.status === 'Evidence Required').length;
  return { aligned, partial, gap, evidence, score: scoreFindings(findings) };
}
function limitAssessmentAssets(assessment: Assessment, maxAssets: number): Assessment {
  const assets = assessment.assets.slice(0, maxAssets);
  const allowed = new Set(assets.map(a => a.name));
  const findings = assessment.findings.filter(f => allowed.has(f.assetName));
  const counts = countFindings(findings);
  return { ...assessment, assets, findings, ...counts };
}
function buildGoldenMatrixRows(assessment: Assessment, query: string) {
  const rows = new Map<string, { key: string; controlId: string; category: string; subcategory: string; expected: string; priority: string; remediation: string; byAsset: Map<string, Finding> }>();
  for (const f of assessment.findings) {
    const rowKey = `${f.controlId}|${f.category}|${f.subcategory}`;
    if (!rows.has(rowKey)) rows.set(rowKey, { key: rowKey, controlId: f.controlId, category: f.category, subcategory: f.subcategory, expected: f.expected, priority: f.priority, remediation: actionFocus(f), byAsset: new Map<string, Finding>() });
    rows.get(rowKey)!.byAsset.set(f.assetName, f);
  }
  const q = query.toLowerCase().trim();
  const values = Array.from(rows.values());
  if (!q) return values;
  return values.filter(row => [row.controlId, row.category, row.subcategory, row.expected, row.priority, row.remediation, ...Array.from(row.byAsset.entries()).flatMap(([asset, f]) => [asset, f.status, f.actual])].join(' ').toLowerCase().includes(q));
}
function goldenComparisonCsv(assessment: Assessment) {
  const assets = assessment.assets.map(a => a.name);
  const header = ['ControlID', 'Category', 'Subcategory', 'GoldenExpected', ...assets, 'Priority', 'Remediation'];
  const rows = buildGoldenMatrixRows(assessment, '').map(row => [row.controlId, row.category, row.subcategory, row.expected, ...assets.map(asset => { const cell = row.byAsset.get(asset); return cell ? `${cell.status}: ${cell.actual}` : 'Not found'; }), row.priority, row.remediation].map(csvCell).join(','));
  const summary = ['Golden baseline comparison summary', `DCs compared: ${assessment.assets.length}`, `Score: ${assessment.score}%`, `Aligned: ${assessment.aligned}`, `Partial: ${assessment.partial}`, `Gap: ${assessment.gap}`, `Evidence Required: ${assessment.evidence}`].map(csvCell).join(',');
  return [summary, header.map(csvCell).join(','), ...rows].join('\n');
}
function goldenComparisonHtml(assessment: Assessment) {
  const assets = assessment.assets.map(a => a.name);
  const summaryRows = assessment.assets.map(asset => {
    const rows = assessment.findings.filter(f => f.assetName === asset.name);
    const counts = countFindings(rows);
    return `<tr><td>${esc(asset.name)}</td><td>${counts.score}%</td><td>${counts.aligned}</td><td>${counts.partial}</td><td>${counts.gap}</td><td>${counts.evidence}</td></tr>`;
  }).join('');
  const matrixRows = buildGoldenMatrixRows(assessment, '').map(row => `<tr><td>${esc(row.controlId)}</td><td>${esc(row.category)}</td><td>${esc(row.subcategory)}</td><td>${esc(row.expected)}</td>${assets.map(asset => { const cell = row.byAsset.get(asset); return `<td class="${cell ? statusClass(cell.status) : ''}">${cell ? `<b>${esc(cell.status)}</b><br>${esc(cell.actual)}` : 'Not found'}</td>`; }).join('')}<td>${esc(row.priority)}</td><td>${esc(row.remediation)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>TAS Golden DC baseline comparison</title><style>body{font-family:Segoe UI,Arial,sans-serif;margin:28px;color:#111827}table{border-collapse:collapse;width:100%;font-size:12px;margin:14px 0}th,td{border:1px solid #d1d5db;padding:8px;vertical-align:top}th{background:#0B2147;color:white;position:sticky;top:0}.aligned{background:#dcfce7}.partial{background:#fef3c7}.gap{background:#fee2e2}.evidence-required{background:#dbeafe}.kpis{display:flex;gap:10px;flex-wrap:wrap}.kpis div{border:1px solid #d1d5db;padding:10px 14px;border-radius:10px}</style></head><body><h1>AuditPol TAS Golden DC audit baseline comparison</h1><p>Generated ${esc(new Date().toLocaleString())}. ${assessment.assets.length} Domain Controller auditpol outputs compared against one single golden DC audit baseline.</p><div class="kpis"><div><b>${assessment.score}%</b><br>Golden score</div><div><b>${assessment.aligned}</b><br>Aligned</div><div><b>${assessment.partial}</b><br>Partial</div><div><b>${assessment.gap}</b><br>Gap</div><div><b>${assessment.evidence}</b><br>Evidence required</div></div><h2>DC summary</h2><table><thead><tr><th>DC</th><th>Score</th><th>Aligned</th><th>Partial</th><th>Gap</th><th>Evidence</th></tr></thead><tbody>${summaryRows || '<tr><td colspan="6">No DC evidence loaded.</td></tr>'}</tbody></table><h2>Golden comparison matrix</h2><table><thead><tr><th>Control</th><th>Category</th><th>Subcategory</th><th>Golden expected</th>${assets.map(a => `<th>${esc(a)}</th>`).join('')}<th>Priority</th><th>Remediation</th></tr></thead><tbody>${matrixRows || `<tr><td colspan="${6 + assets.length}">No matrix rows.</td></tr>`}</tbody></table></body></html>`;
}

function printableReport(html: string) {
  return html.replace('<body>', '<body><script>setTimeout(function(){window.print()},300)</script>');
}
function wordReportFromAssessment(assessment: Assessment) {
  const topFindings = assessment.findings.slice(0, 160);
  const cards = topFindings.map((f, i) => `<section class="finding"><h2>${i + 1}. ${esc(f.controlId)} | ${esc(f.category)} / ${esc(f.subcategory)}</h2><table><tr><th>Asset</th><td>${esc(f.assetName)}</td><th>Status</th><td class="${statusClass(f.status)}">${esc(f.status)}</td></tr><tr><th>Expected</th><td>${esc(f.expected)}</td><th>Actual</th><td>${esc(f.actual)}</td></tr><tr><th>Priority</th><td>${esc(f.priority)}</td><th>Event IDs</th><td>${esc(f.eventIds || 'Not mapped')}</td></tr><tr><th>MITRE</th><td colspan="3">${esc(f.mitre || 'Not mapped')}</td></tr><tr><th>Frameworks</th><td colspan="3">${esc(f.frameworks || 'Not mapped')}</td></tr><tr><th>Remediation</th><td colspan="3">${esc(actionFocus(f))}</td></tr></table></section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>AuditPol TAS Word Report</title><style>
    @page{size:landscape;margin:1.2cm}body{font-family:Segoe UI,Arial,sans-serif;color:#111827;background:#fff}h1{color:#0b2345;margin:0 0 6px}.intro{border-bottom:2px solid #0b2345;padding-bottom:10px;margin-bottom:12px}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0}.kpis div{border:1px solid #cbd5e1;padding:8px;background:#f8fafc}.kpis b{font-size:22px;color:#0b2345}.note{background:#eef6ff;border:1px solid #b8d4f2;padding:8px;margin:12px 0}.finding{page-break-inside:avoid;margin:12px 0 16px}.finding h2{font-size:15px;color:#0b2345;margin:0 0 5px}table{width:100%;border-collapse:collapse;font-size:10px;table-layout:fixed}th,td{border:1px solid #d1d5db;padding:5px;vertical-align:top;word-break:break-word}th{background:#e8edf4;text-align:left;color:#0b2345;width:12%}.aligned{background:#dcfce7}.partial{background:#fef3c7}.gap{background:#fee2e2}.evidence-required{background:#dbeafe}.footer{font-size:10px;color:#475569;margin-top:14px}</style></head><body><section class="intro"><h1>AuditPol TAS Word Report</h1><p>Generated ${esc(new Date(assessment.generatedAt).toLocaleString())} | Mode ${esc(assessment.mode)} | Assets ${assessment.assets.length} | Findings ${assessment.findings.length}</p></section><div class="kpis"><div><b>${assessment.score}%</b><br>Score</div><div><b>${assessment.aligned}</b><br>Aligned</div><div><b>${assessment.partial}</b><br>Partial</div><div><b>${assessment.gap}</b><br>Gap</div><div><b>${assessment.evidence}</b><br>Evidence Required</div></div><div class="note"><b>Word layout note:</b> This export uses readable finding cards instead of one very wide grid. Use the HTML evidence report for the full horizontally scrollable table.</div>${cards || '<p>No findings generated.</p>'}<p class="footer">Rows included: ${topFindings.length} of ${assessment.findings.length}. Full detailed grid is available in the HTML evidence report and CSV action register.</p></body></html>`;
}
function goldenMatrixCsv(controls: BaselineRow[]) { const header = ['Mode','ControlID','Priority','Category','Subcategory','WindowsClient','MemberServer','CriticalMemberServer','DomainController','Weight','AuditpolComparable','EventIDs','MITRE','Frameworks','Remediation']; return [header.map(csvCell).join(','), ...controls.map(c => [c.packageName, c.ControlID, c.Priority, c.Category, c.Subcategory, c.RecommendedWorkstation, c.RecommendedServer, c.RecommendedServer, c.RecommendedDC, baselineWeight(c), String(c.AuditpolComparable ?? true), arrayText(c.ExpectedEventIDs || c.EventIDs), arrayText(c.MITRE_ATTCK), c.FrameworkAlignmentSummary || [arrayText(c.NIST_SP_800_53), arrayText(c.NIST_CSF_2_0), arrayText(c.CIS)].filter(Boolean).join(' | '), c.EngineerRemediation || c.Recommendation].map(csvCell).join(','))].join('\n'); }
function goldenRemediationHtml(controls: BaselineRow[]) { const rows = controls.map(c => `<tr><td>${esc(c.packageName)}</td><td>${esc(c.ControlID)}</td><td>${esc(c.Priority)}</td><td>${esc(c.Category)}</td><td>${esc(c.Subcategory)}</td><td>${esc(c.RecommendedDC || c.RecommendedServer || c.RecommendedWorkstation)}</td><td>${esc(c.EngineerRemediation || c.Recommendation)}</td><td>${esc(c.ValidationMethod || 'Retest auditpol and validate SIEM evidence')}</td></tr>`).join(''); return `<!doctype html><html><head><meta charset="utf-8"><title>TAS Golden Remediation Plan</title><style>body{font-family:Segoe UI,Arial,sans-serif;margin:28px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #d1d5db;padding:8px;vertical-align:top}th{background:#0B2147;color:white}</style></head><body><h1>AuditPol TAS Golden DC remediation plan and governance rationale</h1><p>Generated ${esc(new Date().toLocaleString())}. Role-aware golden baseline pack for Windows audit policy assurance.</p><table><thead><tr><th>Mode</th><th>Control</th><th>Priority</th><th>Category</th><th>Subcategory</th><th>Domain Controller expected</th><th>Engineering remediation</th><th>Validation method</th></tr></thead><tbody>${rows}</tbody></table></body></html>`; }
