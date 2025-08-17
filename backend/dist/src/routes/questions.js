"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const redis_1 = require("../config/redis");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question management (admin only)
 */
// Get all questions (Admin only)
router.get("/", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skillId = req.query.skillId || "";
        const difficulty = req.query.difficulty || "";
        const search = req.query.search || "";
        // Build query conditions
        const query = {};
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
        const total = await models_1.Question.countDocuments(query);
        // Get questions with skill info
        const questions = await models_1.Question.find(query)
            .populate('skillId', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        const formattedQuestions = questions.map((question) => ({
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
    }
    catch (error) {
        console.error("Get questions error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get questions",
        });
    }
});
// Get questions for quiz (User)
router.get("/quiz/:skillId", auth_1.authenticate, async (req, res) => {
    try {
        const skillId = req.params.skillId;
        const limit = parseInt(req.query.limit) || 10;
        // Check if skill exists
        const skill = await models_1.Skill.findById(skillId).where({ isActive: true });
        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found or inactive",
            });
        }
        // Get random questions for the skill
        const questions = await models_1.Question.aggregate([
            { $match: { skillId: skill._id, isActive: true } },
            { $sample: { size: limit } },
            {
                $project: {
                    _id: 1,
                    questionText: 1,
                    optionA: 1,
                    optionB: 1,
                    optionC: 1,
                    optionD: 1,
                    difficulty: 1,
                    points: 1,
                }
            }
        ]);
        const formattedQuestions = questions.map((question) => ({
            id: question._id,
            questionText: question.questionText,
            options: {
                A: question.optionA,
                B: question.optionB,
                C: question.optionC,
                D: question.optionD,
            },
            difficulty: question.difficulty,
            points: question.points,
        }));
        res.json({
            success: true,
            data: {
                questions: formattedQuestions,
            },
        });
    }
    catch (error) {
        console.error("Get quiz questions error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get quiz questions",
        });
    }
});
// Get question by ID (Admin only)
router.get("/:id", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        const question = await models_1.Question.findById(req.params.id)
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
                },
            },
        });
    }
    catch (error) {
        console.error("Get question error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get question",
        });
    }
});
// Create question (Admin only)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), (0, validation_1.validate)(validation_1.questionSchemas.create), async (req, res) => {
    try {
        const { skillId, questionText, optionA, optionB, optionC, optionD, correctAnswer, difficulty, points, } = req.body;
        // Check if skill exists
        const skill = await models_1.Skill.findById(skillId);
        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found",
            });
        }
        // Create question
        const question = new models_1.Question({
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
        await (0, redis_1.cacheDel)("questions:*");
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
    }
    catch (error) {
        console.error("Create question error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create question",
        });
    }
});
// Update question (Admin only)
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), (0, validation_1.validate)(validation_1.questionSchemas.update), async (req, res) => {
    try {
        const { skillId, questionText, optionA, optionB, optionC, optionD, correctAnswer, difficulty, points, isActive, } = req.body;
        // Check if question exists
        const question = await models_1.Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }
        // Check if skill exists (if updating skill)
        if (skillId) {
            const skill = await models_1.Skill.findById(skillId);
            if (!skill) {
                return res.status(404).json({
                    success: false,
                    message: "Skill not found",
                });
            }
        }
        // Update fields
        if (skillId !== undefined)
            question.skillId = skillId;
        if (questionText !== undefined)
            question.questionText = questionText;
        if (optionA !== undefined)
            question.optionA = optionA;
        if (optionB !== undefined)
            question.optionB = optionB;
        if (optionC !== undefined)
            question.optionC = optionC;
        if (optionD !== undefined)
            question.optionD = optionD;
        if (correctAnswer !== undefined)
            question.correctAnswer = correctAnswer;
        if (difficulty !== undefined)
            question.difficulty = difficulty;
        if (points !== undefined)
            question.points = points;
        if (typeof isActive === "boolean")
            question.isActive = isActive;
        await question.save();
        // Clear cache
        await (0, redis_1.cacheDel)("questions:*");
        res.json({
            success: true,
            message: "Question updated successfully",
        });
    }
    catch (error) {
        console.error("Update question error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update question",
        });
    }
});
// Delete question (Admin only)
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        // Check if question exists
        const question = await models_1.Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }
        await models_1.Question.findByIdAndDelete(req.params.id);
        // Clear cache
        await (0, redis_1.cacheDel)("questions:*");
        res.json({
            success: true,
            message: "Question deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete question error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete question",
        });
    }
});
exports.default = router;
//# sourceMappingURL=questions.js.map