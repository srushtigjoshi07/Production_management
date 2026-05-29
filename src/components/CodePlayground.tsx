import React from 'react';
import { FileCode, Play, Save, Terminal, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { PlaygroundFile } from '../types';

interface CodePlaygroundProps {
  files: PlaygroundFile[];
  onSaveFile: (id: string, newCode: string) => void;
}

export default function CodePlayground({ files, onSaveFile }: CodePlaygroundProps) {
  const [selectedFile, setSelectedFile] = React.useState<PlaygroundFile>(files[0]);
  const [editorValue, setEditorValue] = React.useState(files[0].code);
  const [compileStatus, setCompileStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [compileLogs, setCompileLogs] = React.useState<string[]>([]);

  // Sync editor when active file tab shifts
  React.useEffect(() => {
    setEditorValue(selectedFile.code);
    setCompileStatus('idle');
    setCompileLogs([
      `[INFO] Loaded repository file: ${selectedFile.filename}`,
      `[INFO] Language syntax highlighter configured for: ${selectedFile.language.toUpperCase()}`
    ]);
  }, [selectedFile]);

  const handleCompile = () => {
    setCompileStatus('idle');
    const start = performance.now();
    let logs: string[] = [];
    logs.push(`[BUILER] Transpiling TS/JS file: ${selectedFile.filename} ...`);

    try {
      // Direct syntax checker
      if (selectedFile.language === 'typescript' || selectedFile.language === 'javascript') {
        const checkFn = new Function('machine', 'sqlRecords', 'mongoLogs', `
          ${editorValue.replace(/export\s+function/g, 'function')}
        `);
        logs.push(`[COMPILER] Code syntax parsed successfully in ${(performance.now() - start).toFixed(1)}ms.`);
        
        if (selectedFile.id === 'downtime_predictor' && !editorValue.includes('predictDowntimeRisk')) {
          throw new Error("Missing exported function 'predictDowntimeRisk' inside code body.");
        }
        if (selectedFile.id === 'vibration_analyzer' && !editorValue.includes('analyzeVibrationAnomaly')) {
          throw new Error("Missing exported function 'analyzeVibrationAnomaly' inside code body.");
        }
      } else {
        logs.push(`[CATALOG] Database relational definitions saved into main structural cluster.`);
      }

      onSaveFile(selectedFile.id, editorValue);
      
      // Update selected file object local copy so it saves the state
      const updated = { ...selectedFile, code: editorValue };
      setSelectedFile(updated);

      logs.push(`[SUCCESS] Output written to binary path: /dist/${selectedFile.filename.replace(/\.ts$/, '.js')}`);
      logs.push(`[SUCCESS] Dynamic production monitoring loops hot-reloaded safely!`);
      
      setCompileLogs(logs);
      setCompileStatus('success');
    } catch (e: any) {
      logs.push(`[ERROR] Syntax compilation rejected: ${e.message}`);
      setCompileLogs(logs);
      setCompileStatus('error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-800 rounded-xl overflow-hidden shadow-lg bg-slate-900 min-h-[500px]">
      
      {/* 1. Sidebar - File Navigator */}
      <div className="lg:col-span-3 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold block">Applet Explorer</span>
          <h4 className="font-semibold text-sm font-sans text-white">Scada System files</h4>
        </div>

        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {files.map(f => {
            const isSelected = f.id === selectedFile.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  // Sync file back in case of edits
                  const currentFileInList = files.find(curr => curr.id === f.id);
                  if (currentFileInList) {
                    setSelectedFile(currentFileInList);
                  }
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 cursor-pointer transition ${
                  isSelected 
                    ? 'bg-slate-950 text-white font-medium border border-slate-800 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileCode size={14} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                <div className="truncate">
                  <span className="block truncate">{f.filename}</span>
                  <span className={`text-[9px] uppercase font-sans ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                    {f.language}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
          <p className="flex items-start gap-1">
            <Info size={12} className="text-slate-500 mt-0.5" />
            <span>Customize calculations or thresholds. Hit compile to hot-swap logic.</span>
          </p>
        </div>
      </div>

      {/* 2. Middle - Code Editor Container */}
      <div className="lg:col-span-6 flex flex-col bg-slate-950">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">{selectedFile.filename}</span>
            <span className="text-slate-500 font-sans italic">— {selectedFile.description}</span>
          </div>
          <button
            id="compile-save-btn"
            onClick={handleCompile}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded flex items-center gap-1 cursor-pointer transition shadow text-xs"
          >
            <Save size={12} />
            Save & Compile
          </button>
        </div>

        <div className="flex-1 relative">
          <textarea
            id="code-playground-textarea"
            value={editorValue}
            onChange={(e) => setEditorValue(e.target.value)}
            className="w-full h-[450px] bg-slate-950 text-slate-100 font-mono text-xs p-5 focus:outline-none focus:ring-0 leading-relaxed resize-none border-0 selection:bg-slate-800 font-medium"
            spellCheck={false}
          />
        </div>
      </div>

      {/* 3. Right Column - Console Warnings & Logs output */}
      <div className="lg:col-span-3 border-l border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold block">Terminal Output</span>
          <h4 className="font-semibold text-sm font-sans text-white flex items-center gap-1.5">
            <Terminal size={14} className="text-slate-400" />
            System Compiler
          </h4>
        </div>

        {/* Compiler Status banner */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Operational Status</span>
          <div className="mt-1 flex items-center gap-2">
            {compileStatus === 'idle' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-xs font-semibold text-slate-300">Idle / Awaiting saving</span>
              </>
            )}
            {compileStatus === 'success' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                  <CheckCircle size={13} />
                  <span>Loop Loaded (Hot-Swap)</span>
                </div>
              </>
            )}
            {compileStatus === 'error' && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <div className="flex items-center gap-1 text-rose-400 font-semibold text-xs">
                  <AlertTriangle size={13} />
                  <span>Compilation Rejected</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Logging text box */}
        <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-2 bg-slate-900 text-slate-300">
          {compileLogs.map((log, idx) => {
            const isError = log.includes('[ERROR]');
            const isSuccess = log.includes('[SUCCESS]');
            const isWarning = log.includes('[WARNING]');

            let color = 'text-slate-300';
            if (isError) color = 'text-rose-400 font-bold';
            else if (isSuccess) color = 'text-emerald-400 font-bold';
            else if (isWarning) color = 'text-amber-400 font-semibold';

            return (
              <div key={idx} className={`${color} break-words whitespace-pre-wrap`}>
                {log}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
