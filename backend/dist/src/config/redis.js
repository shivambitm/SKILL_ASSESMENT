"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheDel = exports.cacheSet = exports.cacheGet = exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
};
let client;
const connectRedis = async () => {
    try {
        // Skip Redis connection in development if REDIS_OPTIONAL is set
        if (process.env.NODE_ENV === "development" &&
            process.env.REDIS_OPTIONAL === "true") {
            console.log("Redis connection skipped in development mode");
            return;
        }
        client = (0, redis_1.createClient)({
            socket: {
                host: redisConfig.host,
                port: redisConfig.port,
            },
            password: redisConfig.password,
        });
        client.on("error", (err) => {
            console.log("Redis Client Error", err);
            // Don't crash the app in development
            if (process.env.NODE_ENV === "development") {
                console.log("Redis errors ignored in development mode");
                return;
            }
        });
        client.on("connect", () => {
            console.log("Redis connected successfully");
        });
        await client.connect();
    }
    catch (error) {
        console.error("Redis connection failed:", error);
        // In development, make Redis optional
        if (process.env.NODE_ENV === "development") {
            console.log("Continuing without Redis in development mode...");
            client = undefined; // Set to undefined so helper functions know Redis is unavailable
            return;
        }
        // In production, Redis failure should be handled more strictly
        throw error;
    }
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    return client;
};
exports.getRedisClient = getRedisClient;
const cacheGet = async (key) => {
    try {
        if (!client || !client.isOpen)
            return null;
        return await client.get(key);
    }
    catch (error) {
        console.error("Redis get error:", error);
        return null;
    }
};
exports.cacheGet = cacheGet;
const cacheSet = async (key, value, expireInSeconds = 3600) => {
    try {
        if (!client || !client.isOpen)
            return false;
        await client.setEx(key, expireInSeconds, value);
        return true;
    }
    catch (error) {
        console.error("Redis set error:", error);
        return false;
    }
};
exports.cacheSet = cacheSet;
const cacheDel = async (key) => {
    try {
        if (!client || !client.isOpen)
            return false;
        await client.del(key);
        return true;
    }
    catch (error) {
        console.error("Redis del error:", error);
        return false;
    }
};
exports.cacheDel = cacheDel;
//# sourceMappingURL=redis.js.map