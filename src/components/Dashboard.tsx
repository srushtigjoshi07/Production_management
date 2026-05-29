import React from 'react';
import { 
  Wrench, Activity, AlertTriangle, CheckCircle, 
  Gauge, Sliders, RefreshCw, Layers, Sparkles,
  Play, Pause, Clock, PlusCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar 
} from 'recharts';
import { Machine, SqlProductionRecord, MongoFaultLog, DowntimePredictionResult } from '../types';

interface DashboardProps {
  machines: Machine[];
  selectedMachine: Machine;
  setSelectedMachine: (m: Machine) => void;
  sqlRecords: SqlProductionRecord[];
  mongoLogs: MongoFaultLog[];
  prediction: DowntimePredictionResult;
  onSimulateTelemetry: (
    temp: number, 
    vib: number, 
    press: number, 
    customOptions?: {
      component?: string;
      severity?: 'info' | 'warning' | 'critical';
      error_code?: string;
      message?: string;
      enforceAnomaly?: boolean;
    }
  ) => void;
  onRepairAlarms: () => void;
  
  // Auto-simulation states
  isAutoGenerating: boolean;
  setIsAutoGenerating: (val: boolean) => void;
  autoIntervalSpeed: number;
  setAutoIntervalSpeed: (val: number) => void;
  autoAnomaliesEnforced: 'random' | 'healthy' | 'unhealthy';
  setAutoAnomaliesEnforced: (val: 'random' | 'healthy' | 'unhealthy') => void;
  secondsRemaining: number;
}

export default function Dashboard({
  machines,
  selectedMachine,
  setSelectedMachine,
  sqlRecords,
  mongoLogs,
  prediction,
  onSimulateTelemetry,
  onRepairAlarms,
  isAutoGenerating,
  setIsAutoGenerating,
  autoIntervalSpeed,
  setAutoIntervalSpeed,
  autoAnomaliesEnforced,
  setAutoAnomaliesEnforced,
  secondsRemaining
}: DashboardProps) {
  // Telemetry Inputs (local slider states before firing trigger)
  const [tempInput, setTempInput] = React.useState(75);
  const [vibInput, setVibInput] = React.useState(1.4);
  const [pressureInput, setPressureInput] = React.useState(45);

  // Tab control inside the simulator card
  const [simulatorMode, setSimulatorMode] = React.useState<'sliders' | 'manual' | 'auto'>('sliders');

  // Advanced Manual Injection form states
  const [manualTemp, setManualTemp] = React.useState<number>(75);
  const [manualVib, setManualVib] = React.useState<number>(1.4);
  const [manualPressure, setManualPressure] = React.useState<number>(45);
  const [manualComponent, setManualComponent] = React.useState<string>('');
  const [manualSeverity, setManualSeverity] = React.useState<'info' | 'warning' | 'critical'>('warning');
  const [manualErrorCode, setManualErrorCode] = React.useState<string>('MAN_ERR_901');
  const [manualMessage, setManualMessage] = React.useState<string>('Manual operator diagnostics injection');
  const [manualEnforceAnomaly, setManualEnforceAnomaly] = React.useState<boolean>(true);

  // Sync inputs when machine shifts
  React.useEffect(() => {
    let t = 75, v = 1.4, p = 45;
    let comp = "Drivetrain Gearbox";
    if (selectedMachine.id === "M-A100") {
      t = 65; v = 1.2; p = 44; comp = "Arm Joint Actuator #2";
    } else if (selectedMachine.id === "M-C200") {
      t = 52; v = 2.1; p = 55; comp = "Rotor Collet Spindle";
    } else if (selectedMachine.id === "M-H300") {
      t = 105; v = 0.8; p = 70; comp = "Cylinder Core Thermocouple";
    } else {
      t = 32; v = 0.4; p = 20; comp = "Conveyor Tensioner";
    }

    setTempInput(t);
    setVibInput(v);
    setPressureInput(p);

    setManualTemp(t);
    setManualVib(v);
    setManualPressure(p);
    setManualComponent(comp);
  }, [selectedMachine]);

  // Filters
  const machineSql = sqlRecords.filter(r => r.machine_id === selectedMachine.id);
  const machineMongo = mongoLogs.filter(l => l.machine_id === selectedMachine.id);

  // Group trends for SQL Output/Scrap over timestamp
  const sqlChartData = machineSql
    .slice(-6) // last 6 records
    .map(r => ({
      shift: `${r.shift} (${new Date(r.timestamp).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})})`,
      Output: r.output_qty,
      Scrap: r.scrap_qty,
      Pressure: r.oil_pressure_psi
    }));

  // MongoDB Active warnings count by Component
  const activeFaultsGroup = machineMongo.reduce((acc: { [comp: string]: number }, log) => {
    if (!log.repaired) {
      acc[log.component] = (acc[log.component] || 0) + 1;
    }
    return acc;
  }, {});

  const mongoChartData = Object.entries(activeFaultsGroup).map(([comp, count]) => ({
    Component: comp.length > 20 ? comp.substring(0, 18) + "..." : comp,
    Alarms: count
  }));

  // Risk styling helpers
  const getRiskColor = (score: number) => {
    if (score >= 75) return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600', fill: '#f43f5e', label: 'CRITICAL RISK' };
    if (score >= 45) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', fill: '#f59e0b', label: 'MODERATE RISK' };
    return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', fill: '#10b981', label: 'STABLE GREEN' };
  };

  const riskStyle = getRiskColor(prediction.riskScore);

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {machines.map(m => {
          const isSelected = m.id === selectedMachine.id;
          const activeAlarms = mongoLogs.filter(l => l.machine_id === m.id && !l.repaired).length;
          
          return (
            <button
              id={`machine-card-${m.id}`}
              key={m.id}
              onClick={() => setSelectedMachine(m)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'bg-indigo-950 text-white border-indigo-500 shadow-md ring-2 ring-indigo-500/50' 
                  : 'bg-slate-900 text-slate-100 hover:bg-slate-800/80 border-slate-800/80 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] uppercase font-mono tracking-wider p-1 rounded font-medium ${
                  isSelected ? 'bg-indigo-900/60 text-indigo-200' : 'bg-slate-950 text-slate-400'
                }`}>
                  {m.type}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    m.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                    m.status === 'fault' ? 'bg-rose-500 animate-pulse' :
                    m.status === 'maintenance' ? 'bg-amber-500' : 'bg-slate-600'
                  }`} />
                  <span className="text-[11px] font-mono capitalize text-slate-300">
                    {m.status}
                  </span>
                </span>
              </div>
              <h3 className="font-sans font-semibold text-sm truncate">{m.name}</h3>
              <p className={`text-[11px] font-mono mt-1 ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>ID: {m.id}</p>
              
              <div className="mt-3 pt-2 border-t border-dashed border-slate-800 flex justify-between items-center text-xs">
                <span className={isSelected ? 'text-indigo-200' : 'text-slate-500'}>Location:</span>
                <span className="font-medium truncate text-slate-300">{m.room}</span>
              </div>

              {activeAlarms > 0 && (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-500 font-mono">
                  <AlertTriangle size={12} />
                  <span>{activeAlarms} Active NoSQL Alarms</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Machine Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Forecasts & Operational Gauges */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Prediction Matrix Card */}
          <div id="downtime-prediction-card" className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold font-sans flex items-center gap-2">
                <Gauge size={16} className="text-slate-300" />
                Downtime Forecast Analyzer
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${riskStyle.bg.replace('bg-emerald-50 text-emerald-700 border-emerald-200', 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60').replace('bg-amber-50 text-amber-700 border-amber-200', 'bg-amber-950/40 text-amber-400 border-amber-900/60').replace('bg-rose-50 text-rose-700 border-rose-200', 'bg-rose-950/40 text-rose-400 border-rose-900/60')}`}>
                {riskStyle.label}
              </span>
            </div>

            {/* Risk dial visualization */}
            <div className="flex flex-col items-center justify-center py-2 space-y-2 relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG circular track */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={riskStyle.fill}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * prediction.riskScore) / 100}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-bold font-mono tracking-tighter text-white">{prediction.riskScore}%</span>
                  <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Breakdown Risk</p>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-center bg-slate-950 p-2 rounded-lg border border-slate-850">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Cutoff Window</span>
                  <span className="font-mono font-bold text-sm text-slate-200">
                    {prediction.riskScore > 85 ? 'IMMINENT' : `~${prediction.predictedHoursToFailure} hrs`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Waste Factor</span>
                  <span className="font-mono font-bold text-sm text-slate-200">
                    {(100 - prediction.averageWeeklyEfficiency).toFixed(1)}% scrap
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Factor Text */}
            <div className="text-xs space-y-1 bg-slate-950 rounded-lg p-3 border border-slate-850">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Primary Stress Factors</span>
              <p className="font-sans font-medium text-slate-300 leading-snug">
                {prediction.primaryRiskFactor || "None. Machine currently meeting stability standard parameters."}
              </p>
            </div>

            {/* Actions Recommendation */}
            <div className="text-xs space-y-1.5 border-t border-slate-800 pt-3">
              <span className="font-mono text-[10px] text-slate-500 uppercase block">Engineering Recommendation</span>
              <p className="text-amber-200 text-xs italic bg-amber-950/20 p-2 rounded border border-amber-900/30 leading-relaxed">
                "{prediction.recommendation}"
              </p>
            </div>
          </div>

          {/* Sensor Rig Simulator Slider */}
          <div id="sensor-simulator-card" className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-800">
              <h3 className="text-sm font-semibold font-sans flex items-center gap-2">
                <Sliders size={16} className="text-indigo-400" />
                Live Sensor Telemetry Rig
              </h3>
              <div className="flex items-center gap-1.5">
                {isAutoGenerating && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
                <span className={`text-[10px] uppercase font-mono font-bold ${isAutoGenerating ? 'text-emerald-450' : 'text-slate-500'}`}>
                  {isAutoGenerating ? 'Auto Active' : 'Manual'}
                </span>
              </div>
            </div>

            {/* Custom Tab Switcher for different input mechanisms */}
            <div className="flex border-b border-slate-850 bg-slate-950/40 p-1 rounded-lg gap-1 border border-slate-850/80">
              <button
                type="button"
                onClick={() => setSimulatorMode('sliders')}
                className={`flex-1 py-1 px-2 text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition ${
                  simulatorMode === 'sliders' 
                    ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎛️ Sliders
              </button>
              <button
                type="button"
                onClick={() => setSimulatorMode('manual')}
                className={`flex-1 py-1 px-2 text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition ${
                  simulatorMode === 'manual' 
                    ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Inject Form
              </button>
              <button
                type="button"
                onClick={() => setSimulatorMode('auto')}
                className={`flex-1 py-1 px-2 text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition ${
                  simulatorMode === 'auto' 
                    ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⏱️ Interval Gen
              </button>
            </div>

            {/* 1. SLIDER BASED INTERACTION (TAB 1) */}
            {simulatorMode === 'sliders' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-normal">
                  Adjust precision controls or type values directly to manually push parameters past safety bounds. Click "Push to DBs" to route SQL and MongoDB.
                </p>

                <div className="space-y-4 pt-1">
                  {/* Temperature Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">🔬 Core Temp</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="20"
                          max="150"
                          value={tempInput}
                          onChange={(e) => setTempInput(Number(e.target.value))}
                          className="w-14 text-center bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-[11px] text-slate-500">°C</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      step="1"
                      value={tempInput}
                      onChange={(e) => setTempInput(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Vibration Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">📳 Vibration Noise</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="8.0"
                          value={vibInput}
                          onChange={(e) => setVibInput(Number(e.target.value))}
                          className="w-14 text-center bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-[11px] text-slate-500">g</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="8.0"
                      step="0.1"
                      value={vibInput}
                      onChange={(e) => setVibInput(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Oil Pressure Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">🛢️ Oil Pressure</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={pressureInput}
                          onChange={(e) => setPressureInput(Number(e.target.value))}
                          className="w-14 text-center bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-[11px] text-slate-500">PSI</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={pressureInput}
                      onChange={(e) => setPressureInput(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Trigger telemetry action buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      id="simulate-telemetry-btn"
                      type="button"
                      onClick={() => onSimulateTelemetry(tempInput, vibInput, pressureInput)}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-650 text-white hover:bg-indigo-600 flex items-center justify-center gap-1.5 cursor-pointer shadow transition animate-none"
                    >
                      <Sparkles size={13} />
                      Push to DBs
                    </button>
                    <button
                      id="repair-alarms-btn"
                      type="button"
                      onClick={onRepairAlarms}
                      disabled={machineMongo.filter(l => !l.repaired).length === 0}
                      className="w-full py-2 px-3 text-xs border border-slate-800 font-medium rounded-lg text-slate-300 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <RefreshCw size={12} />
                      Flush Alarms
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ADVANCED MANUAL DIRECT FORM INJECTION (TAB 2) */}
            {simulatorMode === 'manual' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-normal">
                  Inject precise SQL rows & custom BSON alert structures directly into the databases for debugging.
                </p>

                <div className="space-y-3 pt-1">
                  {/* Numeric Inputs Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-450 uppercase block font-semibold text-slate-450">Temp (°C)</label>
                      <input
                        type="number"
                        value={manualTemp}
                        onChange={(e) => setManualTemp(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-center font-bold text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-450 uppercase block font-semibold text-slate-450">Friction (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={manualVib}
                        onChange={(e) => setManualVib(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-center font-bold text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-450 uppercase block font-semibold text-slate-450">Oil PSI</label>
                      <input
                        type="number"
                        value={manualPressure}
                        onChange={(e) => setManualPressure(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-center font-bold text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Component name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Target Machinery Component</label>
                    <input
                      type="text"
                      placeholder="e.g. Drivetrain Shaft"
                      value={manualComponent}
                      onChange={(e) => setManualComponent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-left"
                    />
                  </div>

                  {/* Enforce Anomaly checkbox override */}
                  <div className="flex items-center gap-2 bg-slate-955 p-2 rounded border border-slate-850">
                    <input
                      type="checkbox"
                      id="manualEnforceAnomaly"
                      checked={manualEnforceAnomaly}
                      onChange={(e) => setManualEnforceAnomaly(e.target.checked)}
                      className="rounded accent-indigo-500 cursor-pointer text-indigo-500 bg-slate-950"
                    />
                    <label htmlFor="manualEnforceAnomaly" className="text-[10px] font-mono text-slate-350 cursor-pointer font-bold">
                      Enforce NoSQL Fault Log (BSON)
                    </label>
                  </div>

                  {/* Custom alert detail fields if checked */}
                  {manualEnforceAnomaly && (
                    <div className="space-y-2 border-l-2 border-indigo-500/50 pl-2 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono text-slate-550 uppercase block">Severity</label>
                          <select
                            value={manualSeverity}
                            onChange={(e) => setManualSeverity(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                          >
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono text-slate-550 uppercase block">Error Code</label>
                          <input
                            type="text"
                            value={manualErrorCode}
                            onChange={(e) => setManualErrorCode(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded p-1 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-left"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-slate-550 uppercase block">Telemetry Incident Message</label>
                        <input
                          type="text"
                          value={manualMessage}
                          onChange={(e) => setManualMessage(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 text-left"
                        />
                      </div>
                    </div>
                  )}

                  {/* Inject action buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSimulateTelemetry(
                          manualTemp,
                          manualVib,
                          manualPressure,
                          {
                            component: manualComponent || undefined,
                            severity: manualSeverity,
                            error_code: manualErrorCode,
                            message: manualMessage,
                            enforceAnomaly: manualEnforceAnomaly
                          }
                        );
                      }}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white flex items-center justify-center gap-1 cursor-pointer shadow transition"
                    >
                      <PlusCircle size={13} />
                      Inject Log Form
                    </button>
                    <button
                      type="button"
                      onClick={onRepairAlarms}
                      disabled={machineMongo.filter(l => !l.repaired).length === 0}
                      className="w-full py-2 px-3 text-xs border border-slate-800 font-medium rounded-lg text-slate-300 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <RefreshCw size={12} />
                      Flush Alarms
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. AUTO SCHEDULER CONTROLLER (TAB 3) */}
            {simulatorMode === 'auto' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-normal">
                  Activate auto-generation to simulate a live SCADA operational network ticking in real-time or production scales.
                </p>

                <div className="space-y-3 pt-1">
                  {/* Status Indicator */}
                  <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded border border-slate-850 text-xs">
                    <span className="text-slate-400 font-mono uppercase text-[10px]">SCADA Polling Engine:</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isAutoGenerating ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <strong className={`font-mono text-[10px] ${isAutoGenerating ? 'text-emerald-450' : 'text-amber-500'}`}>
                        {isAutoGenerating ? 'POLLING ACTIVE' : 'SERVICE IDLE'}
                      </strong>
                    </span>
                  </div>

                  {/* Cadence Selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block font-semibold text-slate-550">Auto-Harvest Frequency</label>
                    <select
                      value={autoIntervalSpeed}
                      onChange={(e) => setAutoIntervalSpeed(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-350 font-mono focus:outline-none focus:border-indigo-500"
                    >
                      <option value={5}>Every 5 Seconds (Fast Demo)</option>
                      <option value={10}>Every 10 Seconds (Standard Demo)</option>
                      <option value={30}>Every 30 Seconds</option>
                      <option value={60}>Every 1 Minute</option>
                      <option value={300}>Every 5 Minutes (Default Production)</option>
                    </select>
                  </div>

                  {/* Noise walk selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block font-semibold text-slate-550">Anomalous Drift Noise Walk</label>
                    <select
                      value={autoAnomaliesEnforced}
                      onChange={(e) => setAutoAnomaliesEnforced(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-350 font-mono focus:outline-none focus:border-indigo-500"
                    >
                      <option value="random">Randomized Noise (Realistic 15% alert rate)</option>
                      <option value="healthy">Pure Steady Compliance (Always 100% stable)</option>
                      <option value="unhealthy">Continuous Hardware Failure (Always anomalous alert)</option>
                    </select>
                  </div>

                  {/* Countdown Timer Widget Progress bar */}
                  {isAutoGenerating ? (
                    <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-850 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500">NEXT TELEMETRY DRIFT CYCLE:</span>
                        <span className="text-indigo-400 font-bold animate-pulse">T-minus {secondsRemaining}s</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${(secondsRemaining / autoIntervalSpeed) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic text-center font-mono py-2">
                      Click the "Start Autopoll Service" button below to turn on background simulation updates.
                    </p>
                  )}

                  {/* Start/stop button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAutoGenerating(!isAutoGenerating)}
                      className={`w-full py-2 px-3 text-xs font-mono font-bold uppercase rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isAutoGenerating 
                          ? 'bg-rose-950/40 text-rose-400 border-rose-900/40 hover:bg-rose-955 shadow-lg' 
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 hover:bg-emerald-955 shadow-lg'
                      }`}
                    >
                      {isAutoGenerating ? (
                        <>
                          <Pause size={13} /> Shutdown Dispatcher
                        </>
                      ) : (
                        <>
                          <Play size={13} /> Start Autopoll Service
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Dynamic SQL & Mongo Hybrid Graphs */}
        <div className="lg:col-span-8 space-y-6">

          {/* Relational Shift history chart */}
          <div className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-800">
              <div>
                <h3 className="text-sm font-semibold font-sans flex items-center gap-2 text-white">
                  <Layers size={15} className="text-indigo-400" />
                  SQL Relational Store: Operational Shift Outputs
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">TABLE: production_history (Primary Relational metrics)</p>
              </div>
              <span className="text-[10px] bg-slate-950 font-mono text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                {machineSql.length} records parsed
              </span>
            </div>

            {sqlChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sqlChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorScrap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="shift" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569" />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#94a3b8' }} />
                    <Area yAxisId="left" type="monotone" dataKey="Output" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorOutput)" name="Good Units (Pieces)" />
                    <Area yAxisId="left" type="monotone" dataKey="Scrap" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorScrap)" name="Scrap Units (Waste)" />
                    <Area yAxisId="right" type="monotone" dataKey="Pressure" stroke="#34d399" strokeWidth={1.5} strokeDasharray="3 3" fill="none" name="Piston Pressure (PSI)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-lg bg-slate-950/20 text-slate-500 text-xs font-mono">
                No SQL records recorded for this equipment.
              </div>
            )}
          </div>

          {/* NoSQL Unstructured alarms bento-graph */}
          <div className="bg-slate-900 border text-slate-100 border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-800">
              <div>
                <h3 className="text-sm font-semibold font-sans flex items-center gap-2 text-white">
                  <AlertTriangle size={15} className="text-amber-400 animate-pulse" />
                  MongoDB Semi-Structured: Active Fault Count by Component
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">COLLECTION: fault_logs (Schemaless JSON telemetry drift signals)</p>
              </div>
              <span className="text-[10px] bg-amber-950/40 font-mono text-amber-400 px-2 py-0.5 rounded border border-amber-900/50">
                {machineMongo.filter(l => !l.repaired).length} Active Alerts
              </span>
            </div>

            {mongoChartData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mongoChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="Component" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#475569" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#475569" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Bar dataKey="Alarms" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} name="Active Alert Incidents" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center border border-dashed rounded-lg bg-emerald-950/20 border-emerald-900/30 text-emerald-400 text-xs font-mono py-6">
                <CheckCircle size={28} className="text-emerald-400 mb-2 animate-pulse" />
                <span>Zero Active Hardware Alarms found inside MongoDB Collection!</span>
                <span className="text-[10px] text-emerald-500/80 mt-1">Excellent vibration & thermo compliance</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
