import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { generateQuestions } from '../services/aiService';
import { pool } from '../config/database';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for AI generation (expensive operation)
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: 'Too many AI generation requests, please try again later.'
});

// Generate questions using AI
router.post('/generate', authenticate, authorize(['admin']), aiRateLimit, async (req, res) => {
  try {
    const { skillId, difficulty = 'medium', count = 5 } = req.body;

    if (!skillId) {
      return res.status(400).json({
        success: false,
        message: 'Skill ID is required'
      });
    }

    // Get skill name
    const [skillRows] = await pool.execute(
      'SELECT name FROM skills WHERE id = ?',
      [skillId]
    );

    const skills = skillRows as any[];
    if (skills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    const skillName = skills[0].name;

    // Generate questions using AI
    const generatedQuestions = await generateQuestions(skillName, difficulty, count);

    // Save to database
    const savedQuestions = [];
    for (const question of generatedQuestions) {
      const [result] = await pool.execute(
        `INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, points, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          skillId,
          question.question_text,
          question.option_a,
          question.option_b,
          question.option_c,
          question.option_d,
          question.correct_answer,
          question.difficulty
        ]
      );

      savedQuestions.push({
        id: (result as any).lastInsertRowid,
        ...question
      });
    }

    res.json({
      success: true,
      message: `Generated ${savedQuestions.length} questions using AI`,
      data: {
        questions: savedQuestions,
        skill: skillName
      }
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate questions'
    });
  }
});

// Preview questions without saving
router.post('/preview', authenticate, authorize(['admin']), aiRateLimit, async (req, res) => {
  try {
    const { skillName, difficulty = 'medium', count = 3 } = req.body;

    if (!skillName) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    const generatedQuestions = await generateQuestions(skillName, difficulty, count);

    res.json({
      success: true,
      message: 'Questions generated successfully',
      data: {
        questions: generatedQuestions,
        preview: true
      }
    });

  } catch (error) {
    console.error('AI Preview Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate preview'
    });
  }
});

export default router;