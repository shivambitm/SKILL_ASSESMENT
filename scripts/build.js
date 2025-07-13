#!/usr/bin/env node

/**
 * Professional Build Script for Skill Assessment Portal
 * Provides enhanced terminal output with timestamps and technical styling
 */

import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for professional styling
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
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgRed: "\x1b[41m",
};

// Professional symbols
const symbols = {
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "ℹ",
  rocket: "🚀",
  gear: "⚙",
  lightning: "⚡",
  sparkles: "✨",
  hammer: "🔨",
  package: "📦",
  clock: "⏱",
  target: "🎯",
};

// Get current timestamp
function getTimestamp() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Professional header
function printHeader(title, subtitle = "") {
  const timestamp = getTimestamp();
  const line = "═".repeat(80);

  console.log(`${colors.cyan}${line}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.cyan}  ${symbols.rocket} ${title}${colors.reset}`
  );
  if (subtitle) {
    console.log(`${colors.dim}${colors.cyan}     ${subtitle}${colors.reset}`);
  }
  console.log(
    `${colors.gray}     ${symbols.clock} ${timestamp}${colors.reset}`
  );
  console.log(`${colors.cyan}${line}${colors.reset}`);
  console.log("");
}

// Professional step logging
function logStep(step, description) {
  console.log(
    `${colors.blue}${symbols.gear} [STEP ${step}]${colors.reset} ${colors.bright}${description}${colors.reset}`
  );
}

// Success message
function logSuccess(message) {
  console.log(`${colors.green}${symbols.success} ${message}${colors.reset}`);
}

// Error message
function logError(message) {
  console.log(`${colors.red}${symbols.error} ${message}${colors.reset}`);
}

// Info message
function logInfo(message) {
  console.log(`${colors.yellow}${symbols.info} ${message}${colors.reset}`);
}

// Professional footer
function printFooter(success = true) {
  const timestamp = getTimestamp();
  const line = "═".repeat(80);

  console.log("");
  console.log(`${colors.cyan}${line}${colors.reset}`);
  if (success) {
    console.log(
      `${colors.green}  ${symbols.sparkles} BUILD COMPLETED SUCCESSFULLY${colors.reset}`
    );
  } else {
    console.log(`${colors.red}  ${symbols.error} BUILD FAILED${colors.reset}`);
  }
  console.log(
    `${colors.gray}     ${symbols.clock} Finished at ${timestamp}${colors.reset}`
  );
  console.log(`${colors.cyan}${line}${colors.reset}`);
}

// Execute command with enhanced output
function execCommand(command, description, cwd = process.cwd()) {
  try {
    logStep("EXEC", `${description}`);
    console.log(`${colors.gray}     └─ ${command}${colors.reset}`);

    const startTime = Date.now();
    execSync(command, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, FORCE_COLOR: "1" },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logSuccess(`${description} completed in ${duration}s`);
    console.log("");
  } catch (error) {
    logError(`${description} failed`);
    console.log(`${colors.red}     ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Main build function
function build() {
  printHeader(
    "SKILL ASSESSMENT PORTAL - BUILD SYSTEM",
    "Full-Stack TypeScript Application Build Pipeline"
  );

  logInfo("Initializing build environment...");
  console.log(
    `${colors.gray}     Project: Skill Assessment & Reporting Portal${colors.reset}`
  );
  console.log(
    `${colors.gray}     Stack: React + TypeScript + Node.js + Express${colors.reset}`
  );
  console.log(
    `${colors.gray}     Database: SQLite with MySQL compatibility${colors.reset}`
  );
  console.log("");

  // Backend build
  logStep("1/2", "Building Backend Services");
  execCommand("npx tsc", "Backend TypeScript compilation", "./backend");

  // Frontend build
  logStep("2/2", "Building Frontend Application");
  execCommand("npx vite build", "Frontend React application build");

  printFooter(true);
}

// Development mode with enhanced output
function dev() {
  printHeader(
    "SKILL ASSESSMENT PORTAL - DEVELOPMENT MODE",
    "Full-Stack Development Server with Hot Reload"
  );

  logInfo("Starting development environment...");
  console.log(
    `${colors.gray}     Frontend: http://localhost:5173${colors.reset}`
  );
  console.log(
    `${colors.gray}     Backend API: http://localhost:5002${colors.reset}`
  );
  console.log(`${colors.gray}     Hot Reload: Enabled${colors.reset}`);
  console.log("");

  execCommand(
    'concurrently "npm run backend:dev" "npm run frontend:dev"',
    "Development servers"
  );
}

// Get command line argument
const command = process.argv[2];

switch (command) {
  case "build":
    build();
    break;
  case "dev":
    dev();
    break;
  default:
    console.log(
      `${colors.yellow}Usage: node scripts/build.js [build|dev]${colors.reset}`
    );
    process.exit(1);
}
