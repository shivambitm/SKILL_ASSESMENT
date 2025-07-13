#!/usr/bin/env node

/**
 * Professional Production Server Script
 * Enhanced terminal output for production deployment
 */

import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  rocket: "🚀",
  shield: "🛡",
  lightning: "⚡",
  server: "🖥",
  globe: "🌐",
  database: "🗄",
  clock: "⏱",
  check: "✓",
  warning: "⚠",
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

function printProductionHeader() {
  const line = "═".repeat(80);
  console.log(`${colors.green}${line}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.green}  ${symbols.rocket} SKILL ASSESSMENT PORTAL - PRODUCTION MODE${colors.reset}`
  );
  console.log(
    `${colors.dim}${colors.green}     High-Performance Production Deployment${colors.reset}`
  );
  console.log(
    `${colors.gray}     ${symbols.clock} Deployed at ${getTimestamp()}${
      colors.reset
    }`
  );
  console.log(`${colors.green}${line}${colors.reset}`);
  console.log("");
}

function logSystemInfo() {
  console.log(
    `${colors.cyan}${symbols.server} System Information:${colors.reset}`
  );
  console.log(`${colors.gray}     Node.js: ${process.version}${colors.reset}`);
  console.log(
    `${colors.gray}     Platform: ${process.platform} ${process.arch}${colors.reset}`
  );
  console.log(
    `${colors.gray}     Memory: ${Math.round(
      process.memoryUsage().heapUsed / 1024 / 1024
    )} MB${colors.reset}`
  );
  console.log("");
}

function checkBuildArtifacts() {
  console.log(
    `${colors.yellow}${symbols.shield} Pre-flight Checks:${colors.reset}`
  );

  // Check if frontend build exists
  const frontendBuild = fs.existsSync(join(__dirname, "..", "dist"));
  console.log(
    `${colors.gray}     Frontend Build: ${
      frontendBuild
        ? colors.green + symbols.check
        : colors.red + symbols.warning
    } ${frontendBuild ? "Ready" : "Missing"}${colors.reset}`
  );

  // Check if backend build exists
  const backendBuild = fs.existsSync(
    join(__dirname, "..", "backend", "dist")
  );
  console.log(
    `${colors.gray}     Backend Build: ${
      backendBuild ? colors.green + symbols.check : colors.red + symbols.warning
    } ${backendBuild ? "Ready" : "Missing"}${colors.reset}`
  );

  console.log("");

  if (!frontendBuild || !backendBuild) {
    console.log(
      `${colors.red}${symbols.warning} Build artifacts missing. Run 'npm run build' first.${colors.reset}`
    );
    process.exit(1);
  }
}

function logWithPrefix(prefix, color, data) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  const lines = data.toString().split("\n");
  lines.forEach((line) => {
    if (line.trim()) {
      console.log(
        `${colors.gray}[${timestamp}]${colors.reset} ${color}[${prefix}]${colors.reset} ${line}`
      );
    }
  });
}

function startProduction() {
  printProductionHeader();
  logSystemInfo();
  checkBuildArtifacts();

  console.log(
    `${colors.green}${symbols.lightning} Starting Production Servers:${colors.reset}`
  );
  console.log(
    `${colors.blue}${symbols.database} Backend API:${colors.reset} ${colors.bright}http://localhost:5002${colors.reset}`
  );
  console.log(
    `${colors.cyan}${symbols.globe} Frontend App:${colors.reset} ${colors.bright}http://localhost:4173${colors.reset}`
  );
  console.log("");
  console.log(`${colors.gray}Press Ctrl+C to stop all servers${colors.reset}`);
  console.log(`${colors.green}${"─".repeat(80)}${colors.reset}`);
  console.log("");

  // Start backend
  const backend = spawn("npm", ["run", "start"], {
    cwd: join(__dirname, "..", "backend"),
    stdio: "pipe",
    shell: true,
  });

  // Start frontend preview
  const frontend = spawn("npm", ["run", "preview"], {
    cwd: join(__dirname, ".."),
    stdio: "pipe",
    shell: true,
  });

  // Handle backend output
  backend.stdout.on("data", (data) => {
    logWithPrefix("API", colors.blue, data);
  });

  backend.stderr.on("data", (data) => {
    logWithPrefix("API", colors.red, data);
  });

  // Handle frontend output
  frontend.stdout.on("data", (data) => {
    logWithPrefix("WEB", colors.cyan, data);
  });

  frontend.stderr.on("data", (data) => {
    logWithPrefix("WEB", colors.yellow, data);
  });

  // Handle process exit
  process.on("SIGINT", () => {
    console.log("\n");
    console.log(
      `${colors.yellow}${symbols.shield} Gracefully shutting down production servers...${colors.reset}`
    );
    backend.kill();
    frontend.kill();
    setTimeout(() => process.exit(0), 1000);
  });

  backend.on("exit", (code) => {
    console.log(
      `${colors.red}API server exited with code ${code}${colors.reset}`
    );
  });

  frontend.on("exit", (code) => {
    console.log(
      `${colors.red}Web server exited with code ${code}${colors.reset}`
    );
  });
}

startProduction();
