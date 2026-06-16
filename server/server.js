const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const uuid = require("uuid");

// eslint-disable-next-line no-undef
const dbPath = path.join(__dirname, "db.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(__dirname, "..", ".env"));

// --- Helper Functions ---

function generateId() {
  return typeof uuid !== "undefined" && uuid.v4
    ? uuid.v4()
    : Date.now() + Math.random().toString();
}

function getRealisticVariation(currentValue, min, max, maxChange) {
  const change = (Math.random() * 2 - 1) * maxChange; // Random change between -maxChange and +maxChange
  let newValue = currentValue + change;

  // Tendency to return to mean (optional, but helps keep data centered)
  const mean = (min + max) / 2;
  newValue += (mean - newValue) * 0.1;

  // Clamp values
  if (newValue < min) newValue = min;
  if (newValue > max) newValue = max;

  return newValue;
}

// --- Database Operations ---

function readDatabase() {
  if (!fs.existsSync(dbPath)) {
    console.error("db.json not found!");
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    // Initialize arrays if missing
    if (!data.bpm) data.bpm = [];
    if (!data.bloodPressure) data.bloodPressure = [];
    if (!data.glycemia) data.glycemia = [];
    if (!data.sleep) data.sleep = [];
    if (!data.o2) data.o2 = [];
    if (!data.temperature) data.temperature = [];
    if (!data.stress) data.stress = [];
    if (!data.steps) data.steps = [];
    if (!data.alerts) data.alerts = [];

    // Initialize sleep history if empty
    if (data.sleep.length === 0) {
      initializeSleepHistory(data);
      // We need to save this immediately so stats are updated
      writeDatabase(data);
    }

    // Ensure stats objects exist but don't overwrite if they have valid data
    // If they look like defaults {min:0, max:0}, we might want to reset them or just let logic handle it.
    // However, creating them here with 0 causes issues for Min calculation.
    // We will let the generators create them if they are missing.

    return data;
  } catch (e) {
    console.error("Error reading db.json:", e);
    return null;
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing to db.json:", e);
  }
}

// --- Stats Helpers ---

function updateSimpleStats(data, key, value) {
  const statsKey = `${key}Stats`;
  if (!data[statsKey]) {
    data[statsKey] = { min: value, max: value };
  } else {
    data[statsKey].min = Math.min(data[statsKey].min, value);
    data[statsKey].max = Math.max(data[statsKey].max, value);
  }
}

function updateBPStats(data, systolic, diastolic) {
  const statsKey = "bloodPressureStats";
  if (!data[statsKey]) {
    data[statsKey] = {
      minSystolic: systolic,
      maxSystolic: systolic,
      minDiastolic: diastolic,
      maxDiastolic: diastolic,
    };
  } else {
    data[statsKey].minSystolic = Math.min(data[statsKey].minSystolic, systolic);
    data[statsKey].maxSystolic = Math.max(data[statsKey].maxSystolic, systolic);
    data[statsKey].minDiastolic = Math.min(
      data[statsKey].minDiastolic,
      diastolic,
    );
    data[statsKey].maxDiastolic = Math.max(
      data[statsKey].maxDiastolic,
      diastolic,
    );
  }
}

// --- Data Generators ---

function generateBPM(data, timestamp) {
  const lastVal =
    data.bpm.length > 0 ? data.bpm[data.bpm.length - 1].value : 75;

  // 15% chance to generate unsafe value
  const isUnsafe = Math.random() < 0.1;
  let bpmVal;

  if (isUnsafe) {
    // Generate unsafe BPM: either very high (>120) or very low (<50)
    bpmVal =
      Math.random() < 0.5
        ? Math.round(121 + Math.random() * 30) // High: 121-150
        : Math.round(35 + Math.random() * 14); // Low: 35-49
  } else {
    bpmVal = Math.round(getRealisticVariation(lastVal, 60, 100, 5));
  }

  data.bpm.push({
    id: generateId(),
    value: bpmVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "bpm", bpmVal);
  return bpmVal;
}

function generateBloodPressure(data, timestamp) {
  const lastSys =
    data.bloodPressure.length > 0
      ? data.bloodPressure[data.bloodPressure.length - 1].systolic
      : 120;
  const lastDia =
    data.bloodPressure.length > 0
      ? data.bloodPressure[data.bloodPressure.length - 1].diastolic
      : 80;

  // 15% chance to generate unsafe value
  const isUnsafe = Math.random() < 0.15;
  let systolic, diastolic;

  if (isUnsafe) {
    // Generate unsafe BP: either high (>140/90) or low (<90/60)
    if (Math.random() < 0.5) {
      // High BP
      systolic = Math.round(141 + Math.random() * 40); // 141-180
      diastolic = Math.round(91 + Math.random() * 20); // 91-110
    } else {
      // Low BP
      systolic = Math.round(70 + Math.random() * 19); // 70-89
      diastolic = Math.round(45 + Math.random() * 14); // 45-59
    }
  } else {
    systolic = Math.round(getRealisticVariation(lastSys, 110, 130, 4));
    diastolic = Math.round(getRealisticVariation(lastDia, 70, 85, 3));
  }

  data.bloodPressure.push({
    id: generateId(),
    systolic: systolic,
    diastolic: diastolic,
    timestamp: timestamp,
  });
  updateBPStats(data, systolic, diastolic);
  return { systolic, diastolic };
}

function generateGlycemia(data, timestamp) {
  const lastVal =
    data.glycemia.length > 0
      ? data.glycemia[data.glycemia.length - 1].value
      : 100;

  // 15% chance to generate unsafe value
  const isUnsafe = Math.random() < 0.15;
  let glycemiaVal;

  if (isUnsafe) {
    // Generate unsafe glycemia: either very high (>180) or very low (<70)
    glycemiaVal =
      Math.random() < 0.5
        ? Math.round(181 + Math.random() * 50) // High: 181-230
        : Math.round(45 + Math.random() * 24); // Low: 45-69
  } else {
    glycemiaVal = Math.round(getRealisticVariation(lastVal, 80, 120, 3));
  }

  data.glycemia.push({
    id: generateId(),
    value: glycemiaVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "glycemia", glycemiaVal);
  return glycemiaVal;
}

function generateO2(data, timestamp) {
  const lastVal = data.o2.length > 0 ? data.o2[data.o2.length - 1].value : 98;

  // 15% chance to generate unsafe value
  const isUnsafe = Math.random() < 0.15;
  let o2Val;

  if (isUnsafe) {
    // Generate unsafe O2: low (<95)
    o2Val = Math.round(90 + Math.random() * 4); // 90-94
  } else {
    // O2 varies very little
    o2Val = Math.round(getRealisticVariation(lastVal, 98, 99, 1));
  }

  data.o2.push({
    id: generateId(),
    value: o2Val,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "o2", o2Val);
  return o2Val;
}

function generateTemperature(data, timestamp) {
  const lastVal =
    data.temperature.length > 0
      ? data.temperature[data.temperature.length - 1].value
      : 36.5;

  // 15% chance to generate unsafe value
  const isUnsafe = Math.random() < 0.15;
  let tempVal;

  if (isUnsafe) {
    // Generate unsafe temperature: either high (>38) or low (<35)
    tempVal = parseFloat(
      (Math.random() < 0.5
        ? 38.1 + Math.random() * 2 // High: 38.1-40.1
        : 33.5 + Math.random() * 1.4
      ) // Low: 33.5-34.9
        .toFixed(1),
    );
  } else {
    tempVal = parseFloat(
      getRealisticVariation(lastVal, 36.0, 37.5, 1.0).toFixed(1),
    );
  }

  data.temperature.push({
    id: generateId(),
    value: tempVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "temperature", tempVal);
  return tempVal;
}

function generateStress(data, timestamp) {
  const lastVal =
    data.stress.length > 0 ? data.stress[data.stress.length - 1].value : 30;

  // 15% chance to generate unsafe value
  const isUnsafe = Math.random() < 0.15;
  let stressVal;

  if (isUnsafe) {
    // Generate unsafe stress: very high (>80)
    stressVal = Math.round(81 + Math.random() * 19); // 81-100
  } else {
    stressVal = Math.round(getRealisticVariation(lastVal, 10, 80, 5));
  }

  data.stress.push({
    id: generateId(),
    value: stressVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "stress", stressVal);
  return stressVal;
}

function generateSteps(data, timestamp) {
  const lastVal =
    data.steps.length > 0 ? data.steps[data.steps.length - 1].value : 8000;
  // Steps can vary more significantly
  const stepsVal = Math.round(getRealisticVariation(lastVal, 1000, 20000, 500));

  data.steps.push({
    id: generateId(),
    value: stepsVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "steps", stepsVal);
  return stepsVal;
}

function generateSleep(data, timestamp) {
  const lastVal =
    data.sleep.length > 0 ? data.sleep[data.sleep.length - 1].value : 7.5;
  // Sleep can vary by 1-2 hours, but usually stays around a person's average
  const sleepVal = parseFloat(
    getRealisticVariation(lastVal, 5.0, 9.0, 1.5).toFixed(1),
  );

  data.sleep.push({
    id: generateId(),
    value: sleepVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "sleep", sleepVal);
  return sleepVal;
}

function initializeSleepHistory(data) {
  const today = new Date();
  // Generate 7 days back
  for (let i = 7; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(7, 0, 0, 0); // Assume wake up at 7 AM
    generateSleep(data, d.toISOString());
  }
}

function maintainDataLimits(data, limit = 50) {
  if (data.bpm.length > limit) data.bpm.shift();
  if (data.bloodPressure.length > limit) data.bloodPressure.shift();
  if (data.glycemia.length > limit) data.glycemia.shift();
  if (data.o2.length > limit) data.o2.shift();
  if (data.temperature.length > limit) data.temperature.shift();
  if (data.stress.length > limit) data.stress.shift();
  // Sleep accumulates slowly (once a day), so 50 items is 50 days. Acceptable.
  if (data.sleep.length > limit) data.sleep.shift();
}

// --- Alert Generation ---

const ALERT_THRESHOLDS = {
  bpm: { high: 120, low: 50, unit: "BPM" },
  bloodPressure: {
    sysHigh: 140,
    diaHigh: 90,
    sysLow: 90,
    diaLow: 60,
    unit: "mmHg",
  },
  glycemia: { high: 180, low: 70, unit: "mg/dL" },
  o2: { low: 95, unit: "%" },
  temperature: { high: 38, low: 35, unit: "°C" },
  stress: { high: 80, unit: "pts" },
};

function checkAndCreateAlert(data, type, value, timestamp) {
  let alert = null;
  const thresholds = ALERT_THRESHOLDS[type];

  if (!thresholds) return null;

  switch (type) {
    case "bpm":
      if (value > thresholds.high) {
        alert = {
          type,
          message: `Ritmo cardíaco alto detetado: ${value} BPM`,
          severity: "high",
        };
      } else if (value < thresholds.low) {
        alert = {
          type,
          message: `Ritmo cardíaco baixo detetado: ${value} BPM`,
          severity: "medium",
        };
      }
      break;
    case "bloodPressure":
      const { systolic, diastolic } = value;
      if (systolic > thresholds.sysHigh || diastolic > thresholds.diaHigh) {
        alert = {
          type,
          message: `Pressão arterial alta: ${systolic}/${diastolic} mmHg`,
          severity: "high",
        };
      } else if (
        systolic < thresholds.sysLow ||
        diastolic < thresholds.diaLow
      ) {
        alert = {
          type,
          message: `Pressão arterial baixa: ${systolic}/${diastolic} mmHg`,
          severity: "medium",
        };
      }
      break;
    case "glycemia":
      if (value > thresholds.high) {
        alert = {
          type,
          message: `Glicemia alta: ${value} mg/dL`,
          severity: "high",
        };
      } else if (value < thresholds.low) {
        alert = {
          type,
          message: `Glicemia baixa: ${value} mg/dL`,
          severity: "high",
        };
      }
      break;
    case "o2":
      if (value < thresholds.low) {
        alert = {
          type,
          message: `Saturação de oxigénio baixa: ${value}%`,
          severity: "high",
        };
      }
      break;
    case "temperature":
      if (value > thresholds.high) {
        alert = {
          type,
          message: `Temperatura alta: ${value}°C`,
          severity: "medium",
        };
      } else if (value < thresholds.low) {
        alert = {
          type,
          message: `Temperatura baixa: ${value}°C`,
          severity: "medium",
        };
      }
      break;
    case "stress":
      if (value > thresholds.high) {
        alert = {
          type,
          message: `Nível de stress alto: ${value}`,
          severity: "low",
        };
      }
      break;
  }

  if (alert) {
    // Initialize alerts array if missing
    if (!data.alerts) {
      data.alerts = [];
    }

    const alertEntry = {
      id: generateId(),
      ...alert,
      timestamp: timestamp,
      read: false,
    };

    data.alerts.push(alertEntry);

    // Keep last 100 alerts
    if (data.alerts.length > 100) {
      data.alerts.shift();
    }

    console.log(`[ALERT] ${alert.message}`);
    return alertEntry;
  }

  return null;
}

// --- Server Management ---

function startJsonServer() {
  console.log("Starting JSON Server...");
  const serverProcess = spawn(
    "npx",
    [
      "json-server",
      "--watch",
      "db.json",
      "--port",
      "3000",
    ],
    {
      // eslint-disable-next-line no-undef
      cwd: __dirname,
      stdio: "inherit",
      shell: true,
    },
  );

  serverProcess.on("error", (err) => {
    console.error("Failed to start json-server:", err);
  });

  return serverProcess;
}

function startAiServer() {
  console.log("Starting AI Server...");
  const aiProcess = spawn("node", ["ai-server.js"], {
    // eslint-disable-next-line no-undef
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  aiProcess.on("error", (err) => {
    console.error("Failed to start AI server:", err);
  });

  return aiProcess;
}

// --- Main Simulation Loop ---

function runSimulationStep() {
  const data = readDatabase();
  if (!data) return;

  const timestamp = new Date().toISOString();

  const bpm = generateBPM(data, timestamp);
  checkAndCreateAlert(data, "bpm", bpm, timestamp);

  const bp = generateBloodPressure(data, timestamp);
  checkAndCreateAlert(data, "bloodPressure", bp, timestamp);

  const glycemia = generateGlycemia(data, timestamp);
  checkAndCreateAlert(data, "glycemia", glycemia, timestamp);

  const o2 = generateO2(data, timestamp);
  checkAndCreateAlert(data, "o2", o2, timestamp);

  const temp = generateTemperature(data, timestamp);
  checkAndCreateAlert(data, "temperature", temp, timestamp);

  const stress = generateStress(data, timestamp);
  checkAndCreateAlert(data, "stress", stress, timestamp);

  const steps = generateSteps(data, timestamp);

  // Daily Sleep Update Logic
  let sleepLog = "";
  const lastSleep =
    data.sleep.length > 0 ? data.sleep[data.sleep.length - 1] : null;
  const lastDate = lastSleep
    ? new Date(lastSleep.timestamp).toDateString()
    : null;
  const todayDate = new Date().toDateString();

  if (lastDate !== todayDate) {
    const sleep = generateSleep(data, timestamp);
    sleepLog = `, Sleep: ${sleep}h`;
  }

  maintainDataLimits(data);
  writeDatabase(data);

  console.log(
    `[${timestamp.slice(11, 19)}] Generated Data =>
            BPM: ${bpm}
            BP: ${bp.systolic}/${bp.diastolic}
            Glycemia: ${glycemia}
            O2: ${o2}%
            Temp: ${temp}°C
            Stress: ${stress}
            Steps: ${steps}${sleepLog}`,
  );
}

function startSimulation(intervalMs = 10000) {
  console.log(`Starting Data Simulation (${intervalMs / 1000}s interval)...`);

  // Run immediately
  runSimulationStep();

  // Set interval
  setInterval(runSimulationStep, intervalMs);
}

// --- Entry Point ---

const serverProcess = startJsonServer();
const aiProcess = startAiServer();
startSimulation(10000);

// Cleanup on exit
process.on("SIGINT", () => {
  serverProcess.kill();
  aiProcess.kill();
  process.exit();
});
