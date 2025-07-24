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
// Node environment
exports.NODE_ENV = process.env.NODE_ENV || "development";
exports.isDevelopment = exports.NODE_ENV === "development";
exports.isProduction = exports.NODE_ENV === "production";
exports.isTest = exports.NODE_ENV === "test";
// Server settings
exports.PORT = process.env.PORT || 5000;
exports.HOST = process.env.HOST || "localhost";
// Rate limiting config
exports.RATE_LIMIT = {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
    MAX_REQUESTS: exports.isProduction
        ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300")
        : Number.MAX_SAFE_INTEGER,
    AUTH_MAX_REQUESTS: exports.isProduction
        ? parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "20")
        : Number.MAX_SAFE_INTEGER,
};
// 🔧 CORS configuration from .env (supports regex as /pattern/flags)
exports.CORS_ORIGINS = (() => {
    const rawOrigins = process.env.CORS_ORIGIN || "";
    return rawOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
        .map((origin) => {
        // If origin is a regex string like "/^http:\/\/localhost:\d+$/", convert to RegExp
        if (origin.startsWith("/") && origin.lastIndexOf("/") > 0) {
            const lastSlash = origin.lastIndexOf("/");
            const pattern = origin.slice(1, lastSlash);
            const flags = origin.slice(lastSlash + 1);
            try {
                return new RegExp(pattern, flags);
            }
            catch {
                console.warn(`Invalid RegExp in CORS_ORIGIN: ${origin}`);
                return origin;
            }
        }
        return origin;
    });
})();
// Logging for debug
console.log(`Environment: ${exports.NODE_ENV}`);
console.log(`Allowed CORS Origins:`, exports.CORS_ORIGINS);
if (exports.isDevelopment) {
    console.log("Development mode: Rate limiting is relaxed");
}
//# sourceMappingURL=environment.js.map