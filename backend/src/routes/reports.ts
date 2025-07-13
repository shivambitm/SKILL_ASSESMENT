import express from "express";
import { pool } from "../config/database";
import { authenticate, authorize } from "../middleware/auth";
import { cacheGet, cacheSet } from "../config/redis";

const router = express.Router();

// Quiz usage stats for admin dashboard
router.get(
  "/quiz-usage",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      // Recent quiz attempts with user and skill info
      const [recent] = await pool.execute(`
      SELECT qa.id, u.first_name || ' ' || u.last_name as username, s.name as skill_name, qa.score_percentage as percentage, qa.completed_at as created_at
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      JOIN skills s ON qa.skill_id = s.id
      WHERE qa.completed_at IS NOT NULL
      ORDER BY qa.completed_at DESC
      LIMIT 20
    `);

      // Skill performance: how many times each skill was taken
      const [skills] = await pool.execute(`
      SELECT s.id, s.name, COUNT(qa.id) as times_taken
      FROM skills s
      LEFT JOIN quiz_attempts qa ON qa.skill_id = s.id AND qa.completed_at IS NOT NULL
      GROUP BY s.id, s.name
      ORDER BY times_taken DESC
    `);

      // Performance trend: last 10 attempts
      const [trend] = await pool.execute(`
      SELECT u.first_name || ' ' || u.last_name as username, qa.score_percentage as score, qa.completed_at as created_at
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      WHERE qa.completed_at IS NOT NULL
      ORDER BY qa.completed_at DESC
      LIMIT 10
    `);

      res.json({
        recent,
        skills,
        trend,
      });
    } catch (err) {
      console.error("Quiz usage error:", err);
      res.status(500).json({
        message: "Failed to fetch quiz usage",
        error:
          err && typeof err === "object" && "message" in err
            ? (err as any).message
            : String(err),
      });
    }
  }
);

// Get user performance report
/**
 * @swagger
 * /reports/user/{userId}:
 *   get:
 *     summary: Get user performance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [all, week, month]
 *         description: Time period for report
 *     responses:
 *       200:
 *         description: User performance report
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const period = (req.query.period as string) || "all"; // all, week, month

    // Check if user can access this report
    if (req.user!.role !== "admin" && req.user!.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if user exists
    const [userCheck] = await pool.execute(
      "SELECT id, first_name, last_name, email FROM users WHERE id = ?",
      [userId]
    );

    if ((userCheck as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = (userCheck as any[])[0];

    // Build date filter
    let dateFilter = "";
    if (period === "week") {
      dateFilter = "AND qa.completed_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
    } else if (period === "month") {
      dateFilter = "AND qa.completed_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    }

    // Get overall statistics
    const [overallStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_quizzes,
        AVG(score_percentage) as avg_score,
        MAX(score_percentage) as best_score,
        MIN(score_percentage) as worst_score,
        SUM(correct_answers) as total_correct,
        SUM(total_questions) as total_questions,
        AVG(time_taken) as avg_time_taken
       FROM quiz_attempts qa
       WHERE user_id = ? AND completed_at IS NOT NULL ${dateFilter}`,
      [userId]
    );
    const stats = (overallStats as any[])[0];

    // Get number of unique skills assessed
    const [skillsAssessedResult] = await pool.execute(
      `SELECT COUNT(DISTINCT skill_id) as skills_assessed
       FROM quiz_attempts
       WHERE user_id = ? AND completed_at IS NOT NULL ${dateFilter}`,
      [userId]
    );
    const skillsAssessed =
      (skillsAssessedResult as any[])[0]?.skills_assessed || 0;

    // Get skill-wise performance
    const [skillStats] = await pool.execute(
      `SELECT 
        s.id as skill_id,
        s.name as skill_name,
        COUNT(*) as attempts,
        AVG(qa.score_percentage) as avg_score,
        MAX(qa.score_percentage) as best_score,
        SUM(qa.correct_answers) as total_correct,
        SUM(qa.total_questions) as total_questions
       FROM quiz_attempts qa
       LEFT JOIN skills s ON qa.skill_id = s.id
       WHERE qa.user_id = ? AND qa.completed_at IS NOT NULL ${dateFilter}
       GROUP BY s.id, s.name
       ORDER BY avg_score DESC`,
      [userId]
    );

    // Get recent quiz attempts
    const [recentQuizzes] = await pool.execute(
      `SELECT 
        qa.id,
        qa.score_percentage,
        qa.correct_answers,
        qa.total_questions,
        qa.time_taken,
        qa.completed_at,
        s.name as skill_name
       FROM quiz_attempts qa
       LEFT JOIN skills s ON qa.skill_id = s.id
       WHERE qa.user_id = ? AND qa.completed_at IS NOT NULL ${dateFilter}
       ORDER BY qa.completed_at DESC
       LIMIT 10`,
      [userId]
    );

    // Get performance trend (last 10 quizzes)
    const [performanceTrend] = await pool.execute(
      `SELECT 
        DATE(completed_at) as date,
        AVG(score_percentage) as avg_score,
        COUNT(*) as quiz_count
       FROM quiz_attempts
       WHERE user_id = ? AND completed_at IS NOT NULL ${dateFilter}
       GROUP BY DATE(completed_at)
       ORDER BY date DESC
       LIMIT 10`,
      [userId]
    );

    const reportData = {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
      period,
      statistics: {
        totalQuizzes: stats.total_quizzes || 0,
        avgScore: Math.round((stats.avg_score || 0) * 100) / 100,
        bestScore: Math.round((stats.best_score || 0) * 100) / 100,
        worstScore: Math.round((stats.worst_score || 0) * 100) / 100,
        totalCorrect: stats.total_correct || 0,
        totalQuestions: stats.total_questions || 0,
        avgTimeTaken: Math.round((stats.avg_time_taken || 0) * 100) / 100,
        accuracyRate: stats.total_questions
          ? Math.round((stats.total_correct / stats.total_questions) * 10000) /
            100
          : 0,
        skillsAssessed,
      },
      skillPerformance: (skillStats as any[]).map((skill) => ({
        skillId: skill.skill_id,
        skillName: skill.skill_name,
        attempts: skill.attempts,
        avgScore: Math.round((skill.avg_score || 0) * 100) / 100,
        bestScore: Math.round((skill.best_score || 0) * 100) / 100,
        accuracyRate: skill.total_questions
          ? Math.round((skill.total_correct / skill.total_questions) * 10000) /
            100
          : 0,
      })),
      recentQuizzes: (recentQuizzes as any[]).map((quiz) => ({
        id: quiz.id,
        skillName: quiz.skill_name,
        score: Math.round((quiz.score_percentage || 0) * 100) / 100,
        correctAnswers: quiz.correct_answers,
        totalQuestions: quiz.total_questions,
        timeTaken: quiz.time_taken,
        completedAt: quiz.completed_at,
      })),
      performanceTrend: (performanceTrend as any[]).map((trend) => ({
        date: trend.date,
        avgScore: Math.round((trend.avg_score || 0) * 100) / 100,
        quizCount: trend.quiz_count,
      })),
    };

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Get user report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user report",
    });
  }
});

// Get skill gap analysis (Admin only)
/**
 * @swagger
 * /reports/skill-gaps:
 *   get:
 *     summary: Get skill gap analysis (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skill gap analysis report
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/skill-gaps",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const cacheKey = "skill_gaps_report";
      const cachedData = await cacheGet(cacheKey);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Get skill performance statistics
      const [skillGaps] = await pool.execute(
        `SELECT 
        s.id as skill_id,
        s.name as skill_name,
        s.category,
        COUNT(DISTINCT qa.user_id) as users_attempted,
        COUNT(qa.id) as total_attempts,
        AVG(qa.score_percentage) as avg_score,
        MIN(qa.score_percentage) as min_score,
        MAX(qa.score_percentage) as max_score,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users
       FROM skills s
       LEFT JOIN quiz_attempts qa ON s.id = qa.skill_id AND qa.completed_at IS NOT NULL
       WHERE s.is_active = true
       GROUP BY s.id, s.name, s.category
       ORDER BY avg_score ASC`
      );

      // Get difficulty-wise performance
      const [difficultyStats] = await pool.execute(
        `SELECT 
        q.difficulty,
        COUNT(*) as total_questions,
        AVG(CASE WHEN qans.is_correct = true THEN 1 ELSE 0 END) as success_rate,
        COUNT(DISTINCT qa.user_id) as users_attempted
       FROM questions q
       LEFT JOIN quiz_answers qans ON q.id = qans.question_id
       LEFT JOIN quiz_attempts qa ON qans.quiz_attempt_id = qa.id
       WHERE q.is_active = true
       GROUP BY q.difficulty
       ORDER BY success_rate ASC`
      );

      // Get categories with poor performance
      const [categoryStats] = await pool.execute(
        `SELECT 
        s.category,
        COUNT(DISTINCT s.id) as skill_count,
        AVG(qa.score_percentage) as avg_score,
        COUNT(DISTINCT qa.user_id) as users_attempted
       FROM skills s
       LEFT JOIN quiz_attempts qa ON s.id = qa.skill_id AND qa.completed_at IS NOT NULL
       WHERE s.is_active = true AND s.category IS NOT NULL
       GROUP BY s.category
       ORDER BY avg_score ASC`
      );

      const reportData = {
        skillGaps: (skillGaps as any[]).map((skill) => ({
          skillId: skill.skill_id,
          skillName: skill.skill_name,
          category: skill.category,
          usersAttempted: skill.users_attempted || 0,
          totalAttempts: skill.total_attempts || 0,
          avgScore: Math.round((skill.avg_score || 0) * 100) / 100,
          minScore: Math.round((skill.min_score || 0) * 100) / 100,
          maxScore: Math.round((skill.max_score || 0) * 100) / 100,
          participationRate: skill.total_users
            ? Math.round((skill.users_attempted / skill.total_users) * 10000) /
              100
            : 0,
          gapLevel:
            skill.avg_score < 60
              ? "high"
              : skill.avg_score < 75
              ? "medium"
              : "low",
        })),
        difficultyAnalysis: (difficultyStats as any[]).map((diff) => ({
          difficulty: diff.difficulty,
          totalQuestions: diff.total_questions,
          successRate: Math.round((diff.success_rate || 0) * 10000) / 100,
          usersAttempted: diff.users_attempted || 0,
        })),
        categoryPerformance: (categoryStats as any[]).map((cat) => ({
          category: cat.category,
          skillCount: cat.skill_count,
          avgScore: Math.round((cat.avg_score || 0) * 100) / 100,
          usersAttempted: cat.users_attempted || 0,
        })),
      };

      // Cache the report for 10 minutes
      await cacheSet(
        cacheKey,
        JSON.stringify({
          success: true,
          data: reportData,
        }),
        600
      );

      res.json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error("Get skill gaps error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get skill gaps report",
      });
    }
  }
);

// Get system overview (Admin only)
/**
 * @swagger
 * /reports/overview:
 *   get:
 *     summary: Get system overview report (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System overview report
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/overview",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const cacheKey = "system_overview_report";
      const cachedData = await cacheGet(cacheKey);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Get basic statistics
      const [basicStats] = await pool.execute(
        `SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM skills WHERE is_active = true) as total_skills,
        (SELECT COUNT(*) FROM questions WHERE is_active = true) as total_questions,
        (SELECT COUNT(*) FROM quiz_attempts WHERE completed_at IS NOT NULL) as total_quiz_attempts`
      );

      // Get recent activity (last 30 days)
      const [recentActivity] = await pool.execute(
        `SELECT 
        COUNT(*) as recent_attempts,
        COUNT(DISTINCT user_id) as active_users,
        AVG(score_percentage) as avg_recent_score
       FROM quiz_attempts 
       WHERE completed_at >= datetime('now', '-30 days')`
      );

      // Get daily activity for the last 14 days
      const [dailyActivity] = await pool.execute(
        `SELECT 
        DATE(completed_at) as date,
        COUNT(*) as quiz_count,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(score_percentage) as avg_score
       FROM quiz_attempts 
       WHERE completed_at >= datetime('now', '-14 days')
       GROUP BY DATE(completed_at)
       ORDER BY date DESC`
      );

      // Get top performing users
      const [topUsers] = await pool.execute(
        `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(qa.id) as quiz_count,
        AVG(qa.score_percentage) as avg_score
       FROM users u
       LEFT JOIN quiz_attempts qa ON u.id = qa.user_id AND qa.completed_at IS NOT NULL
       WHERE u.is_active = true
       GROUP BY u.id, u.first_name, u.last_name, u.email
       HAVING quiz_count > 0
       ORDER BY avg_score DESC, quiz_count DESC
       LIMIT 10`
      );

      // Get most challenging skills
      const [challengingSkills] = await pool.execute(
        `SELECT 
        s.id,
        s.name,
        COUNT(qa.id) as attempts,
        AVG(qa.score_percentage) as avg_score
       FROM skills s
       LEFT JOIN quiz_attempts qa ON s.id = qa.skill_id AND qa.completed_at IS NOT NULL
       WHERE s.is_active = true
       GROUP BY s.id, s.name
       HAVING attempts > 0
       ORDER BY avg_score ASC
       LIMIT 10`
      );

      const stats = (basicStats as any[])[0];
      const activity = (recentActivity as any[])[0];

      const reportData = {
        basicStatistics: {
          totalUsers: stats.total_users || 0,
          totalSkills: stats.total_skills || 0,
          totalQuestions: stats.total_questions || 0,
          totalQuizAttempts: stats.total_quiz_attempts || 0,
        },
        recentActivity: {
          recentAttempts: activity.recent_attempts || 0,
          activeUsers: activity.active_users || 0,
          avgRecentScore:
            Math.round((activity.avg_recent_score || 0) * 100) / 100,
        },
        dailyActivity: (dailyActivity as any[]).map((day) => ({
          date: day.date,
          quizCount: day.quiz_count,
          uniqueUsers: day.unique_users,
          avgScore: Math.round((day.avg_score || 0) * 100) / 100,
        })),
        topUsers: (topUsers as any[]).map((user) => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          quizCount: user.quiz_count,
          avgScore: Math.round((user.avg_score || 0) * 100) / 100,
        })),
        challengingSkills: (challengingSkills as any[]).map((skill) => ({
          id: skill.id,
          name: skill.name,
          attempts: skill.attempts,
          avgScore: Math.round((skill.avg_score || 0) * 100) / 100,
        })),
      };

      // Cache the report for 5 minutes
      await cacheSet(
        cacheKey,
        JSON.stringify({
          success: true,
          data: reportData,
        }),
        300
      );

      res.json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      console.error("Get overview error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get overview report",
      });
    }
  }
);

// Get user leaderboard
router.get("/leaderboard", authenticate, async (req, res) => {
  try {
    const period = (req.query.period as string) || "all"; // all, week, month
    const skillId = (req.query.skillId as string) || "";
    const limit = parseInt(req.query.limit as string) || 10;

    // Build date filter (SQLite compatible)
    let dateFilter = "";
    if (period === "week") {
      dateFilter = "AND qa.completed_at >= datetime('now', '-7 days')";
    } else if (period === "month") {
      dateFilter = "AND qa.completed_at >= datetime('now', '-1 month')";
    }

    // Build skill filter
    let skillFilter = "";
    if (skillId) {
      skillFilter = "AND qa.skill_id = ?";
    }

    const queryParams = [];
    if (skillId) {
      queryParams.push(skillId);
    }
    queryParams.push(limit);

    const [leaderboard] = await pool.execute(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        COUNT(qa.id) as quiz_count,
        AVG(qa.score_percentage) as avg_score,
        MAX(qa.score_percentage) as best_score,
        SUM(qa.correct_answers) as total_correct,
        SUM(qa.total_questions) as total_questions
       FROM users u
       LEFT JOIN quiz_attempts qa ON u.id = qa.user_id AND qa.completed_at IS NOT NULL ${dateFilter} ${skillFilter}
       WHERE u.is_active = true
       GROUP BY u.id, u.first_name, u.last_name
       HAVING quiz_count > 0
       ORDER BY avg_score DESC, quiz_count DESC
       LIMIT ?`,
      queryParams
    );

    const leaderboardData = (leaderboard as any[]).map((user, index) => ({
      rank: index + 1,
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      quizCount: user.quiz_count,
      avgScore: Math.round((user.avg_score || 0) * 100) / 100,
      bestScore: Math.round((user.best_score || 0) * 100) / 100,
      accuracyRate: user.total_questions
        ? Math.round((user.total_correct / user.total_questions) * 10000) / 100
        : 0,
    }));

    res.json({
      success: true,
      data: {
        leaderboard: leaderboardData,
        period,
        skillId: skillId || null,
      },
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get leaderboard",
    });
  }
});

export default router;
