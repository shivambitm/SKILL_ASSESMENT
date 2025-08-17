import express from "express";
import { Skill, Question } from "../models";
import { authenticate, authorize } from "../middleware/auth";
import { validate, skillSchemas } from "../middleware/validation";
import { cacheGet, cacheSet, cacheDel } from "../config/redis";

const router = express.Router();

/**
 * @swagger
 * /skills:
 *   get:
 *     summary: Get all skills
 *     tags: [Skills]
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
 *         description: Number of skills per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term (name or description)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Skill category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of skills
 *       401:
 *         description: Unauthorized
 */

// Get all skills
router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const isActive = (req.query.isActive as string) || "";

    // Try to get from cache first
    const cacheKey = `skills:${page}:${limit}:${search}:${category}:${isActive}`;
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Build query conditions
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (isActive === "true") {
      query.isActive = true;
    } else if (isActive === "false") {
      query.isActive = false;
    }

    // Get total count
    const total = await Skill.countDocuments(query);

    // Get skills with pagination
    const skills = await Skill.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const items = skills.map((skill) => ({
      id: skill._id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      isActive: skill.isActive,
      createdAt: skill.createdAt,
    }));

    const response = {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

    // Cache the response
    await cacheSet(cacheKey, JSON.stringify(response), 300); // Cache for 5 minutes

    res.json(response);
  } catch (error) {
    console.error("Get skills error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get skills",
    });
  }
});

// Get a skill by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    res.json({
      success: true,
      data: {
        skill: {
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          isActive: skill.isActive,
          createdAt: skill.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get skill error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get skill",
    });
  }
});

// Create a new skill (Admin only)
router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  validate(skillSchemas.create),
  async (req, res) => {
    try {
      const { name, description, category } = req.body;

      // Check if skill already exists
      const existingSkill = await Skill.findOne({ name });
      if (existingSkill) {
        return res.status(400).json({
          success: false,
          message: "Skill with this name already exists",
        });
      }

      // Create skill
      const skill = new Skill({
        name,
        description,
        category,
      });

      await skill.save();

      // Clear cache
      await cacheDel("skills:*");

      res.status(201).json({
        success: true,
        message: "Skill created successfully",
        data: {
          skill: {
            id: skill._id,
            name: skill.name,
            description: skill.description,
            category: skill.category,
            isActive: skill.isActive,
          },
        },
      });
    } catch (error) {
      console.error("Create skill error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create skill",
      });
    }
  }
);

// Update a skill (Admin only)
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  validate(skillSchemas.update),
  async (req, res) => {
    try {
      const { name, description, category, isActive } = req.body;

      // Check if skill exists
      const skill = await Skill.findById(req.params.id);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      // Check if name is unique (excluding current skill)
      if (name && name !== skill.name) {
        const existingSkill = await Skill.findOne({ name, _id: { $ne: skill._id } });
        if (existingSkill) {
          return res.status(400).json({
            success: false,
            message: "Skill with this name already exists",
          });
        }
      }

      // Update fields
      if (name !== undefined) skill.name = name;
      if (description !== undefined) skill.description = description;
      if (category !== undefined) skill.category = category;
      if (typeof isActive === "boolean") skill.isActive = isActive;

      await skill.save();

      // Clear cache
      await cacheDel("skills:*");

      res.json({
        success: true,
        message: "Skill updated successfully",
      });
    } catch (error) {
      console.error("Update skill error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update skill",
      });
    }
  }
);

// Delete a skill (Admin only)
router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    // Check if skill exists
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    // Check if skill has associated questions
    const questionCount = await Question.countDocuments({ skill_id: skill._id });
    if (questionCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete skill with associated questions",
      });
    }

    await Skill.findByIdAndDelete(req.params.id);

    // Clear cache
    await cacheDel("skills:*");

    res.json({
      success: true,
      message: "Skill deleted successfully",
    });
  } catch (error) {
    console.error("Delete skill error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete skill",
    });
  }
});

// Get all skill categories
router.get("/categories/list", authenticate, async (req, res) => {
  try {
    const categories = await Skill.distinct("category", { 
      category: { $ne: null, $ne: "" } 
    });

    res.json({
      success: true,
      data: {
        categories: categories.sort(),
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
});

// Create a skill with questions (Admin only)
router.post(
  "/with-questions",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      console.log("[ADMIN] /with-questions request body:", req.body);
      const { name, questions } = req.body;
      let { description = null, category = null } = req.body;
      
      if (!name || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Skill name and at least one question are required.",
        });
      }

      // Convert empty strings to null for DB consistency
      if (description === "") description = null;
      if (category === "") category = null;

      // Check if skill already exists
      const existingSkill = await Skill.findOne({ name });
      if (existingSkill) {
        return res.status(400).json({
          success: false,
          message: "Skill with this name already exists",
        });
      }

      // Create skill
      const skill = new Skill({
        name,
        description,
        category,
      });

      await skill.save();

      // Insert questions
      const questionDocs = questions.map(q => ({
        skill_id: skill._id,
        question_text: q.questionText,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
        correct_answer: q.correctAnswer,
        difficulty: q.difficulty || 'easy',
        is_active: true,
      }));

      await Question.insertMany(questionDocs);

      // Clear cache
      await cacheDel("skills:*");
      await cacheDel("questions:*");

      res.status(201).json({
        success: true,
        message: "Skill and questions created successfully.",
        data: {
          skill: { id: skill._id, name: skill.name },
          questionsCount: questions.length,
        },
      });
    } catch (error) {
      console.error("Create skill with questions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create skill and questions",
      });
    }
  }
);

export default router;