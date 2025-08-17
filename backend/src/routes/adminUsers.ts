import express from "express";
import { User } from "../models";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

// GET all users (admin only)
router.get("/users", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedUsers = users.map(user => ({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    }));
    
    res.json({ 
      success: true,
      data: formattedUsers 
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users"
    });
  }
});

export default router;
