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
      diastolic
    );
    data[statsKey].maxDiastolic = Math.max(
      data[statsKey].maxDiastolic,
      diastolic
    );
  }
}

// --- Data Generators ---

function generateBPM(data, timestamp) {
  const bpmVal = getRandomInt(60, 100);
  data.bpm.push({
    id: generateId(),
    value: bpmVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "bpm", bpmVal);
  return bpmVal;
}

function generateBloodPressure(data, timestamp) {
  const systolic = getRandomInt(110, 130);
  const diastolic = getRandomInt(70, 85);
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
  const glycemiaVal = getRandomInt(80, 120);
  data.glycemia.push({
    id: generateId(),
    value: glycemiaVal,
    timestamp: timestamp,
  });
  updateSimpleStats(data, "glycemia", glycemiaVal);
  return glycemiaVal;
}

function maintainDataLimits(data, limit = 50) {
  if (data.bpm.length > limit) data.bpm.shift();
  if (data.bloodPressure.length > limit) data.bloodPressure.shift();
  if (data.glycemia.length > limit) data.glycemia.shift();
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

  maintainDataLimits(data);
  writeDatabase(data);

  console.log(
    `[${timestamp}] New readings - BPM: ${bpm}, BP: ${bp.systolic}/${bp.diastolic}, Gly: ${glycemia}`
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
