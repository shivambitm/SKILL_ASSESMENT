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
 * @requires MongoDB models
 */

import express from "express";
import { QuizAttempt, QuizAnswer, Skill, Question } from "../models";
import { authenticate, CustomRequest } from "../middleware/auth";
import { validate, quizSchemas } from "../middleware/validation";

const router = express.Router();

// Add more robust logging to the backend's quiz routes
router.use((req: CustomRequest, res, next) => {
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
router.post("/start", authenticate, async (req: CustomRequest, res) => {
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
   *                 type: string
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
    const skill = await Skill.findById(skillId).where({ isActive: true });
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found or inactive",
      });
    }

    // Get question count for this skill
    const questionCount = await Question.countDocuments({ 
      skillId: skill._id, 
      isActive: true 
    });

    if (questionCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No questions available for this skill",
      });
    }

    // Create quiz attempt
    const quizAttempt = new QuizAttempt({
      userId: req.user!.userId,
      skillId: skill._id,
      totalQuestions: questionCount,
      correctAnswers: 0,
      score: 0,
    });

    await quizAttempt.save();

    res.status(201).json({
      success: true,
      message: "Quiz started successfully",
      data: {
        quizAttempt: {
          id: quizAttempt._id,
          userId: req.user!.userId,
          skillId: skill._id,
          skillName: skill.name,
          totalQuestions: questionCount,
          startedAt: quizAttempt.createdAt,
        },
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
  async (req: CustomRequest, res) => {
    try {
      const { quizAttemptId, questionId, selectedAnswer, timeTaken } = req.body;

      console.log("Submit answer request:", {
        quizAttemptId,
        questionId,
        selectedAnswer,
        timeTaken,
        userId: req.user?.userId,
      });

      // Check if quiz attempt exists and belongs to user
      const quizAttempt = await QuizAttempt.findOne({
        _id: quizAttemptId,
        userId: req.user!.userId,
      });

      if (!quizAttempt) {
        return res.status(404).json({
          success: false,
          message: "Quiz attempt not found",
        });
      }

      if (quizAttempt.isCompleted) {
        return res.status(400).json({
          success: false,
          message: "Quiz has already been completed",
        });
      }

      // Check if question exists and get correct answer
      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      // Check if answer already submitted for this question
      const existingAnswer = await QuizAnswer.findOne({
        quizAttemptId,
        questionId,
      });

      if (existingAnswer) {
        return res.status(400).json({
          success: false,
          message: "Answer already submitted for this question",
        });
      }

      const isCorrect = selectedAnswer === question.correctAnswer;

      // Save answer
      const quizAnswer = new QuizAnswer({
        quizAttemptId,
        questionId,
        selectedAnswer,
        isCorrect,
        timeTaken,
      });

      await quizAnswer.save();

      res.json({
        success: true,
        message: "Answer submitted successfully",
        data: {
          isCorrect,
          correctAnswer: question.correctAnswer,
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
router.post("/complete", authenticate, async (req: CustomRequest, res) => {
  try {
    const { quizAttemptId, timeTaken } = req.body;

    // Check if quiz attempt exists and belongs to user
    const quizAttempt = await QuizAttempt.findOne({
      _id: quizAttemptId,
      userId: req.user!.userId,
    });

    if (!quizAttempt) {
      return res.status(404).json({
        success: false,
        message: "Quiz attempt not found",
      });
    }

    if (quizAttempt.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Quiz has already been completed",
      });
    }

    // Calculate score
    const correctAnswers = await QuizAnswer.countDocuments({
      quizAttemptId,
      isCorrect: true,
    });

    const scorePercentage = (correctAnswers / quizAttempt.totalQuestions) * 100;

    // Update quiz attempt
    quizAttempt.correctAnswers = correctAnswers;
    quizAttempt.score = scorePercentage;
    quizAttempt.timeTaken = timeTaken;
    quizAttempt.isCompleted = true;
    quizAttempt.completedAt = new Date();

    await quizAttempt.save();

    res.json({
      success: true,
      message: "Quiz completed successfully",
      data: {
        score: {
          totalQuestions: quizAttempt.totalQuestions,
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
});

// Get quiz history for user
router.get("/history", authenticate, async (req: CustomRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skillId = (req.query.skillId as string) || "";

    // Build query conditions
    const query: any = {
      userId: req.user!.userId,
      isCompleted: true,
    };

    if (skillId) {
      query.skillId = skillId;
    }

    // Get total count
    const total = await QuizAttempt.countDocuments(query);

    // Get quiz history
    const quizHistory = await QuizAttempt.find(query)
      .populate('skillId', 'name')
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedHistory = quizHistory.map((quiz: any) => ({
      id: quiz._id,
      skillId: quiz.skillId._id,
      skillName: quiz.skillId.name,
      totalQuestions: quiz.totalQuestions,
      correctAnswers: quiz.correctAnswers,
      scorePercentage: quiz.score,
      timeTaken: quiz.timeTaken,
      startedAt: quiz.createdAt,
      completedAt: quiz.completedAt,
    }));

    res.json({
      success: true,
      data: {
        quizHistory: formattedHistory,
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
router.get("/:id", authenticate, async (req: CustomRequest, res) => {
  try {
    const quizAttemptId = req.params.id;

    // Check if quiz attempt exists and belongs to user (or user is admin)
    const query: any = { _id: quizAttemptId };
    if (req.user!.role !== "admin") {
      query.userId = req.user!.userId;
    }

    const quizAttempt = await QuizAttempt.findOne(query)
      .populate('skillId', 'name')
      .lean();

    if (!quizAttempt) {
      return res.status(404).json({
        success: false,
        message: "Quiz attempt not found",
      });
    }

    // Get answers with question details
    const answers = await QuizAnswer.find({ quizAttemptId })
      .populate('questionId', 'questionText optionA optionB optionC optionD correctAnswer')
      .sort({ createdAt: 1 })
      .lean();

    const formattedAnswers = answers.map((answer: any) => ({
      questionId: answer.questionId._id,
      questionText: answer.questionId.questionText,
      options: {
        A: answer.questionId.optionA,
        B: answer.questionId.optionB,
        C: answer.questionId.optionC,
        D: answer.questionId.optionD,
      },
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.questionId.correctAnswer,
      isCorrect: answer.isCorrect,
      timeTaken: answer.timeTaken,
    }));

    res.json({
      success: true,
      data: {
        quizAttempt: {
          id: quizAttempt._id,
          userId: quizAttempt.userId,
          skillId: (quizAttempt.skillId as any)._id,
          skillName: (quizAttempt.skillId as any).name,
          totalQuestions: quizAttempt.totalQuestions,
          correctAnswers: quizAttempt.correctAnswers,
          scorePercentage: quizAttempt.score,
          timeTaken: quizAttempt.timeTaken,
          startedAt: quizAttempt.createdAt,
          completedAt: quizAttempt.completedAt,
          answers: formattedAnswers,
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