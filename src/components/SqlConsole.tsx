import React from 'react';
import { Database, Terminal, Play, HelpCircle, Table } from 'lucide-react';
import { SimulatedDB } from '../utils/dbEngine';

interface SqlConsoleProps {
  dbEngine: SimulatedDB;
  onRefreshFromDB: () => void;
}

const TEMPLATE_QUERIES = [
  {
    label: "Show All Production Runs",
    sql: "SELECT * FROM production_history ORDER BY id DESC LIMIT 10"
  },
  {
    label: "Show Only Active Machines",
    sql: "SELECT * FROM machines WHERE status = 'active'"
  },
  {
    label: "Evaluate Average Pressure and RPM grouped by Shift",
    sql: "SELECT shift, AVG(rpm_speed) as avg_speed, AVG(oil_pressure_psi) as avg_press, COUNT(id) as shift_records FROM production_history GROUP BY shift"
  },
  {
    label: "Join Machines & Production Stats",
    sql: "SELECT machines.name, machines.type, production_history.shift, production_history.output_qty, production_history.oil_pressure_psi FROM production_history JOIN machines ON production_history.machine_id = machines.id"
  }
];

export default function SqlConsole({ dbEngine, onRefreshFromDB }: SqlConsoleProps) {
  const [query, setQuery] = React.useState(TEMPLATE_QUERIES[0].sql);
  const [results, setResults] = React.useState<any[]>([]);
  const [execTime, setExecTime] = React.useState(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [activeSchemaTab, setActiveSchemaTab] = React.useState<'machines' | 'production_history'>('machines');

  // Run on init
  React.useEffect(() => {
    handleRunQuery();
  }, []);

  const handleRunQuery = () => {
    setErrorMsg(null);
    const start = performance.now();
    try {
      const res = dbEngine.executeSqlQuery(query);
      setResults(res);
      setExecTime(Math.round((performance.now() - start) * 100) / 100);
    } catch (err: any) {
      setErrorMsg(err.message);
      setResults([]);
    }
  };

  const loadTemplate = (sql: string) => {
    setQuery(sql);
    setErrorMsg(null);
  };

  // Get dynamic headings from keys in rows
  const headers = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Columns - Query Composer & Schema Visualizer */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Schema Blueprint Catalog Card */}
        <div className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-semibold font-sans flex items-center gap-2 text-white">
            <Table size={15} className="text-indigo-400" />
            Relational Data Catalog Schema
          </h3>

          <div className="flex gap-1 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveSchemaTab('machines')}
              className={`px-3 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                activeSchemaTab === 'machines' 
                  ? 'bg-slate-950 text-indigo-400 border border-slate-800 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              machines
            </button>
            <button
              onClick={() => setActiveSchemaTab('production_history')}
              className={`px-3 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                activeSchemaTab === 'production_history' 
                  ? 'bg-slate-950 text-indigo-400 border border-slate-800 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              production_history
            </button>
          </div>

          <div className="bg-slate-950 rounded-lg p-3 border border-slate-850 font-mono text-[11px] leading-relaxed text-slate-400 space-y-2">
            {activeSchemaTab === 'machines' ? (
              <>
                <div><span className="text-indigo-400 font-semibold">id</span> VARCHAR(50) [PK]</div>
                <div><span className="text-slate-300">name</span> VARCHAR(100)</div>
                <div><span className="text-slate-300">type</span> VARCHAR(50) (Machine variants)</div>
                <div><span className="text-slate-300">status</span> VARCHAR(20) ('active'|'idle'|'maintenance'|'fault')</div>
                <div><span className="text-slate-300">room</span> VARCHAR(50)</div>
                <div><span className="text-slate-300">manufacturer</span> VARCHAR(100)</div>
                <div><span className="text-slate-300">installed_at</span> DATE</div>
              </>
            ) : (
              <>
                <div><span className="text-indigo-400 font-semibold">id</span> INT [PK, AUTO_INCREMENT]</div>
                <div><span className="text-indigo-400 font-semibold">machine_id</span> VARCHAR(50) [FK {"->"} machines.id]</div>
                <div><span className="text-slate-300">shift</span> VARCHAR(20) ('Morning'|'Evening'|'Night')</div>
                <div><span className="text-slate-300">output_qty</span> INT</div>
                <div><span className="text-slate-300">scrap_qty</span> INT</div>
                <div><span className="text-slate-300">rpm_speed</span> INT</div>
                <div><span className="text-slate-300">oil_pressure_psi</span> DECIMAL(5,2)</div>
                <div><span className="text-slate-400">timestamp</span> TIMESTAMP</div>
              </>
            )}
          </div>
        </div>

        {/* Premade Template Queries Trigger Card */}
        <div id="sql-templates-card" className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
          <h3 className="text-sm font-semibold font-sans flex items-center gap-2 text-white">
            <HelpCircle size={15} className="text-indigo-400" />
            Interactive SQL Templates
          </h3>
          <p className="text-xs text-slate-400">
            Click any query template below to instantly load it into the terminal console.
          </p>

          <div className="space-y-2 pt-2">
            {TEMPLATE_QUERIES.map((t, idx) => (
              <button
                key={idx}
                onClick={() => loadTemplate(t.sql)}
                className="w-full text-left p-2.5 rounded-lg border border-slate-800 hover:bg-slate-800 bg-slate-950 hover:border-slate-700 transition-all text-xs font-sans font-medium text-slate-300 flex justify-between items-center group cursor-pointer"
              >
                <div className="truncate pr-2">
                  <span className="block text-[11px] text-slate-500 font-mono mb-0.5">Template #{idx + 1}</span>
                  <span className="truncate block font-semibold text-slate-200">{t.label}</span>
                </div>
                <Play size={10} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column - Shell Terminal Input & Return grids */}
      <div className="lg:col-span-8 flex flex-col space-y-6">

        {/* Database SQL Terminal */}
        <div id="sql-terminal-box" className="bg-slate-900 rounded-xl flex flex-col shadow-lg border border-slate-950 overflow-hidden">
          <div className="bg-slate-950 px-4 py-3 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-indigo-400" />
              <span className="font-mono text-xs font-semibold text-slate-300">Relational SQLite Terminal Console v1.2</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="p-4 flex flex-col space-y-3">
            <textarea
              id="sql-query-textarea"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SELECT * FROM production_history ORDER BY id DESC"
              className="w-full h-28 bg-slate-950 text-slate-100 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="font-mono text-indigo-400">
                INFO: Read-only transactions active to bypass hardware state damage.
              </span>
              <button
                id="run-sql-btn"
                onClick={handleRunQuery}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Play size={12} fill="white" />
                EXECUTE QUERY
              </button>
            </div>
          </div>
        </div>

        {/* Output Grid Card */}
        <div className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg flex-1 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center border-b pb-3 mb-4 border-slate-800">
            <h3 className="text-sm font-semibold font-sans flex items-center gap-2 text-white">
              <Database size={15} className="text-indigo-400" />
              Console STDOUT Output Stream
            </h3>

            {errorMsg ? (
              <span className="text-[10px] font-mono bg-rose-950/40 border border-rose-900/60 text-rose-400 px-2 py-0.5 rounded">
                TRANSACTION EXCEPTION
              </span>
            ) : (
              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                <span>Row count: <strong className="text-slate-250">{results.length}</strong></span>
                <span>Latency: <strong className="text-indigo-400">{execTime}ms</strong></span>
              </div>
            )}
          </div>

          {/* Results renderer */}
          <div className="flex-1 overflow-x-auto">
            {errorMsg ? (
              <div className="bg-rose-950/20 border border-dashed border-rose-900/40 text-rose-300 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {errorMsg}
              </div>
            ) : results.length > 0 ? (
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-450 uppercase font-mono text-[9px] tracking-wider">
                    {headers.map(h => (
                      <th key={h} className="py-2.5 px-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {results.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50 transition font-mono text-[11px] text-slate-300">
                      {headers.map(h => (
                        <td key={h} className="py-2 px-3 whitespace-nowrap">
                          {row[h] === null ? (
                            <span className="text-slate-600 italic">NULL</span>
                          ) : typeof row[h] === 'object' ? (
                            JSON.stringify(row[h])
                          ) : typeof row[h] === 'number' && h.includes('pressure') ? (
                            <span>{row[h].toFixed(1)}</span>
                          ) : String(row[h])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center p-8 border border-dashed rounded-lg bg-slate-950/20 border-slate-800 text-slate-500 text-xs font-mono">
                Query executed successfully. Result set returned empty relations.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
