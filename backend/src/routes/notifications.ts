import express from "express";
import { pool } from "../config/database";
import { authenticate, CustomRequest } from "../middleware/auth";

const router = express.Router();

// Admin: Send notification to user
router.post("/notify", authenticate, async (req: CustomRequest, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId or message" });
    }
    await pool.execute(
      `INSERT INTO notifications (user_id, message, is_read, created_at) VALUES (?, ?, 0, CURRENT_TIMESTAMP)`,
      [userId, message]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Send notification error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send notification" });
  }
});

// User: Get notifications
router.get("/notifications", authenticate, async (req: CustomRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      `SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, notifications: rows });
  } catch (error) {
    console.error("Get notifications error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get notifications" });
  }
});

// User: Mark notification as read
router.post("/notifications/read", authenticate, async (req: CustomRequest, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing notificationId" });
    }
    await pool.execute(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [
      notificationId,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark notification as read" });
  }
});

export default router;
