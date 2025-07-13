"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin: Get all user reports (summary)
router.get("/reports", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        // Use correct columns: no username, use first_name and last_name, and created_at
        // Only fetch users who are not admins
        const [users] = await database_1.pool.execute(`SELECT id, email, first_name, last_name, created_at FROM users WHERE is_active = true AND role = 'user'`);
        // For each user, get quiz stats
        const userReports = await Promise.all(users.map(async (user) => {
            const [stats] = await database_1.pool.execute(`SELECT COUNT(*) as total_quizzes, SUM(correct_answers) as total_correct, AVG(score_percentage) as avg_score FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL`, [user.id]);
            const stat = stats[0] || {};
            return {
                id: user.id,
                username: user.first_name + " " + user.last_name,
                email: user.email,
                registeredAt: user.created_at,
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