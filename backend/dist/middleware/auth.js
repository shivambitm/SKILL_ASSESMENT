"use strict";
/**
 * Authentication & Authorization Middleware
 *
 * This middleware provides secure authentication and authorization for the
 * Skill Assessment Portal backend. It implements JWT-based authentication
 * with role-based access control.
 *
 * Features:
 * - JWT token validation and verification
 * - User existence and status checking
 * - Role-based access control (admin/user)
 * - Secure error handling without information leakage
 * - Token expiration handling
 *
 * Middleware Functions:
 * - authenticate: Validates JWT tokens and sets req.user
 * - authorize: Checks user roles for protected endpoints
 *
 * Security Measures:
 * - Token verification using JWT_SECRET
 * - User active status verification
 * - Proper error responses without sensitive information
 * - TypeScript interfaces for type safety
 *
 * @module AuthMiddleware
 * @requires jsonwebtoken for token verification
 * @requires database pool for user validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
/**
 * Middleware to authenticate users using JWT tokens.
 *
 * - Extracts token from Authorization header
 * - Verifies token validity and decodes user information
 * - Checks if the user exists and is active in the database
 * - Sets req.user with the authenticated user's information
 * - Proceeds to the next middleware or returns an error response
 *
 * @function authenticate
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided, authorization denied",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log("🔐 Auth middleware - JWT decoded:", {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        });
        // Verify user still exists and is active
        const [rows] = await database_1.pool.execute("SELECT id, email, role, is_active FROM users WHERE id = ?", [decoded.userId]);
        const users = rows;
        console.log("🔍 Auth middleware - User lookup:", {
            searchingForUserId: decoded.userId,
            foundUsers: users.length,
            userDetails: users[0]
                ? {
                    id: users[0].id,
                    email: users[0].email,
                    role: users[0].role,
                    is_active: users[0].is_active,
                }
                : null,
        });
        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                success: false,
                message: "User not found or inactive",
            });
        }
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: users[0].role,
        };
        console.log("✅ Auth middleware - req.user set:", req.user);
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to authorize users based on roles.
 *
 * - Checks if the user is authenticated (req.user exists)
 * - Verifies if the user's role is included in the allowed roles
 * - Proceeds to the next middleware or returns an error response
 *
 * @function authorize
 * @param {string[]} roles - Array of allowed roles for the route
 * @returns {function} - Express middleware function
 */
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions",
            });
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map