// Route: /api/reports/user/:userId/skill-usage
// Returns all available skills with: { skillName, count, bestScore } for the user

import { Router } from "express";
import { pool } from "../config/database";

const router = Router();

router.get("/user/:userId/skill-usage", async (req, res) => {
  const userId = req.params.userId;
  try {
    // Get all skills
    const [skillsRaw] = await pool.execute("SELECT id, name FROM skills");
    const skills: { id: number; name: string }[] = Array.isArray(skillsRaw)
      ? (skillsRaw as any)
      : [];
    // Get all quiz attempts for this user
    const [attemptsRaw] = await pool.execute(
      "SELECT skill_id, score_percentage FROM quiz_attempts WHERE user_id = ?",
      [userId]
    );
    const attempts: { skill_id: number; score_percentage: number }[] =
      Array.isArray(attemptsRaw) ? (attemptsRaw as any) : [];
    // Build stats for each skill
    const skillStats = skills.map((skill: { id: number; name: string }) => {
      const userAttempts = attempts.filter(
        (a: { skill_id: number; score_percentage: number }) =>
          a.skill_id === skill.id
      );
      return {
        skillName: skill.name,
        count: userAttempts.length,
        bestScore:
          userAttempts.length > 0
            ? Math.max(
                ...userAttempts.map(
                  (a: { score_percentage: number }) => a.score_percentage
                )
              )
            : 0,
      };
    });
    // Sort by count desc
    skillStats.sort((a, b) => b.count - a.count);
    res.json({ success: true, data: skillStats });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch skill usage" });
  }
});

export default router;
