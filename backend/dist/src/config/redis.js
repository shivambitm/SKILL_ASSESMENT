"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheDel = exports.cacheSet = exports.cacheGet = exports.getRedisClient = exports.connectRedis = void 0;
console.log('🚫 [Redis] Redis disabled - using in-memory caching');
// In-memory cache replacement for Redis
const cache = new Map();
const connectRedis = async () => {
    console.log('✅ [Cache] In-memory cache initialized');
    return Promise.resolve();
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    return null;
};
exports.getRedisClient = getRedisClient;
const cacheGet = async (key) => {
    const item = cache.get(key);
    if (!item)
        return null;
    if (Date.now() > item.expires) {
        cache.delete(key);
        return null;
    }
    return item.value;
};
exports.cacheGet = cacheGet;
const cacheSet = async (key, value, expireInSeconds = 3600) => {
    cache.set(key, {
        value,
        expires: Date.now() + (expireInSeconds * 1000)
    });
    return true;
};
exports.cacheSet = cacheSet;
const cacheDel = async (key) => {
    return cache.delete(key);
};
exports.cacheDel = cacheDel;
// Cleanup expired items periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, item] of cache.entries()) {
        if (now > item.expires) {
            cache.delete(key);
        }
    }
}, 60000); // Clean up every minute
//# sourceMappingURL=redis.js.map