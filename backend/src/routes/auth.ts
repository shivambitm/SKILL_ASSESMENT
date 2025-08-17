import express from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
import { User, LoginOtp } from "../models";
import { validate, authSchemas } from "../middleware/validation";
import { authenticate, CustomRequest } from "../middleware/auth";
import { sendLoginOTP } from "../utils/emailService";

dotenv.config();

const router = express.Router();

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
    const existingUser = await User.findOne({ email });
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
    const user = new User({
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

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || "7d" } as SignOptions
    );

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
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

// Step 1: Request OTP for login
router.post("/login", validate(authSchemas.login), async (req: CustomRequest, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔍 Login attempt for:", email);
    
    // Find user
    const user = await User.findOne({ email });
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
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password provided",
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Delete any existing OTPs for this email
    await LoginOtp.deleteMany({ email });
    
    // Create new OTP record
    const loginOtp = new LoginOtp({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });
    
    await loginOtp.save();
    
    // Send OTP via email
    try {
      await sendLoginOTP(email, otp);
      console.log("✅ OTP sent to:", email);
    } catch (emailError) {
      console.error("❌ Failed to send OTP:", emailError);
      // In development, still allow login but log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log("🔧 DEV MODE - OTP:", otp);
      }
    }

    res.json({
      success: true,
      message: "OTP sent to your email. Please verify to complete login.",
      data: {
        requiresOTP: true,
        email,
        expiresIn: 300, // 5 minutes in seconds
        ...(process.env.NODE_ENV === 'development' && { devOTP: otp })
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// Step 2: Verify OTP and complete login
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find valid OTP
    const loginOtp = await LoginOtp.findOne({
      email,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!loginOtp) {
      // Check if OTP exists but is expired or used
      const expiredOtp = await LoginOtp.findOne({ email, otp });
      if (expiredOtp) {
        return res.status(400).json({
          success: false,
          message: "OTP has expired or already been used. Please request a new one.",
        });
      }
      
      // Increment attempts
      await LoginOtp.updateOne(
        { email, expiresAt: { $gt: new Date() } },
        { $inc: { attempts: 1 } }
      );
      
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    // Check attempts limit
    if (loginOtp.attempts >= 3) {
      await LoginOtp.deleteMany({ email });
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Mark OTP as used
    loginOtp.isUsed = true;
    await loginOtp.save();

    // Get user and generate JWT
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || "7d" } as SignOptions
    );

    // Clean up used OTP
    await LoginOtp.deleteMany({ email });

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
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Delete existing OTPs
    await LoginOtp.deleteMany({ email });
    
    // Create new OTP
    const loginOtp = new LoginOtp({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    
    await loginOtp.save();
    
    // Send OTP
    try {
      await sendLoginOTP(email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP:", emailError);
      if (process.env.NODE_ENV === 'development') {
        console.log("🔧 DEV MODE - New OTP:", otp);
      }
    }

    res.json({
      success: true,
      message: "New OTP sent to your email",
      data: {
        expiresIn: 300,
        ...(process.env.NODE_ENV === 'development' && { devOTP: otp })
      },
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
});

// Get current user
router.get("/me", authenticate, async (req: CustomRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
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
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
});

// Change password
router.put("/change-password", authenticate, async (req: CustomRequest, res) => {
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
    const user = await User.findById(req.user!.userId);
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
  } catch (error) {
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
    } catch (decodeError) {
      console.error("❌ JWT decode error:", decodeError);
      return res.status(400).json({
        success: false,
        message: "Invalid Google credential format",
      });
    }
    
    const { email, given_name, family_name, picture, sub } = payload;

    // Check if user exists
    console.log("🔍 Checking if user exists:", email);
    let user = await User.findOne({ email });
    let userRole = "user";

    if (user) {
      // User exists, log them in
      console.log("✅ Existing user login:", { id: user._id, email: user.email, role: user.role });
    } else {
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
      user = new User({
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

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || "7d" } as SignOptions
    );

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
  } catch (error) {
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
router.post("/deactivate", authenticate, async (req: CustomRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId);
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
  } catch (error) {
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
    const user = await User.findOne({ email, isActive: false });
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
  } catch (error) {
    console.error("Reactivate account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate account"
    });
  }
});

// Admin: Get Deactivated Users
router.get("/admin/deactivated-users", authenticate, async (req: CustomRequest, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }
    
    const users = await User.find({ isActive: false })
      .select('email firstName lastName deactivatedAt')
      .sort({ deactivatedAt: -1 });
    
    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error("Get deactivated users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get deactivated users"
    });
  }
});

// Admin: Force Reactivate User
router.post("/admin/reactivate-user", authenticate, async (req: CustomRequest, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }
    
    const { userId } = req.body;
    
    const user = await User.findById(userId);
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
  } catch (error) {
    console.error("Admin reactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate user"
    });
  }
});

export default router;