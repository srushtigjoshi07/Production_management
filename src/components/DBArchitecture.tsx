import React from 'react';
import { Database, FileCode, Copy, Check, BookOpen, Layers, Milestone, HelpCircle, ArrowRightLeft } from 'lucide-react';

export default function DBArchitecture() {
  const [copiedType, setCopiedType] = React.useState<'sql' | 'mongo' | null>(null);
  const [activeSubTab, setActiveSubTab] = React.useState<'concepts' | 'sql_code' | 'mongo_code'>('concepts');

  const FULL_SQL_CODE = `-- ==========================================
-- PRODUCTION MANAGEMENT RELATIONAL SCHEMA (SQL)
-- Target DBMS: SQLite/PostgreSQL/MySQL
-- ==========================================

-- Table 1: Static and semi-static machinery catalog configurations
CREATE TABLE machines (
  id VARCHAR(50) PRIMARY KEY,              -- Alpha-numeric unique cluster identifier
  name VARCHAR(100) NOT NULL,               -- High-fidelity system label
  type VARCHAR(50) NOT NULL,               -- Machine operational class
  status VARCHAR(20) DEFAULT 'active'      -- Status tracking: active, idle, maintenance, fault
    CHECK (status IN ('active', 'idle', 'maintenance', 'fault')),
  room VARCHAR(50),                         -- Facility physical room division
  manufacturer VARCHAR(100),               -- Original manufacturing vendor
  installed_at DATE NOT NULL                -- Commissioning date
);

-- Table 2: Tabular high-frequency production yield & speed records
-- Highly structured data with strict foreign key constraints.
CREATE TABLE production_history (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,    -- Autoincrement indexing sequence
  machine_id VARCHAR(50) NOT NULL,          -- Relational Link to master machinery catalog
  shift VARCHAR(20) NOT NULL                -- Operational crew shift
    CHECK (shift IN ('Morning', 'Evening', 'Night')),
  output_qty INT NOT NULL DEFAULT 0,        -- Total successful units machined
  scrap_qty INT DEFAULT 0,                  -- Discarded waste due to mechanical deviation
  rpm_speed INT,                            -- Spindle rotative speed configuration
  oil_pressure_psi DECIMAL(5,2),            -- System hydraulic pressure bar level
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Temporal coordinate of the run
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- ==========================================
-- SEED DATA INJECTION
-- ==========================================
INSERT INTO machines (id, name, type, status, room, manufacturer, installed_at) VALUES
('M-A100', 'Precision Arm Delta-6', 'Robotic Arm', 'active', 'Assembly Room A', 'Adept Robotics Inc.', '2024-03-12'),
('M-C200', 'Centrifuge Super-Mill X', 'CNC Centrifuge', 'active', 'Heavy Milling Zone B', 'Krupp Heavy Industries', '2023-08-19'),
('M-H300', 'Pyrocompressor TC-3000', 'Thermal Compressor', 'active', 'Thermal Isolation Cells', 'ThermoCore Systems', '2025-01-10'),
('M-V400', 'Flexi-Route Conveyor X1', 'Conveyor Belt', 'idle', 'Packaging Dock C', 'IntraRoute Logistics', '2022-11-05');

INSERT INTO production_history (machine_id, shift, output_qty, scrap_qty, rpm_speed, oil_pressure_psi, timestamp) VALUES
('M-A100', 'Morning', 450, 8, 1200, 45.2, '2026-05-28 06:00:00'),
('M-A100', 'Evening', 430, 12, 1250, 44.8, '2026-05-28 14:00:00'),
('M-A100', 'Night', 390, 24, 1300, 42.1, '2026-05-28 22:00:00'),
('M-C200', 'Morning', 180, 2, 3600, 58.0, '2026-05-28 06:00:00'),
('M-C200', 'Evening', 175, 4, 3650, 56.5, '2026-05-28 14:00:00'),
('M-C200', 'Night', 160, 15, 3800, 51.2, '2026-05-28 22:00:00');`;

  const FULL_MONGO_CODE = `// ==========================================
// PRODUCTION MANAGEMENT DOCUMENT STORAGE (NoSQL)
// Target Database: MongoDB (BSON format)
// ==========================================

// 1. Establish the collection structure and optional JSON schema validation
db.createCollection("fault_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["machine_id", "component", "severity", "repaired", "timestamp"],
      properties: {
        machine_id: { bsonType: "string" },
        component: { bsonType: "string" },
        severity: { enum: ["info", "warning", "critical"] },
        error_code: { bsonType: "string" },
        message: { bsonType: "string" },
        telemetry: {
          bsonType: "object",
          properties: {
            temperature_c: { bsonType: "double" },
            vibration_g: { bsonType: "double" },
            voltage_v: { bsonType: "double" }
          }
        },
        repaired: { bsonType: "bool" },
        timestamp: { bsonType: "date" }
      }
    }
  }
});

// 2. Build multi-key indexing structure for fast query lookups
db.fault_logs.createIndex({ "machine_id": 1, "repaired": 1 });
db.fault_logs.createIndex({ "telemetry.vibration_g": 1 });
db.fault_logs.createIndex({ "timestamp": -1 });

// 3. Inject seed BSON documents with variable format telemetry fields
db.fault_logs.insertMany([
  {
    _id: ObjectId("60a2c300f3be6a1fae120001"),
    machine_id: "M-A100",
    component: "Hydraulic Pump Actuator",
    severity: "warning",
    error_code: "W-ACT-401",
    message: "Hydraulic actuator movement micro-delay detected. Response time at 140ms.",
    telemetry: {
      temperature_c: 68.4,
      vibration_g: 0.85,
      voltage_v: 24.2
    },
    repaired: true,
    timestamp: ISODate("2026-05-27T10:15:22.000Z")
  },
  {
    _id: ObjectId("60a2c300f3be6a1fae120002"),
    machine_id: "M-A100",
    component: "Elbow Joint Motor",
    severity: "critical",
    error_code: "E-MOTOR-102",
    message: "Current draw peaked during rapid reverse sweep. Thermal overload trip threat logged.",
    telemetry: {
      temperature_c: 84.1,
      vibration_g: 2.14,
      voltage_v: 21.8
    },
    repaired: false,
    timestamp: ISODate("2026-05-28T22:45:10.000Z")
  },
  {
    _id: ObjectId("60a2c300f3be6a1fae120003"),
    machine_id: "M-C200",
    component: "Main Spindle Bearing",
    severity: "warning",
    error_code: "W-BEAR-209",
    message: "Acoustical profile suggests lubrication film degradation in centrifuge chamber.",
    telemetry: {
      temperature_c: 98.2,
      vibration_g: 3.82,
      voltage_v: 401.5
    },
    repaired: false,
    timestamp: ISODate("2026-05-28T18:30:00.000Z")
  }
]);`;

  const copyToClipboard = (text: string, type: 'sql' | 'mongo') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Descriptive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-6 text-white shadow-md border border-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-xs text-indigo-300 font-mono font-medium">
            <Layers size={11} />
            Hybrid Database Architecture Specification
          </div>
          <h2 className="text-xl font-bold tracking-tight font-sans">SQL & NoSQL Coexistence Blueprint</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Industrial monitoring requires marrying tabular financial production metrics with high-frequency, complex hardware alarm telemetry. Learn how SQL and MongoDB work together in an active factory environment to enable AI-driven prognostic dispatching.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setActiveSubTab('concepts')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans cursor-pointer transition ${
              activeSubTab === 'concepts' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'bg-slate-800/80 text-slate-350 hover:bg-slate-800'
            }`}
          >
            📊 What & Why
          </button>
          <button 
            onClick={() => setActiveSubTab('sql_code')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans cursor-pointer transition ${
              activeSubTab === 'sql_code' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'bg-slate-800/80 text-slate-350 hover:bg-slate-800'
            }`}
          >
            🗄️ SQL Full Code
          </button>
          <button 
            onClick={() => setActiveSubTab('mongo_code')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans cursor-pointer transition ${
              activeSubTab === 'mongo_code' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'bg-slate-800/80 text-slate-350 hover:bg-slate-800'
            }`}
          >
            📁 MongoDB Full Code
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="bg-slate-900 border text-slate-200 border-slate-800 rounded-xl shadow-lg p-6">
        
        {/* VIEW 1: CONCEPTS (Detailed Comparative Analysis) */}
        {activeSubTab === 'concepts' && (
          <div className="space-y-8">
            
            {/* Visual joint flow indicator */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              <div className="md:col-span-4 bg-slate-950 border border-slate-850 rounded-xl p-5 text-center shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1.5 text-xs font-mono font-bold bg-indigo-950/80 border-b border-l border-slate-800 text-indigo-400 rounded-bl-lg">
                  SQL
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-950/60 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-900/30">
                  <Database size={20} />
                </div>
                <h4 className="text-sm font-bold text-white">Relational SQLite</h4>
                <p className="text-[11px] text-slate-400 mt-1">Structured Shift Aggregations</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[9px] font-mono text-slate-400">
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">Foreign Keys</span>
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">ACID Checks</span>
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">Tabular OEE</span>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 text-slate-500">
                <div id="tech-flow-joint" className="bg-indigo-950/50 border border-indigo-900/40 text-indigo-400 text-[10px] font-mono py-1 px-2.5 rounded-full inline-block font-bold">
                  CROSS-STORE DATA JOIN
                </div>
                <div className="flex items-center gap-1 mt-2 text-slate-500">
                  <Milestone size={18} className="text-slate-600" />
                  <ArrowRightLeft size={16} className="text-slate-500 animate-pulse" />
                  <Milestone size={18} className="text-slate-600" />
                </div>
                <span className="text-[10px] uppercase font-mono mt-2 text-slate-500">Predictive Diagnostics Core</span>
              </div>

              <div className="md:col-span-4 bg-slate-950 border border-slate-850 rounded-xl p-5 text-center shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1.5 text-xs font-mono font-bold bg-amber-950/80 border-b border-l border-slate-800 text-amber-400 rounded-bl-lg">
                  NoSQL
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-950/60 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-900/30">
                  <FileCode size={20} />
                </div>
                <h4 className="text-sm font-bold text-white">MongoDB Document</h4>
                <p className="text-[11px] text-slate-400 mt-1">Schemaless Nesting Anomalies</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[9px] font-mono text-slate-400">
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">Nested BSON</span>
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">Variable Fields</span>
                  <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">Raw Accelerometers</span>
                </div>
              </div>

            </div>

            {/* Core Structural Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              
              {/* Relational Table Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  <h3 className="font-sans font-bold text-base text-white">What SQL is Used For & Why</h3>
                </div>

                <div className="space-y-3 font-sans text-xs text-slate-400 leading-relaxed">
                  <p>
                    In Production Management, the relational SQL engine (simulated via <strong>SQLite</strong>) is deployed specifically to store the factory's structured configurations and sequential operational logs. This handles state-machine definitions such as the commissioning date and specific locations of factory equipment.
                  </p>
                  
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold uppercase font-mono text-indigo-400 block">KEY FIELDS & RELATIONS</span>
                    <ul className="list-disc list-inside space-y-1 font-sans text-slate-350">
                      <li><strong>Tabular Columns:</strong> Output quantity, scrap totals, target shaft speed RPM, stable hydraulic PSI pressure.</li>
                      <li><strong>Entity Integrity:</strong> Primary keys ensure no overlap in shift identifiers.</li>
                      <li><strong>Referential Linking:</strong> Foreign keys (<code>FOREIGN KEY (machine_id) REFERENCES machines(id)</code>) prevent orphaned recordings.</li>
                    </ul>
                  </div>

                  <p className="font-semibold text-slate-200">
                    Why we use target Relational Tables here:
                  </p>
                  <p>
                    Tabular production shift results are highly uniform. We expect every single record inside <code>production_history</code> to contain the identical column values (RPM speed, oil pressure, shift labels). SQL databases excel here, optimizing storage and query evaluation in flat arrays. 
                  </p>
                  <p>
                    Crucially, <strong>ACID compliance</strong> ensures that when recording physical hardware yields, values are never corrupted. If an arm delta-6 records output data, we trigger automatic calculations for Overall Equipment Effectiveness (OEE). Relations enable perfect mathematical joins so we can confidently query shifts combined with machine attributes.
                  </p>
                </div>
              </div>

              {/* Document Store Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  <h3 className="font-sans font-bold text-base text-white">What MongoDB is Used For & Why</h3>
                </div>

                <div className="space-y-3 font-sans text-xs text-slate-400 leading-relaxed">
                  <p>
                    The document database (simulated via **MongoDB**) is engaged to store machine sensor diagnostics, system error exceptions, and high-frequency wave-friction alarm streams.
                  </p>

                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold uppercase font-mono text-amber-400 block">DYNAMISM IN NESTED BSON</span>
                    <ul className="list-disc list-inside space-y-1 font-sans text-slate-350">
                      <li><strong>Schemaless Properties:</strong> Storing dynamic array alerts with variable shapes and metadata attributes.</li>
                      <li><strong>BSON Nested Objects:</strong> Telemetry values are grouped under a nested <code>telemetry</code> sub-document.</li>
                      <li><strong>Asymmetrical Anomaly Fields:</strong> Specific diagnostic attributes vary based on machine type.</li>
                    </ul>
                  </div>

                  <p className="font-semibold text-slate-200">
                    Why MongoDB is the perfect industrial telemetry choice:
                  </p>
                  <p>
                    Industrial machinery has massive structural variance. For instance, a <strong>Robotic Delta-6 Arm</strong> reports joint current draw and axis angle deviations other devices do not possess. Conversely, a <strong>Thermal Compressor</strong> generates valve leakage metrics, cooling loop pressures, and gas levels.
                  </p>
                  <p>
                    Trying to store all dynamic accelerometer variations inside rigid SQL columns would require thousands of wide, sparse, NULL-filled table records. Splitting them into multiple joined tables would trigger crippling database query degradation. 
                  </p>
                  <p>
                    <strong>MongoDB document storage solves this completely</strong>. Each document contains specialized values encapsulated inside its own BSON envelope. We can query on nested values dynamically using deep operators like <code>"telemetry.vibration_g"</code> without forcing any unified columns pattern.
                  </p>
                </div>

              </div>

            </div>

            {/* Synergy & Joining */}
            <div className="bg-indigo-950/40 text-indigo-200 rounded-xl p-5 border border-indigo-900/40 space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-1.5 text-white">
                <Milestone size={16} className="text-indigo-400" />
                The Hybrid Architectural Synergy: Why Use Both?
              </h4>
              <p className="text-xs leading-relaxed text-slate-300">
                By maintaining SQL for transaction yields and MongoDB for fault document logs, Production Management enjoys the best of both database paradigms. 
                Our <strong>Predictive Script Laboratory</strong> runs a unified Javascript processor that ingests relational values (SQL) and filters schemaless active alerts (MongoDB). It then executes live mathematical regressions to evaluate continuous machine health, outputting remaining operation hours to precision before hardware breaks.
              </p>
            </div>

          </div>
        )}
         {/* VIEW 2: FULL SQL DEFINITIONS CODE */}
        {activeSubTab === 'sql_code' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-850">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Database size={15} className="text-indigo-400" />
                  PRODUCTION_MANAGEMENT_SCADA_CATALOG_DDL.sql
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Contains the absolute structural database configuration including foreign keys and data types constraint checks.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(FULL_SQL_CODE, 'sql')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-sans font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm border border-slate-700"
              >
                {copiedType === 'sql' ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy SQL Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative border border-slate-950 rounded-xl overflow-hidden shadow-inner">
              <pre className="bg-slate-955 text-indigo-100 p-5 overflow-x-auto text-[11px] leading-relaxed font-mono font-medium max-h-[500px]">
                {FULL_SQL_CODE}
              </pre>
            </div>
          </div>
        )}

        {/* VIEW 3: FULL MONGODB CODE */}
        {activeSubTab === 'mongo_code' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-850">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileCode size={15} className="text-amber-400" />
                  PRODUCTION_MANAGEMENT_SCADA_FAULT_BSON.js
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Collection creation scripts, nested schema validation guidelines, indexes, and document insertion logs of NoSQL.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(FULL_MONGO_CODE, 'mongo')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-sans font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm border border-slate-700"
              >
                {copiedType === 'mongo' ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Mongo Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative border border-slate-950 rounded-xl overflow-hidden shadow-inner">
              <pre className="bg-slate-955 text-amber-100 p-5 overflow-x-auto text-[11px] leading-relaxed font-mono font-medium max-h-[500px]">
                {FULL_MONGO_CODE}
              </pre>
            </div>
          </div>
         )}

      </div>

    </div>
  );
}
