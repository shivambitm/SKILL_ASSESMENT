import express from "express";
import { User, Skill, Question, QuizAttempt, QuizAnswer } from "../models";
import { authenticate, authorize, CustomRequest } from "../middleware/auth";
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
      const recent = await QuizAttempt.find({ completed_at: { $ne: null } })
        .populate('user_id', 'firstName lastName')
        .populate('skill_id', 'name')
        .sort({ completed_at: -1 })
        .limit(20)
        .lean();

      // Skill performance: how many times each skill was taken
      const skillsAgg = await QuizAttempt.aggregate([
        { $match: { completed_at: { $ne: null } } },
        { $group: { _id: '$skill_id', times_taken: { $sum: 1 } } },
        { $lookup: { from: 'skills', localField: '_id', foreignField: '_id', as: 'skill' } },
        { $unwind: '$skill' },
        { $project: { id: '$_id', name: '$skill.name', times_taken: 1 } },
        { $sort: { times_taken: -1 } }
      ]);

      // Performance trend: last 10 attempts
      const trend = await QuizAttempt.find({ completed_at: { $ne: null } })
        .populate('user_id', 'firstName lastName')
        .sort({ completed_at: -1 })
        .limit(10)
        .lean();

      res.json({
        recent: recent.map(r => ({
          id: r._id,
          username: `${(r.user_id as any)?.firstName} ${(r.user_id as any)?.lastName}`,
          skill_name: (r.skill_id as any)?.name,
          percentage: r.score_percentage,
          created_at: r.completed_at
        })),
        skills: skillsAgg,
        trend: trend.map(t => ({
          username: `${(t.user_id as any)?.firstName} ${(t.user_id as any)?.lastName}`,
          score: t.score_percentage,
          created_at: t.completed_at
        }))
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
router.get("/user/:userId", authenticate, async (req: CustomRequest, res) => {
  try {
    const userId = req.params.userId;

    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.userId !== userId)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Find user
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get quiz statistics
    const quizStats = await QuizAttempt.aggregate([
      { $match: { user_id: user._id, completed_at: { $ne: null } } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: "$score_percentage" },
          bestScore: { $max: "$score_percentage" },
          accuracyRate: {
            $avg: {
              $cond: [{ $gte: ["$score_percentage", 70] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get recent quizzes
    const recentQuizzes = await QuizAttempt.find({ 
      user_id: userId, 
      completed_at: { $ne: null } 
    })
    .populate('skill_id', 'name')
    .sort({ completed_at: -1 })
    .limit(10)
    .lean();

    const stats = quizStats[0] || {};
    const reportData = {
      user: {
        id: user._id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        created_at: user.createdAt
      },
      statistics: {
        totalQuizzes: stats.totalQuizzes || 0,
        averageScore: Math.round((stats.averageScore || 0) * 100) / 100,
        bestScore: Math.round((stats.bestScore || 0) * 100) / 100,
        accuracyRate: Math.round((stats.accuracyRate || 0) * 100) / 100,
      },
      recentQuizzes: recentQuizzes.map(quiz => ({
        id: quiz._id.toString(),
        skillName: (quiz.skill_id as any)?.name || 'Unknown',
        correctAnswers: quiz.correct_answers,
        totalQuestions: quiz.total_questions,
        score: Math.round((quiz.score_percentage || 0) * 100) / 100,
        completedAt: quiz.completed_at,
      })),
      performanceTrend: [], // Simplified for now
    };

    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error("Get user report error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get user report" });
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

      // Get total users count
      const totalUsers = await User.countDocuments({ isActive: true });

      // Get skill performance statistics using MongoDB aggregation
      const skillGaps = await Skill.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "quizattempts",
            let: { skillId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$skill_id", "$$skillId"] },
                  completed_at: { $ne: null }
                }
              }
            ],
            as: "attempts"
          }
        },
        {
          $project: {
            skill_id: "$_id",
            skill_name: "$name",
            category: "$category",
            users_attempted: { $size: { $setUnion: ["$attempts.user_id", []] } },
            total_attempts: { $size: "$attempts" },
            avg_score: { $avg: "$attempts.score_percentage" },
            min_score: { $min: "$attempts.score_percentage" },
            max_score: { $max: "$attempts.score_percentage" },
            total_users: totalUsers
          }
        },
        { $sort: { avg_score: 1 } }
      ]);

      // Simplified difficulty and category stats for now
      const difficultyStats = [];
      const categoryStats = [];

      const reportData = {
        skillGaps: skillGaps.map((skill) => ({
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
        difficultyAnalysis: difficultyStats.map((diff) => ({
          difficulty: diff._id,
          totalQuestions: diff.total_questions,
          successRate: Math.round((diff.success_rate || 0) * 10000) / 100,
          usersAttempted: diff.users_attempted || 0,
        })),
        categoryPerformance: categoryStats.map((cat) => ({
          category: cat._id,
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

      // Get basic statistics using MongoDB
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalSkills = await Skill.countDocuments({ isActive: true });
      const totalQuestions = await Question.countDocuments({ isActive: true });
      const totalQuizAttempts = await QuizAttempt.countDocuments({ completed_at: { $ne: null } });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentAttempts = await QuizAttempt.countDocuments({ 
        completed_at: { $gte: thirtyDaysAgo } 
      });
      
      const activeUsers = await QuizAttempt.distinct('user_id', { 
        completed_at: { $gte: thirtyDaysAgo } 
      }).then(users => users.length);
      
      const avgRecentScoreResult = await QuizAttempt.aggregate([
        { $match: { completed_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, avg: { $avg: "$score_percentage" } } }
      ]);
      const avgRecentScore = avgRecentScoreResult[0]?.avg || 0;

      // Simplified for now - empty arrays
      const dailyActivity: any[] = [];
      const topUsers: any[] = [];
      const challengingSkills: any[] = [];

      const stats = {
        total_users: totalUsers,
        total_skills: totalSkills,
        total_questions: totalQuestions,
        total_quiz_attempts: totalQuizAttempts
      };
      
      const activity = {
        recent_attempts: recentAttempts,
        active_users: activeUsers,
        avg_recent_score: avgRecentScore
      };

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
        dailyActivity: dailyActivity.map((day) => ({
          date: day.date,
          quizCount: day.quiz_count,
          uniqueUsers: day.unique_users,
          avgScore: Math.round((day.avg_score || 0) * 100) / 100,
        })),
        topUsers: topUsers.map((user) => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          quizCount: user.quiz_count,
          avgScore: Math.round((user.avg_score || 0) * 100) / 100,
        })),
        challengingSkills: challengingSkills.map((skill) => ({
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

    // Build date filter for MongoDB
    let dateFilter: any = { completed_at: { $ne: null } };
    if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.completed_at = { $gte: weekAgo };
    } else if (period === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter.completed_at = { $gte: monthAgo };
    }

    // Build skill filter
    if (skillId) {
      dateFilter.skill_id = skillId;
    }

    // MongoDB aggregation for leaderboard
    const leaderboard = await QuizAttempt.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$user_id",
          quiz_count: { $sum: 1 },
          avg_score: { $avg: "$score_percentage" },
          best_score: { $max: "$score_percentage" },
          total_correct: { $sum: "$correct_answers" },
          total_questions: { $sum: "$total_questions" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $match: { "user.isActive": true } },
      { $sort: { avg_score: -1, quiz_count: -1 } },
      { $limit: limit }
    ]);

    const leaderboardData = leaderboard.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      firstName: user.user.firstName,
      lastName: user.user.lastName,
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
