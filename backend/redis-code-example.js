// Redis Development Example - How Your App Works

// 1. Current Development Setup (No Redis)
// ====================================

// When you call questions endpoint:
// GET /api/questions

// What happens in questions.ts:
async function getQuestions() {
  // 1. Try to get from cache
  const cachedData = await cacheGet("questions:all");
  // Returns null because Redis is disabled

  if (cachedData) {
    // This never happens in development
    return JSON.parse(cachedData);
  }

  // 2. Always hits database in development
  const questions = await db.query("SELECT * FROM questions");

  // 3. Try to cache (does nothing in development)
  await cacheSet("questions:all", JSON.stringify(questions), 3600);
  // Returns false because Redis is disabled

  return questions;
}

// 2. Production Setup (With Redis)
// ===============================

// First request:
// GET /api/questions
// 1. cacheGet('questions:all') -> null (cache miss)
// 2. Database query -> results
// 3. cacheSet('questions:all', results, 3600) -> stored in Redis
// 4. Return results (slow - ~100ms)

// Second request (within 1 hour):
// GET /api/questions
// 1. cacheGet('questions:all') -> cached results (cache hit)
// 2. Skip database query
// 3. Return cached results (fast - ~5ms)

// 3. Practical Example with Your Current Code
// ==========================================

// From routes/questions.ts - Get all questions
router.get("/", async (req, res) => {
  try {
    // In development: always returns null
    // In production: returns cached data if available
    const cacheKey = "questions:all";
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      console.log("📦 Cache hit! Returning cached questions");
      return res.json(JSON.parse(cachedData));
    }

    console.log("💾 Cache miss! Querying database...");

    // Always happens in development
    const questions = await db.query(`
      SELECT q.*, s.name as skill_name 
      FROM questions q 
      JOIN skills s ON q.skill_id = s.id
    `);

    // In development: does nothing
    // In production: stores in cache for 1 hour
    await cacheSet(cacheKey, JSON.stringify(questions), 3600);

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

// 4. Cache Invalidation Example
// ===========================

// From routes/questions.ts - Create new question
router.post("/", async (req, res) => {
  try {
    // Create new question in database
    const result = await db.query(
      "INSERT INTO questions (title, skill_id) VALUES (?, ?)",
      [req.body.title, req.body.skill_id]
    );

    // Clear cache so next request gets fresh data
    // In development: does nothing
    // In production: removes cached questions
    await cacheDel("questions:*");

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: "Error creating question" });
  }
});

// 5. Reports Caching Example
// =========================

// From routes/reports.ts - Skill gaps report
router.get("/skill-gaps", async (req, res) => {
  try {
    const cacheKey = "skill_gaps_report";
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      console.log("📊 Returning cached skill gaps report");
      return res.json(JSON.parse(cachedData));
    }

    console.log("📈 Generating skill gaps report...");

    // Expensive database operations
    const skillGaps = await db.query(`
      SELECT 
        s.name as skill_name,
        COUNT(q.id) as total_questions,
        AVG(ua.score) as avg_score,
        COUNT(DISTINCT ua.user_id) as users_attempted
      FROM skills s
      LEFT JOIN questions q ON s.id = q.skill_id
      LEFT JOIN user_answers ua ON q.id = ua.question_id
      GROUP BY s.id, s.name
      ORDER BY avg_score ASC
    `);

    // Cache for 10 minutes (600 seconds)
    await cacheSet(cacheKey, JSON.stringify(skillGaps), 600);

    res.json(skillGaps);
  } catch (error) {
    res.status(500).json({ message: "Error generating report" });
  }
});

// 6. Testing Redis Behavior
// ========================

// To test Redis in development:
// 1. Install Redis: choco install redis-64
// 2. Start Redis: redis-server
// 3. Update .env:
//    REDIS_ENABLED=true
//    REDIS_OPTIONAL=false
// 4. Restart your app
// 5. Make requests and watch console logs

// 7. Performance Comparison
// ========================

// Without Redis (Current Development):
// Request 1: Database query (100ms)
// Request 2: Database query (100ms)
// Request 3: Database query (100ms)
// Total: 300ms

// With Redis (Production):
// Request 1: Database query + cache store (100ms)
// Request 2: Cache hit (5ms)
// Request 3: Cache hit (5ms)
// Total: 110ms (73% faster!)

// 8. Error Handling
// ================

// Your app gracefully handles Redis failures:
export const cacheGet = async (key: string) => {
  try {
    if (!client || !client.isOpen) {
      console.log("Redis not available, skipping cache");
      return null; // App continues without caching
    }
    return await client.get(key);
  } catch (error) {
    console.error("Redis error:", error);
    return null; // Graceful degradation
  }
};

// This means your app will:
// - Work perfectly without Redis
// - Be faster with Redis
// - Never crash due to Redis issues
// - Automatically fall back to database queries
