import { createClient } from "redis";
export declare const connectRedis: () => Promise<void>;
export declare const getRedisClient: () => ReturnType<typeof createClient> | undefined;
export declare const cacheGet: (key: string) => Promise<string | null>;
export declare const cacheSet: (key: string, value: string, expireInSeconds?: number) => Promise<boolean>;
export declare const cacheDel: (key: string) => Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map