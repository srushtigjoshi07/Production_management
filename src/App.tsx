import React from 'react';
import { 
  Activity, Database, ShieldAlert, Cpu, 
  Terminal, Play, HelpCircle, Sparkles, Layers 
} from 'lucide-react';
import { SimulatedDB } from './utils/dbEngine';
import { Machine, SqlProductionRecord, MongoFaultLog, PlaygroundFile, DowntimePredictionResult } from './types';
import Dashboard from './components/Dashboard';
import SqlConsole from './components/SqlConsole';
import MongoConsole from './components/MongoConsole';
import CodePlayground from './components/CodePlayground';
import AIPromptExplainer from './components/AIPromptExplainer';
import DBArchitecture from './components/DBArchitecture';

export default function App() {
  // 1. Initialize our simulated SQL-NoSQL hybrid databases
  const dbRef = React.useRef<SimulatedDB>(new SimulatedDB());
  
  // React State mirrors of database files for triggers
  const [machines, setMachines] = React.useState<Machine[]>(dbRef.current.machines);
  const [selectedMachine, setSelectedMachine] = React.useState<Machine>(dbRef.current.machines[0]);
  const [sqlRecords, setSqlRecords] = React.useState<SqlProductionRecord[]>(dbRef.current.production_history);
  const [mongoLogs, setMongoLogs] = React.useState<MongoFaultLog[]>(dbRef.current.fault_logs);
  const [files, setFiles] = React.useState<PlaygroundFile[]>(dbRef.current.codeFiles);
  
  // Prediction result
  const [prediction, setPrediction] = React.useState<DowntimePredictionResult>({
    machineId: dbRef.current.machines[0].id,
    riskScore: 5,
    predictedHoursToFailure: 168,
    primaryRiskFactor: "Stable baseline operation parameters.",
    criticalFaultCount: 0,
    averageWeeklyEfficiency: 98.2,
    recommendation: "System operating normal."
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'sql' | 'mongo' | 'playground' | 'ai' | 'architecture'>('dashboard');

  // Auto-generation state manager
  const [isAutoGenerating, setIsAutoGenerating] = React.useState<boolean>(false);
  const [autoIntervalSpeed, setAutoIntervalSpeed] = React.useState<number>(5); // Default with 5 seconds for fast visual feedback
  const [autoAnomaliesEnforced, setAutoAnomaliesEnforced] = React.useState<'random' | 'healthy' | 'unhealthy'>('random');
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(5);

  // Sync refs to bypass setInterval stale closures
  const latestSelectedMachineRef = React.useRef(selectedMachine);
  const latestAnomaliesEnforcedRef = React.useRef(autoAnomaliesEnforced);
  
  React.useEffect(() => {
    latestSelectedMachineRef.current = selectedMachine;
  }, [selectedMachine]);

  React.useEffect(() => {
    latestAnomaliesEnforcedRef.current = autoAnomaliesEnforced;
  }, [autoAnomaliesEnforced]);

  // Trigger full re-evaluation of predictDowntimeRisk on active machine/records change
  const evaluateActiveMachinePrediction = React.useCallback(() => {
    const res = dbRef.current.runCustomPredictor(
      selectedMachine,
      dbRef.current.production_history,
      dbRef.current.fault_logs
    );
    setPrediction(res);
  }, [selectedMachine]);

  React.useEffect(() => {
    evaluateActiveMachinePrediction();
  }, [selectedMachine, sqlRecords, mongoLogs, files, evaluateActiveMachinePrediction]);

  // Setup countdown reset effect
  React.useEffect(() => {
    if (!isAutoGenerating) {
      return;
    }
    setSecondsRemaining(autoIntervalSpeed);
  }, [isAutoGenerating, autoIntervalSpeed]);

  // Handler: Ingesting/Simulating New Live Telemetry (SQL shift tally and MongoDB fault entries)
  const handleSimulateTelemetry = (
    temp: number, 
    vibration: number, 
    oilPressure: number,
    customOptions?: {
      component?: string;
      severity?: 'info' | 'warning' | 'critical';
      error_code?: string;
      message?: string;
      enforceAnomaly?: boolean;
    }
  ) => {
    const db = dbRef.current;
    
    // 1. Execute Vibration Analyzer JS file code
    const alertResult = db.runVibrationAnalyzer(selectedMachine, vibration);
    
    let updatedStatus: 'active' | 'fault' | 'maintenance' = 'active';
    let mongoDoc: MongoFaultLog | null = null;

    const triggerAnomaly = customOptions?.enforceAnomaly ?? alertResult.triggerAnomaly;
    const severity = customOptions?.severity ?? alertResult.severity;
    const error_code = customOptions?.error_code ?? alertResult.code;
    const message = customOptions?.message ?? alertResult.reason;
    const component = customOptions?.component ?? (
      selectedMachine.type === 'Robotic Arm' ? "Arm Joint Actuator #2" :
      selectedMachine.type === 'CNC Centrifuge' ? "Rotor Collet Spindle" :
      selectedMachine.type === 'Thermal Compressor' ? "Cylinder Core Thermocouple" :
      "Drivetrain Gearbox"
    );

    if (triggerAnomaly) {
      updatedStatus = severity === 'critical' ? 'fault' : 'maintenance';
      
      mongoDoc = {
        _id: `log_fl_${Date.now().toString(36)}`,
        machine_id: selectedMachine.id,
        component,
        severity,
        error_code,
        message,
        telemetry: {
          temperature_c: temp,
          vibration_g: vibration,
          voltage_v: selectedMachine.type === 'CNC Centrifuge' ? 398.4 : 24.1
        },
        repaired: false,
        timestamp: new Date().toISOString()
      };
      
      // Push Mongo document log
      db.fault_logs.push(mongoDoc);
    }

    // 2. Insert corresponding relational SQL shift record
    // Calculate randomized but realistic output numbers based on machine type and temperature
    let baseOutput = 400;
    if (selectedMachine.type === 'Robotic Arm') baseOutput = 420;
    else if (selectedMachine.type === 'CNC Centrifuge') baseOutput = 175;
    else if (selectedMachine.type === 'Thermal Compressor') baseOutput = 850;
    else if (selectedMachine.type === 'Conveyor Belt') baseOutput = 1100;

    // High vibration/temps lower efficiency, boosting waste (scrap)
    const scrapRatio = triggerAnomaly ? (severity === 'critical' ? 0.18 : 0.08) : 0.015;
    const finalScrap = Math.round(baseOutput * scrapRatio);
    const finalGood = baseOutput - finalScrap;

    const sqlRecord: SqlProductionRecord = {
      id: db.production_history.length + 1,
      machine_id: selectedMachine.id,
      shift: new Date().getHours() < 14 ? 'Morning' : new Date().getHours() < 22 ? 'Evening' : 'Night',
      output_qty: finalGood,
      scrap_qty: finalScrap,
      rpm_speed: selectedMachine.type === 'CNC Centrifuge' ? 3700 : selectedMachine.type === 'Robotic Arm' ? 1200 : 900,
      oil_pressure_psi: oilPressure,
      timestamp: new Date().toISOString()
    };

    // Push SQL record
    db.production_history.push(sqlRecord);

    // 3. Update machine statuses
    db.machines = db.machines.map(m => {
      if (m.id === selectedMachine.id) {
        return { ...m, status: updatedStatus };
      }
      return m;
    });

    // Update active local state
    setMachines(db.machines);
    setSelectedMachine(db.machines.find(m => m.id === selectedMachine.id)!);
    setSqlRecords([...db.production_history]);
    setMongoLogs([...db.fault_logs]);
  };

  const triggerAutoTelemetry = React.useCallback(() => {
    const activeMachine = latestSelectedMachineRef.current;
    const strategy = latestAnomaliesEnforcedRef.current;
    
    // Determine healthy vs anomalous based on strategy
    let triggerAnomaly = false;
    if (strategy === 'unhealthy') {
      triggerAnomaly = true;
    } else if (strategy === 'healthy') {
      triggerAnomaly = false;
    } else {
      triggerAnomaly = Math.random() < 0.15;
    }

    // Generate realistic values with slight variations
    let temp = 60;
    let vib = 1.0;
    let press = 45;

    const noise = (Math.random() - 0.5) * 4; // -2 to +2
    const vibNoise = (Math.random() - 0.5) * 0.4; // -0.2 to +0.2
    const pressNoise = (Math.random() - 0.5) * 3; // -1.5 to +1.5

    if (activeMachine.id === "M-A100") {
      if (triggerAnomaly) {
        temp = 95 + Math.random() * 15;
        vib = 4.2 + Math.random() * 2.0;
        press = 22 + Math.random() * 10;
      } else {
        temp = 63 + noise;
        vib = 1.2 + vibNoise;
        press = 43 + pressNoise;
      }
    } else if (activeMachine.id === "M-C200") {
      if (triggerAnomaly) {
        temp = 88 + Math.random() * 15;
        vib = 5.4 + Math.random() * 2.0;
        press = 28 + Math.random() * 12;
      } else {
        temp = 51 + noise;
        vib = 2.0 + vibNoise;
        press = 54 + pressNoise;
      }
    } else if (activeMachine.id === "M-H300") {
      if (triggerAnomaly) {
        temp = 138 + Math.random() * 15;
        vib = 3.8 + Math.random() * 1.5;
        press = 32 + Math.random() * 15;
      } else {
        temp = 104 + noise;
        vib = 0.82 + vibNoise;
        press = 69 + pressNoise;
      }
    } else { // M-B400 or other
      if (triggerAnomaly) {
        temp = 58 + Math.random() * 12;
        vib = 2.1 + Math.random() * 1.0;
        press = 6 + Math.random() * 5;
      } else {
        temp = 31 + noise;
        vib = 0.38 + vibNoise;
        press = 21 + pressNoise;
      }
    }

    // Constrain values to bounds
    temp = Math.max(15, Math.min(200, Math.round(temp)));
    vib = Math.max(0.1, Math.min(10.0, Number(vib.toFixed(1))));
    press = Math.max(2, Math.min(120, Math.round(press)));

    // Trigger simulation with standard logic
    handleSimulateTelemetry(temp, vib, press);
  }, []);

  React.useEffect(() => {
    if (!isAutoGenerating) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          setTimeout(() => {
            triggerAutoTelemetry();
          }, 0);
          return autoIntervalSpeed;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoGenerating, autoIntervalSpeed, triggerAutoTelemetry]);

  // Handler: Flushes/Repairs active alarms of selected machine
  const handleRepairAlarms = () => {
    const db = dbRef.current;
    
    // Resolve unresolved Mongo documents
    db.fault_logs = db.fault_logs.map(log => {
      if (log.machine_id === selectedMachine.id && !log.repaired) {
        return { ...log, repaired: true };
      }
      return log;
    });

    // Revert machine status back to active
    db.machines = db.machines.map(m => {
      if (m.id === selectedMachine.id) {
        return { ...m, status: 'active' };
      }
      return m;
    });

    setMachines(db.machines);
    setSelectedMachine(db.machines.find(m => m.id === selectedMachine.id)!);
    setMongoLogs([...db.fault_logs]);
  };

  // Handler: Save file from playground
  const handleSaveFile = (fileId: string, newCode: string) => {
    dbRef.current.codeFiles = dbRef.current.codeFiles.map(f => {
      if (f.id === fileId) {
        return { ...f, code: newCode };
      }
      return f;
    });
    setFiles(dbRef.current.codeFiles);
    
    // Explicit trigger prediction recheck to respond to formulas modified
    evaluateActiveMachinePrediction();
  };

  // Static stats
  const activeAlarmsCount = mongoLogs.filter(l => !l.repaired).length;
  const oeeTotalRatio = React.useMemo(() => {
    const good = sqlRecords.reduce((sum, r) => sum + r.output_qty, 0);
    const scrap = sqlRecords.reduce((sum, r) => sum + r.scrap_qty, 0);
    return good > 0 ? (good / (good + scrap)) * 100 : 96.2;
  }, [sqlRecords]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-slate-800">
      
      {/* 1. Technical SCADA Header */}
      <header className="bg-slate-900/95 border-b border-slate-950 text-white shadow-xl p-4 pr-6 pl-6 flex flex-col sm:flex-row gap-4 justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-500/20">
            <Activity className="animate-pulse" size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold font-sans tracking-tight">PRODUCTION MANAGEMENT: HYBRID TELEMETRY HARVESTER</h1>
            <p className="text-[11px] text-indigo-400 font-mono">OPERATIONAL STATUS: SCADA CLUSTERS ONLINE</p>
          </div>
        </div>

        {/* Technical metadata gauges */}
        <div className="flex gap-4 items-center">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 text-center">
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Total Relational Logs</span>
            <span className="font-mono text-xs font-bold text-indigo-400">{sqlRecords.length} Rows</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 text-center">
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Total Document Logs</span>
            <span className="font-mono text-xs font-bold text-amber-400">{mongoLogs.length} Documents</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 text-center">
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Active Alarms (BSON)</span>
            <span className="font-mono text-xs font-bold text-rose-400">{activeAlarmsCount} Active</span>
          </div>
        </div>
      </header>

      {/* 2. Top Banner Operators Info */}
      <div className="bg-slate-900/50 border-b border-slate-950 px-6 py-2 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active SCADA Terminal IP: <strong className="text-slate-200">10.124.0.3</strong></span>
          <span className="text-slate-800">|</span>
          <span>Target Cluster Location: <strong className="text-slate-200">DUSSELDORF FL-4</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Global OEE Index:</span>
          <span className="text-emerald-400 font-bold">{oeeTotalRatio.toFixed(2)}% compliant</span>
        </div>
      </div>

      {/* 3. Horizontal Control Tabs */}
      <div className="bg-slate-950 border-b border-slate-900 px-6 pt-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-xs font-sans font-semibold rounded-t-lg border-t border-r border-l transition cursor-pointer shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-slate-900 border-slate-850 text-white border-b-slate-900 -mb-[1px]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          🖥️ Machine Telemetry Dashboard
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 text-xs font-sans font-semibold rounded-t-lg border-t border-r border-l transition cursor-pointer shrink-0 ${
            activeTab === 'sql'
              ? 'bg-slate-900 border-slate-850 text-white border-b-slate-900 -mb-[1px]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          🗄️ SQLite Terminal Console
        </button>
        <button
          onClick={() => setActiveTab('mongo')}
          className={`px-4 py-2 text-xs font-sans font-semibold rounded-t-lg border-t border-r border-l transition cursor-pointer shrink-0 ${
            activeTab === 'mongo'
              ? 'bg-slate-900 border-slate-850 text-white border-b-slate-900 -mb-[1px]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          📁 MongoDB Document Store
        </button>
        <button
          onClick={() => setActiveTab('playground')}
          className={`px-4 py-2 text-xs font-sans font-semibold rounded-t-lg border-t border-r border-l transition cursor-pointer shrink-0 ${
            activeTab === 'playground'
              ? 'bg-slate-900 border-slate-850 text-white border-b-slate-900 -mb-[1px]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          ⚙️ Predictive Script Laboratory
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 text-xs font-sans font-semibold rounded-t-lg border-t border-r border-l transition cursor-pointer shrink-0 ${
            activeTab === 'ai'
              ? 'bg-slate-900 border-slate-850 text-white border-b-slate-900 -mb-[1px]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          🔮 Core AI Diagnostics
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 text-xs font-sans font-semibold rounded-t-lg border-t border-r border-l transition cursor-pointer shrink-0 ${
            activeTab === 'architecture'
              ? 'bg-slate-900 border-slate-850 text-white border-b-slate-900 -mb-[1px]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          🔌 DB Architecture Blueprint
        </button>
      </div>

      {/* 4. Active Tab Canvas Panel */}
      <main className="flex-1 p-6 pr-6 pl-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Render respective tab view */}
        {activeTab === 'dashboard' && (
          <Dashboard
            machines={machines}
            selectedMachine={selectedMachine}
            setSelectedMachine={setSelectedMachine}
            sqlRecords={sqlRecords}
            mongoLogs={mongoLogs}
            prediction={prediction}
            onSimulateTelemetry={handleSimulateTelemetry}
            onRepairAlarms={handleRepairAlarms}
            isAutoGenerating={isAutoGenerating}
            setIsAutoGenerating={setIsAutoGenerating}
            autoIntervalSpeed={autoIntervalSpeed}
            setAutoIntervalSpeed={setAutoIntervalSpeed}
            autoAnomaliesEnforced={autoAnomaliesEnforced}
            setAutoAnomaliesEnforced={setAutoAnomaliesEnforced}
            secondsRemaining={secondsRemaining}
          />
        )}

        {activeTab === 'sql' && (
          <SqlConsole
            dbEngine={dbRef.current}
            onRefreshFromDB={() => {
              setSqlRecords([...dbRef.current.production_history]);
            }}
          />
        )}

        {activeTab === 'mongo' && (
          <MongoConsole
            dbEngine={dbRef.current}
            onRefreshFromDB={() => {
              setMongoLogs([...dbRef.current.fault_logs]);
            }}
          />
        )}

        {activeTab === 'playground' && (
          <CodePlayground
            files={files}
            onSaveFile={handleSaveFile}
          />
        )}

        {activeTab === 'ai' && (
          <AIPromptExplainer
            selectedMachine={selectedMachine}
            sqlRecords={sqlRecords}
            mongoLogs={mongoLogs}
            prediction={prediction}
          />
        )}

        {activeTab === 'architecture' && (
          <DBArchitecture />
        )}

      </main>

      {/* 5. Compact Industrial Footer */}
      <footer className="bg-slate-900 border-t border-slate-950 py-4 px-6 text-center text-[10px] text-slate-500 font-mono">
        <p>Production Management SCADA Core © 2026. All operations authenticated under operator code jsrushti71@gmail.com.</p>
      </footer>
    </div>
  );
}
