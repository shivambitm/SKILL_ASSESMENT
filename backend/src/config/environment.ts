/**
 * Environment configuration utility
 * Centralizes environment variable handling
 */

import dotenv from "dotenv";
import { Router } from "express";
import { pool } from "../config/database";

// Load environment variables from .env file
dotenv.config();

// Node environment
export const NODE_ENV = process.env.NODE_ENV || "development";
export const isDevelopment = NODE_ENV === "development";
export const isProduction = NODE_ENV === "production";
export const isTest = NODE_ENV === "test";

// Server settings
export const PORT = process.env.PORT || 5000;
export const HOST = process.env.HOST || "localhost";

// Rate limiting config
export const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  MAX_REQUESTS: isProduction
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300")
    : Number.MAX_SAFE_INTEGER,
  AUTH_MAX_REQUESTS: isProduction
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "20")
    : Number.MAX_SAFE_INTEGER,
};

// 🔧 Fixed CORS configuration
export const CORS_ORIGINS = (() => {
  if (isDevelopment) {
    return [
      /^http:\/\/localhost:\d+$/, // Allow localhost:PORT
      /^http:\/\/127\.0\.0\.1:\d+$/, // Allow 127.0.0.1:PORT
      "http://localhost:5173",
    ];
  }

  // In production, parse comma-separated origins from .env
  const rawOrigins = process.env.CORS_ORIGIN || "";
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
})();

// Logging for debug
console.log(`Environment: ${NODE_ENV}`);
console.log(`Allowed CORS Origins:`, CORS_ORIGINS);
if (isDevelopment) {
  console.log("Development mode: Rate limiting is relaxed");
}
