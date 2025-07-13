"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin: Send notification to user
router.post("/notify", auth_1.authenticate, async (req, res) => {
    try {
        const { userId, message } = req.body;
        if (!userId || !message) {
            return res
                .status(400)
                .json({ success: false, message: "Missing userId or message" });
        }
        await database_1.pool.execute(`INSERT INTO notifications (user_id, message, is_read, created_at) VALUES (?, ?, 0, CURRENT_TIMESTAMP)`, [userId, message]);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Send notification error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to send notification" });
    }
});
// User: Get notifications
router.get("/notifications", auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userId = req.user.userId;
        const [rows] = await database_1.pool.execute(`SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        res.json({ success: true, notifications: rows });
    }
    catch (error) {
        console.error("Get notifications error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to get notifications" });
    }
});
// User: Mark notification as read
router.post("/notifications/read", auth_1.authenticate, async (req, res) => {
    try {
        const { notificationId } = req.body;
        if (!notificationId) {
            return res
                .status(400)
                .json({ success: false, message: "Missing notificationId" });
        }
        await database_1.pool.execute(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [
            notificationId,
        ]);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Mark notification as read error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to mark notification as read" });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map