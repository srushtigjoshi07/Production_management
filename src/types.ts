export interface Machine {
  id: string;
  name: string;
  type: 'Robotic Arm' | 'CNC Centrifuge' | 'Thermal Compressor' | 'Conveyor Belt';
  status: 'active' | 'idle' | 'maintenance' | 'fault';
  room: string;
  manufacturer: string;
  installedAt: string;
}

export interface SqlProductionRecord {
  id: number;
  machine_id: string;
  shift: 'Morning' | 'Evening' | 'Night';
  output_qty: number;
  scrap_qty: number;
  rpm_speed: number;
  oil_pressure_psi: number;
  timestamp: string; // ISO String
}

export interface MongoFaultLog {
  _id: string;
  machine_id: string;
  component: string;
  severity: 'info' | 'warning' | 'critical';
  error_code: string;
  message: string;
  telemetry: {
    temperature_c: number;
    vibration_g: number;
    voltage_v: number;
  };
  repaired: boolean;
  timestamp: string; // ISO String
}

export interface PlaygroundFile {
  id: string;
  filename: string;
  language: 'sql' | 'json' | 'typescript' | 'javascript';
  description: string;
  code: string;
}

export interface DowntimePredictionResult {
  machineId: string;
  riskScore: number; // 0 to 100
  predictedHoursToFailure: number;
  primaryRiskFactor: string;
  criticalFaultCount: number;
  averageWeeklyEfficiency: number;
  recommendation: string;
}

export interface LiveTelemetry {
  machineId: string;
  temperature: number;
  vibration: number;
  voltage: number;
}
