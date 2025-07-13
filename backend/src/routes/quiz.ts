/**
 * Quiz Routes - Core Quiz Functionality
 *
 * This module handles all quiz-related operations including starting quizzes,
 * submitting answers, completing quizzes, and retrieving quiz history.
 *
 * Features:
 * - Start new quiz attempts with question selection
 * - Submit individual answers with timing tracking
 * - Complete quizzes with score calculation
 * - Retrieve quiz history with pagination and filtering
 * - Detailed quiz attempt information
 *
 * Security:
 * - All endpoints require authentication
 * - Users can only access their own quiz data
 * - Admins can access all quiz data
 * - Input validation for all requests
 *
 * Database Operations:
 * - Quiz attempts tracking
 * - Individual answer recording
 * - Score calculation and storage
 * - Performance analytics
 *
 * @module QuizRoutes
 * @requires authentication middleware
 * @requires validation middleware
 * @requires database pool for operations
 */

import express from "express";
import { pool } from "../config/database";
import { authenticate } from "../middleware/auth";
import { validate, quizSchemas } from "../middleware/validation";

const router = express.Router();

// Add more robust logging to the backend's quiz routes
router.use((req, res, next) => {
  if (req.path.startsWith("/answer") || req.path.startsWith("/complete")) {
    console.log(`Quiz API ${req.method} ${req.path}:`, {
      body: req.body,
      userId: req.user?.userId,
      timestamp: new Date().toISOString(),
    });
  }
  next();
});

// Start quiz attempt
router.post("/start", authenticate, async (req, res) => {
  /**
   * @swagger
   * /quiz/start:
   *   post:
   *     summary: Start a new quiz attempt
   *     tags: [Quiz]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - skillId
   *             properties:
   *               skillId:
   *                 type: integer
   *                 description: Skill ID to start quiz for
   *     responses:
   *       200:
   *         description: Quiz started
   *       400:
   *         description: Skill ID is required
   *       401:
   *         description: Unauthorized
   */
  try {
    const { skillId } = req.body;

    if (!skillId) {
      return res.status(400).json({
        success: false,
        message: "Skill ID is required",
      });
    }

    // Check if skill exists
    const [skillCheck] = await pool.execute(
      "SELECT id, name FROM skills WHERE id = ? AND is_active = true",
      [skillId]
    );

    if ((skillCheck as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: "Skill not found or inactive",
      });
    }

    const skill = (skillCheck as any[])[0];

    // Get question count for this skill
    const [questionCountResult] = await pool.execute(
      "SELECT COUNT(*) as count FROM questions WHERE skill_id = ? AND is_active = true",
      [skillId]
    );

    const questionCount = (questionCountResult as any[])[0].count;

    if (questionCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No questions available for this skill",
      });
    }

    // Create quiz attempt
    const [result] = await pool.execute(
      "INSERT INTO quiz_attempts (user_id, skill_id, total_questions, correct_answers, score_percentage) VALUES (?, ?, ?, 0, 0)",
      [req.user!.userId, skillId, questionCount]
    );

    const quizAttemptId = (result as any).lastInsertRowid;

    console.log("🎯 Quiz attempt created:", {
      quizAttemptId,
      type: typeof quizAttemptId,
      value: quizAttemptId,
      skill: skill.name,
      userId: req.user!.userId,
    });

    const responseData = {
      id: quizAttemptId,
      userId: req.user!.userId,
      skillId,
      skillName: skill.name,
      totalQuestions: questionCount,
      startedAt: new Date(),
    };

    console.log("🚀 Sending response data:", responseData);

    res.status(201).json({
      success: true,
      message: "Quiz started successfully",
      data: {
        quizAttempt: responseData,
      },
    });
  } catch (error) {
    console.error("Start quiz error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start quiz",
    });
  }
});

// Submit answer
router.post(
  "/answer",
  authenticate,
  validate(quizSchemas.submitAnswer),
  async (req, res) => {
    try {
      let { quizAttemptId, questionId, selectedAnswer, timeTaken } = req.body;

      // Type safety for SQLite
      quizAttemptId = Number(quizAttemptId);
      questionId = Number(questionId);
      selectedAnswer = String(selectedAnswer);
      timeTaken = Number(timeTaken);

      console.log("Submit answer request:", {
        quizAttemptId,
        questionId,
        selectedAnswer,
        timeTaken,
        userId: req.user?.userId,
        types: {
          quizAttemptId: typeof quizAttemptId,
          questionId: typeof questionId,
          selectedAnswer: typeof selectedAnswer,
          timeTaken: typeof timeTaken,
        },
      });

      // Check if quiz attempt exists and belongs to user
      const [quizCheck] = await pool.execute(
        "SELECT id, user_id, completed_at FROM quiz_attempts WHERE id = ? AND user_id = ?",
        [quizAttemptId, req.user!.userId]
      );

      if ((quizCheck as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          message: "Quiz attempt not found",
        });
      }

      const quizAttempt = (quizCheck as any[])[0];

      if (quizAttempt.completed_at) {
        return res.status(400).json({
          success: false,
          message: "Quiz has already been completed",
        });
      }

      // Check if question exists and get correct answer
      const [questionCheck] = await pool.execute(
        "SELECT id, correct_answer FROM questions WHERE id = ?",
        [questionId]
      );

      if ((questionCheck as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      const question = (questionCheck as any[])[0];

      // Check if answer already submitted for this question
      const [existingAnswer] = await pool.execute(
        "SELECT id FROM quiz_answers WHERE quiz_attempt_id = ? AND question_id = ?",
        [quizAttemptId, questionId]
      );

      if ((existingAnswer as any[]).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Answer already submitted for this question",
        });
      }

      const isCorrect = selectedAnswer === question.correct_answer;

      // Save answer

      await pool.execute(
        "INSERT INTO quiz_answers (quiz_attempt_id, question_id, selected_answer, is_correct, time_taken) VALUES (?, ?, ?, ?, ?)",
        [
          quizAttemptId,
          questionId,
          selectedAnswer,
          isCorrect ? 1 : 0,
          timeTaken,
        ]
      );

      res.json({
        success: true,
        message: "Answer submitted successfully",
        data: {
          isCorrect,
          correctAnswer: question.correct_answer,
        },
      });
    } catch (error) {
      console.error("Submit answer error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit answer",
      });
    }
  }
);

// Complete quiz
router.post(
  "/complete",
  authenticate,
  (req, res, next) => {
    console.log("Quiz complete validation debugging:", {
      body: req.body,
      quizAttemptId: req.body.quizAttemptId,
      userId: req.user?.userId,
      timestamp: new Date().toISOString(),
    });
    next();
  },
  /**
   * @swagger
   * /quiz/complete:
   *   post:
   *     summary: Complete a quiz attempt
   *     tags: [Quiz]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - quizAttemptId
   *               - timeTaken
   *             properties:
   *               quizAttemptId:
   *                 type: integer
   *               timeTaken:
   *                 type: number
   *                 description: Total time taken (seconds)
   *     responses:
   *       200:
   *         description: Quiz completed
   *       400:
   *         description: Quiz already completed or invalid input
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Quiz attempt not found
   */
  validate(quizSchemas.completeQuiz),
  async (req, res) => {
    try {
      const { quizAttemptId, timeTaken } = req.body;

      console.log("Complete quiz request:", {
        quizAttemptId,
        timeTaken,
        userId: req.user?.userId,
      });

      // Check if quiz attempt exists and belongs to user
      const [quizCheck] = await pool.execute(
        "SELECT id, user_id, total_questions, completed_at FROM quiz_attempts WHERE id = ? AND user_id = ?",
        [quizAttemptId, req.user!.userId]
      );

      if ((quizCheck as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          message: "Quiz attempt not found",
        });
      }

      const quizAttempt = (quizCheck as any[])[0];

      if (quizAttempt.completed_at) {
        return res.status(400).json({
          success: false,
          message: "Quiz has already been completed",
        });
      }

      // Calculate score
      const [scoreResult] = await pool.execute(
        "SELECT COUNT(*) as correct_count FROM quiz_answers WHERE quiz_attempt_id = ? AND is_correct = true",
        [quizAttemptId]
      );

      const correctAnswers = (scoreResult as any[])[0].correct_count;
      const scorePercentage =
        (correctAnswers / quizAttempt.total_questions) * 100;

      // Update quiz attempt

      await pool.execute(
        "UPDATE quiz_attempts SET correct_answers = ?, score_percentage = ?, time_taken = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
        [correctAnswers, scorePercentage, timeTaken, quizAttemptId]
      );

      res.json({
        success: true,
        message: "Quiz completed successfully",
        data: {
          score: {
            totalQuestions: quizAttempt.total_questions,
            correctAnswers,
            scorePercentage: Math.round(scorePercentage * 100) / 100,
            timeTaken,
          },
        },
      });
    } catch (error) {
      console.error("Complete quiz error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to complete quiz",
      });
    }
  }
);

// Get quiz history for user
router.get("/history", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skillId = (req.query.skillId as string) || "";

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereClause = "WHERE qa.user_id = ? AND qa.completed_at IS NOT NULL";
    const queryParams: any[] = [req.user!.userId];

    if (skillId) {
      whereClause += " AND qa.skill_id = ?";
      queryParams.push(skillId);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM quiz_attempts qa ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // Get quiz history
    const [rows] = await pool.execute(
      `SELECT qa.id, qa.skill_id, qa.total_questions, qa.correct_answers, qa.score_percentage, 
              qa.time_taken, qa.started_at, qa.completed_at, s.name as skill_name
       FROM quiz_attempts qa
       LEFT JOIN skills s ON qa.skill_id = s.id
       ${whereClause}
       ORDER BY qa.completed_at DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const quizHistory = (rows as any[]).map((quiz) => ({
      id: quiz.id,
      skillId: quiz.skill_id,
      skillName: quiz.skill_name,
      totalQuestions: quiz.total_questions,
      correctAnswers: quiz.correct_answers,
      scorePercentage: quiz.score_percentage,
      timeTaken: quiz.time_taken,
      startedAt: quiz.started_at,
      completedAt: quiz.completed_at,
    }));

    res.json({
      success: true,
      data: {
        quizHistory,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get quiz history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get quiz history",
    });
  }
});

// Get quiz details
router.get("/:id", authenticate, async (req, res) => {
  try {
    const quizAttemptId = parseInt(req.params.id);

    // Check if quiz attempt exists and belongs to user (or user is admin)
    const [quizCheck] = await pool.execute(
      'SELECT id, user_id, skill_id, total_questions, correct_answers, score_percentage, time_taken, started_at, completed_at FROM quiz_attempts WHERE id = ? AND (user_id = ? OR ? = "admin")',
      [quizAttemptId, req.user!.userId, req.user!.role]
    );

    if ((quizCheck as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quiz attempt not found",
      });
    }

    const quizAttempt = (quizCheck as any[])[0];

    // Get skill info
    const [skillResult] = await pool.execute(
      "SELECT name FROM skills WHERE id = ?",
      [quizAttempt.skill_id]
    );

    const skillName = (skillResult as any[])[0]?.name || "Unknown";

    // Get answers with question details
    const [answersResult] = await pool.execute(
      `SELECT qa.question_id, qa.selected_answer, qa.is_correct, qa.time_taken,
              q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer
       FROM quiz_answers qa
       LEFT JOIN questions q ON qa.question_id = q.id
       WHERE qa.quiz_attempt_id = ?
       ORDER BY qa.created_at`,
      [quizAttemptId]
    );

    const answers = (answersResult as any[]).map((answer) => ({
      questionId: answer.question_id,
      questionText: answer.question_text,
      options: {
        A: answer.option_a,
        B: answer.option_b,
        C: answer.option_c,
        D: answer.option_d,
      },
      selectedAnswer: answer.selected_answer,
      correctAnswer: answer.correct_answer,
      isCorrect: answer.is_correct,
      timeTaken: answer.time_taken,
    }));

    res.json({
      success: true,
      data: {
        quizAttempt: {
          id: quizAttempt.id,
          userId: quizAttempt.user_id,
          skillId: quizAttempt.skill_id,
          skillName,
          totalQuestions: quizAttempt.total_questions,
          correctAnswers: quizAttempt.correct_answers,
          scorePercentage: quizAttempt.score_percentage,
          timeTaken: quizAttempt.time_taken,
          startedAt: quizAttempt.started_at,
          completedAt: quizAttempt.completed_at,
          answers,
        },
      },
    });
  } catch (error) {
    console.error("Get quiz details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get quiz details",
    });
  }
});

export default router;
