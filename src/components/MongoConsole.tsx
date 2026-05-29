import React from 'react';
import { Database, Terminal, Play, HelpCircle, Code } from 'lucide-react';
import { SimulatedDB } from '../utils/dbEngine';

interface MongoConsoleProps {
  dbEngine: SimulatedDB;
  onRefreshFromDB: () => void;
}

const TEMPLATE_PIPELINES = [
  {
    label: "Fetch Unresolved Critical Faults",
    pipeline: `[\n  { "$match": { "repaired": false, "severity": "critical" } }\n]`
  },
  {
    label: "Group Fault Incidents Count by Machine ID",
    pipeline: `[\n  { "$match": { "repaired": false } },\n  {\n    "$group": {\n      "_id": "$machine_id",\n      "active_alert_count": { "$sum": 1 },\n      "average_frequency_vibration": { "$avg": "$telemetry.vibration_g" }\n    }\n  }\n]`
  },
  {
    label: "Filter Raw Sensors reporting excessive Vibrations (>1.5g)",
    pipeline: `[\n  {\n    "$match": {\n      "telemetry.vibration_g": { "$gt": 1.5 }\n    }\n  },\n  {\n    "$project": {\n      "_id": 1,\n      "machine_id": 1,\n      "component": 1,\n      "vibe_read": "$telemetry.vibration_g"\n    }\n  }\n]`
  },
  {
    label: "Find Latest 3 Log Faults Sorted Chronologically",
    pipeline: `[\n  { "$sort": { "timestamp": -1 } },\n  { "$limit": 3 }\n]`
  }
];

export default function MongoConsole({ dbEngine, onRefreshFromDB }: MongoConsoleProps) {
  const [pipelineText, setPipelineText] = React.useState(TEMPLATE_PIPELINES[0].pipeline);
  const [results, setResults] = React.useState<any[]>([]);
  const [execTime, setExecTime] = React.useState(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Exec on load
  React.useEffect(() => {
    handleRunAggregation();
  }, []);

  const handleRunAggregation = () => {
    setErrorMsg(null);
    const start = performance.now();
    try {
      const res = dbEngine.executeMongoAggregation(pipelineText);
      setResults(res);
      setExecTime(Math.round((performance.now() - start) * 100) / 100);
    } catch (err: any) {
      setErrorMsg(err.message);
      setResults([]);
    }
  };

  const loadTemplate = (pText: string) => {
    setPipelineText(pText);
    setErrorMsg(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Columns: Aggregation Help / Collections Index */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Document Model Blueprint */}
        <div className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-semibold font-sans flex items-center gap-2 text-white">
            <Code size={15} className="text-amber-400" />
            MongoDB Document BSON Schema
          </h3>
          <p className="text-xs text-slate-400">
            Document database tables (Collections) store nesting parameters, allowing each alarm to possess independent shapes.
          </p>

          <div className="bg-slate-950 rounded-lg p-3 border border-slate-850 font-mono text-[10px] leading-relaxed text-slate-300">
            <span className="text-slate-500 font-semibold italic">// COLLECTION: fault_logs</span>
            <pre className="mt-1 font-mono text-slate-200">{`{
  _id: "log_fl002",
  machine_id: "M-A100",
  component: "Elbow Joint Motor",
  severity: "critical" | "warning",
  error_code: "E-MOTOR-102",
  message: "Current draw peaked...",
  telemetry: {
    temperature_c: 84.1,
    vibration_g: 2.14,
    voltage_v: 21.8
  },
  repaired: false,
  timestamp: ISODate("...")
}`}</pre>
          </div>
        </div>

        {/* Aggregation Pipeline Templates Selector */}
        <div id="mongo-templates-card" className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
          <h3 className="text-sm font-semibold font-sans flex items-center gap-2 text-white">
            <HelpCircle size={15} className="text-amber-400" />
            Aggregate Query Operators
          </h3>
          <p className="text-xs text-slate-400">
            Select a MongoDB JSON Aggregation pipeline template to filter and transform logs dynamically:
          </p>

          <div className="space-y-2 pt-2">
            {TEMPLATE_PIPELINES.map((p, idx) => (
              <button
                key={idx}
                onClick={() => loadTemplate(p.pipeline)}
                className="w-full text-left p-2.5 rounded-lg border border-slate-800 hover:bg-slate-800 bg-slate-950 hover:border-slate-700 transition-all text-xs font-sans font-medium text-slate-300 flex justify-between items-center group cursor-pointer"
              >
                <div className="truncate pr-2">
                  <span className="block text-[11px] text-slate-500 font-mono mb-0.5">Pipeline Option #{idx + 1}</span>
                  <span className="truncate block font-semibold text-slate-200">{p.label}</span>
                </div>
                <Play size={10} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column: Terminal Console + Document Stream Outputs */}
      <div className="lg:col-span-8 flex flex-col space-y-6">

        {/* Unified MongoDB Terminal Console (CLI + Output) */}
        <div id="mongo-terminal-panel" className="bg-slate-900 rounded-xl flex flex-col shadow-lg border border-slate-950 overflow-hidden min-h-[500px]">
          <div className="bg-slate-950 px-4 py-3 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-amber-400" />
              <span className="font-mono text-xs font-semibold text-slate-300">db.fault_logs.aggregate( [ ... ] ) v1.2</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">STATUS: CLUSTER READY</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
          </div>

          {/* 1. Terminal Textarea panel */}
          <div className="p-4 flex flex-col space-y-3 bg-slate-900 border-b border-slate-800">
            <textarea
              id="mongo-pipeline-textarea"
              value={pipelineText}
              onChange={(e) => setPipelineText(e.target.value)}
              placeholder="Enter MongoDB Aggregation Pipeline Array"
              className="w-full h-32 bg-slate-950 text-amber-100 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed font-medium"
            />

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="font-mono text-amber-500/80">
                INFO: MONGODB IS NO-SQL SCHEMALESS CAPABLE
              </span>
              <button
                id="run-mongo-btn"
                onClick={handleRunAggregation}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Play size={12} fill="black" stroke="none" />
                EXECUTE AGGREGATION
              </button>
            </div>
          </div>

          {/* 2. Integrated CLI STDOUT Stream panel */}
          <div className="bg-slate-950 flex-1 p-5 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center border-b pb-3 mb-4 border-slate-800">
              <h3 className="text-xs font-bold font-mono text-amber-400 flex items-center gap-1.5 uppercase">
                <Database size={13} />
                COLLECTION BSON STREAM OUTPUT
              </h3>

              {errorMsg ? (
                <span className="text-[10px] font-mono bg-rose-950/60 border border-rose-900 text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                  AGGREGATION FAILED
                </span>
              ) : (
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                  <span>Output Documents: <strong className="text-slate-300">{results.length}</strong></span>
                  <span>Latency: <strong className="text-slate-400">{execTime}ms</strong></span>
                </div>
              )}
            </div>

            {/* Results document inspector - Styled in beautiful High-Contrast Terminal theme */}
            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[350px]">
              {errorMsg ? (
                <div className="bg-rose-950/40 border border-rose-900 text-rose-350 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed space-y-1">
                  <div className="font-bold uppercase tracking-wide text-rose-400 flex items-center gap-1.5">
                    ❌ [MONGO ENGINE ERROR EXCEPTION]
                  </div>
                  <p className="text-rose-200">{errorMsg}</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((doc, idx) => (
                    <div key={doc._id || idx} className="bg-slate-900/55 border border-slate-800 rounded-lg p-3 font-mono text-xs overflow-x-auto relative shadow-sm">
                      <span className="absolute top-2 right-2 text-[9px] bg-slate-800 text-slate-500 font-mono py-0.5 px-1.5 rounded uppercase font-bold border border-slate-700">
                        doc #{idx + 1}
                      </span>
                      <pre className="text-amber-100/90 font-mono leading-relaxed font-medium">
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-10 border border-dashed border-slate-800 rounded-lg bg-slate-900/20 text-slate-500 text-xs font-mono">
                  <span>Pipeline execution completed. Zero JSON documents returned.</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
