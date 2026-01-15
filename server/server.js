const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const uuid = require("uuid");

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dbPath = path.join(__dirname, "db.json");

// 1. Start JSON Server
// We use npx to ensure we find the installed binary.
// CWD is set to __dirname so it finds db.json easily.
console.log("Starting JSON Server...");
const serverProcess = spawn(
  "npx",
  ["json-server", "--watch", "db.json", "--port", "3000"],
  {
    cwd: __dirname,
    stdio: "inherit",
    shell: true, // Helpful for npx resolution on some systems
  },
);

serverProcess.on("error", (err) => {
  console.error("Failed to start json-server:", err);
});

// 2. Simulate Data Stream
console.log("Starting Data Simulation (10s interval)...");

function simulateData() {
  try {
    // Read current DB
    if (!fs.existsSync(dbPath)) {
      console.error("db.json not found!");
      return;
    }
    const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    // Initialize if missing
    if (!Array.isArray(data.healthData)) {
      data.healthData = [];
    }

    // Generate new reading
    const newReading = {
      id: uuid.v4(),
      bpm: Math.floor(Math.random() * (100 - 80 + 1) + 80), // 80-100 BPM
      timestamp: new Date().toISOString(),
    };

    // Add and trim
    data.healthData.push(newReading);
    if (data.healthData.length > 50) {
      // Keep last 50exists
      data.healthData.shift();
    }

    // Write back
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log(
      `[${newReading.timestamp}] added reading: ${newReading.bpm} BPM`,
    );
  } catch (err) {
    console.error("Simulation error:", err);
  }
}

// Run immediately and then interval
simulateData();
setInterval(simulateData, 10000); // 10s

// Clean up on exit
process.on("SIGINT", () => {
  serverProcess.kill();
  process.exit();
});
