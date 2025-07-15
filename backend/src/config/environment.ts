/**
 * Environment configuration utility
 * Centralizes environment variable handling
 */

import dotenv from "dotenv";
import { Router } from "express";
import { pool } from "../config/database";

// Load environment variables from .env file
dotenv.config();

// Node environment (development, production, test)
export const NODE_ENV = process.env.NODE_ENV || "development";
export const isDevelopment = NODE_ENV === "development";
export const isProduction = NODE_ENV === "production";
export const isTest = NODE_ENV === "test";

// Server settings
export const PORT = process.env.PORT || 5000;
export const HOST = process.env.HOST || "localhost";

// Rate limiting
export const RATE_LIMIT = {
  // In development, use very high limits (effectively disabled)
  // In production, use more restrictive limits
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
  MAX_REQUESTS: isProduction
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300")
    : Number.MAX_SAFE_INTEGER,
  AUTH_MAX_REQUESTS: isProduction
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "20")
    : Number.MAX_SAFE_INTEGER,
};

// CORS configuration
export const CORS_ORIGINS = (() => {
  if (isDevelopment) {
    // Allow all localhost origins in development for easier testing, including Vite dev server
    return [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      "http://localhost:5173",
    ];
  }
  return [
    process.env.CORS_ORIGIN || "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5002",
  ];
})();

// Log environment information
console.log(`Environment: ${NODE_ENV}`);
if (isDevelopment) {
  console.log("Development mode: Rate limiting is relaxed");
}

// ...existing config code only...
