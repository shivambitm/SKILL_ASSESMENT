#!/usr/bin/env node

/**
 * System Health Check & Status Script
 * Professional monitoring and diagnostics
 */

import { execSync } from "child_process";
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const http = require("http");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

const symbols = {
  check: "✓",
  cross: "✗",
  warning: "⚠",
  info: "ℹ",
  rocket: "🚀",
  gear: "⚙",
  monitor: "📊",
  database: "🗄",
  globe: "🌐",
  shield: "🛡",
  clock: "⏱",
};

function getTimestamp() {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function printStatusHeader() {
  const line = "═".repeat(80);
  console.log(`${colors.magenta}${line}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.magenta}  ${symbols.monitor} SKILL ASSESSMENT PORTAL - SYSTEM STATUS${colors.reset}`
  );
  console.log(
    `${colors.dim}${colors.magenta}     Health Check & Diagnostic Report${colors.reset}`
  );
  console.log(
    `${colors.gray}     ${symbols.clock} ${getTimestamp()}${colors.reset}`
  );
  console.log(`${colors.magenta}${line}${colors.reset}`);
  console.log("");
}

function checkStatus(name, condition, details = "") {
  const status = condition
    ? `${colors.green}${symbols.check} ONLINE${colors.reset}`
    : `${colors.red}${symbols.cross} OFFLINE${colors.reset}`;

  console.log(`${colors.cyan}${name}:${colors.reset} ${status}`);
  if (details) {
    console.log(`${colors.gray}     ${details}${colors.reset}`);
  }
}

async function checkEndpoint(url, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      resolve({ success: true, status: res.statusCode });
    });

    req.on("error", () => resolve({ success: false }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ success: false });
    });
  });
}

async function runHealthCheck() {
  printStatusHeader();

  console.log(
    `${colors.blue}${symbols.gear} System Components:${colors.reset}`
  );
  console.log("");

  // Check Node.js
  const nodeVersion = process.version;
  checkStatus("Node.js Runtime", true, `Version ${nodeVersion}`);

  // Check npm
  try {
    const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim();
    checkStatus("NPM Package Manager", true, `Version ${npmVersion}`);
  } catch {
    checkStatus("NPM Package Manager", false, "Not available");
  }

  // Check dependencies
  const packageJsonExists = fs.existsSync(
    join(__dirname, "..", "package.json")
  );
  const nodeModulesExists = fs.existsSync(
    join(__dirname, "..", "node_modules")
  );
  checkStatus(
    "Frontend Dependencies",
    packageJsonExists && nodeModulesExists,
    nodeModulesExists ? "Installed" : "Run npm install"
  );

  const backendPackageExists = fs.existsSync(
    join(__dirname, "..", "backend", "package.json")
  );
  const backendNodeModulesExists = fs.existsSync(
    join(__dirname, "..", "backend", "node_modules")
  );
  checkStatus(
    "Backend Dependencies",
    backendPackageExists && backendNodeModulesExists,
    backendNodeModulesExists ? "Installed" : "Run npm install in backend/"
  );

  console.log("");
  console.log(
    `${colors.yellow}${symbols.database} Build Artifacts:${colors.reset}`
  );
  console.log("");

  // Check build files
  const frontendBuild = fs.existsSync(path.join(__dirname, "..", "dist"));
  checkStatus(
    "Frontend Build",
    frontendBuild,
    frontendBuild ? "Ready for deployment" : "Run npm run build"
  );

  const backendBuild = fs.existsSync(
    path.join(__dirname, "..", "backend", "dist")
  );
  checkStatus(
    "Backend Build",
    backendBuild,
    backendBuild ? "Ready for deployment" : "Run npm run build"
  );

  // Check database
  const dbExists = fs.existsSync(
    path.join(__dirname, "..", "backend", "skill_assessment.db")
  );
  checkStatus(
    "SQLite Database",
    dbExists,
    dbExists ? "Database file present" : "Run npm run seed"
  );

  console.log("");
  console.log(
    `${colors.green}${symbols.globe} Network Services:${colors.reset}`
  );
  console.log("");

  // Check backend API
  console.log(`${colors.gray}     Checking backend API...${colors.reset}`);
  const backendHealth = await checkEndpoint(
    "http://localhost:5002/api/auth/test"
  );
  checkStatus(
    "Backend API (Port 5002)",
    backendHealth.success,
    backendHealth.success ? `HTTP ${backendHealth.status}` : "Not responding"
  );

  // Check frontend dev server
  console.log(`${colors.gray}     Checking frontend server...${colors.reset}`);
  const frontendHealth = await checkEndpoint("http://localhost:5173");
  checkStatus(
    "Frontend Dev Server (Port 5173)",
    frontendHealth.success,
    frontendHealth.success ? `HTTP ${frontendHealth.status}` : "Not responding"
  );

  console.log("");
  console.log(
    `${colors.cyan}${symbols.shield} Security & Environment:${colors.reset}`
  );
  console.log("");

  // Check environment file
  const envExists = fs.existsSync(
    path.join(__dirname, "..", "backend", ".env")
  );
  checkStatus(
    "Environment Configuration",
    envExists,
    envExists ? "Environment variables loaded" : "Create .env file"
  );

  // Memory usage
  const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  checkStatus("Memory Usage", memUsage < 500, `${memUsage} MB heap used`);

  console.log("");
  console.log(`${colors.magenta}${"═".repeat(80)}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.magenta}  ${symbols.info} System Status Check Complete${colors.reset}`
  );
  console.log(`${colors.magenta}${"═".repeat(80)}${colors.reset}`);
}

runHealthCheck().catch(console.error);
