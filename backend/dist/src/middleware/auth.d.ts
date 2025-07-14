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
import { Request, Response, NextFunction } from "express";
interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}
export interface CustomRequest extends Request {
    user?: JwtPayload;
}
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
export declare const authenticate: (req: CustomRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
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
export declare const authorize: (roles: string[]) => (req: CustomRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=auth.d.ts.map