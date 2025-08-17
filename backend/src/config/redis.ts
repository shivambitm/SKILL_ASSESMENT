console.log('🚫 [Redis] Redis disabled - using in-memory caching');

// In-memory cache replacement for Redis
const cache = new Map<string, { value: string; expires: number }>();

export const connectRedis = async () => {
  console.log('✅ [Cache] In-memory cache initialized');
  return Promise.resolve();
};

export const getRedisClient = () => {
  return null;
};

export const cacheGet = async (key: string) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};

export const cacheSet = async (
  key: string,
  value: string,
  expireInSeconds: number = 3600
) => {
  cache.set(key, {
    value,
    expires: Date.now() + (expireInSeconds * 1000)
  });
  return true;
};

export const cacheDel = async (key: string) => {
  return cache.delete(key);
};

// Cleanup expired items periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expires) {
      cache.delete(key);
    }
  }
}, 60000); // Clean up every minute
