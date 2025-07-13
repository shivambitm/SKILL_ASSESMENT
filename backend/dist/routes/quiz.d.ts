/**
 * Quiz Routes - Core Quiz Functionality
 *
 * This module handles all quiz-related operations including starting quizzes,
 * submitting answers, completing quizzes, and retrieving quiz history.
 *
 * Features:
 * - Start new quiz attempts with question selection
 * - Submit individual answers with timing tracking
 * - Complete quizzes with score calculation
 * - Retrieve quiz history with pagination and filtering
 * - Detailed quiz attempt information
 *
 * Security:
 * - All endpoints require authentication
 * - Users can only access their own quiz data
 * - Admins can access all quiz data
 * - Input validation for all requests
 *
 * Database Operations:
 * - Quiz attempts tracking
 * - Individual answer recording
 * - Score calculation and storage
 * - Performance analytics
 *
 * @module QuizRoutes
 * @requires authentication middleware
 * @requires validation middleware
 * @requires database pool for operations
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=quiz.d.ts.map