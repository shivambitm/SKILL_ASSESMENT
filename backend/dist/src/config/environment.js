"use strict";
/**
 * Environment configuration utility
 * Centralizes environment variable handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORS_ORIGINS = exports.RATE_LIMIT = exports.HOST = exports.PORT = exports.isTest = exports.isProduction = exports.isDevelopment = exports.NODE_ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Node environment (development, production, test)
exports.NODE_ENV = process.env.NODE_ENV || "development";
exports.isDevelopment = exports.NODE_ENV === "development";
exports.isProduction = exports.NODE_ENV === "production";
exports.isTest = exports.NODE_ENV === "test";
// Server settings
exports.PORT = process.env.PORT || 5002;
exports.HOST = process.env.HOST || "localhost";
// Rate limiting
exports.RATE_LIMIT = {
    // In development, use very high limits (effectively disabled)
    // In production, use more restrictive limits
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
    MAX_REQUESTS: exports.isDevelopment
        ? 10000
        : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300"),
    AUTH_MAX_REQUESTS: exports.isDevelopment
        ? 10000
        : parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "20"),
};
// CORS configuration
exports.CORS_ORIGINS = (() => {
    if (exports.isDevelopment) {
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
console.log(`Environment: ${exports.NODE_ENV}`);
if (exports.isDevelopment) {
    console.log("Development mode: Rate limiting is relaxed");
}
// ...existing config code only...
//# sourceMappingURL=environment.js.map