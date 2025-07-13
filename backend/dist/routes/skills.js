"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const redis_1 = require("../config/redis");
const router = express_1.default.Router();
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
router.get("/", auth_1.authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const category = req.query.category || "";
        const isActive = req.query.isActive || "";
        const offset = (page - 1) * limit;
        // Try to get from cache first
        const cacheKey = `skills:${page}:${limit}:${search}:${category}:${isActive}`;
        const cachedData = await (0, redis_1.cacheGet)(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
        // Build query conditions
        let whereClause = "WHERE 1=1";
        const queryParams = [];
        if (search) {
            whereClause += " AND (name LIKE ? OR description LIKE ?)";
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            whereClause += " AND category = ?";
            queryParams.push(category);
        }
        if (isActive === "true") {
            whereClause += " AND is_active = true";
        }
        else if (isActive === "false") {
            whereClause += " AND is_active = false";
        }
        // Get total count
        const [countResult] = await database_1.pool.execute(`SELECT COUNT(*) as total FROM skills ${whereClause}`, queryParams);
        const total = countResult[0].total;
        // Get skills
        const [rows] = await database_1.pool.execute(`SELECT id, name, description, category, is_active, created_at 
       FROM skills ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);
        const items = rows.map((skill) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            category: skill.category,
            isActive: skill.is_active,
            createdAt: skill.created_at,
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
        await (0, redis_1.cacheSet)(cacheKey, JSON.stringify(response), 300); // Cache for 5 minutes
        res.json(response);
    }
    catch (error) {
        console.error("Get skills error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get skills",
        });
    }
});
/**
 * @swagger
 * /skills/{id}:
 *   get:
 *     summary: Get a skill by ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Skill ID
 *     responses:
 *       200:
 *         description: Skill details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Skill not found
 */
router.get("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const skillId = parseInt(req.params.id);
        const [rows] = await database_1.pool.execute("SELECT id, name, description, category, is_active, created_at FROM skills WHERE id = ?", [skillId]);
        const skills = rows;
        if (skills.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }
        const skill = skills[0];
        res.json({
            success: true,
            data: {
                skill: {
                    id: skill.id,
                    name: skill.name,
                    description: skill.description,
                    category: skill.category,
                    isActive: skill.is_active,
                    createdAt: skill.created_at,
                },
            },
        });
    }
    catch (error) {
        console.error("Get skill error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get skill",
        });
    }
});
/**
 * @swagger
 * /skills:
 *   post:
 *     summary: Create a new skill (Admin only)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Skill created successfully
 *       400:
 *         description: Skill with this name already exists or invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), (0, validation_1.validate)(validation_1.skillSchemas.create), async (req, res) => {
    try {
        const { name, description, category } = req.body;
        // Check if skill already exists
        const [existingSkills] = await database_1.pool.execute("SELECT id FROM skills WHERE name = ?", [name]);
        if (existingSkills.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Skill with this name already exists",
            });
        }
        // Create skill
        const [result] = await database_1.pool.execute("INSERT INTO skills (name, description, category) VALUES (?, ?, ?)", [name, description, category]);
        const skillId = result.lastInsertRowid;
        // Clear cache
        await (0, redis_1.cacheDel)("skills:*");
        res.status(201).json({
            success: true,
            message: "Skill created successfully",
            data: {
                skill: {
                    id: skillId,
                    name,
                    description,
                    category,
                    isActive: true,
                },
            },
        });
    }
    catch (error) {
        console.error("Create skill error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create skill",
        });
    }
});
/**
 * @swagger
 * /skills/{id}:
 *   put:
 *     summary: Update a skill (Admin only)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Skill ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Skill updated successfully
 *       400:
 *         description: No fields to update or duplicate name
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Skill not found
 */
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), (0, validation_1.validate)(validation_1.skillSchemas.update), async (req, res) => {
    try {
        const skillId = parseInt(req.params.id);
        const { name, description, category, isActive } = req.body;
        // Check if skill exists
        const [existingSkills] = await database_1.pool.execute("SELECT id FROM skills WHERE id = ?", [skillId]);
        if (existingSkills.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }
        // Check if name is unique (excluding current skill)
        if (name) {
            const [nameCheck] = await database_1.pool.execute("SELECT id FROM skills WHERE name = ? AND id != ?", [name, skillId]);
            if (nameCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Skill with this name already exists",
                });
            }
        }
        // Build update query
        const updateFields = [];
        const updateValues = [];
        if (name) {
            updateFields.push("name = ?");
            updateValues.push(name);
        }
        if (description !== undefined) {
            updateFields.push("description = ?");
            updateValues.push(description);
        }
        if (category !== undefined) {
            updateFields.push("category = ?");
            updateValues.push(category);
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
        updateValues.push(skillId);
        await database_1.pool.execute(`UPDATE skills SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);
        // Clear cache
        await (0, redis_1.cacheDel)("skills:*");
        res.json({
            success: true,
            message: "Skill updated successfully",
        });
    }
    catch (error) {
        console.error("Update skill error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update skill",
        });
    }
});
/**
 * @swagger
 * /skills/{id}:
 *   delete:
 *     summary: Delete a skill (Admin only)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Skill ID
 *     responses:
 *       200:
 *         description: Skill deleted successfully
 *       400:
 *         description: Cannot delete skill with associated questions
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Skill not found
 */
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        const skillId = parseInt(req.params.id);
        // Check if skill exists
        const [existingSkills] = await database_1.pool.execute("SELECT id FROM skills WHERE id = ?", [skillId]);
        if (existingSkills.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }
        // Check if skill has associated questions
        const [questionsCheck] = await database_1.pool.execute("SELECT COUNT(*) as count FROM questions WHERE skill_id = ?", [skillId]);
        const questionCount = questionsCheck[0].count;
        if (questionCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete skill with associated questions",
            });
        }
        await database_1.pool.execute("DELETE FROM skills WHERE id = ?", [skillId]);
        // Clear cache
        await (0, redis_1.cacheDel)("skills:*");
        res.json({
            success: true,
            message: "Skill deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete skill error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete skill",
        });
    }
});
/**
 * @swagger
 * /skills/categories/list:
 *   get:
 *     summary: Get all skill categories
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of skill categories
 *       401:
 *         description: Unauthorized
 */
router.get("/categories/list", auth_1.authenticate, async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute('SELECT DISTINCT category FROM skills WHERE category IS NOT NULL AND category != "" ORDER BY category');
        const categories = rows.map((row) => row.category);
        res.json({
            success: true,
            data: {
                categories,
            },
        });
    }
    catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get categories",
        });
    }
});
/**
 * @swagger
 * /skills/with-questions:
 *   post:
 *     summary: Create a skill with questions (Admin only)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - questions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionText
 *                     - optionA
 *                     - optionB
 *                     - optionC
 *                     - optionD
 *                     - correctAnswer
 *                   properties:
 *                     questionText:
 *                       type: string
 *                     optionA:
 *                       type: string
 *                     optionB:
 *                       type: string
 *                     optionC:
 *                       type: string
 *                     optionD:
 *                       type: string
 *                     correctAnswer:
 *                       type: string
 *     responses:
 *       201:
 *         description: Skill and questions created successfully
 *       400:
 *         description: Skill with this name already exists or invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/with-questions", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        // Log the incoming request body for debugging
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
        if (description === "")
            description = null;
        if (category === "")
            category = null;
        // Check if skill already exists
        const [existingSkills] = await database_1.pool.execute("SELECT id FROM skills WHERE name = ?", [name]);
        if (existingSkills.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Skill with this name already exists",
            });
        }
        // Create skill (description/category from request body)
        const [result] = await database_1.pool.execute("INSERT INTO skills (name, description, category) VALUES (?, ?, ?)", [name, description, category]);
        const skillId = result.lastInsertRowid || result.insertId;
        // Insert questions
        for (const q of questions) {
            console.log("[ADMIN] Inserting question:", q);
            await database_1.pool.execute(`INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`, [
                skillId,
                q.questionText,
                q.optionA,
                q.optionB,
                q.optionC,
                q.optionD,
                q.correctAnswer,
            ]);
        }
        // Optionally: Generate a seed script file for this skill+questions
        // (Node.js script, similar to your seed_project_management_questions.js)
        const fs = require("fs");
        const path = require("path");
        const scriptName = `seed_${name
            .replace(/\s+/g, "_")
            .toLowerCase()}_questions.js`;
        const scriptsDir = path.join(__dirname, "../scripts");
        // Ensure the scripts directory exists
        if (!fs.existsSync(scriptsDir)) {
            fs.mkdirSync(scriptsDir, { recursive: true });
        }
        const scriptPath = path.join(scriptsDir, scriptName);
        const questionsArr = questions
            .map((q) => `  [\n    ${skillId},\n    ${JSON.stringify(q.questionText)},\n    ${JSON.stringify(q.optionA)},\n    ${JSON.stringify(q.optionB)},\n    ${JSON.stringify(q.optionC)},\n    ${JSON.stringify(q.optionD)},\n    ${JSON.stringify(q.correctAnswer)},\n    1,\n  ]`)
            .join(",\n");
        const scriptContent = `// Node.js script to seed ${name} questions into SQLite\nconst sqlite3 = require(\"sqlite3\").verbose();\nconst path = require(\"path\");\n\nconst dbPath = path.join(__dirname, \"../skill_assessment.db\");\nconst db = new sqlite3.Database(dbPath);\n\nconst questions = [\n${questionsArr}\n];\n\ndb.serialize(() => {\n  const stmt = db.prepare(\n    \`INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)\`\n  );\n  questions.forEach((q) =>\n    stmt.run(q, (err) => {\n      if (err) {\n        console.error(\"Error inserting question:\", err.message);\n      }\n    })\n  );\n  stmt.finalize(() => {\n    console.log(\"${name} questions seeded successfully.\");\n    db.close();\n  });\n});\n`;
        fs.writeFileSync(scriptPath, scriptContent);
        // Clear cache
        await (0, redis_1.cacheDel)("skills:*");
        await (0, redis_1.cacheDel)("questions:*");
        res.status(201).json({
            success: true,
            message: "Skill and questions created successfully. Seed script generated.",
            data: {
                skill: { id: skillId, name },
                questionsCount: questions.length,
                seedScript: scriptName,
            },
        });
    }
    catch (error) {
        console.error("Create skill with questions error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create skill and questions",
        });
    }
});
exports.default = router;
//# sourceMappingURL=skills.js.map