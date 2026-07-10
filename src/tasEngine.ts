import basicControlsRaw from './data/baseline_basic_audit.json';
import advancedControlsRaw from './data/baseline_advanced_audit.json';
import eventLookupRaw from './data/event_id_lookup.json';
import sampleTwoAssetsRaw from './data/sample_two_assets_auditpol.txt?raw';
import sampleTenDcRaw from './data/EGoP_10_DCs_multi_auditpol.txt?raw';
import sampleMatrixRaw from './data/EGoP_matrix_category_subcategory_3_DCs.txt?raw';

export type Role = 'Workstation' | 'Server' | 'CriticalServer' | 'DC';
export type OsFamily = 'Windows 10' | 'Windows 11' | 'Windows Server 2016' | 'Windows Server 2019' | 'Windows Server 2022' | 'Windows Server 2025';
export type Mode = 'Basic' | 'Advanced';
export type Status = 'Aligned' | 'Partial' | 'Gap' | 'Evidence Required';

export interface BaselineControl {
  Category: string;
  Subcategory: string;
  ControlID?: string;
  Control?: string;
  Package?: string;
  Priority?: string;
  Context?: string;
  MappingStrength?: string;
  RecommendedWorkstation?: string;
  RecommendedServer?: string;
  RecommendedDC?: string;
  Recommendation?: string;
  TelemetryImpact?: string;
  SecurityImpact?: string;
  DetectionUseCases?: string[];
  ExpectedEventIDs?: string[];
  EventIDs?: string[];
  EventChannels?: string[];
  ImplementationPath?: string;
  EngineerRemediation?: string;
  AnalystValue?: string;
  AuditorRationale?: string;
  ValidationMethod?: string;
  CollectionPrerequisites?: string;
  BlindSpotIfMissing?: string;
  MITRE_ATTCK?: string[];
  NIST_SP_800_53?: string[];
  NIST_CSF_2_0?: string[];
  CIS?: string[];
  MicrosoftBestPractice?: string;
  MicrosoftRecommendedSetting?: string;
  MicrosoftFramework?: string;
  MicrosoftFrameworkControl?: string;
  MicrosoftEvidenceExpectation?: string;
  MicrosoftReferenceSet?: string;
  MicrosoftAuditMapping?: string;
  MicrosoftBaselineNote?: string;
  FrameworkAlignmentSummary?: string;
  OfficialMicrosoftReferences?: string[];
  OfficialFrameworkReferences?: string[];
  AuditpolComparable?: boolean;
  EvidenceRequired?: boolean | string;
  CoverageLayer?: string;
}

export interface AuditEntry { category: string; subcategory: string; setting: string; line: number; }
export interface AuditAsset { name: string; role: Role; os: OsFamily; raw: string; entries: AuditEntry[]; diagnostics: string[]; sourceType?: 'text' | 'matrix' | 'multi-file'; }
export interface Finding {
  assetName: string;
  role: Role;
  os: OsFamily;
  controlId: string;
  category: string;
  subcategory: string;
  expected: string;
  actual: string;
  status: Status;
  priority: string;
  telemetryImpact: string;
  recommendation: string;
  eventIds: string;
  mitre: string;
  frameworks: string;
  engineerRemediation: string;
  analystValue: string;
  auditorRationale: string;
  blindSpot: string;
  baseline: BaselineControl;
}
export interface Assessment {
  mode: Mode;
  generatedAt: string;
  assets: AuditAsset[];
  findings: Finding[];
  aligned: number;
  partial: number;
  gap: number;
  evidence: number;
  score: number;
}
export interface ComparisonRow { assetName: string; controlId: string; area: string; before: Status; after: Status; movement: 'Improved' | 'Regressed' | 'Unchanged'; beforeActual: string; afterActual: string; }

type MatrixLayout = { headerIndex: number; categoryIndex: number; subcategoryIndex: number; assetColumns: Array<{ index: number; name: string }> };

const knownCategories = ['System','Logon/Logoff','Object Access','Privilege Use','Detailed Tracking','Policy Change','Account Management','DS Access','Account Logon'];
const settingLine = /^\s*(.+?)\s{2,}(No\s+Auditing|Success\s+and\s+Failure|Failure\s+and\s+Success|Success|Failure)\s*$/i;

export const basicControls = basicControlsRaw as BaselineControl[];
export const advancedControls = advancedControlsRaw as BaselineControl[];
export const eventLookup = (eventLookupRaw as { Events: Array<{Source:string; EventID:string; Name:string; Aliases?: string[]}> }).Events;
export const samples = {
  sampleTwoAssets: sampleTwoAssetsRaw,
  sampleTenDc: sampleTenDcRaw,
  sampleMatrix: sampleMatrixRaw
};

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function cleanSetting(value: string) {
  const lower = normalizeWhitespace(value).toLowerCase();
  if (lower === 'failure and success') return 'Success and Failure';
  if (lower === 'success and failure') return 'Success and Failure';
  if (lower === 'no auditing') return 'No Auditing';
  if (lower === 'success') return 'Success';
  if (lower === 'failure') return 'Failure';
  if (!lower || lower === 'missing') return 'Missing';
  if (lower.includes('evidence required')) return 'Evidence Required';
  return normalizeWhitespace(value);
}

function isKnownSetting(value: string) {
  return ['No Auditing', 'Success', 'Failure', 'Success and Failure', 'Missing', 'Evidence Required'].includes(cleanSetting(value));
}

function key(category: string, subcategory: string) {
  return `${category}::${subcategory}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function expectedFor(control: BaselineControl, role: Role) {
  if (role === 'DC') return control.RecommendedDC || control.RecommendedServer || control.RecommendedWorkstation || 'Evidence Required';
  if (role === 'Workstation') return control.RecommendedWorkstation || control.RecommendedServer || control.RecommendedDC || 'Evidence Required';
  return control.RecommendedServer || control.RecommendedDC || control.RecommendedWorkstation || 'Evidence Required';
}

function rank(status: Status) {
  if (status === 'Aligned') return 3;
  if (status === 'Partial') return 2;
  if (status === 'Evidence Required') return 1;
  return 0;
}

function evalSetting(expectedRaw: string, actualRaw: string): Status {
  const expected = cleanSetting(expectedRaw);
  const actual = cleanSetting(actualRaw);
  if (/evidence|required|collect|validate|monitor|source-specific/i.test(expected)) return 'Evidence Required';
  if (actual === 'Missing' || actual === 'No Auditing') return expected === 'No Auditing' ? 'Aligned' : 'Gap';
  if (expected === actual) return 'Aligned';
  if (actual === 'Success and Failure' && (expected === 'Success' || expected === 'Failure')) return 'Partial';
  if (expected === 'No Auditing' && actual !== 'No Auditing') return 'Partial';
  return 'Partial';
}

function isCommandLine(trimmed: string) {
  return />\s*auditpol/i.test(trimmed) || /^auditpol(\.exe)?\s+/i.test(trimmed);
}

function isAssetHeader(trimmed: string) {
  return /^(?:Asset|Host|HostName|Computer|Server|Node|Device|DomainController|DC)\s*[:=]\s*(.+)$/i.test(trimmed);
}

function isStandaloneAssetLabel(trimmed: string) {
  if (!trimmed) return false;
  if (knownCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) return false;
  if (/category\/subcategory/i.test(trimmed) || /system audit policy/i.test(trimmed)) return false;
  if (settingLine.test(trimmed)) return false;
  if (/^(?:source file|static intake file)\s*:/i.test(trimmed)) return true;
  if (isAssetHeader(trimmed)) return true;
  if (/^\d+$/.test(trimmed)) return true;
  const decorated = trimmed.replace(/^[=\-#\[\]\s\\]+|[=\-#\[\]\s]+$/g, '');
  if (!decorated || decorated.includes(' ')) return false;
  if (isKnownSetting(decorated)) return false;
  return /\d|[-_.]/.test(decorated) || /^dc/i.test(decorated);
}

function detectAssetName(block: string, sourceName: string, ordinal: number, blockCount: number) {
  for (const line of block.replace(/\r\n/g, '\n').split('\n').slice(0, 12)) {
    const trimmed = line.trim();
    const explicit = trimmed.match(/^(?:Asset|Host|HostName|Computer|Server|Node|Device|DomainController|DC)\s*[:=]\s*(.+)$/i);
    if (explicit?.[1]) return normalizeWhitespace(explicit[1]).replace(/^\\+/, '');
    const numbered = trimmed.match(/^(?:#?\s*)?(?:\d+[\).:-]?\s+)([A-Za-z0-9][A-Za-z0-9_.()\/ -]{1,80})\s*$/i);
    if (numbered?.[1]) return normalizeWhitespace(numbered[1]).replace(/^\\+/, '');
    if (isStandaloneAssetLabel(trimmed) && !/^\d+$/.test(trimmed) && !/^(?:source file|static intake file)\s*:/i.test(trimmed)) {
      return normalizeWhitespace(trimmed.replace(/^[=\-#\[\]\s\\]+|[=\-#\[\]\s]+$/g, '')).replace(/^\\+/, '');
    }
  }
  const cleanSource = sourceName.replace(/\.[^.]+$/, '').trim();
  if (cleanSource && !/^Manual/i.test(cleanSource)) return blockCount > 1 ? `${cleanSource}-${String(ordinal).padStart(2, '0')}` : cleanSource;
  return `ASSET-${String(ordinal).padStart(2, '0')}`;
}

export function parseAuditpolBlock(raw: string): { entries: AuditEntry[]; diagnostics: string[] } {
  const entries: AuditEntry[] = [];
  const diagnostics: string[] = [];
  let currentCategory = '';
  const detected = new Set<string>();
  const seen = new Set<string>();
  let duplicates = 0;
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    const trimmed = original.trim();
    if (!trimmed) continue;
    if (/category\/subcategory/i.test(trimmed)) continue;
    if (/system audit policy/i.test(trimmed)) continue;
    if (/^[=\-#\s]+$/.test(trimmed)) continue;
    if (isStandaloneAssetLabel(trimmed)) continue;
    if (isCommandLine(trimmed)) continue;

    const category = knownCategories.find(c => c.toLowerCase() === trimmed.toLowerCase());
    if (category) {
      currentCategory = category;
      detected.add(category);
      continue;
    }

    const match = original.match(settingLine);
    if (match && currentCategory) {
      const subcategory = normalizeWhitespace(match[1]);
      const value = cleanSetting(match[2]);
      const rowKey = key(currentCategory, subcategory);
      if (seen.has(rowKey)) {
        duplicates++;
        diagnostics.push(`Warning DUPLICATE_SUBCATEGORY line ${i + 1}: ${currentCategory} / ${subcategory}. Latest value retained by scoring.`);
      }
      seen.add(rowKey);
      entries.push({ category: currentCategory, subcategory, setting: value, line: i + 1 });
      continue;
    }

    if (currentCategory) diagnostics.push(`Warning UNSUPPORTED_LINE ${i + 1}: ${trimmed.slice(0, 100)}`);
  }

  const missing = knownCategories.filter(c => !detected.has(c));
  if (entries.length < 50) diagnostics.push(`BLOCKING PARTIAL_AUDITPOL_INPUT: Only ${entries.length} auditpol row(s) were parsed. A complete export normally has around 60 rows, so scoring is blocked.`);
  if (entries.length >= 90 && duplicates >= 10) diagnostics.push(`BLOCKING POSSIBLE_MULTI_ASSET_INPUT_NOT_SPLIT: ${entries.length} rows and ${duplicates} duplicates look like several assets were parsed as one host.`);
  if (missing.length) diagnostics.push(`${entries.length < 50 ? 'BLOCKING' : 'Warning'} MISSING_AUDIT_CATEGORIES: ${missing.join(', ')}`);

  return { entries, diagnostics };
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i++; }
      else quoted = !quoted;
      continue;
    }
    if (ch === ',' && !quoted) { cells.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parseDelimitedMatrix(raw: string) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 4) return [] as string[][];
  if (lines.some(line => line.includes('\t'))) return lines.map(line => line.split('\t').map(cell => cell.trim()));
  if (lines.filter(line => line.includes(',')).length >= Math.max(2, Math.floor(lines.length / 3))) return lines.map(splitCsvLine);
  if (lines.filter(line => line.includes(';')).length >= Math.max(2, Math.floor(lines.length / 3))) return lines.map(line => line.split(';').map(cell => cell.trim().replace(/^"|"$/g, '')));
  return [] as string[][];
}

function findHeaderColumn(row: string[], headerName: string) {
  for (let i = 0; i < row.length; i++) {
    const cell = row[i].trim();
    if (cell.toLowerCase() === headerName.toLowerCase()) return i;
    if (headerName === 'Subcategory' && /subcategory/i.test(cell)) return i;
    if (headerName === 'Category' && /^audit category$/i.test(cell)) return i;
  }
  return -1;
}

function isIgnoredMatrixHeader(value: string) {
  const text = value.trim();
  if (!text) return false;
  return /baseline|consolidated|expected|target|golden|standard|reference/i.test(text) || /^view$/i.test(text);
}

function isIgnoredMatrixLabel(value: string) {
  const text = value.trim();
  return !text || /system audit policy|category\/subcategory/i.test(text) || isIgnoredMatrixHeader(text);
}

function isLikelyMatrixAssetColumn(value: string) {
  const text = value.trim();
  if (!text || isIgnoredMatrixHeader(text) || isKnownSetting(text) || text.length > 80) return false;
  if (/^(category|subcategory|setting)$/i.test(text)) return false;
  if (knownCategories.some(c => c.toLowerCase() === text.toLowerCase())) return false;
  return /\d|[-_.]/.test(text) || /^dc/i.test(text);
}

function detectMatrixAssetColumns(header: string[], startIndex: number) {
  const columns: Array<{ index: number; name: string }> = [];
  for (let i = Math.max(0, startIndex); i < header.length; i++) {
    const name = header[i].trim();
    if (isLikelyMatrixAssetColumn(name)) columns.push({ index: i, name });
  }
  return columns;
}

function findMatrixLayout(matrix: string[][]): MatrixLayout | null {
  for (let index = 0; index < Math.min(matrix.length, 12); index++) {
    const row = matrix[index];
    if (row.length < 4) continue;
    const categoryColumn = findHeaderColumn(row, 'Category');
    let subcategoryColumn = findHeaderColumn(row, 'Subcategory');
    if (subcategoryColumn < 0) subcategoryColumn = findHeaderColumn(row, 'Category/Subcategory');
    const assetColumns = detectMatrixAssetColumns(row, Math.max(0, Math.max(categoryColumn, subcategoryColumn) + 1));
    if (assetColumns.length >= 2 && subcategoryColumn >= 0) return { headerIndex: index, categoryIndex: categoryColumn, subcategoryIndex: subcategoryColumn, assetColumns };

    const first = row[0].trim();
    const settingsOrAssets = row.slice(1).filter(cell => isLikelyMatrixAssetColumn(cell) || isIgnoredMatrixHeader(cell)).length;
    if ((knownCategories.some(c => c.toLowerCase() === first.toLowerCase()) || /subcategory|system/i.test(first)) && settingsOrAssets >= 2) {
      return { headerIndex: index, categoryIndex: -1, subcategoryIndex: 0, assetColumns: detectMatrixAssetColumns(row, 1) };
    }
  }
  return null;
}

function getCell(row: string[], index: number) {
  return index >= 0 && index < row.length ? row[index] : '';
}

function tryParseAuditpolMatrix(raw: string, role: Role, os: OsFamily, sourceName: string): AuditAsset[] {
  const matrix = parseDelimitedMatrix(raw);
  if (matrix.length < 4) return [];
  const layout = findMatrixLayout(matrix);
  if (!layout || layout.assetColumns.length < 2) return [];

  const entriesByAsset = new Map<string, AuditEntry[]>();
  for (const col of layout.assetColumns) {
    let name = col.name;
    let suffix = 2;
    while (entriesByAsset.has(name)) name = `${col.name}-${suffix++}`;
    entriesByAsset.set(name, []);
  }

  let currentCategory = knownCategories.find(c => c.toLowerCase() === getCell(matrix[layout.headerIndex], layout.categoryIndex).trim().toLowerCase()) || '';
  if (!currentCategory) currentCategory = knownCategories.find(c => c.toLowerCase() === getCell(matrix[layout.headerIndex], layout.subcategoryIndex).trim().toLowerCase()) || '';
  const detected = new Set<string>();
  if (currentCategory) detected.add(currentCategory);

  for (let rowIndex = layout.headerIndex + 1; rowIndex < matrix.length; rowIndex++) {
    const row = matrix[rowIndex];
    const categoryCell = getCell(row, layout.categoryIndex).trim();
    const subcategoryCell = getCell(row, layout.subcategoryIndex).trim();
    const category = knownCategories.find(c => c.toLowerCase() === categoryCell.toLowerCase());
    if (category) {
      currentCategory = category;
      detected.add(category);
      if (!subcategoryCell || subcategoryCell.toLowerCase() === category.toLowerCase() || isIgnoredMatrixLabel(subcategoryCell)) continue;
    }
    const subcategoryAsCategory = knownCategories.find(c => c.toLowerCase() === subcategoryCell.toLowerCase());
    if (subcategoryAsCategory && layout.categoryIndex < 0) {
      currentCategory = subcategoryAsCategory;
      detected.add(subcategoryAsCategory);
      continue;
    }
    if (!currentCategory || !subcategoryCell || isIgnoredMatrixLabel(subcategoryCell)) continue;

    for (const col of layout.assetColumns) {
      const setting = cleanSetting(getCell(row, col.index));
      if (!isKnownSetting(setting) || setting === 'Missing' || setting === 'Evidence Required') continue;
      const entries = entriesByAsset.get(col.name) || entriesByAsset.get([...entriesByAsset.keys()].find(k => k.startsWith(col.name)) || col.name);
      entries?.push({ category: currentCategory, subcategory: normalizeWhitespace(subcategoryCell), setting, line: rowIndex + 1 });
    }
  }

  const totalRows = [...entriesByAsset.values()].reduce((sum, rows) => sum + rows.length, 0);
  if (entriesByAsset.size < 2 || totalRows < 80) return [];
  const missing = knownCategories.filter(c => !detected.has(c));

  return [...entriesByAsset.entries()].flatMap(([name, entries]) => {
    if (!entries.length) return [];
    const diagnostics: string[] = [];
    if (entries.length < 50) diagnostics.push(`BLOCKING PARTIAL_AUDITPOL_INPUT: Only ${entries.length} auditpol row(s) were parsed for matrix asset '${name}'. Scoring is blocked.`);
    if (missing.length) diagnostics.push(`${entries.length < 50 ? 'BLOCKING' : 'Warning'} MISSING_AUDIT_CATEGORIES: ${missing.join(', ')}`);
    return [{ name, role, os, raw, entries, diagnostics, sourceType: 'matrix' as const }];
  });
}

function splitByExplicitAssetHeaders(text: string) {
  const matches = [...text.matchAll(/^(?:Asset|Host|HostName|Computer|Server|Node|Device|DomainController|DC)\s*[:=]\s*(.+)$/gim)];
  if (matches.length <= 1) return [] as Array<{ name: string; raw: string }>;
  return matches.map((match, i) => {
    const start = match.index || 0;
    const end = i + 1 < matches.length ? matches[i + 1].index || text.length : text.length;
    return { name: normalizeWhitespace(match[1]), raw: text.slice(start, end).trim() };
  });
}

export function splitAssets(raw: string, role: Role, os: OsFamily, fallbackName = 'Imported auditpol'): AuditAsset[] {
  const text = raw.trim();
  if (!text) return [];

  const matrixAssets = tryParseAuditpolMatrix(text, role, os, fallbackName);
  if (matrixAssets.length > 1) return matrixAssets;

  const blocks: Array<{ name: string; raw: string }> = [];
  const explicit = splitByExplicitAssetHeaders(text);
  if (explicit.length > 1) {
    blocks.push(...explicit);
  } else {
    const parts = text.split(/\n\s*={10,}\s*\n|\n\s*-{10,}\s*\n/g).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      parts.forEach((part, index) => blocks.push({ name: detectAssetName(part, fallbackName, index + 1, parts.length), raw: part }));
    } else {
      blocks.push({ name: detectAssetName(text, fallbackName, 1, 1), raw: text });
    }
  }

  return blocks.map((block, index) => {
    const parsed = parseAuditpolBlock(block.raw);
    return { name: block.name || detectAssetName(block.raw, fallbackName, index + 1, blocks.length), role, os, raw: block.raw, ...parsed, sourceType: blocks.length > 1 ? 'multi-file' as const : 'text' as const };
  }).filter(asset => asset.entries.length > 0);
}

function scoringBlocked(asset: AuditAsset) {
  return asset.diagnostics.some(d => /^BLOCKING/i.test(d));
}

export function assess(raw: string, role: Role, os: OsFamily, mode: Mode, sourceName = 'Imported auditpol'): Assessment {
  const assets = splitAssets(raw, role, os, sourceName);
  const controls = mode === 'Basic' ? basicControls : advancedControls;
  const findings: Finding[] = [];
  for (const asset of assets) {
    const lookup = new Map<string, string>();
    for (const entry of asset.entries) lookup.set(key(entry.category, entry.subcategory), entry.setting);
    const blocked = scoringBlocked(asset);
    const blockReason = asset.diagnostics.find(d => /^BLOCKING/i.test(d)) || 'Evidence requires parser review before scoring.';
    for (const control of controls) {
      const expected = mode === 'Advanced' || blocked ? 'Evidence Required' : cleanSetting(expectedFor(control, role));
      const actual = mode === 'Advanced'
        ? 'Validate in SIEM / source evidence'
        : blocked
          ? blockReason
          : (lookup.get(key(control.Category, control.Subcategory)) || 'Missing');
      const status = mode === 'Advanced' || blocked ? 'Evidence Required' : evalSetting(expected, actual);
      findings.push({
        assetName: asset.name,
        role,
        os,
        controlId: control.ControlID || '',
        category: control.Category,
        subcategory: control.Subcategory,
        expected,
        actual,
        status,
        priority: control.Priority || '',
        telemetryImpact: control.TelemetryImpact || '',
        recommendation: control.Recommendation || control.MicrosoftRecommendedSetting || '',
        eventIds: [...(control.EventIDs || []), ...(control.ExpectedEventIDs || [])].join('; '),
        mitre: (control.MITRE_ATTCK || []).join('; '),
        frameworks: control.FrameworkAlignmentSummary || [control.NIST_SP_800_53?.join(', '), control.NIST_CSF_2_0?.join(', '), control.CIS?.join(', ')].filter(Boolean).join(' | '),
        engineerRemediation: control.EngineerRemediation || '',
        analystValue: control.AnalystValue || '',
        auditorRationale: control.AuditorRationale || '',
        blindSpot: control.BlindSpotIfMissing || control.SecurityImpact || '',
        baseline: control
      });
    }
  }
  const aligned = findings.filter(f => f.status === 'Aligned').length;
  const partial = findings.filter(f => f.status === 'Partial').length;
  const gap = findings.filter(f => f.status === 'Gap').length;
  const evidence = findings.filter(f => f.status === 'Evidence Required').length;
  const scorable = aligned + partial + gap;
  const score = scorable ? Math.round(((aligned + partial * 0.5) / scorable) * 100) : 0;
  return { mode, generatedAt: new Date().toISOString(), assets, findings, aligned, partial, gap, evidence, score };
}

function comparableAssetName(value: string) {
  return value.toLowerCase().replace(/\b(before|after|pre|post|old|new|baseline|updated)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function compare(beforeRaw: string, afterRaw: string, role: Role, os: OsFamily): ComparisonRow[] {
  const before = assess(beforeRaw, role, os, 'Basic', 'Before').findings;
  const after = assess(afterRaw, role, os, 'Basic', 'After').findings;
  const beforeExact = new Map(before.map(f => [`${comparableAssetName(f.assetName)}|${f.controlId}`, f]));
  const beforeByControl = new Map<string, Finding[]>();
  before.forEach(f => beforeByControl.set(f.controlId, [...(beforeByControl.get(f.controlId) || []), f]));
  return after.map(a => {
    const b = beforeExact.get(`${comparableAssetName(a.assetName)}|${a.controlId}`) || beforeByControl.get(a.controlId)?.[0] || a;
    const movement = rank(a.status) > rank(b.status) ? 'Improved' : rank(a.status) < rank(b.status) ? 'Regressed' : 'Unchanged';
    return { assetName: a.assetName, controlId: a.controlId, area: `${a.assetName} | ${a.category} / ${a.subcategory}`, before: b.status, after: a.status, movement, beforeActual: b.actual, afterActual: a.actual };
  });
}

function esc(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}

export function toCsv(assessment: Assessment) {
  const header = ['Asset','Role','OperatingSystem','ControlID','Category','Subcategory','Expected','Actual','Status','Priority','TelemetryImpact','EventIDs','MITRE','Frameworks','Remediation'];
  const csv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [header.map(csv).join(','), ...assessment.findings.map(f => [f.assetName,f.role,f.os,f.controlId,f.category,f.subcategory,f.expected,f.actual,f.status,f.priority,f.telemetryImpact,f.eventIds,f.mitre,f.frameworks,f.engineerRemediation].map(csv).join(','))].join('\n');
}

export function toHtmlReport(assessment: Assessment) {
  const diagnostics = assessment.assets.flatMap(a => a.diagnostics.map(d => `<li><b>${esc(a.name)}</b>: ${esc(d)}</li>`)).join('');
  const rows = assessment.findings.map(f => `<tr><td>${esc(f.assetName)}</td><td>${esc(f.role)}</td><td>${esc(f.os)}</td><td>${esc(f.controlId)}</td><td>${esc(f.category)}</td><td>${esc(f.subcategory)}</td><td>${esc(f.expected)}</td><td>${esc(f.actual)}</td><td class="${f.status.toLowerCase().replace(/\s+/g,'-')}">${esc(f.status)}</td><td>${esc(f.priority)}</td><td>${esc(f.eventIds)}</td><td>${esc(f.mitre)}</td><td>${esc(f.frameworks)}</td><td>${esc(f.engineerRemediation)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>AuditPol TAS v70 Evidence Pack</title><style>
  :root{--navy:#0B2147;--line:#d1d5db;--muted:#475569;--bg:#f3f6fa;--orange:#ff7a00}
  *{box-sizing:border-box}body{font-family:Segoe UI,Arial,sans-serif;margin:0;color:#111827;background:var(--bg)}
  .reportShell{min-height:100vh;display:flex;flex-direction:column}.reportToolbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--navy);color:#fff;padding:10px 14px;box-shadow:0 2px 10px rgba(0,0,0,.18)}
  .reportToolbar strong{font-size:15px}.reportActions{display:flex;gap:8px;align-items:center}.iconButton{border:1px solid rgba(255,255,255,.55);background:#fff;color:var(--navy);border-radius:6px;padding:8px 10px;font-weight:700;cursor:pointer;display:inline-flex;gap:7px;align-items:center}.iconButton:hover{background:#eef6ff}.iconButton.print{background:#ff7a00;color:#fff;border-color:#ff7a00}.editOn{outline:3px solid #ffb65c;outline-offset:4px;background:#fffdf8!important}
  #reportContent{padding:22px}.hero{background:#fff;border:1px solid var(--line);padding:18px;margin-bottom:14px}.hero h1{font-size:28px;margin:0 0 7px;color:var(--navy)}.hero p{margin:0;color:var(--muted)}
  .kpis{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:10px;margin:14px 0}.kpis div{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 14px}.kpis b{font-size:24px;color:var(--navy)}
  .diagnostics{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:8px;margin:12px 0}.tableCard{background:#fff;border:1px solid var(--line);margin-top:14px}.tableHead{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line);background:#f8fafc}.scrollHint{font-size:12px;color:var(--muted);font-weight:700}.wideSlider{overflow:auto;max-width:100%;border-top:1px solid #eef2f7;scrollbar-width:auto;scrollbar-color:#64748b #e2e8f0}.wideSlider::-webkit-scrollbar{height:16px;width:16px}.wideSlider::-webkit-scrollbar-thumb{background:#64748b;border-radius:8px}.wideSlider::-webkit-scrollbar-track{background:#e2e8f0}
  table{border-collapse:separate;border-spacing:0;min-width:1900px;width:max-content;font-size:12px}td,th{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:8px;vertical-align:top;max-width:260px;overflow-wrap:anywhere}th{background:var(--navy);color:#fff;position:sticky;top:0;z-index:4}th:first-child,td:first-child{position:sticky;left:0;z-index:3}td:first-child{background:#fff;font-weight:700}th:first-child{background:#081b3a;z-index:5}.aligned{background:#dcfce7}.partial{background:#fef9c3}.gap{background:#fee2e2}.evidence-required{background:#e0f2fe}
  .footerNote{margin-top:12px;color:var(--muted);font-size:12px}@media print{.reportToolbar,.scrollHint{display:none}body{background:#fff}#reportContent{padding:0}.wideSlider{overflow:visible}table{min-width:0;width:100%;font-size:9px}td,th{padding:4px;max-width:120px}.hero,.tableCard{border:0}.kpis{grid-template-columns:repeat(5,1fr)}}
  </style><script>
  function toggleEdit(){var c=document.getElementById('reportContent');var b=document.getElementById('editButton');var on=c.getAttribute('contenteditable')==='true';c.setAttribute('contenteditable', on?'false':'true');c.classList.toggle('editOn', !on);b.innerHTML=!on?'💾 Save text edits':'✏️ Edit report text';}
  function printReport(){window.print();}
  </script></head><body><div class="reportShell"><div class="reportToolbar"><strong>AuditPol TAS Evidence Pack</strong><div class="reportActions"><button id="editButton" class="iconButton" onclick="toggleEdit()" title="Edit all report text">✏️ Edit report text</button><button class="iconButton print" onclick="printReport()" title="Print or save as PDF">🖨️ Print / save PDF</button></div></div><main id="reportContent"><section class="hero"><h1>AuditPol TAS v70 Evidence Pack</h1><p>Generated ${esc(new Date(assessment.generatedAt).toLocaleString())} | Mode ${esc(assessment.mode)} | Assets ${assessment.assets.length}</p></section><div class="kpis"><div><b>${assessment.score}%</b><br>Score</div><div><b>${assessment.aligned}</b><br>Aligned</div><div><b>${assessment.partial}</b><br>Partial</div><div><b>${assessment.gap}</b><br>Gap</div><div><b>${assessment.evidence}</b><br>Evidence Required</div></div>${diagnostics ? `<div class="diagnostics"><h2>Parser diagnostics</h2><ul>${diagnostics}</ul></div>` : ''}<section class="tableCard"><div class="tableHead"><h2>Detailed findings table</h2><span class="scrollHint">Drag the horizontal slider below to view all columns</span></div><div class="wideSlider"><table><thead><tr><th>Asset</th><th>Role</th><th>OS</th><th>Control</th><th>Category</th><th>Subcategory</th><th>Expected</th><th>Actual</th><th>Status</th><th>Priority</th><th>Event IDs</th><th>MITRE</th><th>Frameworks</th><th>Remediation</th></tr></thead><tbody>${rows}</tbody></table></div></section><p class="footerNote">Tip: use the Edit button to amend narrative text, then Print / save PDF to produce a customer copy.</p></main></div></body></html>`;
}
