import express from "express";
import { pool } from "../config/database";
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

/**
 * @swagger
 * /api/questions/:
 *   get:
 *     summary: Get all questions
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Page size
 *       - in: query
 *         name: skillId
 *         schema:
 *           type: string
 *         description: Filter by skill
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by question text
 *     responses:
 *       200:
 *         description: List of questions
 *       401:
 *         description: Unauthorized
 */

// Get all questions (Admin only)
router.get("/", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skillId = (req.query.skillId as string) || "";
    const difficulty = (req.query.difficulty as string) || "";
    const search = (req.query.search as string) || "";

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (skillId) {
      whereClause += " AND q.skill_id = ?";
      queryParams.push(skillId);
    }

    if (difficulty) {
      whereClause += " AND q.difficulty = ?";
      queryParams.push(difficulty);
    }

    if (search) {
      whereClause += " AND q.question_text LIKE ?";
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM questions q ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // Get questions with skill info
    const [rows] = await pool.execute(
      `SELECT q.id, q.skill_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, 
              q.correct_answer, q.difficulty, q.points, q.is_active, q.created_at, 
              s.name as skill_name
       FROM questions q
       LEFT JOIN skills s ON q.skill_id = s.id
       ${whereClause}
       ORDER BY q.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const questions = (rows as any[]).map((question) => ({
      id: question.id,
      skillId: question.skill_id,
      skillName: question.skill_name,
      questionText: question.question_text,
      options: {
        A: question.option_a,
        B: question.option_b,
        C: question.option_c,
        D: question.option_d,
      },
      correctAnswer: question.correct_answer,
      difficulty: question.difficulty,
      points: question.points,
      isActive: question.is_active,
      createdAt: question.created_at,
    }));

    res.json({
      success: true,
      data: {
        questions,
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
/**
 * @swagger
 * /api/questions/quiz/{skillId}:
 *   get:
 *     summary: Get quiz questions for a skill
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Skill ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of questions
 *     responses:
 *       200:
 *         description: List of quiz questions
 *       401:
 *         description: Unauthorized
 */

// Get questions for quiz (User)
router.get("/quiz/:skillId", authenticate, async (req, res) => {
  try {
    const skillId = parseInt(req.params.skillId);
    const limit = parseInt(req.query.limit as string) || 10;

    // Check if skill exists
    const [skillCheck] = await pool.execute(
      "SELECT id FROM skills WHERE id = ? AND is_active = true",
      [skillId]
    );

    if ((skillCheck as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: "Skill not found or inactive",
      });
    }

    // Get random questions for the skill
    const [rows] = await pool.execute(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, difficulty, points
       FROM questions 
       WHERE skill_id = ? AND is_active = true 
       ORDER BY RANDOM() 
       LIMIT ?`,
      [skillId, limit]
    );

    const questions = (rows as any[]).map((question) => ({
      id: question.id,
      questionText: question.question_text,
      options: {
        A: question.option_a,
        B: question.option_b,
        C: question.option_c,
        D: question.option_d,
      },
      difficulty: question.difficulty,
      points: question.points,
    }));

    res.json({
      success: true,
      data: {
        questions,
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
/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

// Get question by ID (Admin only)
router.get("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);

    const [rows] = await pool.execute(
      `SELECT q.id, q.skill_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, 
              q.correct_answer, q.difficulty, q.points, q.is_active, q.created_at, 
              s.name as skill_name
       FROM questions q
       LEFT JOIN skills s ON q.skill_id = s.id
       WHERE q.id = ?`,
      [questionId]
    );

    const questions = rows as any[];
    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const question = questions[0];

    res.json({
      success: true,
      data: {
        question: {
          id: question.id,
          skillId: question.skill_id,
          skillName: question.skill_name,
          questionText: question.question_text,
          options: {
            A: question.option_a,
            B: question.option_b,
            C: question.option_c,
            D: question.option_d,
          },
          correctAnswer: question.correct_answer,
          difficulty: question.difficulty,
          points: question.points,
          isActive: question.is_active,
          createdAt: question.created_at,
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
/**
 * @swagger
 * /api/questions/:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skillId:
 *                 type: integer
 *               questionText:
 *                 type: string
 *               optionA:
 *                 type: string
 *               optionB:
 *                 type: string
 *               optionC:
 *                 type: string
 *               optionD:
 *                 type: string
 *               correctAnswer:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               points:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Question created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

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
      const [skillCheck] = await pool.execute(
        "SELECT id FROM skills WHERE id = ?",
        [skillId]
      );

      if ((skillCheck as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      // Create question
      const [result] = await pool.execute(
        `INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, points) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          skillId,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          difficulty,
          points,
        ]
      );

      const questionId = (result as any).lastInsertRowid;

      // Clear cache
      await cacheDel("questions:*");

      res.status(201).json({
        success: true,
        message: "Question created successfully",
        data: {
          question: {
            id: questionId,
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
/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skillId:
 *                 type: integer
 *               questionText:
 *                 type: string
 *               optionA:
 *                 type: string
 *               optionB:
 *                 type: string
 *               optionC:
 *                 type: string
 *               optionD:
 *                 type: string
 *               correctAnswer:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               points:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Question updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

// Update question (Admin only)
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validate(questionSchemas.update),
  async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
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
      const [existingQuestions] = await pool.execute(
        "SELECT id FROM questions WHERE id = ?",
        [questionId]
      );

      if ((existingQuestions as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      // Check if skill exists (if updating skill)
      if (skillId) {
        const [skillCheck] = await pool.execute(
          "SELECT id FROM skills WHERE id = ?",
          [skillId]
        );

        if ((skillCheck as any[]).length === 0) {
          return res.status(404).json({
            success: false,
            message: "Skill not found",
          });
        }
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];

      if (skillId) {
        updateFields.push("skill_id = ?");
        updateValues.push(skillId);
      }
      if (questionText) {
        updateFields.push("question_text = ?");
        updateValues.push(questionText);
      }
      if (optionA) {
        updateFields.push("option_a = ?");
        updateValues.push(optionA);
      }
      if (optionB) {
        updateFields.push("option_b = ?");
        updateValues.push(optionB);
      }
      if (optionC) {
        updateFields.push("option_c = ?");
        updateValues.push(optionC);
      }
      if (optionD) {
        updateFields.push("option_d = ?");
        updateValues.push(optionD);
      }
      if (correctAnswer) {
        updateFields.push("correct_answer = ?");
        updateValues.push(correctAnswer);
      }
      if (difficulty) {
        updateFields.push("difficulty = ?");
        updateValues.push(difficulty);
      }
      if (points) {
        updateFields.push("points = ?");
        updateValues.push(points);
      }
      if (typeof isActive === "boolean") {
        updateFields.push("is_active = ?");
        updateValues.push(isActive);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      updateValues.push(questionId);

      await pool.execute(
        `UPDATE questions SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );

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
/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

// Delete question (Admin only)
router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);

    // Check if question exists
    const [existingQuestions] = await pool.execute(
      "SELECT id FROM questions WHERE id = ?",
      [questionId]
    );

    if ((existingQuestions as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await pool.execute("DELETE FROM questions WHERE id = ?", [questionId]);

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
