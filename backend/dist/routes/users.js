"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
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
router.get("/", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const role = req.query.role || "";
        const offset = (page - 1) * limit;
        // Build query conditions
        let whereClause = "WHERE 1=1";
        const queryParams = [];
        if (search) {
            whereClause +=
                " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (role) {
            whereClause += " AND role = ?";
            queryParams.push(role);
        }
        // Get total count
        const [countResult] = await database_1.pool.execute(`SELECT COUNT(*) as total FROM users ${whereClause}`, queryParams);
        const total = countResult[0].total;
        // Get users
        const [rows] = await database_1.pool.execute(`SELECT id, email, first_name, last_name, role, is_active, created_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);
        const users = rows.map((user) => ({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            isActive: user.is_active,
            createdAt: user.created_at,
        }));
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get users",
        });
    }
});
// Update own profile (Any authenticated user)
router.put("/profile", auth_1.authenticate, async (req, res) => {
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
        const userId = req.user.userId;
        const { firstName, lastName, email } = req.body;
        // Validate input
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, and email are required",
            });
        }
        // Check if email is already taken by another user
        const [existingUsers] = await database_1.pool.execute("SELECT id FROM users WHERE email = ? AND id != ?", [email, userId]);
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email is already taken by another user",
            });
        }
        // Update user profile
        await database_1.pool.execute("UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?", [firstName, lastName, email, userId]);
        // Get updated user data
        const [rows] = await database_1.pool.execute("SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ?", [userId]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const user = rows[0];
        const updatedUser = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            isActive: user.is_active,
        };
        res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                user: updatedUser,
            },
        });
    }
    catch (error) {
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
 *           type: integer
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
router.get("/:id", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const [rows] = await database_1.pool.execute("SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ?", [userId]);
        const users = rows;
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const user = users[0];
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    isActive: user.is_active,
                    createdAt: user.created_at,
                },
            },
        });
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user",
        });
    }
});
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
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
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
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { firstName, lastName, role, isActive } = req.body;
        // Check if user exists
        const [existingUsers] = await database_1.pool.execute("SELECT id FROM users WHERE id = ?", [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Build update query
        const updateFields = [];
        const updateValues = [];
        if (firstName) {
            updateFields.push("first_name = ?");
            updateValues.push(firstName);
        }
        if (lastName) {
            updateFields.push("last_name = ?");
            updateValues.push(lastName);
        }
        if (role) {
            updateFields.push("role = ?");
            updateValues.push(role);
        }
        if (typeof isActive === "boolean") {
            updateFields.push("is_active = ?");
            updateValues.push(isActive);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update",
            });
        }
        updateValues.push(userId);
        await database_1.pool.execute(`UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);
        res.json({
            success: true,
            message: "User updated successfully",
        });
    }
    catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
});
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
 *           type: integer
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
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        // Check if user exists
        const [existingUsers] = await database_1.pool.execute("SELECT id FROM users WHERE id = ?", [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Don't allow deleting the last admin
        if (req.user.userId === userId) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete your own account",
            });
        }
        await database_1.pool.execute("DELETE FROM users WHERE id = ?", [userId]);
        res.json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
});
// Get user statistics (Admin only)
router.get("/stats/overview", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
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
        const [totalUsersResult] = await database_1.pool.execute("SELECT COUNT(*) as total FROM users");
        const totalUsers = totalUsersResult[0].total;
        // Get active users
        const [activeUsersResult] = await database_1.pool.execute("SELECT COUNT(*) as total FROM users WHERE is_active = true");
        const activeUsers = activeUsersResult[0].total;
        // Get users by role
        const [roleStatsResult] = await database_1.pool.execute("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        const roleStats = roleStatsResult;
        // Get recent registrations (last 30 days)
        const [recentRegistrationsResult] = await database_1.pool.execute("SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        const recentRegistrations = recentRegistrationsResult[0].total;
        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                roleStats,
                recentRegistrations,
            },
        });
    }
    catch (error) {
        console.error("Get user stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user statistics",
        });
    }
});
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
 *           type: integer
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
router.put("/:id/toggle-status", auth_1.authenticate, (0, auth_1.authorize)(["admin"]), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        // Check if user exists
        const [existingUsers] = await database_1.pool.execute("SELECT id FROM users WHERE id = ?", [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Toggle user status
        await database_1.pool.execute("UPDATE users SET is_active = NOT is_active WHERE id = ?", [userId]);
        res.json({
            success: true,
            message: "User status toggled successfully",
        });
    }
    catch (error) {
        console.error("Toggle user status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to toggle user status",
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map