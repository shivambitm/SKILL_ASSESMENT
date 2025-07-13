/**
 * Skill Assessment & Reporting Portal - Backend Server
 *
 * This is the main server file that initializes and configures the Express.js backend
 * for the Skill Assessment & Reporting Portal application.
 *
 * Features:
 * - JWT-based authentication system
 * - Role-based access control (admin/user)
 * - RESTful API endpoints for CRUD operations
 * - Database integration with SQLite
 * - Redis caching for performance optimization
 * - Rate limiting for API protection
 * - Comprehensive error handling
 * - Security middleware (CORS, Helmet)
 * - Health check endpoint
 * - Development vs Production configuration
 *
 * Database Schema:
 * - Users: Authentication and profile management
 * - Skills: Skill categories and management
 * - Questions: Quiz questions linked to skills
 * - Quiz Attempts: User quiz sessions and results
 * - Quiz Answers: Individual answer records
 *
 * API Endpoints:
 * - /api/auth/* - Authentication (register, login, profile)
 * - /api/users/* - User management (admin only)
 * - /api/skills/* - Skill management
 * - /api/questions/* - Question management (admin only)
 * - /api/quiz/* - Quiz operations (start, answer, complete)
 * - /api/reports/* - Performance reports and analytics
 *
 * Security Features:
 * - JWT tokens for authentication
 * - Password hashing with bcrypt
 * - Input validation with Joi
 * - Rate limiting to prevent abuse
 * - CORS protection
 * - SQL injection prevention
 * - XSS protection via Helmet
 *
 * @author Skill Assessment Team
 * @version 1.0.0
 */
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=server.d.ts.map