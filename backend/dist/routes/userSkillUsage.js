"use strict";
// Route: /api/reports/user/:userId/skill-usage
// Returns all available skills with: { skillName, count, bestScore } for the user
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get("/user/:userId/skill-usage", async (req, res) => {
    const userId = req.params.userId;
    try {
        // Get all skills
        const [skillsRaw] = await database_1.pool.execute("SELECT id, name FROM skills");
        const skills = Array.isArray(skillsRaw)
            ? skillsRaw
            : [];
        // Get all quiz attempts for this user
        const [attemptsRaw] = await database_1.pool.execute("SELECT skill_id, score_percentage FROM quiz_attempts WHERE user_id = ?", [userId]);
        const attempts = Array.isArray(attemptsRaw) ? attemptsRaw : [];
        // Build stats for each skill
        const skillStats = skills.map((skill) => {
            const userAttempts = attempts.filter((a) => a.skill_id === skill.id);
            return {
                skillName: skill.name,
                count: userAttempts.length,
                bestScore: userAttempts.length > 0
                    ? Math.max(...userAttempts.map((a) => a.score_percentage))
                    : 0,
            };
        });
        // Sort by count desc
        skillStats.sort((a, b) => b.count - a.count);
        res.json({ success: true, data: skillStats });
    }
    catch (err) {
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch skill usage" });
    }
});
exports.default = router;
//# sourceMappingURL=userSkillUsage.js.map