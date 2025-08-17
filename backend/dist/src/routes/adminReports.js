"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin: Get all user reports (summary)
router.get("/reports", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        // Get all non-admin users
        const users = await models_1.User.find({ isActive: true, role: 'user' })
            .select('_id email firstName lastName createdAt')
            .lean();
        // For each user, get quiz stats
        const userReports = await Promise.all(users.map(async (user) => {
            const stats = await models_1.QuizAttempt.aggregate([
                { $match: { user_id: user._id, completed_at: { $ne: null } } },
                {
                    $group: {
                        _id: null,
                        total_quizzes: { $sum: 1 },
                        total_correct: { $sum: "$correct_answers" },
                        avg_score: { $avg: "$score_percentage" }
                    }
                }
            ]);
            const stat = stats[0] || {};
            return {
                id: user._id,
                username: user.firstName + " " + user.lastName,
                email: user.email,
                registeredAt: user.createdAt,
                totalQuizzes: stat.total_quizzes || 0,
                totalCorrect: stat.total_correct || 0,
                avgScore: stat.avg_score ? Math.round(stat.avg_score * 100) / 100 : 0,
            };
        }));
        res.json({ success: true, reports: userReports });
    }
    catch (error) {
        console.error("Admin user reports error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to get user reports" });
    }
});
exports.default = router;
//# sourceMappingURL=adminReports.js.map