import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool } from "../config/database";
import { validate, authSchemas } from "../middleware/validation";
import { authenticate, CustomRequest } from "../middleware/auth";
import { sendOTPEmail } from "../utils/emailService";

// Ensure environment variables are loaded
dotenv.config();

const router = express.Router();

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
    const { email, password, firstName, lastName, role, adminPasscode } =
      req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if ((existingUsers as any[]).length > 0) {
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
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [result] = await pool.execute(
      "INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, firstName, lastName, userRole]
    );

    const userId = (result as any).lastInsertRowid;

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign({ userId, email, role: userRole }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    } as jwt.SignOptions);

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
  } catch (error) {
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
router.post(
  "/login",
  validate(authSchemas.login),
  async (req: CustomRequest, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const [rows] = await pool.execute(
        "SELECT id, email, password, first_name, last_name, role, is_active FROM users WHERE email = ?",
        [email]
      );

      const users = rows as any[];
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
      const isPasswordValid = await bcrypt.compare(password, user.password);
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

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRE || "7d" } as jwt.SignOptions
      );

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
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed",
      });
    }
  }
);
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
router.get("/me", authenticate, async (req: CustomRequest, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ?",
      [req.user!.userId]
    );

    const users = rows as any[];
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
  } catch (error) {
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
router.put(
  "/change-password",
  authenticate,
  async (req: CustomRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      console.log("🔐 Password change request:", {
        userId: req.user!.userId,
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
      const [rows] = await pool.execute(
        "SELECT password FROM users WHERE id = ?",
        [req.user!.userId]
      );

      const users = rows as any[];
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.log("🔍 Password verification:", {
        userId: req.user!.userId,
        hasStoredPassword: !!users[0].password,
        storedPasswordLength: users[0].password?.length,
        providedPasswordLength: currentPassword.length,
      });

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        users[0].password
      );

      console.log("✅ Password comparison result:", {
        isCurrent: isCurrentPasswordValid,
        userId: req.user!.userId,
      });

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
        hashedNewPassword,
        req.user!.userId,
      ]);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password",
      });
    }
  }
);
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
router.get("/debug-user", authenticate, async (req: CustomRequest, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ?",
      [req.user!.userId]
    );

    const users = rows as any[];
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
        match: users[0].id === req.user!.userId,
      },
    });
  } catch (error) {
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

// Forgot Password - Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const [users] = await pool.execute(
      "SELECT id, email FROM users WHERE email = ?",
      [email]
    );

    if ((users as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await pool.execute(
      "INSERT INTO password_reset_otps (email, otp, expires_at) VALUES (?, ?, ?)",
      [email, otp, expiresAt.toISOString()]
    );

    // Send OTP via email
    console.log(`🔐 Password reset OTP for ${email}: ${otp}`);
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      // Still return success but log the error
    }

    res.json({
      success: true,
      message: "OTP sent to your email address",
      // Remove this in production - only for demo
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔍 OTP Verification Request:', { email, otp });

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find valid OTP
    const [otpRecords] = await pool.execute(
      "SELECT id, expires_at FROM password_reset_otps WHERE email = ? AND otp = ? AND is_used = FALSE ORDER BY created_at DESC LIMIT 1",
      [email, otp]
    );

    console.log('🔍 OTP Records Found:', otpRecords);

    if ((otpRecords as any[]).length === 0) {
      console.log('❌ No OTP records found');
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const otpRecord = (otpRecords as any[])[0];
    const expiresAt = new Date(otpRecord.expires_at);
    const now = new Date();

    console.log('🕐 Time check:', {
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
      isExpired: expiresAt < now
    });

    if (expiresAt < now) {
      console.log('❌ OTP has expired');
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    console.log('✅ OTP is valid, proceeding...');

    // Mark OTP as used
    console.log('🔄 Marking OTP as used...');
    await pool.execute(
      "UPDATE password_reset_otps SET is_used = TRUE WHERE id = ?",
      [otpRecord.id]
    );

    // Generate temporary token for password reset
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET not found');
      throw new Error("JWT_SECRET is not defined");
    }

    console.log('🔑 Generating reset token...');
    const resetToken = jwt.sign(
      { email, purpose: "password_reset" },
      jwtSecret,
      { expiresIn: "15m" }
    );

    console.log('✅ OTP verification successful, sending response');
    res.json({
      success: true,
      message: "OTP verified successfully",
      data: {
        resetToken,
      },
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token, new password, and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Verify reset token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, jwtSecret);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, decoded.email]
    );

    // Clean up used OTPs for this email
    await pool.execute(
      "DELETE FROM password_reset_otps WHERE email = ?",
      [decoded.email]
    );

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
});

// Temporary password reset endpoint for debugging (REMOVE IN PRODUCTION)
router.post(
  "/debug-reset-password",
  authenticate,
  async (req: CustomRequest, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }

      console.log("🔧 DEBUG: Resetting password for user:", req.user!.userId);

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password without checking current password
      await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
        hashedNewPassword,
        req.user!.userId,
      ]);

      res.json({
        success: true,
        message: "Password reset successfully (DEBUG MODE)",
      });
    } catch (error) {
      console.error("Debug password reset error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset password",
      });
    }
  }
);

export default router;
