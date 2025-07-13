# Redis in Your Application - How It Works

## What Redis Does in Your Application

Redis is an in-memory data structure store used as a cache and session store. In your application, it serves two main purposes:

### 1. **Caching** (Performance Optimization)

- Stores frequently accessed data in memory
- Reduces database queries
- Improves response times

### 2. **Session Management** (User Authentication)

- Stores user sessions
- Manages login states
- Handles rate limiting

## How Redis Works in Development vs Production

### Development Mode (Current Setup)

```env
REDIS_ENABLED=false
REDIS_OPTIONAL=true
NODE_ENV=development
```

**What happens:**

- Redis connection is skipped entirely
- Cache functions return null/false (graceful degradation)
- Application works without Redis
- Database queries happen every time (slower but functional)

### Production Mode

```env
REDIS_ENABLED=true
REDIS_OPTIONAL=false
NODE_ENV=production
REDIS_HOST=your-redis-server
REDIS_PORT=6379
```

**What happens:**

- Redis connection is required
- Cache functions store/retrieve data from Redis
- Database queries are cached
- Much faster response times

## Code Examples

### 1. Caching Questions (from questions.ts)

```typescript
// When getting questions, it first checks Redis cache
const cacheKey = "questions:all";
const cachedData = await cacheGet(cacheKey);

if (cachedData) {
  // Return cached data (fast)
  return res.json(JSON.parse(cachedData));
}

// If not in cache, query database
const questions = await db.query("SELECT * FROM questions");

// Store in cache for next time (expires in 1 hour)
await cacheSet(cacheKey, JSON.stringify(questions), 3600);
```

### 2. Reports Caching (from reports.ts)

```typescript
// Cache skill gaps report for 10 minutes
const cacheKey = "skill_gaps_report";
const cachedData = await cacheGet(cacheKey);

if (cachedData) {
  return res.json(JSON.parse(cachedData));
}

// Generate report from database
const report = await generateSkillGapsReport();

// Cache for 10 minutes (600 seconds)
await cacheSet(cacheKey, JSON.stringify(report), 600);
```

## Redis Configuration Explained

### Environment Variables

```env
REDIS_ENABLED=false     # Skip Redis entirely in development
REDIS_OPTIONAL=true     # Don't crash if Redis fails
REDIS_HOST=localhost    # Redis server address
REDIS_PORT=6379         # Redis server port
```

### Connection Logic

```typescript
// In redis.ts
export const connectRedis = async () => {
  try {
    // Skip Redis in development if REDIS_OPTIONAL is true
    if (
      process.env.NODE_ENV === "development" &&
      process.env.REDIS_OPTIONAL === "true"
    ) {
      console.log("Redis connection skipped in development mode");
      return;
    }

    // Create Redis client
    client = createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
    });

    // Handle errors gracefully in development
    client.on("error", (err) => {
      if (process.env.NODE_ENV === "development") {
        console.log("Redis errors ignored in development mode");
        return;
      }
    });

    await client.connect();
  } catch (error) {
    // In development, continue without Redis
    if (process.env.NODE_ENV === "development") {
      console.log("Continuing without Redis in development mode...");
      client = undefined;
      return;
    }
    throw error; // In production, this would crash the app
  }
};
```

## Cache Helper Functions

### 1. Get from Cache

```typescript
export const cacheGet = async (key: string) => {
  try {
    if (!client || !client.isOpen) return null; // No Redis = no cache
    return await client.get(key);
  } catch (error) {
    console.error("Redis get error:", error);
    return null; // Graceful degradation
  }
};
```

### 2. Set Cache

```typescript
export const cacheSet = async (
  key: string,
  value: string,
  expireInSeconds: number = 3600
) => {
  try {
    if (!client || !client.isOpen) return false; // No Redis = skip caching
    await client.setEx(key, expireInSeconds, value);
    return true;
  } catch (error) {
    console.error("Redis set error:", error);
    return false; // Graceful degradation
  }
};
```

### 3. Delete from Cache

```typescript
export const cacheDel = async (key: string) => {
  try {
    if (!client || !client.isOpen) return false; // No Redis = skip deletion
    await client.del(key);
    return true;
  } catch (error) {
    console.error("Redis del error:", error);
    return false; // Graceful degradation
  }
};
```

## Performance Impact

### Without Redis (Development)

- Every request hits the database
- Slower response times
- Higher database load
- Simple and reliable for development

### With Redis (Production)

- First request hits database, subsequent requests use cache
- Much faster response times (milliseconds vs seconds)
- Lower database load
- Better scalability

## Example Flow

### 1. First Request (Cold Cache)

```
Client -> API -> Check Redis Cache -> Cache Miss -> Database Query -> Store in Cache -> Return Data
```

### 2. Subsequent Requests (Warm Cache)

```
Client -> API -> Check Redis Cache -> Cache Hit -> Return Cached Data (fast!)
```

## When to Use Redis

### Use Redis For:

- Frequently accessed data (questions, user profiles)
- Expensive computations (reports, analytics)
- Session storage
- Rate limiting
- Real-time features

### Don't Use Redis For:

- Data that changes frequently
- Large datasets that don't fit in memory
- Critical data that can't be lost
- Simple applications with low traffic

## Current Status

With your current `.env` configuration:

- Redis is disabled in development
- Application works without Redis
- No more connection errors
- Cache functions return null/false gracefully
- Database queries happen every time (expected in development)

When you're ready for production, change `REDIS_ENABLED=true` and ensure Redis server is running.
