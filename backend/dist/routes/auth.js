"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
// Ensure environment variables are loaded
dotenv_1.default.config();
const router = express_1.default.Router();
// Debug logging
console.log("Auth routes module loaded");
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user account endpoints
 */
/**
 * @swagger
 * /api/auth/test:
 *   get:
 *     summary: Test auth route
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Auth routes are working
 */
// Simple test route to verify routing works
router.get("/test", (req, res) => {
    res.json({ message: "Auth routes are working!" });
});
// Register user
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *               adminPasscode:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: User already exists or validation error
 */
// Enhanced Register user (supports admin registration with passcode)
router.post("/register", async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, adminPasscode } = req.body;
        // Check if user already exists
        const [existingUsers] = await database_1.pool.execute("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }
        // Validate role and admin passcode
        let userRole = "user";
        if (role === "admin") {
            if (adminPasscode !== "admin") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid admin passcode",
                });
            }
            userRole = "admin";
        }
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Create user
        const [result] = await database_1.pool.execute("INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)", [email, hashedPassword, firstName, lastName, userRole]);
        const userId = result.lastInsertRowid;
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined");
        }
        const token = jsonwebtoken_1.default.sign({ userId, email, role: userRole }, jwtSecret, {
            expiresIn: process.env.JWT_EXPIRE || "7d",
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: {
                    id: userId,
                    email,
                    firstName,
                    lastName,
                    role: userRole,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
});
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
// Login user
router.post("/login", (0, validation_1.validate)(validation_1.authSchemas.login), async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const [rows] = await database_1.pool.execute("SELECT id, email, password, first_name, last_name, role, is_active FROM users WHERE email = ?", [email]);
        const users = rows;
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        const user = users[0];
        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: "Account has been deactivated",
            });
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        console.log("JWT_SECRET loaded:", jwtSecret ? "✅ Yes" : "❌ No");
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: process.env.JWT_EXPIRE || "7d" });
        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
});
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
// Get current user
router.get("/me", auth_1.authenticate, async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute("SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ?", [req.user.userId]);
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
                    createdAt: user.created_at,
                },
            },
        });
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user information",
        });
    }
});
/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
// Change password
router.put("/change-password", auth_1.authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        console.log("🔐 Password change request:", {
            userId: req.user.userId,
            currentPasswordLength: currentPassword?.length,
            newPasswordLength: newPassword?.length,
            timestamp: new Date().toISOString(),
        });
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long",
            });
        }
        // Get current user
        const [rows] = await database_1.pool.execute("SELECT password FROM users WHERE id = ?", [req.user.userId]);
        const users = rows;
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        console.log("🔍 Password verification:", {
            userId: req.user.userId,
            hasStoredPassword: !!users[0].password,
            storedPasswordLength: users[0].password?.length,
            providedPasswordLength: currentPassword.length,
        });
        // Verify current password
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, users[0].password);
        console.log("✅ Password comparison result:", {
            isCurrent: isCurrentPasswordValid,
            userId: req.user.userId,
        });
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }
        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        // Update password
        await database_1.pool.execute("UPDATE users SET password = ? WHERE id = ?", [
            hashedNewPassword,
            req.user.userId,
        ]);
        res.json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to change password",
        });
    }
});
/**
 * @swagger
 * /api/auth/debug-user:
 *   get:
 *     summary: Debug - get user info (dev only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info
 *       401:
 *         description: Unauthorized
 */
// Debug endpoint to check user information (temporary)
router.get("/debug-user", auth_1.authenticate, async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute("SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ?", [req.user.userId]);
        const users = rows;
        if (users.length === 0) {
            return res.json({
                success: false,
                message: "User not found",
                jwtUser: req.user,
            });
        }
        res.json({
            success: true,
            data: {
                jwtUser: req.user,
                dbUser: users[0],
                match: users[0].id === req.user.userId,
            },
        });
    }
    catch (error) {
        console.error("Debug user error:", error);
        res.status(500).json({
            success: false,
            message: "Debug query failed",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * @swagger
 * /api/auth/debug-reset-password:
 *   post:
 *     summary: Debug - reset password (dev only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
// Temporary password reset endpoint for debugging (REMOVE IN PRODUCTION)
router.post("/debug-reset-password", auth_1.authenticate, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long",
            });
        }
        console.log("🔧 DEBUG: Resetting password for user:", req.user.userId);
        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        // Update password without checking current password
        await database_1.pool.execute("UPDATE users SET password = ? WHERE id = ?", [
            hashedNewPassword,
            req.user.userId,
        ]);
        res.json({
            success: true,
            message: "Password reset successfully (DEBUG MODE)",
        });
    }
    catch (error) {
        console.error("Debug password reset error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reset password",
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map