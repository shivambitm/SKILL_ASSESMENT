import express from "express";
import { User } from "../models";
import { authenticate, authorize, CustomRequest } from "../middleware/auth";

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term (name or email)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: User role (admin/user)
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */

// Get all users (Admin only)
router.get(
  "/",
  authenticate,
  authorize(["admin"]),
  async (req: CustomRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const role = (req.query.role as string) || "";

      // Build query conditions
      const query: any = {};
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (role) {
        query.role = role;
      }

      // Get total count
      const total = await User.countDocuments(query);

      // Get users
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const formattedUsers = users.map((user) => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }));

      res.json({
        success: true,
        data: {
          users: formattedUsers,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get users",
      });
    }
  }
);

// Update own profile (Any authenticated user)
router.put("/profile", authenticate, async (req: CustomRequest, res) => {
  try {
    /**
     * @swagger
     * /users/profile:
     *   put:
     *     summary: Update own profile (authenticated user)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - firstName
     *               - lastName
     *               - email
     *             properties:
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               email:
     *                 type: string
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *       400:
     *         description: Invalid input or email already taken
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    const userId = req.user!.userId;
    const { firstName, lastName, email } = req.body;

    // Validate input
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and email are required",
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: userId } 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already taken by another user",
      });
    }

    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a specific user by ID (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

// Get user by ID (Admin only)
router.get(
  "/:id",
  authenticate,
  authorize(["admin"]),
  async (req: CustomRequest, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user",
      });
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *     responses:
 *       200:
 *         description: User updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

// Update user (Admin only)
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  async (req: CustomRequest, res) => {
    try {
      const { firstName, lastName, role, isActive } = req.body;

      // Check if user exists
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update fields
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (role !== undefined) user.role = role;
      if (typeof isActive === "boolean") user.isActive = isActive;

      await user.save();

      res.json({
        success: true,
        message: "User updated successfully",
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user",
      });
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

// Delete user (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  async (req: CustomRequest, res) => {
    try {
      // Check if user exists
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Don't allow deleting your own account
      if (req.user!.userId.toString() === req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account",
        });
      }

      await User.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }
);

// Get user statistics (Admin only)
router.get(
  "/stats/overview",
  authenticate,
  authorize(["admin"]),
  async (req: CustomRequest, res) => {
    try {
      /**
       * @swagger
       * /users/stats/overview:
       *   get:
       *     summary: Get user statistics (admin only)
       *     tags: [Users]
       *     security:
       *       - bearerAuth: []
       *     responses:
       *       200:
       *         description: User statistics overview
       *       401:
       *         description: Unauthorized
       */
      // Get total users
      const totalUsers = await User.countDocuments();

      // Get active users
      const activeUsers = await User.countDocuments({ isActive: true });

      // Get users by role
      const roleStats = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $project: { role: "$_id", count: 1, _id: 0 } }
      ]);

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRegistrations = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          roleStats,
          recentRegistrations,
        },
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user statistics",
      });
    }
  }
);

/**
 * @swagger
 * /users/{id}/toggle-status:
 *   put:
 *     summary: Toggle user status (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User status toggled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

// Toggle user status (Admin only)
router.put(
  "/:id/toggle-status",
  authenticate,
  authorize(["admin"]),
  async (req: CustomRequest, res) => {
    try {
      // Check if user exists
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Toggle user status
      user.isActive = !user.isActive;
      await user.save();

      res.json({
        success: true,
        message: "User status toggled successfully",
      });
    } catch (error) {
      console.error("Toggle user status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle user status",
      });
    }
  }
);

export default router;