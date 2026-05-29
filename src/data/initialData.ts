import { Machine, SqlProductionRecord, MongoFaultLog } from '../types';

export const INITIAL_MACHINES: Machine[] = [
  {
    id: "M-A100",
    name: "Precision Arm Delta-6",
    type: "Robotic Arm",
    status: "active",
    room: "Assembly Room A",
    manufacturer: "Adept Robotics Inc.",
    installedAt: "2024-03-12"
  },
  {
    id: "M-C200",
    name: "Centrifuge Super-Mill X",
    type: "CNC Centrifuge",
    status: "active",
    room: "Heavy Milling Zone B",
    manufacturer: "Krupp Heavy Industries",
    installedAt: "2023-08-19"
  },
  {
    id: "M-H300",
    name: "Pyrocompressor TC-3000",
    type: "Thermal Compressor",
    status: "active",
    room: "Thermal Isolation Cells",
    manufacturer: "ThermoCore Systems",
    installedAt: "2025-01-10"
  },
  {
    id: "M-V400",
    name: "Flexi-Route Conveyor X1",
    type: "Conveyor Belt",
    status: "idle",
    room: "Packaging Dock C",
    manufacturer: "IntraRoute Logistics",
    installedAt: "2022-11-05"
  }
];

export const INITIAL_SQL_PRODUCTION_RECORDS: SqlProductionRecord[] = [
  // 3 shifts for M-A100
  { id: 1, machine_id: "M-A100", shift: "Morning", output_qty: 450, scrap_qty: 8, rpm_speed: 1200, oil_pressure_psi: 45.2, timestamp: "2026-05-28T06:00:00Z" },
  { id: 2, machine_id: "M-A100", shift: "Evening", output_qty: 430, scrap_qty: 12, rpm_speed: 1250, oil_pressure_psi: 44.8, timestamp: "2026-05-28T14:00:00Z" },
  { id: 3, machine_id: "M-A100", shift: "Night", output_qty: 390, scrap_qty: 24, rpm_speed: 1300, oil_pressure_psi: 42.1, timestamp: "2026-05-28T22:00:00Z" },
  // M-C200 CNC Centrifuge
  { id: 4, machine_id: "M-C200", shift: "Morning", output_qty: 180, scrap_qty: 2, rpm_speed: 3600, oil_pressure_psi: 58.0, timestamp: "2026-05-28T06:00:00Z" },
  { id: 5, machine_id: "M-C200", shift: "Evening", output_qty: 175, scrap_qty: 4, rpm_speed: 3650, oil_pressure_psi: 56.5, timestamp: "2026-05-28T14:00:00Z" },
  { id: 6, machine_id: "M-C200", shift: "Night", output_qty: 160, scrap_qty: 15, rpm_speed: 3800, oil_pressure_psi: 51.2, timestamp: "2026-05-28T22:00:00Z" },
  // M-H300 Compressor
  { id: 7, machine_id: "M-H300", shift: "Morning", output_qty: 900, scrap_qty: 5, rpm_speed: 900, oil_pressure_psi: 72.4, timestamp: "2026-05-28T06:00:00Z" },
  { id: 8, machine_id: "M-H300", shift: "Evening", output_qty: 880, scrap_qty: 9, rpm_speed: 920, oil_pressure_psi: 71.0, timestamp: "2026-05-28T14:00:00Z" },
  { id: 9, machine_id: "M-H300", shift: "Night", output_qty: 850, scrap_qty: 18, rpm_speed: 950, oil_pressure_psi: 67.8, timestamp: "2026-05-28T22:00:00Z" },
  // M-V400 Conveyor
  { id: 10, machine_id: "M-V400", shift: "Morning", output_qty: 1200, scrap_qty: 0, rpm_speed: 150, oil_pressure_psi: 21.3, timestamp: "2026-05-28T06:00:00Z" },
  { id: 11, machine_id: "M-V400", shift: "Evening", output_qty: 1180, scrap_qty: 1, rpm_speed: 150, oil_pressure_psi: 20.9, timestamp: "2026-05-28T14:00:00Z" },
  { id: 12, machine_id: "M-V400", shift: "Night", output_qty: 500, scrap_qty: 0, rpm_speed: 100, oil_pressure_psi: 19.5, timestamp: "2026-05-28T22:00:00Z" },
  // Previous Day data (for trends)
  { id: 13, machine_id: "M-A100", shift: "Morning", output_qty: 460, scrap_qty: 5, rpm_speed: 1200, oil_pressure_psi: 45.5, timestamp: "2026-05-27T06:00:00Z" },
  { id: 14, machine_id: "M-A100", shift: "Evening", output_qty: 440, scrap_qty: 8, rpm_speed: 1220, oil_pressure_psi: 45.1, timestamp: "2026-05-27T14:00:00Z" },
  { id: 15, machine_id: "M-A100", shift: "Night", output_qty: 400, scrap_qty: 14, rpm_speed: 1280, oil_pressure_psi: 44.0, timestamp: "2026-05-27T22:00:00Z" },
  { id: 16, machine_id: "M-C200", shift: "Morning", output_qty: 182, scrap_qty: 1, rpm_speed: 3600, oil_pressure_psi: 58.2, timestamp: "2026-05-27T06:00:00Z" },
  { id: 17, machine_id: "M-C200", shift: "Evening", output_qty: 178, scrap_qty: 3, rpm_speed: 3600, oil_pressure_psi: 57.9, timestamp: "2026-05-27T14:00:00Z" },
  { id: 18, machine_id: "M-C200", shift: "Night", output_qty: 170, scrap_qty: 8, rpm_speed: 3700, oil_pressure_psi: 56.4, timestamp: "2026-05-27T22:00:00Z" }
];

export const INITIAL_MONGO_FAULT_LOGS: MongoFaultLog[] = [
  {
    _id: "log_fl001",
    machine_id: "M-A100",
    component: "Hydraulic Pump Actuator",
    severity: "warning",
    error_code: "W-ACT-401",
    message: "Hydraulic actuator movement micro-delay detected. Response time at 140ms (Standard: <100ms).",
    telemetry: {
      temperature_c: 68.4,
      vibration_g: 0.85,
      voltage_v: 24.2
    },
    repaired: true,
    timestamp: "2026-05-27T10:15:22Z"
  },
  {
    _id: "log_fl002",
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
    timestamp: "2026-05-28T22:45:10Z"
  },
  {
    _id: "log_fl003",
    machine_id: "M-C200",
    component: "Spindle Drive Collet",
    severity: "warning",
    error_code: "W-SPINDLE-705",
    message: "Harmonic mechanical noise registered on accelerometer #2 during tool handover. Imbalance detected.",
    telemetry: {
      temperature_c: 48.0,
      vibration_g: 1.84,
      voltage_v: 400.1
    },
    repaired: false,
    timestamp: "2026-05-28T16:30:00Z"
  },
  {
    _id: "log_fl004",
    machine_id: "M-H300",
    component: "Thermal Cylinder Wall",
    severity: "critical",
    error_code: "E-TEMP-911",
    message: "Internal thermal thermocouple registered limit-near core heat drift.",
    telemetry: {
      temperature_c: 122.5,
      vibration_g: 0.98,
      voltage_v: 110.5
    },
    repaired: false,
    timestamp: "2026-05-29T02:11:44Z"
  },
  {
    _id: "log_fl005",
    machine_id: "M-V400",
    component: "Primary Roller Gearbox",
    severity: "info",
    error_code: "I-GEAR-001",
    message: "Automated oil level sweep completed successfully. Level: 92%. Refill not required.",
    telemetry: {
      temperature_c: 34.2,
      vibration_g: 0.15,
      voltage_v: 24.0
    },
    repaired: true,
    timestamp: "2026-05-28T08:00:00Z"
  },
  {
    _id: "log_fl006",
    machine_id: "M-C200",
    component: "Coolant Delivery Jets",
    severity: "warning",
    error_code: "W-COOL-309",
    message: "Coolant delivery backpressure reached 21 PSI due to micro-sediment accumulation.",
    telemetry: {
      temperature_c: 41.5,
      vibration_g: 0.32,
      voltage_v: 398.5
    },
    repaired: true,
    timestamp: "2026-05-27T18:40:00Z"
  },
  {
    _id: "log_fl007",
    machine_id: "M-H300",
    component: "Exhaust Solenoid Valve",
    severity: "warning",
    error_code: "W-PRESSURE-804",
    message: "Exhaust cycling counter reached 100,000 actuations. Scheduled seat replacement cycle nearing.",
    telemetry: {
      temperature_c: 98.2,
      vibration_g: 1.12,
      voltage_v: 109.8
    },
    repaired: false,
    timestamp: "2026-05-29T11:00:00Z"
  }
];
