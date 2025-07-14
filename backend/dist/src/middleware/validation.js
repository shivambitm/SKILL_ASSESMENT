"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizSchemas = exports.questionSchemas = exports.skillSchemas = exports.authSchemas = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
// Enhanced validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const detailedErrors = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            }));
            console.log("Validation error:", {
                path: req.path,
                method: req.method,
                body: req.body,
                user: req.user?.userId,
                errors: detailedErrors,
            });
            return res.status(400).json({
                success: false,
                message: "Validation error",
                details: detailedErrors,
            });
        }
        next();
    };
};
exports.validate = validate;
// Common validation schemas
exports.authSchemas = {
    register: joi_1.default.object({
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().min(6).required(),
        firstName: joi_1.default.string().min(2).max(50).required(),
        lastName: joi_1.default.string().min(2).max(50).required(),
    }),
    login: joi_1.default.object({
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().required(),
    }),
};
exports.skillSchemas = {
    create: joi_1.default.object({
        name: joi_1.default.string().min(2).max(255).required(),
        description: joi_1.default.string().max(1000),
        category: joi_1.default.string().max(100),
    }),
    update: joi_1.default.object({
        name: joi_1.default.string().min(2).max(255),
        description: joi_1.default.string().max(1000),
        category: joi_1.default.string().max(100),
        isActive: joi_1.default.boolean(),
    }),
};
exports.questionSchemas = {
    create: joi_1.default.object({
        skillId: joi_1.default.number().integer().positive().required(),
        questionText: joi_1.default.string().min(10).required(),
        optionA: joi_1.default.string().min(1).max(500).required(),
        optionB: joi_1.default.string().min(1).max(500).required(),
        optionC: joi_1.default.string().min(1).max(500).required(),
        optionD: joi_1.default.string().min(1).max(500).required(),
        correctAnswer: joi_1.default.string().valid("A", "B", "C", "D").required(),
        difficulty: joi_1.default.string().valid("easy", "medium", "hard").default("medium"),
        points: joi_1.default.number().integer().min(1).max(10).default(1),
    }),
    update: joi_1.default.object({
        skillId: joi_1.default.number().integer().positive(),
        questionText: joi_1.default.string().min(10),
        optionA: joi_1.default.string().min(1).max(500),
        optionB: joi_1.default.string().min(1).max(500),
        optionC: joi_1.default.string().min(1).max(500),
        optionD: joi_1.default.string().min(1).max(500),
        correctAnswer: joi_1.default.string().valid("A", "B", "C", "D"),
        difficulty: joi_1.default.string().valid("easy", "medium", "hard"),
        points: joi_1.default.number().integer().min(1).max(10),
        isActive: joi_1.default.boolean(),
    }),
};
exports.quizSchemas = {
    submitAnswer: joi_1.default.object({
        quizAttemptId: joi_1.default.number().integer().positive().required(),
        questionId: joi_1.default.number().integer().positive().required(),
        selectedAnswer: joi_1.default.string().valid("A", "B", "C", "D").required(),
        timeTaken: joi_1.default.number().integer().min(0).default(0),
    }),
    completeQuiz: joi_1.default.object({
        quizAttemptId: joi_1.default.number().integer().positive().required(),
        timeTaken: joi_1.default.number().integer().min(0).default(0),
    }),
};
//# sourceMappingURL=validation.js.map