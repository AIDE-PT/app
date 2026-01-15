const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const uuid = require("uuid");

// eslint-disable-next-line no-undef
const dbPath = path.join(__dirname, "db.json");

// --- Helper Functions ---

function generateId() {
  return typeof uuid !== "undefined" && uuid.v4
    ? uuid.v4()
    : Date.now() + Math.random().toString();
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomFloat(min, max, decimals = 1) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
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
  const bpmVal = Math.round(getRealisticVariation(lastVal, 60, 100, 5));

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

  const systolic = Math.round(getRealisticVariation(lastSys, 110, 130, 4));
  const diastolic = Math.round(getRealisticVariation(lastDia, 70, 85, 3));

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
  const glycemiaVal = Math.round(getRealisticVariation(lastVal, 80, 120, 3));

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
  // O2 varies very little
  const o2Val = Math.round(getRealisticVariation(lastVal, 98, 99, 1));

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
  const tempVal = parseFloat(
    getRealisticVariation(lastVal, 36.0, 37.5, 0.2).toFixed(1),
  );

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
  const stressVal = Math.round(getRealisticVariation(lastVal, 10, 80, 5));

  data.stress.push({
    id: generateId(),
    value: stressVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "stress", stressVal);
  return stressVal;
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

// --- Server Management ---

function startJsonServer() {
  console.log("Starting JSON Server...");
  const serverProcess = spawn(
    "npx",
    ["json-server", "--watch", "db.json", "--port", "3000"],
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

// --- Main Simulation Loop ---

function runSimulationStep() {
  const data = readDatabase();
  if (!data) return;

  const timestamp = new Date().toISOString();

  const bpm = generateBPM(data, timestamp);
  const bp = generateBloodPressure(data, timestamp);
  const glycemia = generateGlycemia(data, timestamp);
  const o2 = generateO2(data, timestamp);
  const temp = generateTemperature(data, timestamp);
  const stress = generateStress(data, timestamp);

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
            Stress: ${stress}${sleepLog}`,
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
startSimulation(10000);

// Cleanup on exit
process.on("SIGINT", () => {
  serverProcess.kill();
  process.exit();
});
