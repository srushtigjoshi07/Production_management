import React from 'react';
import { Sparkles, Brain, Cpu, MessageSquareWarning, ArrowRight, Clipboard } from 'lucide-react';
import Markdown from 'react-markdown';
import { Machine, SqlProductionRecord, MongoFaultLog, DowntimePredictionResult } from '../types';

interface AIPromptExplainerProps {
  selectedMachine: Machine;
  sqlRecords: SqlProductionRecord[];
  mongoLogs: MongoFaultLog[];
  prediction: DowntimePredictionResult;
}

export default function AIPromptExplainer({
  selectedMachine,
  sqlRecords,
  mongoLogs,
  prediction
}: AIPromptExplainerProps) {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [loadStep, setLoadStep] = React.useState(0);

  const steps = [
    "Compiling relational machine shift outputs (SQL)...",
    "Parsing schemaless document alarms (MongoDB)...",
    "Joining SQL–NoSQL hybrid indices...",
    "Querying Gemini 3.5 diagnostic core..."
  ];

  React.useEffect(() => {
    let timer: any;
    if (loading) {
      setLoadStep(0);
      timer = setInterval(() => {
        setLoadStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleFetchAiPrognosis = async () => {
    setLoading(true);
    setReport(null);
    setErrorMsg(null);

    const mSql = sqlRecords.filter(r => r.machine_id === selectedMachine.id);
    const mMongo = mongoLogs.filter(l => l.machine_id === selectedMachine.id);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine: selectedMachine,
          sqlRecords: mSql.slice(-4), // slice recent ones
          mongoLogs: mMongo.slice(-4),
          prediction: prediction
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status} connecting to server api.`);
      }

      setReport(data.text);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unresolved exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
      
      {/* Accent Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <h3 className="text-lg font-bold font-sans text-white flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-400 fill-indigo-950/40 animate-pulse" />
            AI Principal Machinery Diagnostics Core
          </h3>
          <p className="text-xs text-slate-400">
            Triggers cross-store data joints to perform root-cause downtime forecasting using Google Gemini.
          </p>
        </div>

        <button
          id="get-diagnostics-btn"
          onClick={handleFetchAiPrognosis}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition duration-200 disabled:opacity-75 disabled:cursor-wait shrink-0 cursor-pointer text-xs"
        >
          <Brain size={15} />
          {loading ? "Generating Report..." : "Query AI Prognosis"}
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="min-h-[220px] flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
              <Cpu size={24} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <span className="font-mono text-xs text-indigo-450 font-bold uppercase tracking-wider block">Diagnostics Engaged</span>
              <p className="text-xs text-slate-400 font-medium font-sans animate-pulse">{steps[loadStep]}</p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-950/20 border border-dashed border-rose-900 rounded-lg p-5 flex items-start gap-3 text-rose-300">
            <MessageSquareWarning size={20} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold uppercase font-mono text-rose-400">Telemetry Proxy Incomplete</h4>
              <p className="leading-relaxed text-rose-200">
                {errorMsg}
              </p>
              <div className="mt-3 text-[11px] text-rose-350">
                To activate direct Gemini model analysis, configure your <code className="bg-rose-950/60 p-1.5 rounded font-mono font-bold border border-rose-900 text-white">GEMINI_API_KEY</code> within the <strong className="font-semibold text-white">Settings &gt; Secrets</strong> sidebar.
              </div>
            </div>
          </div>
        ) : report ? (
          <div id="ai-report-body" className="space-y-5">
            
            {/* Report Tagline */}
            <div className="flex justify-between items-center bg-slate-950 py-2.5 px-4 rounded-lg border border-slate-850 text-xs">
              <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase">
                TARGET REPORT: {selectedMachine.id}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                Authorized Operator: jsrushti71@gmail.com
              </span>
            </div>

            {/* Markdown Viewer */}
            <div className="markdown-body text-slate-200 text-xs sm:text-sm leading-relaxed max-w-none prose prose-invert prose-indigo bg-slate-950/60 p-5 rounded-xl border border-slate-850 p-4 prose-sm space-y-4">
              <Markdown>{report}</Markdown>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 p-6 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
              <Brain size={24} />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-white">Generate Prognosis Checklist</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Connect SQL shift efficiency trends and MongoDB active sensor anomaly flags. Clicking "Query AI Prognosis" submits the joined dataset to Gemini for a technician checklist.
              </p>
            </div>
            <button
              onClick={handleFetchAiPrognosis}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition uppercase tracking-wider font-mono"
            >
              Consult AI Diagnostics Unit <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
