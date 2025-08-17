import express from "express";
import { Question, Skill } from "../models";
import { authenticate, authorize } from "../middleware/auth";
import { validate, questionSchemas } from "../middleware/validation";
import { cacheGet, cacheSet, cacheDel } from "../config/redis";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question management (admin only)
 */

// Get all questions (Admin only)
router.get("/", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skillId = (req.query.skillId as string) || "";
    const difficulty = (req.query.difficulty as string) || "";
    const search = (req.query.search as string) || "";

    // Build query conditions
    const query: any = {};
    
    if (skillId) {
      query.skillId = skillId;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (search) {
      query.questionText = { $regex: search, $options: 'i' };
    }

    // Get total count
    const total = await Question.countDocuments(query);

    // Get questions with skill info
    const questions = await Question.find(query)
      .populate('skillId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedQuestions = questions.map((question: any) => ({
      id: question._id,
      skillId: question.skillId._id,
      skillName: question.skillId.name,
      questionText: question.questionText,
      options: {
        A: question.optionA,
        B: question.optionB,
        C: question.optionC,
        D: question.optionD,
      },
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      points: question.points,
      isActive: question.isActive,
      createdAt: question.createdAt,
    }));

    res.json({
      success: true,
      data: {
        questions: formattedQuestions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get questions",
    });
  }
});

// Get questions for quiz (User)
router.get("/quiz/:skillId", authenticate, async (req, res) => {
  try {
    const skillId = req.params.skillId;
    const limit = parseInt(req.query.limit as string) || 10;

    // Check if skill exists
    const skill = await Skill.findById(skillId).where({ isActive: true });
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found or inactive",
      });
    }

    // Get random questions for the skill
    const questions = await Question.aggregate([
      { $match: { skill_id: skill._id, is_active: true } },
      { $sample: { size: limit } },
      {
        $project: {
          _id: 1,
          question_text: 1,
          option_a: 1,
          option_b: 1,
          option_c: 1,
          option_d: 1,
          difficulty: 1,
          points: 1,
        }
      }
    ]);

    const formattedQuestions = questions.map((question) => ({
      id: question._id,
      questionText: question.question_text,
      options: {
        A: question.option_a,
        B: question.option_b,
        C: question.option_c,
        D: question.option_d,
      },
      difficulty: question.difficulty,
      points: question.points || 1,
    }));

    res.json({
      success: true,
      data: {
        questions: formattedQuestions,
      },
    });
  } catch (error) {
    console.error("Get quiz questions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get quiz questions",
    });
  }
});

// Get question by ID (Admin only)
router.get("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('skillId', 'name')
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.json({
      success: true,
      data: {
        question: {
          id: question._id,
          skillId: (question.skillId as any)._id,
          skillName: (question.skillId as any).name,
          questionText: question.questionText,
          options: {
            A: question.optionA,
            B: question.optionB,
            C: question.optionC,
            D: question.optionD,
          },
          correctAnswer: question.correctAnswer,
          difficulty: question.difficulty,
          points: question.points,
          isActive: question.isActive,
          createdAt: question.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get question",
    });
  }
});

// Create question (Admin only)
router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  validate(questionSchemas.create),
  async (req, res) => {
    try {
      const {
        skillId,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        difficulty,
        points,
      } = req.body;

      // Check if skill exists
      const skill = await Skill.findById(skillId);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      // Create question
      const question = new Question({
        skillId,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        difficulty,
        points,
      });

      await question.save();

      // Clear cache
      await cacheDel("questions:*");

      res.status(201).json({
        success: true,
        message: "Question created successfully",
        data: {
          question: {
            id: question._id,
            skillId,
            questionText,
            options: {
              A: optionA,
              B: optionB,
              C: optionC,
              D: optionD,
            },
            correctAnswer,
            difficulty,
            points,
            isActive: true,
          },
        },
      });
    } catch (error) {
      console.error("Create question error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create question",
      });
    }
  }
);

// Update question (Admin only)
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validate(questionSchemas.update),
  async (req, res) => {
    try {
      const {
        skillId,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        difficulty,
        points,
        isActive,
      } = req.body;

      // Check if question exists
      const question = await Question.findById(req.params.id);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      // Check if skill exists (if updating skill)
      if (skillId) {
        const skill = await Skill.findById(skillId);
        if (!skill) {
          return res.status(404).json({
            success: false,
            message: "Skill not found",
          });
        }
      }

      // Update fields
      if (skillId !== undefined) question.skillId = skillId;
      if (questionText !== undefined) question.questionText = questionText;
      if (optionA !== undefined) question.optionA = optionA;
      if (optionB !== undefined) question.optionB = optionB;
      if (optionC !== undefined) question.optionC = optionC;
      if (optionD !== undefined) question.optionD = optionD;
      if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
      if (difficulty !== undefined) question.difficulty = difficulty;
      if (points !== undefined) question.points = points;
      if (typeof isActive === "boolean") question.isActive = isActive;

      await question.save();

      // Clear cache
      await cacheDel("questions:*");

      res.json({
        success: true,
        message: "Question updated successfully",
      });
    } catch (error) {
      console.error("Update question error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update question",
      });
    }
  }
);

// Delete question (Admin only)
router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    // Check if question exists
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    // Clear cache
    await cacheDel("questions:*");

    res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete question",
    });
  }
});

export default router;