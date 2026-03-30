#!/usr/bin/env node
import { spawn, execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.DEV_WATCHDOG_PORT ?? 3000);
const CHECK_URLS = [
  `http://127.0.0.1:${PORT}/`,
  `http://127.0.0.1:${PORT}/dashboard`,
];
const CHECK_INTERVAL_MS = Number(process.env.DEV_WATCHDOG_INTERVAL_MS ?? 5000);
const CHECK_TIMEOUT_MS = Number(process.env.DEV_WATCHDOG_TIMEOUT_MS ?? 12000);
const FAIL_THRESHOLD = Number(process.env.DEV_WATCHDOG_FAIL_THRESHOLD ?? 4);
const START_CMD = process.env.DEV_WATCHDOG_START_CMD ?? "npm run dev:only";
const LOCK_PATH = process.env.DEV_WATCHDOG_LOCK_PATH ?? path.join(process.cwd(), ".dev-watchdog.lock");

let child = null;
let failCount = 0;
let stopping = false;
let lockAcquired = false;

function log(...args) {
  console.log(`[dev-watchdog]`, ...args);
}

function processAlive(pid) {
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLockOrExit() {
  try {
    const existing = fs.readFileSync(LOCK_PATH, "utf8").trim();
    const pid = Number(existing);
    if (processAlive(pid)) {
      log(`another watchdog is already running (pid=${pid}); exiting`);
      process.exit(1);
    }
    // Stale lock file; continue and overwrite.
  } catch {
    // no lock file
  }

  fs.writeFileSync(LOCK_PATH, String(process.pid), { encoding: "utf8" });
  lockAcquired = true;
}

function releaseLock() {
  if (!lockAcquired) return;
  try {
    const current = fs.readFileSync(LOCK_PATH, "utf8").trim();
    if (Number(current) === process.pid) {
      fs.unlinkSync(LOCK_PATH);
    }
  } catch {
    // ignore
  }
  lockAcquired = false;
}

function spawnServer() {
  // Clear any stale listener before spawning a new server.
  try {
    execSync(`lsof -t -iTCP:${PORT} -sTCP:LISTEN | xargs -I {} kill -9 {} 2>/dev/null || true`, {
      stdio: "ignore",
    });
  } catch {
    // ignore
  }
  log(`starting: ${START_CMD}`);
  child = spawn(START_CMD, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    log(`server exited code=${code ?? "null"} signal=${signal ?? "null"}`);
    if (!stopping) {
      // Force immediate recovery loop.
      failCount = FAIL_THRESHOLD;
    }
  });
}

async function stopServer() {
  if (!child || child.exitCode !== null) return;
  log("stopping server...");
  child.kill("SIGTERM");
  await sleep(800);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
  // Wait for port release to avoid EADDRINUSE restart loops.
  for (let i = 0; i < 10; i++) {
    try {
      const out = execSync(`lsof -t -iTCP:${PORT} -sTCP:LISTEN || true`).toString().trim();
      if (!out) break;
    } catch {
      break;
    }
    await sleep(300);
  }
}

async function checkOne(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function healthCheck() {
  for (const url of CHECK_URLS) {
    const ok = await checkOne(url);
    if (!ok) return false;
  }
  return true;
}

async function main() {
  acquireLockOrExit();
  log(`watching port ${PORT}; interval=${CHECK_INTERVAL_MS}ms timeout=${CHECK_TIMEOUT_MS}ms`);
  spawnServer();

  while (!stopping) {
    await sleep(CHECK_INTERVAL_MS);
    const ok = await healthCheck();
    if (ok) {
      failCount = 0;
      continue;
    }

    failCount += 1;
    log(`health check failed (${failCount}/${FAIL_THRESHOLD})`);
    if (failCount < FAIL_THRESHOLD) continue;

    failCount = 0;
    await stopServer();
    spawnServer();
  }
}

process.on("SIGINT", async () => {
  stopping = true;
  await stopServer();
  releaseLock();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  stopping = true;
  await stopServer();
  releaseLock();
  process.exit(0);
});

main().catch(async (err) => {
  console.error(`[dev-watchdog] fatal`, err);
  stopping = true;
  await stopServer();
  releaseLock();
  process.exit(1);
});
