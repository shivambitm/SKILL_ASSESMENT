import { Request, Response, NextFunction } from "express";
import Joi from "joi";

// Enhanced validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const detailedErrors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        type: detail.type,
        value: detail.context?.value,
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

// Common validation schemas
export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const skillSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(1000),
    category: Joi.string().max(100),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255),
    description: Joi.string().max(1000),
    category: Joi.string().max(100),
    isActive: Joi.boolean(),
  }),
};

export const questionSchemas = {
  create: Joi.object({
    skillId: Joi.number().integer().positive().required(),
    questionText: Joi.string().min(10).required(),
    optionA: Joi.string().min(1).max(500).required(),
    optionB: Joi.string().min(1).max(500).required(),
    optionC: Joi.string().min(1).max(500).required(),
    optionD: Joi.string().min(1).max(500).required(),
    correctAnswer: Joi.string().valid("A", "B", "C", "D").required(),
    difficulty: Joi.string().valid("easy", "medium", "hard").default("medium"),
    points: Joi.number().integer().min(1).max(10).default(1),
  }),

  update: Joi.object({
    skillId: Joi.number().integer().positive(),
    questionText: Joi.string().min(10),
    optionA: Joi.string().min(1).max(500),
    optionB: Joi.string().min(1).max(500),
    optionC: Joi.string().min(1).max(500),
    optionD: Joi.string().min(1).max(500),
    correctAnswer: Joi.string().valid("A", "B", "C", "D"),
    difficulty: Joi.string().valid("easy", "medium", "hard"),
    points: Joi.number().integer().min(1).max(10),
    isActive: Joi.boolean(),
  }),
};

export const quizSchemas = {
  submitAnswer: Joi.object({
    quizAttemptId: Joi.number().integer().positive().required(),
    questionId: Joi.number().integer().positive().required(),
    selectedAnswer: Joi.string().valid("A", "B", "C", "D").required(),
    timeTaken: Joi.number().integer().min(0).default(0),
  }),

  completeQuiz: Joi.object({
    quizAttemptId: Joi.number().integer().positive().required(),
    timeTaken: Joi.number().integer().min(0).default(0),
  }),
};
