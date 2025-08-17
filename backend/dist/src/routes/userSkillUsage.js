"use strict";
// Route: /api/reports/user/:userId/skill-usage
// Returns all available skills with: { skillName, count, bestScore } for the user
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get("/user/:userId/skill-usage", async (req, res) => {
    const userId = req.params.userId;
    try {
        // Get all skills
        const skills = await models_1.Skill.find().select('_id name').lean();
        // Get all quiz attempts for this user
        const attempts = await models_1.QuizAttempt.find({ user_id: userId })
            .select('skill_id score_percentage')
            .lean();
        // Build stats for each skill
        const skillStats = skills.map((skill) => {
            const userAttempts = attempts.filter((a) => a.skill_id.toString() === skill._id.toString());
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
        console.error('Error in skill-usage route:', err);
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch skill usage", error: err });
    }
});
exports.default = router;
//# sourceMappingURL=userSkillUsage.js.map