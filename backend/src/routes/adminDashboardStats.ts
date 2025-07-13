import express from "express";
import { pool } from "../config/database";

const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    // Total users (non-admin, active)
    const [userRows]: any = await pool.execute(
      `SELECT COUNT(*) as total_users FROM users WHERE is_active = true AND role = 'user'`
    );
    const totalUsers = userRows[0]?.total_users || 0;

    // Total quizzes (all quiz attempts)
    const [quizRows]: any = await pool.execute(
      `SELECT COUNT(*) as total_quizzes FROM quiz_attempts WHERE completed_at IS NOT NULL`
    );
    const totalQuizzes = quizRows[0]?.total_quizzes || 0;

    // Average score (across all quiz attempts)
    const [scoreRows]: any = await pool.execute(
      `SELECT AVG(score_percentage) as avg_score FROM quiz_attempts WHERE completed_at IS NOT NULL`
    );
    const avgScore = scoreRows[0]?.avg_score
      ? Math.round(scoreRows[0].avg_score * 100) / 100
      : 0;

    res.json({
      totalUsers,
      totalQuizzes,
      avgScore,
    });
  } catch (err) {
    console.error("Error in /summary:", err);
    res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
});

export default router;

// GET /api/admin/quiz-stats
router.get("/quiz-stats", async (req, res) => {
  try {
    // Get all users' quiz stats, pick 10 random
    const [rows]: any = await pool.execute(
      `SELECT qa.id, u.first_name, u.last_name, u.username, s.name as skill_name, qa.score, qa.score_percentage, qa.completed_at
       FROM quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       JOIN skills s ON qa.skill_id = s.id
       WHERE qa.completed_at IS NOT NULL
       ORDER BY RANDOM()
       LIMIT 10`
    );
    res.json({ stats: rows });
  } catch (err) {
    console.error("Error in /quiz-stats:", err);
    res.status(500).json({ message: "Failed to fetch quiz stats" });
  }
});

// GET /api/admin/recent-quizzes
router.get("/recent-quizzes", async (req, res) => {
  try {
    // Check if there is any data
    const [quizRows]: any = await pool.execute(
      "SELECT COUNT(*) as total FROM quiz_attempts"
    );
    const totalQuizzes = quizRows[0]?.total || 0;
    if (totalQuizzes === 0) {
      // Demo random data
      const demoNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
      const demoSkills = ["React", "Node.js", "Python", "HTML", "CSS", "SQL"];
      const now = Date.now();
      const recent = Array.from({ length: 10 }).map((_, i) => {
        const idx = Math.floor(Math.random() * demoNames.length);
        const skillIdx = Math.floor(Math.random() * demoSkills.length);
        return {
          id: i + 1,
          username: demoNames[idx].toLowerCase(),
          name: demoNames[idx],
          skill_name: demoSkills[skillIdx],
          score: Math.floor(Math.random() * 100),
          total_questions: 10,
          percentage: Math.floor(Math.random() * 100),
          created_at: new Date(now - i * 1000 * 60 * 60).toISOString(),
        };
      });
      res.json({ recent });
      return;
    }
    // ...existing code for real data...
    const [rows]: any = await pool.execute(
      `SELECT qa.id, qa.score, qa.created_at, u.username, u.name, s.name as skill_name, qa.total_questions FROM quiz_attempts qa JOIN users u ON qa.user_id = u.id JOIN skills s ON qa.skill_id = s.id ORDER BY qa.created_at DESC LIMIT 20`
    );
    // Add percentage
    const recent = rows.map((r: any) => ({
      ...r,
      percentage: r.total_questions ? (r.score / r.total_questions) * 100 : 0,
    }));
    res.json({ recent });
  } catch (err) {
    console.error("Error in /recent-quizzes:", err);
    res.status(500).json({ message: "Failed to fetch recent quizzes" });
  }
});

// GET /api/admin/skill-performance
router.get("/skill-performance", async (req, res) => {
  try {
    // Check if there is any data
    const [quizRows]: any = await pool.execute(
      "SELECT COUNT(*) as total FROM quiz_attempts"
    );
    const totalQuizzes = quizRows[0]?.total || 0;
    if (totalQuizzes === 0) {
      // Demo random data
      const demoSkills = ["React", "Node.js", "Python", "HTML", "CSS", "SQL"];
      const skills = demoSkills.map((name, i) => ({
        id: i + 1,
        name,
        times_taken: Math.floor(Math.random() * 50) + 1,
      }));
      res.json({ skills });
      return;
    }
    // ...existing code for real data...
    const [rows]: any = await pool.execute(
      `SELECT s.id, s.name, COUNT(qa.id) as times_taken FROM skills s LEFT JOIN quiz_attempts qa ON qa.skill_id = s.id GROUP BY s.id, s.name ORDER BY times_taken DESC`
    );
    res.json({ skills: rows });
  } catch (err) {
    console.error("Error in /skill-performance:", err);
    res.status(500).json({ message: "Failed to fetch skill performance" });
  }
});

// GET /api/admin/performance-trend
router.get("/performance-trend", async (req, res) => {
  try {
    // Check if there is any data
    const [quizRows]: any = await pool.execute(
      "SELECT COUNT(*) as total FROM quiz_attempts"
    );
    const totalQuizzes = quizRows[0]?.total || 0;
    if (totalQuizzes === 0) {
      // Demo random data
      const demoNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
      const now = Date.now();
      const trend = Array.from({ length: 20 }).map((_, i) => {
        const idx = Math.floor(Math.random() * demoNames.length);
        return {
          username: demoNames[idx].toLowerCase(),
          score: Math.floor(Math.random() * 100),
          created_at: new Date(now - i * 1000 * 60 * 30).toISOString(),
        };
      });
      res.json({ trend });
      return;
    }
    // ...existing code for real data...
    // For demo: last 30 quiz completions by time
    const [rows]: any = await pool.execute(
      `SELECT qa.created_at, qa.score, u.username FROM quiz_attempts qa JOIN users u ON qa.user_id = u.id ORDER BY qa.created_at DESC LIMIT 30`
    );
    res.json({ trend: rows });
  } catch (err) {
    console.error("Error in /performance-trend:", err);
    res.status(500).json({ message: "Failed to fetch performance trend" });
  }
});

// --- ADMIN ANALYTICS: ALL USERS' QUIZ HISTORY ---
// GET /api/admin/all-quiz-history
router.get("/all-quiz-history", async (req, res) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT qa.id, qa.user_id, u.first_name, u.last_name, u.email, u.username, qa.skill_id, s.name as skill_name, qa.score, qa.score_percentage, qa.correct_answers, qa.total_questions, qa.time_taken, qa.completed_at
       FROM quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       JOIN skills s ON qa.skill_id = s.id
       ORDER BY qa.completed_at DESC, qa.id DESC
       LIMIT 100`
    );
    res.json({ history: rows });
  } catch (err) {
    console.error("Error in /all-quiz-history:", err);
    res.status(500).json({ message: "Failed to fetch all quiz history" });
  }
});

// --- ADMIN ANALYTICS: TOPPER QUIZ RESULTS ---
// GET /api/admin/topper-quiz-results
router.get("/topper-quiz-results", async (req, res) => {
  try {
    // Only users who scored 100% (all answers correct)
    const [rows]: any = await pool.execute(
      `SELECT qa.id, qa.user_id, u.first_name, u.last_name, u.email, u.username, qa.skill_id, s.name as skill_name, qa.score, qa.score_percentage, qa.correct_answers, qa.total_questions, qa.time_taken, qa.completed_at
       FROM quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       JOIN skills s ON qa.skill_id = s.id
       WHERE qa.completed_at IS NOT NULL AND qa.score_percentage = 100
       ORDER BY qa.completed_at DESC
       LIMIT 20`
    );
    res.json({ toppers: rows });
  } catch (err) {
    console.error("Error in /topper-quiz-results:", err);
    res.status(500).json({ message: "Failed to fetch topper quiz results" });
  }
});
