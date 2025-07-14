import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Ensure client is properly typed and initialized
let client: ReturnType<typeof createClient> | undefined;

export const connectRedis = async () => {
  console.log("Connecting to Redis...");
  try {
    // Skip Redis connection in development if REDIS_OPTIONAL is set
    if (
      process.env.NODE_ENV === "development" &&
      process.env.REDIS_OPTIONAL === "true"
    ) {
      console.log("Redis connection skipped in development mode");
      return;
    }

    client = createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on("error", (err) => {
      console.error("Redis Client Error", err);
      // Don't crash the app in development
      if (process.env.NODE_ENV === "development") {
        console.log("Redis errors ignored in development mode");
        return;
      }
    });

    client.on("connect", () => {
      console.log("Redis connected successfully.");
    });

    await client.connect();
  } catch (error) {
    console.error("Redis connection failed:", error);

    // In development, make Redis optional
    if (process.env.NODE_ENV === "development") {
      console.log("Continuing without Redis in development mode...");
      client = undefined; // Mark client as unavailable
      return;
    }

    // In production, Redis failure should be handled more strictly
    throw error;
  }
};

export const getRedisClient = ():
  | ReturnType<typeof createClient>
  | undefined => {
  return client;
};

export const cacheGet = async (key: string) => {
  try {
    if (!client || !client.isOpen) return null;
    return await client.get(key);
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: string,
  expireInSeconds: number = 3600
) => {
  try {
    if (!client || !client.isOpen) return false;
    await client.setEx(key, expireInSeconds, value);
    return true;
  } catch (error) {
    console.error("Redis set error:", error);
    return false;
  }
};

export const cacheDel = async (key: string) => {
  try {
    if (!client || !client.isOpen) return false;
    await client.del(key);
    return true;
  } catch (error) {
    console.error("Redis del error:", error);
    return false;
  }
};
