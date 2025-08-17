// Route: /api/reports/user/:userId/skill-usage
// Returns all available skills with: { skillName, count, bestScore } for the user

import { Router } from "express";
import { Skill, QuizAttempt } from "../models";

const router = Router();

router.get("/user/:userId/skill-usage", async (req, res) => {
  const userId = req.params.userId;
  try {
    // Get all skills
    const skills = await Skill.find().select('_id name').lean();
    
    // Get all quiz attempts for this user
    const attempts = await QuizAttempt.find({ user_id: userId })
      .select('skill_id score_percentage')
      .lean();
    
    // Build stats for each skill
    const skillStats = skills.map((skill) => {
      const userAttempts = attempts.filter(
        (a) => a.skill_id.toString() === skill._id.toString()
      );
      return {
        skillName: skill.name,
        count: userAttempts.length,
        bestScore:
          userAttempts.length > 0
            ? Math.max(...userAttempts.map((a) => a.score_percentage))
            : 0,
      };
    });
    
    // Sort by count desc
    skillStats.sort((a, b) => b.count - a.count);
    res.json({ success: true, data: skillStats });
  } catch (err) {
    console.error('Error in skill-usage route:', err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch skill usage", error: err });
  }
});

export default router;
