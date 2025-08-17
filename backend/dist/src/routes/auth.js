"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("../models");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
dotenv_1.default.config();
const router = express_1.default.Router();
console.log("Auth routes module loaded");
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user account endpoints
 */
router.get("/test", (req, res) => {
    res.json({ message: "Auth routes are working!" });
});
// Register user
router.post("/register", async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, adminPasscode } = req.body;
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
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
        // Create user (password will be hashed by pre-save middleware)
        const user = new models_1.User({
            email,
            password,
            firstName,
            lastName,
            role: userRole,
        });
        await user.save();
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, jwtSecret, { expiresIn: process.env.JWT_EXPIRE || "7d" });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
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
// Login user
router.post("/login", (0, validation_1.validate)(validation_1.authSchemas.login), async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("🔍 Login attempt for:", email);
        // Find user
        const user = await models_1.User.findOne({ email });
        if (!user) {
            console.log("❌ No user found with email:", email);
            return res.status(401).json({
                success: false,
                message: `No account found with email: ${email}`,
            });
        }
        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Account has been deactivated",
            });
        }
        // Check password
        console.log("🔑 Validating password for user:", user._id);
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log("❌ Invalid password for user:", email);
            return res.status(401).json({
                success: false,
                message: "Invalid password provided",
            });
        }
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, jwtSecret, { expiresIn: process.env.JWT_EXPIRE || "7d" });
        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
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
// Get current user
router.get("/me", auth_1.authenticate, async (req, res) => {
    try {
        const user = await models_1.User.findById(req.user.userId).select('-password');
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
                    createdAt: user.createdAt,
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
// Change password
router.put("/change-password", auth_1.authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
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
        const user = await models_1.User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }
        // Update password (will be hashed by pre-save middleware)
        user.password = newPassword;
        await user.save();
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
// Google OAuth Login
router.post("/google", async (req, res) => {
    try {
        const { credential, adminPasscode } = req.body;
        console.log("🔐 Google OAuth request:", { hasCredential: !!credential, hasAdminPasscode: !!adminPasscode });
        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required",
            });
        }
        // Decode Google JWT token (simplified - in production use google-auth-library)
        let payload;
        try {
            payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
            console.log("✅ JWT payload decoded:", { email: payload.email, name: payload.given_name });
        }
        catch (decodeError) {
            console.error("❌ JWT decode error:", decodeError);
            return res.status(400).json({
                success: false,
                message: "Invalid Google credential format",
            });
        }
        const { email, given_name, family_name, picture, sub } = payload;
        // Check if user exists
        console.log("🔍 Checking if user exists:", email);
        let user = await models_1.User.findOne({ email });
        let userRole = "user";
        if (user) {
            // User exists, log them in
            console.log("✅ Existing user login:", { id: user._id, email: user.email, role: user.role });
        }
        else {
            // New user, check if they want admin role
            if (adminPasscode) {
                if (adminPasscode !== process.env.ADMIN_PASSCODE) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid admin passcode",
                        requiresAdminPasscode: true,
                        userInfo: { email, firstName: given_name, lastName: family_name, picture }
                    });
                }
                userRole = "admin";
            }
            // Create new user
            user = new models_1.User({
                email,
                password: 'google_oauth',
                firstName: given_name,
                lastName: family_name,
                role: userRole
            });
            await user.save();
        }
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, jwtSecret, { expiresIn: process.env.JWT_EXPIRE || "7d" });
        console.log("✅ Google OAuth successful, sending response");
        res.json({
            success: true,
            message: "Google login successful",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    picture
                },
                token,
            },
        });
    }
    catch (error) {
        console.error("❌ Google auth error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            message: `Google authentication failed: ${errorMessage}`,
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
});
// Deactivate Account
router.post("/deactivate", auth_1.authenticate, async (req, res) => {
    try {
        const user = await models_1.User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Set deactivation date (30 days from now for deletion)
        const deactivatedAt = new Date();
        user.isActive = false;
        user.deactivatedAt = deactivatedAt;
        await user.save();
        res.json({
            success: true,
            message: "Account deactivated. You have 30 days to reactivate before deletion.",
            data: { deactivatedAt }
        });
    }
    catch (error) {
        console.error("Deactivate account error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to deactivate account"
        });
    }
});
// Reactivate Account
router.post("/reactivate", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find deactivated user
        const user = await models_1.User.findOne({ email, isActive: false });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No deactivated account found with this email"
            });
        }
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }
        // Reactivate account
        user.isActive = true;
        user.deactivatedAt = undefined;
        await user.save();
        res.json({
            success: true,
            message: "Account reactivated successfully"
        });
    }
    catch (error) {
        console.error("Reactivate account error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reactivate account"
        });
    }
});
// Admin: Get Deactivated Users
router.get("/admin/deactivated-users", auth_1.authenticate, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }
        const users = await models_1.User.find({ isActive: false })
            .select('email firstName lastName deactivatedAt')
            .sort({ deactivatedAt: -1 });
        res.json({
            success: true,
            data: { users }
        });
    }
    catch (error) {
        console.error("Get deactivated users error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get deactivated users"
        });
    }
});
// Admin: Force Reactivate User
router.post("/admin/reactivate-user", auth_1.authenticate, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }
        const { userId } = req.body;
        const user = await models_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        user.isActive = true;
        user.deactivatedAt = undefined;
        await user.save();
        res.json({
            success: true,
            message: "User account reactivated successfully"
        });
    }
    catch (error) {
        console.error("Admin reactivate user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reactivate user"
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map