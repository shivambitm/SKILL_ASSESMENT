import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import { Question } from "../models";

const router = express.Router();

// Test route to verify the endpoint is working
router.get("/questions/test", (req, res) => {
  res.json({
    success: true,
    message: "Admin questions route is working",
    timestamp: new Date().toISOString()
  });
});

// GET all questions
router.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find().populate('skill_id', 'name');
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Apply authentication and admin middleware to protected routes
router.use(authenticate);
router.use(authorize(['admin']));

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log(`🔧 Admin Questions Route: ${req.method} ${req.path}`);
  console.log('📝 Request body:', req.body);
  next();
});

// Edit a question
router.put("/questions/:id", async (req, res) => {
  try {
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty,
      is_active,
    } = req.body;

    // Validate required fields
    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      {
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        difficulty,
        is_active: Boolean(is_active),
      },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    res.json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update question",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a question
router.post("/questions", async (req, res) => {
  try {
    const {
      skill_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty,
      is_active = true,
    } = req.body;

    // Validate required fields
    if (!skill_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Validate correct_answer is one of A, B, C, D
    if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return res.status(400).json({
        success: false,
        message: "Correct answer must be A, B, C, or D"
      });
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be easy, medium, or hard"
      });
    }

    const question = new Question({
      skill_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      difficulty,
      is_active: Boolean(is_active),
    });

    const savedQuestion = await question.save();

    res.status(201).json({
      success: true,
      message: "Question added successfully",
      data: { id: savedQuestion._id }
    });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({
      success: false,
      message: "Failed to add question",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a question
router.delete("/questions/:id", async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndDelete(req.params.id);
    
    if (!deletedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }
    
    res.json({
      success: true,
      message: "Question deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete question",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
