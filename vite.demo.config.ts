import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

function patchDemoApp(source: string): string {
  let code = source;
  code = code.replace("const workspaceStorageKey = 'tas-v70-18-aurora-workspace';", "const demoMode = true;\nconst workspaceStorageKey = 'tas-v70-demo-synthetic-workspace';");
  code = code.replace("  const storedWorkspace = useMemo(readStoredWorkspace, []);", "  const storedWorkspace = useMemo(() => null, []);");
  code = code.replace("  const [input, setInput] = useState(storedWorkspace?.input || '');", "  const [input, setInput] = useState(samples.sampleTwoAssets);");
  code = code.replace("  const [beforeInput, setBeforeInput] = useState(storedWorkspace?.beforeInput || '');", "  const [beforeInput, setBeforeInput] = useState(samples.sampleTwoAssets);");
  code = code.replace("  const [afterInput, setAfterInput] = useState(storedWorkspace?.afterInput || '');", "  const [afterInput, setAfterInput] = useState(samples.sampleTenDc);");
  code = code.replace("  const [goldenInput, setGoldenInput] = useState(storedWorkspace?.goldenInput || '');", "  const [goldenInput, setGoldenInput] = useState(samples.sampleTenDc);");
  code = code.replace("  const [status, setStatus] = useState('No evidence parsed yet. Paste or load auditpol output, then click Parse pasted evidence.');", "  const [status, setStatus] = useState('Interactive demo loaded with fixed synthetic evidence. All reports are watermarked and contain no commercial Golden baseline.');");
  code = code.replace("  const [lastSaved, setLastSaved] = useState(storedWorkspace ? 'Workspace restored' : 'New workspace');", "  const [lastSaved, setLastSaved] = useState('Synthetic demo workspace');");
  code = code.replace("  useEffect(() => {\n    const timer = window.setTimeout(() => {", "  useEffect(() => {\n    if (demoMode) return;\n    const timer = window.setTimeout(() => {");
  code = code.replace("  function clearAll() { setInput(''); setAssessment(null); setSelected(null); setReportHtml(''); setStatus('Cleared. Paste or load auditpol evidence.'); }", "  function clearAll() { setInput(samples.sampleTwoAssets); setAssessment(null); setSelected(null); setReportHtml(''); setStatus('Demo reset to the fixed synthetic evidence pack.'); }");
  code = code.replace("  async function readFiles(filesLike: FileList | File[] | null, target: EvidenceTarget) {\n    const files", "  async function readFiles(filesLike: FileList | File[] | null, target: EvidenceTarget) {\n    setStatus('The free demo accepts only the bundled synthetic inputs. Professional and Consultant editions accept customer evidence locally.'); return;\n    const files");
  code = code.replace("  return <div className={cn('tasDesktop tasNextGen', navCompact && 'navCompact')}>", "  return <div className={cn('tasDesktop tasNextGen', navCompact && 'navCompact', 'tasDemoMode')}><div className=\"tasDemoRibbon\"><b>FREE INTERACTIVE DEMO</b><span>Synthetic evidence and controls only · full navigation and reporting · no commercial Golden baseline</span><a href=\"/\">View editions and pricing</a></div>");
  code = code.replace("<p>TAS v70 Cloudflare embedded | v70.18 AURORA command-centre build</p>", "<p>TAS interactive demonstration | synthetic control pack</p>");
  code = code.replace("{activated ? 'Commercial licence active' : 'Protected demonstration mode'}", "{'Free interactive demo'}");
  code = code.replaceAll('commercial-parity-demo-web', 'synthetic-interactive-demo');
  code = code.replace("input={input} setInput={setInput}", "input={input} setInput={() => setStatus('Demo evidence is fixed. Choose another bundled synthetic sample or upgrade to Professional.')}");
  code = code.replace("setBeforeInput={setBeforeInput} setAfterInput={setAfterInput}", "setBeforeInput={() => setStatus('Demo Before evidence is fixed.')} setAfterInput={() => setStatus('Demo After evidence is fixed.')}");
  code = code.replace("goldenInput={goldenInput} setGoldenInput={setGoldenInput}", "goldenInput={goldenInput} setGoldenInput={() => setStatus('Demo Golden comparison uses a synthetic pack and cannot be replaced.')}");
  return code;
}

export default defineConfig({
  root: path.resolve(__dirname, 'editions/demo'),
  plugins: [
    react(),
    {
      name: 'tas-demo-boundary',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === './tasEngine' && importer && importer.replaceAll('\\', '/').endsWith('/src/App.tsx')) {
          return path.resolve(__dirname, 'src/demo/demoEngine.ts');
        }
      },
      transform(code, id) {
        if (id.replaceAll('\\', '/').endsWith('/src/App.tsx')) {
          const patched = patchDemoApp(code);
          if (patched === code || !patched.includes('tasDemoRibbon')) throw new Error('TAS Demo App transform did not apply');
          return { code: patched, map: null };
        }
      }
    }
  ],
  build: { outDir: path.resolve(__dirname, 'dist-editions/demo'), emptyOutDir: true },
  base: './'
});
