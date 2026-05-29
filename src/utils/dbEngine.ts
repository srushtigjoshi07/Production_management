import { Machine, SqlProductionRecord, MongoFaultLog, PlaygroundFile, DowntimePredictionResult } from '../types';
import { INITIAL_MACHINES, INITIAL_SQL_PRODUCTION_RECORDS, INITIAL_MONGO_FAULT_LOGS } from '../data/initialData';

// Simulated DB State Class
export class SimulatedDB {
  public machines: Machine[];
  public production_history: SqlProductionRecord[];
  public fault_logs: MongoFaultLog[];
  public codeFiles: PlaygroundFile[];

  constructor() {
    this.machines = [...INITIAL_MACHINES];
    this.production_history = [...INITIAL_SQL_PRODUCTION_RECORDS];
    this.fault_logs = [...INITIAL_MONGO_FAULT_LOGS];
    this.codeFiles = this.getDefaultCodeFiles();
  }

  private getDefaultCodeFiles(): PlaygroundFile[] {
    return [
      {
        id: "downtime_predictor",
        filename: "downtime_predictor.ts",
        language: "typescript",
        description: "Evaluates production state (SQL) and hardware alarms (MongoDB) to calculate live operational failure risk.",
        code: `/**
 * Hybrid Predictive Analytics Logic
 * This function aggregates structured operational stats and raw JSON alarms
 * to assess machinery failure risks (0 to 100%) and estimate hours-to-cutoff.
 */
export function predictDowntimeRisk(
  machine: any,
  sqlRecords: any[], // production history records for this machine
  mongoLogs: any[]   // MongoDB fault logs for this machine
): { riskScore: number; predictedHours: number; riskFactor: string; recommendation: string } {
  
  let risk = 8; // baseline structural risk
  let factors: string[] = [];
  
  // 1. Evaluate semi-structured MongoDB fault logs (severities, repairs & vibrations)
  const activeFaults = mongoLogs.filter(log => !log.repaired);
  const criticalCount = activeFaults.filter(log => log.severity === 'critical').length;
  const warningCount = activeFaults.filter(log => log.severity === 'warning').length;
  
  if (criticalCount > 0) {
    risk += criticalCount * 30;
    factors.push(\`\${criticalCount} active critical anomaly alarm(s)\`);
  }
  if (warningCount > 0) {
    risk += warningCount * 12;
    factors.push(\`\${warningCount} unresolved hardware alert(s)\`);
  }
  
  // Checking nested JSON sensor values recorded in MongoDB logs
  const highVibrations = activeFaults.filter(log => log.telemetry?.vibration_g > 3.2);
  if (highVibrations.length > 0) {
    risk += 25;
    factors.push(\`Dangerous spindle vibrations at \${highVibrations[0].telemetry.vibration_g}g\`);
  }

  const highTemps = activeFaults.filter(log => log.telemetry?.temperature_c > 110);
  if (highTemps.length > 0) {
    risk += 22;
    factors.push(\`Extreme thermal core load registered (\${highTemps[0].telemetry.temperature_c}°C)\`);
  }
  
  // 2. Evaluate structured transactional SQL history (efficiency patterns)
  if (sqlRecords.length > 0) {
    const totalOutput = sqlRecords.reduce((sum, r) => sum + r.output_qty, 0);
    const totalScrap = sqlRecords.reduce((sum, r) => sum + r.scrap_qty, 0);
    const scrapRate = totalScrap / (totalOutput + totalScrap || 1);
    
    // High waste implies tool/nozzle alignment failure
    if (scrapRate > 0.035) {
      risk += 18;
      factors.push(\`Abnormal machine scrap rate of \${(scrapRate * 100).toFixed(1)}%\`);
    }
    
    // Check hydraulic pressure drop trends over recent shifts
    const recentRecords = sqlRecords.slice(-3);
    if (recentRecords.length >= 2) {
      const earlier = recentRecords[0].oil_pressure_psi;
      const later = recentRecords[recentRecords.length - 1].oil_pressure_psi;
      if (later < earlier * 0.88) {
        risk += 15;
        factors.push(\`Operational hydraulic pressure drop of \${((1 - later / earlier) * 100).toFixed(0)}%\`);
      }
    }
  }

  // 3. Final calculations
  risk = Math.round(Math.min(Math.max(risk, 5), 98));
  
  // Calculate remaining operational hours
  let hours = 168; // 1 week
  if (risk > 80) {
    hours = Math.max(2, Math.round(24 - (risk - 80) * 1.5));
  } else if (risk > 50) {
    hours = Math.round(72 - (risk - 50) * 1.6);
  } else if (risk > 20) {
    hours = Math.round(168 - (risk - 20) * 3);
  }

  // Generate actionable diagnostics commands
  let rec = "All systems green. Schedule standard weekly lube.";
  if (risk > 75) {
    rec = "CRITICAL: Automated shutdown warning triggered! Dispatch mechanical response unit immediately. Flush hydraulic valve and recalibrate spindle joint bearings.";
  } else if (risk > 45) {
    rec = "WARNING: Schedule physical diagnostic probe within 24 hours. Clear metal filings from spindle and check oil pressure pumps.";
  } else if (risk > 22) {
    rec = "MODERATE: Run sensor telemetry calibration sweep. Inspect exhaust valve fittings on next idle break.";
  }

  return {
    riskScore: risk,
    predictedHours: hours,
    riskFactor: factors.join(", ") || "Stable thermal & pressure coefficients",
    recommendation: rec
  };
}`
      },
      {
        id: "vibration_analyzer",
        filename: "vibration_analyzer.ts",
        language: "typescript",
        description: "Monitors real-time vibration inputs from industrial accelerometers to log anomalies in MongoDB.",
        code: `/**
 * Industrial Vibration Telemetry Evaluator
 * Returns True if vibration levels trigger a log requirement.
 * Configured limits vary based on machine type.
 */
export function analyzeVibrationAnomaly(machine: any, vibrationG: number): { triggerAnomaly: boolean; severity: 'info' | 'warning' | 'critical'; code: string; reason: string } {
  let limit = 2.0; // Robotic Arm default limit
  
  if (machine.type === 'CNC Centrifuge') {
    limit = 3.5; // High rotational speed needs higher tolerances
  } else if (machine.type === 'Thermal Compressor') {
    limit = 1.5; // Extremely sensitive compressor seals
  } else if (machine.type === 'Conveyor Belt') {
    limit = 1.0; // Low speed belt should be smooth
  }

  if (vibrationG > limit * 1.5) {
    return {
      triggerAnomaly: true,
      severity: 'critical',
      code: 'E-VIB-CRIT',
      reason: \`Structural vibration of \${vibrationG}g exceeded absolute safe ceiling of \${(limit * 1.5).toFixed(1)}g\`
    };
  } else if (vibrationG > limit) {
    return {
      triggerAnomaly: true,
      severity: 'warning',
      code: 'W-VIB-ALERT',
      reason: \`Vibration friction baseline threshold of \${limit}g exceeded at \${vibrationG}g\`
    };
  }

  return {
    triggerAnomaly: false,
    severity: 'info',
    code: 'I-VIB-STRIP',
    reason: 'Operational wave frequency satisfies stability constraints'
  };
}`
      },
      {
        id: "schema_sql",
        filename: "schema.sql",
        language: "sql",
        description: "Relational database schema containing high-write physical production tallies and machine descriptors.",
        code: `CREATE TABLE machines (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  room VARCHAR(50),
  manufacturer VARCHAR(100),
  installed_at DATE
);

CREATE TABLE production_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machine_id VARCHAR(50),
  shift VARCHAR(20) CHECK (shift IN ('Morning', 'Evening', 'Night')),
  output_qty INT NOT NULL,
  scrap_qty INT DEFAULT 0,
  rpm_speed INT,
  oil_pressure_psi DECIMAL(5,2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);`
      }
    ];
  }

  // Executes a custom query on simulated MongoDB
  public executeMongoAggregation(pipelineJson: string): any[] {
    try {
      const pipeline = JSON.parse(pipelineJson);
      if (!Array.isArray(pipeline)) {
        throw new Error("Aggregation pipeline must be a JSON array.");
      }

      let currentDocs = JSON.parse(JSON.stringify(this.fault_logs));

      for (const stage of pipeline) {
        const stageKeys = Object.keys(stage);
        if (stageKeys.length !== 1) {
          throw new Error("Each pipeline stage must have exactly one top-level key (e.g. $match, $group, etc.)");
        }

        const operator = stageKeys[0];
        const val = stage[operator];

        switch (operator) {
          case "$match": {
            currentDocs = currentDocs.filter((doc: any) => {
              for (const [key, filterVal] of Object.entries(val)) {
                // Handle nested keys safely (like telemetry.vibration_g)
                const actualValue = key.includes('.') 
                  ? key.split('.').reduce((obj, k) => obj?.[k], doc)
                  : doc[key];

                if (typeof filterVal === 'object' && filterVal !== null) {
                  // Operators like $gt, $lt, $eq, $ne
                  for (const [subOp, subVal] of Object.entries(filterVal)) {
                    if (subOp === '$gt' && !(actualValue > (subVal as any))) return false;
                    if (subOp === '$lt' && !(actualValue < (subVal as any))) return false;
                    if (subOp === '$gte' && !(actualValue >= (subVal as any))) return false;
                    if (subOp === '$lte' && !(actualValue <= (subVal as any))) return false;
                    if (subOp === '$eq' && actualValue !== subVal) return false;
                    if (subOp === '$ne' && actualValue === subVal) return false;
                  }
                } else {
                  // Direct comparison
                  if (actualValue !== filterVal) return false;
                }
              }
              return true;
            });
            break;
          }
          case "$project": {
            currentDocs = currentDocs.map((doc: any) => {
              const res: any = { _id: doc._id };
              for (const [field, rule] of Object.entries(val)) {
                if (rule === 1 || rule === true) {
                  // Simple inclusion
                  if (field.includes('.')) {
                    const keys = field.split('.');
                    let currentObj = doc;
                    keys.forEach((k: string) => { currentObj = currentObj?.[k]; });
                    res[field.replace(/\./g, '_')] = currentObj;
                  } else {
                    res[field] = doc[field];
                  }
                } else if (typeof rule === 'string' && rule.startsWith('$')) {
                  // Simple rename / reference field e.g. "machine": "$machine_id"
                  const refKey = rule.substring(1);
                  res[field] = doc[refKey];
                } else if (rule === 0 || rule === false) {
                  // Exclude
                  delete res[field];
                }
              }
              return res;
            });
            break;
          }
          case "$group": {
            const idRule = val._id;
            const aggregations = { ...val };
            delete aggregations._id;

            const groups: { [key: string]: any[] } = {};
            currentDocs.forEach((doc: any) => {
              let groupKey = "null";
              if (typeof idRule === 'string' && idRule.startsWith('$')) {
                const docField = idRule.substring(1);
                groupKey = String(docField.split('.').reduce((obj, k) => obj?.[k], doc) || "undefined");
              } else if (idRule !== null) {
                groupKey = String(idRule);
              }
              if (!groups[groupKey]) groups[groupKey] = [];
              groups[groupKey].push(doc);
            });

            currentDocs = Object.entries(groups).map(([gKey, docs]) => {
              const grp: any = { _id: gKey === "null" ? null : gKey };
              for (const [outField, aggRule] of Object.entries(aggregations)) {
                if (typeof aggRule === 'object' && aggRule !== null) {
                  const [aggOp, aggField] = Object.entries(aggRule)[0];
                  if (typeof aggField === 'string' && aggField.startsWith('$')) {
                    const cleanField = aggField.substring(1);
                    const getVal = (d: any) => cleanField.split('.').reduce((obj, k) => obj?.[k], d);

                    if (aggOp === '$sum') {
                      grp[outField] = docs.reduce((sum, d) => sum + (Number(getVal(d)) || 0), 0);
                    } else if (aggOp === '$avg') {
                      const sum = docs.reduce((sum, d) => sum + (Number(getVal(d)) || 0), 0);
                      grp[outField] = Math.round((sum / docs.length) * 10) / 10;
                    } else if (aggOp === '$min') {
                      grp[outField] = Math.min(...docs.map(d => Number(getVal(d)) || Infinity).filter(v => v !== Infinity));
                    } else if (aggOp === '$max') {
                      grp[outField] = Math.max(...docs.map(d => Number(getVal(d)) || -Infinity).filter(v => v !== -Infinity));
                    } else if (aggOp === '$push') {
                      grp[outField] = docs.map(d => getVal(d));
                    }
                  } else if (aggOp === '$sum' && aggField === 1) {
                    // count count
                    grp[outField] = docs.length;
                  }
                }
              }
              return grp;
            });
            break;
          }
          case "$sort": {
            const sortFields = Object.entries(val);
            currentDocs.sort((a: any, b: any) => {
              for (const [sField, sOrder] of sortFields) {
                const valA = a[sField];
                const valB = b[sField];
                const modifier = sOrder === -1 ? -1 : 1;
                if (valA < valB) return -1 * modifier;
                if (valA > valB) return 1 * modifier;
              }
              return 0;
            });
            break;
          }
          case "$limit": {
            const limitVal = Number(val);
            if (!isNaN(limitVal)) {
              currentDocs = currentDocs.slice(0, limitVal);
            }
            break;
          }
          default:
            throw new Error(`Unsupported MongoDB aggregation operator: ${operator}`);
        }
      }

      return currentDocs;
    } catch (e: any) {
      throw new Error(`MongoDB Aggregation Exception: ${e.message}`);
    }
  }

  // Executes a parsed select query on simulated relational SQL database
  public executeSqlQuery(queryStr: string): any[] {
    const rawQuery = queryStr.trim().replace(/\s+/g, " ");
    const query = rawQuery.replace(/;$/, "").trim();
    const lowerQuery = query.toLowerCase();

    if (!lowerQuery.startsWith("select")) {
      throw new Error("Simulated SQL engine currently supports SELECT queries (Read-Only Console Safeguard).");
    }

    try {
      // Find indexes of keywords to fragment clauses cleanly
      const fromIdx = lowerQuery.indexOf(" from ");
      if (fromIdx === -1) {
        throw new Error("Syntax Error: Missing FROM clause.");
      }

      const fieldsStr = query.substring(7, fromIdx).trim();

      const joinIdx = lowerQuery.indexOf(" join ");
      const onIdx = lowerQuery.indexOf(" on ");
      const whereIdx = lowerQuery.indexOf(" where ");
      const groupByIdx = lowerQuery.indexOf(" group by ");
      const orderByIdx = lowerQuery.indexOf(" order by ");
      const limitIdx = lowerQuery.indexOf(" limit ");

      // The end of table1 (FROM table) is the earliest of JOIN, WHERE, GROUP BY, ORDER BY, LIMIT or end of string
      let fromEndIdx = query.length;
      if (joinIdx !== -1) fromEndIdx = joinIdx;
      else if (whereIdx !== -1) fromEndIdx = whereIdx;
      else if (groupByIdx !== -1) fromEndIdx = groupByIdx;
      else if (orderByIdx !== -1) fromEndIdx = orderByIdx;
      else if (limitIdx !== -1) fromEndIdx = limitIdx;

      const table1 = query.substring(fromIdx + 6, fromEndIdx).trim();

      // JOIN extraction
      let table2: string | undefined = undefined;
      let joinKey1: string | undefined = undefined;
      let joinKey2: string | undefined = undefined;

      if (joinIdx !== -1 && onIdx !== -1) {
        table2 = query.substring(joinIdx + 6, onIdx).trim();

        let onEndIdx = query.length;
        if (whereIdx !== -1) onEndIdx = whereIdx;
        else if (groupByIdx !== -1) onEndIdx = groupByIdx;
        else if (orderByIdx !== -1) onEndIdx = orderByIdx;
        else if (limitIdx !== -1) onEndIdx = limitIdx;

        const onStr = query.substring(onIdx + 4, onEndIdx).trim();
        const onParts = onStr.split("=");
        if (onParts.length === 2) {
          joinKey1 = onParts[0].trim();
          joinKey2 = onParts[1].trim();
        }
      }

      // WHERE extraction
      let whereStr: string | undefined = undefined;
      if (whereIdx !== -1) {
        let whereEndIdx = query.length;
        if (groupByIdx !== -1) whereEndIdx = groupByIdx;
        else if (orderByIdx !== -1) whereEndIdx = orderByIdx;
        else if (limitIdx !== -1) whereEndIdx = limitIdx;
        whereStr = query.substring(whereIdx + 7, whereEndIdx).trim();
      }

      // GROUP BY extraction
      let groupByStr: string | undefined = undefined;
      if (groupByIdx !== -1) {
        let groupByEndIdx = query.length;
        if (orderByIdx !== -1) groupByEndIdx = orderByIdx;
        else if (limitIdx !== -1) groupByEndIdx = limitIdx;
        groupByStr = query.substring(groupByIdx + 10, groupByEndIdx).trim();
      }

      // ORDER BY extraction
      let orderByStr: string | undefined = undefined;
      if (orderByIdx !== -1) {
        let orderByEndIdx = query.length;
        if (limitIdx !== -1) orderByEndIdx = limitIdx;
        orderByStr = query.substring(orderByIdx + 10, orderByEndIdx).trim();
      }

      // LIMIT extraction
      let limitStr: string | undefined = undefined;
      if (limitIdx !== -1) {
        limitStr = query.substring(limitIdx + 7).trim();
      }

      // Ensure table exists
      let workingSet: any[] = [];
      if (table1.toLowerCase() === "machines") {
        workingSet = JSON.parse(JSON.stringify(this.machines));
      } else if (table1.toLowerCase() === "production_history") {
        workingSet = JSON.parse(JSON.stringify(this.production_history));
      } else {
        throw new Error(`Table "${table1}" not found in relational catalog schema.`);
      }

      // Handle simple INNER JOIN
      if (table2 && joinKey1 && joinKey2) {
        let t2Data: any[] = [];
        if (table2.toLowerCase() === "machines") {
          t2Data = this.machines;
        } else if (table2.toLowerCase() === "production_history") {
          t2Data = this.production_history;
        } else {
          throw new Error(`Table "${table2}" not found in relational catalog schema.`);
        }

        const joinedSet: any[] = [];
        workingSet.forEach(row1 => {
          t2Data.forEach(row2 => {
            const key1Parts = joinKey1.split('.');
            const key2Parts = joinKey2.split('.');

            const getVal = (row: any, tableName: string, fieldParts: string[]) => {
              const checkTable = fieldParts[0].toLowerCase();
              const prop = fieldParts[1];
              if (checkTable === tableName.toLowerCase()) {
                return row[prop] ?? row[fieldParts[0]] ?? null;
              }
              // Alternative guess
              return row[prop] ?? row[fieldParts[0]] ?? null;
            };

            const val1 = key1Parts.length > 1 ? getVal(row1, table1, key1Parts) ?? getVal(row2, table2, key1Parts) : row1[joinKey1] ?? row2[joinKey1];
            const val2 = key2Parts.length > 1 ? getVal(row1, table1, key2Parts) ?? getVal(row2, table2, key2Parts) : row1[joinKey2] ?? row2[joinKey2];

            if (val1 !== null && val2 !== null && String(val1) === String(val2)) {
              // Combine properties prefixing with table name or merging
              const merged: any = {};
              Object.entries(row1).forEach(([k, v]) => { merged[`${table1}_${k}`] = v; merged[k] = v; });
              Object.entries(row2).forEach(([k, v]) => { merged[`${table2}_${k}`] = v; merged[k] = v; });
              joinedSet.push(merged);
            }
          });
        });
        workingSet = joinedSet;
      }

      // Handle WHERE Clause
      if (whereStr) {
        workingSet = workingSet.filter(row => {
          // Parse basic clauses like status = 'active' or output_qty > 500
          const matchAnd = whereStr.split(/\s+and\s+/i);
          return matchAnd.every(clause => {
            const eqMatch = clause.match(/([\w.]+)\s*(=|!=|>|<|>=|<=)\s*(.*)/);
            if (!eqMatch) return true;
            let [, field, op, valToCompare] = eqMatch;
            field = field.trim();
            valToCompare = valToCompare.trim().replace(/^['"]|['"]$/g, ""); // strip quotes
            
            const rawVal = row[field] ?? row[field.replace(/\./, '_')];
            const compareNum = Number(valToCompare);
            const actualNum = Number(rawVal);

            if (!isNaN(compareNum) && !isNaN(actualNum)) {
              if (op === '=') return actualNum === compareNum;
              if (op === '!=') return actualNum !== compareNum;
              if (op === '>') return actualNum > compareNum;
              if (op === '<') return actualNum < compareNum;
              if (op === '>=') return actualNum >= compareNum;
              if (op === '<=') return actualNum <= compareNum;
            } else {
              if (op === '=') return String(rawVal).toLowerCase() === valToCompare.toLowerCase();
              if (op === '!=') return String(rawVal).toLowerCase() !== valToCompare.toLowerCase();
            }
            return true;
          });
        });
      }

      // Handle Group By and basic aggregations
      if (groupByStr) {
        const groupField = groupByStr.trim();
        const groups: { [key: string]: any[] } = {};
        workingSet.forEach(row => {
          const val = String(row[groupField] ?? "");
          if (!groups[val]) groups[val] = [];
          groups[val].push(row);
        });

        // Determine aggregations based on SELECT fields
        // e.g., AVG(output_qty) as avg_qty, SUM(scrap_qty)
        workingSet = Object.entries(groups).map(([gKey, rows]) => {
          const res: any = { [groupField]: gKey };

          // Inspect fields string for counts, sums, avgs
          const fields = fieldsStr.split(',');
          fields.forEach(field => {
            const cleanField = field.trim();
            const avgMatch = cleanField.match(/avg\((.*?)\)(?:\s+as\s+(\w+))?/i);
            const sumMatch = cleanField.match(/sum\((.*?)\)(?:\s+as\s+(\w+))?/i);
            const countMatch = cleanField.match(/count\((.*?)\)(?:\s+as\s+(\w+))?/i);

            if (avgMatch) {
              const col = avgMatch[1].trim();
              const alias = avgMatch[2]?.trim() || `AVG_${col}`;
              const sum = rows.reduce((s, r) => s + (Number(r[col]) || 0), 0);
              res[alias] = Math.round((sum / rows.length) * 10) / 10;
            } else if (sumMatch) {
              const col = sumMatch[1].trim();
              const alias = sumMatch[2]?.trim() || `SUM_${col}`;
              res[alias] = rows.reduce((s, r) => s + (Number(r[col]) || 0), 0);
            } else if (countMatch) {
              const col = countMatch[1].trim();
              const alias = countMatch[2]?.trim() || `COUNT_${col}`;
              res[alias] = rows.length;
            }
          });
          return res;
        });
      } else {
        // Simple Project SELECT fields (if not Group By)
        const fields = fieldsStr.split(',').map(f => f.trim());
        if (fields.length > 0 && fields[0] !== '*') {
          workingSet = workingSet.map(row => {
            const projected: any = {};
            fields.forEach(f => {
              let fName = f;
              let alias = f;
              const asMatch = f.match(/(.*?)\s+as\s+(\w+)/i);
              if (asMatch) {
                fName = asMatch[1].trim();
                alias = asMatch[2].trim();
              }
              projected[alias] = row[fName] ?? row[fName.replace(/\./g, '_')] ?? null;
            });
            return projected;
          });
        }
      }

      // Handle ORDER BY
      if (orderByStr) {
        const orderMatch = orderByStr.trim().split(/\s+/);
        const orderField = orderMatch[0];
        const isDesc = orderMatch[1]?.toLowerCase() === "desc";

        workingSet.sort((a, b) => {
          const valA = a[orderField];
          const valB = b[orderField];
          if (valA === undefined || valB === undefined) return 0;
          const numA = Number(valA);
          const numB = Number(valB);

          if (!isNaN(numA) && !isNaN(numB)) {
            return isDesc ? numB - numA : numA - numB;
          } else {
            return isDesc 
              ? String(valB).localeCompare(String(valA)) 
              : String(valA).localeCompare(String(valB));
          }
        });
      }

      // Handle LIMIT
      if (limitStr) {
        const limitAmt = parseInt(limitStr, 10);
        if (!isNaN(limitAmt)) {
          workingSet = workingSet.slice(0, limitAmt);
        }
      }

      return workingSet;
    } catch (err: any) {
      throw new Error(`SQL Parsing Exception: ${err.message}`);
    }
  }

  // Runs safe browser evaluation of editable code file predictDowntimeRisk
  public runCustomPredictor(
    machine: Machine,
    allProduction: SqlProductionRecord[],
    allLogs: MongoFaultLog[]
  ): DowntimePredictionResult {
    const predictorFile = this.codeFiles.find(f => f.id === "downtime_predictor");
    const sqlFiltered = allProduction.filter(p => p.machine_id === machine.id);
    const mongoFiltered = allLogs.filter(l => l.machine_id === machine.id);

    if (!predictorFile) {
      return this.fallbackPredictor(machine, sqlFiltered, mongoFiltered);
    }

    try {
      // Isolate the core function inside typescript code using standard JS transpilation mapping
      // We look for everything inside the function body and convert to an eval function
      const code = predictorFile.code;
      
      // Basic transpiler: strip export commands and types so browser can execute it as plain ES5/ES6
      const cleanCode = code
        .replace(/export\s+function/g, 'function')
        .replace(/:\s*any/g, '')
        .replace(/:\s*string/g, '')
        .replace(/:\s*number/g, '')
        .replace(/:\s*boolean/g, '')
        .replace(/:\s*PlaygroundFile/g, '')
        .replace(/:\s*any\[\]/g, '')
        .replace(/:\s*string\[\]/g, '')
        .replace(/:\s*\{\s*riskScore.*?\}/gs, '');

      // Create function evaluator
      const runner = new Function('machine', 'sqlRecords', 'mongoLogs', `
        ${cleanCode}
        if (typeof predictDowntimeRisk === "function") {
          return predictDowntimeRisk(machine, sqlRecords, mongoLogs);
        } else {
          throw new Error("Could not locate predictDowntimeRisk function in file.");
        }
      `);

      const result = runner(machine, sqlFiltered, mongoFiltered);
      
      const activeFaults = mongoFiltered.filter(l => !l.repaired).length;
      const totalOutputs = sqlFiltered.reduce((sum, s) => sum + s.output_qty, 0);
      const scrap = sqlFiltered.reduce((sum, s) => sum + s.scrap_qty, 0);
      const efficiency = totalOutputs > 0 ? (totalOutputs / (totalOutputs + scrap)) * 100 : 96.5;

      return {
        machineId: machine.id,
        riskScore: result.riskScore ?? 10,
        predictedHoursToFailure: result.predictedHours ?? 168,
        primaryRiskFactor: result.riskFactor ?? "Optimized core state",
        criticalFaultCount: activeFaults,
        averageWeeklyEfficiency: Math.round(efficiency * 10) / 10,
        recommendation: result.recommendation ?? "System in nominal cycle status"
      };
    } catch (e: any) {
      console.warn("Prediction compilation failed. Falling back to default baseline logic: ", e.message);
      // Fallback
      return this.fallbackPredictor(machine, sqlFiltered, mongoFiltered, e.message);
    }
  }

  private fallbackPredictor(machine: Machine, sqlFiltered: SqlProductionRecord[], mongoFiltered: MongoFaultLog[], compilationErr?: string): DowntimePredictionResult {
    const activeFaults = mongoFiltered.filter(l => !l.repaired);
    const critical = activeFaults.filter(l => l.severity === 'critical').length;
    const warning = activeFaults.filter(l => l.severity === 'warning').length;

    let risk = 12 + (critical * 25) + (warning * 10);
    if (machine.status === 'fault') risk += 40;
    risk = Math.min(risk, 99);

    const totalOutputs = sqlFiltered.reduce((sum, s) => sum + s.output_qty, 0);
    const scrap = sqlFiltered.reduce((sum, s) => sum + s.scrap_qty, 0);
    const efficiency = totalOutputs > 0 ? (totalOutputs / (totalOutputs + scrap)) * 100 : 95;

    return {
      machineId: machine.id,
      riskScore: risk,
      predictedHoursToFailure: risk > 70 ? 12 : risk > 40 ? 48 : 140,
      primaryRiskFactor: compilationErr 
        ? `Compilation Warning: ${compilationErr}`
        : `${activeFaults.length} unresolved log fault warnings`,
      criticalFaultCount: activeFaults.length,
      averageWeeklyEfficiency: Math.round(efficiency * 10) / 10,
      recommendation: risk > 60 
        ? "Warning baseline exceeded. Reset sensor calibration immediately."
        : "Operational limits compliant. Basic visual watch schedule active."
    };
  }

  // Safe browser evaluation of analyzeVibrationAnomaly inside vibration_analyzer.ts file
  public runVibrationAnalyzer(machine: Machine, vibrationG: number): { triggerAnomaly: boolean; severity: 'info' | 'warning' | 'critical'; code: string; reason: string } {
    const file = this.codeFiles.find(f => f.id === "vibration_analyzer");
    if (!file) {
      return { triggerAnomaly: false, severity: 'info', code: 'W-VIB', reason: "Analyzer block deleted." };
    }

    try {
      const cleanCode = file.code
        .replace(/export\s+function/g, 'function')
        .replace(/:\s*any/g, '')
        .replace(/:\s*number/g, '')
        .replace(/:\s*boolean/g, '')
        .replace(/:\s*string/g, '')
        .replace(/:\s*\{\s*triggerAnomaly.*?\}/gs, '');

      const runner = new Function('machine', 'vibrationG', `
        ${cleanCode}
        if (typeof analyzeVibrationAnomaly === "function") {
          return analyzeVibrationAnomaly(machine, vibrationG);
        } else {
          throw new Error("analytical function not found");
        }
      `);

      return runner(machine, vibrationG);
    } catch (e: any) {
      // Static fallback
      const excess = vibrationG > 3.0;
      return {
        triggerAnomaly: excess,
        severity: vibrationG > 4.5 ? 'critical' : 'warning',
        code: 'E-VIB-ERR',
        reason: excess ? `Vibration ${vibrationG}g exceeds critical margin (Compilation Warning: ${e.message})` : "Telemetry reading normal"
      };
    }
  }
}
