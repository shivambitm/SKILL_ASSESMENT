#!/usr/bin/env node

/**
 * Professional Development Server Script
 * Enhanced terminal output for development mode
 */

import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
  gear: "⚙",
  lightning: "⚡",
  computer: "💻",
  globe: "🌐",
  database: "🗄",
  clock: "⏱",
  check: "✅",
  error: "❌",
  warning: "⚠️",
};

// Track last messages to avoid duplicates
let lastMessages = new Map();

function getTimestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function printDevHeader() {
  const line = "═".repeat(80);
  console.log(`${colors.cyan}${line}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.cyan}  ${symbols.rocket} SKILL ASSESSMENT PORTAL - DEVELOPMENT MODE${colors.reset}`
  );
  console.log(
    `${colors.dim}${colors.cyan}     Full-Stack Development Environment${colors.reset}`
  );
  console.log(
    `${colors.gray}     ${symbols.clock} Started at ${getTimestamp()}${
      colors.reset
    }`
  );
  console.log(`${colors.cyan}${line}${colors.reset}`);
  console.log("");
  console.log(
    `${colors.green}${symbols.computer} Frontend Dev Server:${colors.reset} ${colors.bright}http://localhost:5173${colors.reset}`
  );
  console.log(
    `${colors.blue}${symbols.database} Backend API Server:${colors.reset} ${colors.bright}http://localhost:5002${colors.reset}`
  );
  console.log(
    `${colors.yellow}${symbols.lightning} Hot Reload:${colors.reset} ${colors.bright}Enabled${colors.reset}`
  );
  console.log("");
  console.log(`${colors.gray}Press Ctrl+C to stop all servers${colors.reset}`);
  console.log(`${colors.cyan}${"─".repeat(80)}${colors.reset}`);
  console.log("");
}

function logWithPrefix(prefix, color, data) {
  const timestamp = getTimestamp();
  const lines = data.toString().split("\n");

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Skip empty lines and repetitive npm/script output
    if (
      !trimmedLine ||
      trimmedLine.includes("> node scripts/dev.js") ||
      trimmedLine.includes("> skill-assessment-") ||
      trimmedLine.includes("> nodemon") ||
      trimmedLine.includes("> vite") ||
      trimmedLine.startsWith(">") ||
      trimmedLine === "[nodemon] 3.1.10" ||
      trimmedLine === "[nodemon] to restart at any time, enter `rs`" ||
      trimmedLine.includes("watching path(s):") ||
      trimmedLine.includes("VITE v")
    ) {
      return;
    }

    // Avoid duplicate consecutive messages
    const messageKey = `${prefix}:${trimmedLine}`;
    const now = Date.now();
    const lastTime = lastMessages.get(messageKey);

    if (lastTime && now - lastTime < 1000) {
      return; // Skip if same message within 1 second
    }

    lastMessages.set(messageKey, now);

    // Add appropriate symbols for different message types
    let symbol = "";
    if (trimmedLine.includes("Error:") || trimmedLine.includes("error")) {
      symbol = `${symbols.error} `;
      color = colors.red;
    } else if (
      trimmedLine.includes("warning") ||
      trimmedLine.includes("warn")
    ) {
      symbol = `${symbols.warning} `;
      color = colors.yellow;
    } else if (
      trimmedLine.includes("connected") ||
      trimmedLine.includes("started") ||
      trimmedLine.includes("ready")
    ) {
      symbol = `${symbols.check} `;
    }

    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ${color}[${prefix}]${colors.reset} ${symbol}${trimmedLine}`
    );
  });
}

function startDevelopment() {
  printDevHeader();

  // Start backend
  const backend = spawn("npm", ["run", "dev"], {
    cwd: join(__dirname, "..", "backend"),
    stdio: "pipe",
    shell: true,
  });

  // Start frontend
  const frontend = spawn("npm", ["run", "frontend:dev"], {
    cwd: join(__dirname, ".."),
    stdio: "pipe",
    shell: true,
  });

  // Handle backend output
  backend.stdout.on("data", (data) => {
    logWithPrefix("BACKEND", colors.blue, data);
  });

  backend.stderr.on("data", (data) => {
    const errorText = data.toString();
    if (errorText.includes("EADDRINUSE")) {
      console.log(
        `${colors.red}${symbols.error} Backend port 5002 is already in use!${colors.reset}`
      );
      console.log(
        `${colors.yellow}${symbols.warning} Please stop other backend processes or change the port${colors.reset}`
      );
    } else {
      logWithPrefix("BACKEND", colors.red, data);
    }
  });

  // Handle frontend output
  frontend.stdout.on("data", (data) => {
    logWithPrefix("FRONTEND", colors.green, data);
  });

  frontend.stderr.on("data", (data) => {
    logWithPrefix("FRONTEND", colors.yellow, data);
  });

  // Handle process exit
  process.on("SIGINT", () => {
    console.log("\n");
    console.log(
      `${colors.yellow}${symbols.gear} Shutting down development servers...${colors.reset}`
    );
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  backend.on("exit", (code) => {
    console.log(
      `${colors.red}Backend process exited with code ${code}${colors.reset}`
    );
  });

  frontend.on("exit", (code) => {
    console.log(
      `${colors.red}Frontend process exited with code ${code}${colors.reset}`
    );
  });
}

startDevelopment();
