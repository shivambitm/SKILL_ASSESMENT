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

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import { connectRedis } from "./config/redis";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import {
  NODE_ENV,
  isDevelopment,
  CORS_ORIGINS,
  RATE_LIMIT,
} from "./config/environment";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import skillRoutes from "./routes/skills";
import questionRoutes from "./routes/questions";
import quizRoutes from "./routes/quiz";
import reportsRouter from "./routes/reports";
import adminReportsRoutes from "./routes/adminReports";
import adminSkillsRouter from "./routes/adminSkills";
import adminQuestionsRouter from "./routes/adminQuestions";
import adminUsersRouter from "./routes/adminUsers";
import notificationsRoutes from "./routes/notifications";
import adminSeedMergeRouter from "./routes/adminSeedMerge";
import importSeedQuestionRouter from "./routes/importSeedQuestion";

// Swagger API docs
import { setupSwagger } from "./swagger";

// Load environment variables
dotenv.config();

/**
 * Server configuration
 *
 * Rate limiting behavior:
 * - In development (NODE_ENV=development): Very high limits (10000 requests)
 * - In production: Normal limits apply (300 requests per minute for general, 20 for auth)
 * - OPTIONS requests: Always bypassed regardless of environment
 *
 * To change environment:
 * - Set NODE_ENV in .env file or environment variables
 * - Default is 'development' if not set
 */

// Log current environment mode
console.log(`Starting server in ${NODE_ENV} environment`);
if (isDevelopment) {
  console.log("Development mode: Rate limiting is relaxed");
}

const app = express();
app.use(express.static("public")); // Serve static files from the "public" directory

// Security middleware
app.use(helmet());

// Setup CORS - must come BEFORE rate limiting
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "http://localhost:5173", // Development frontend
        "http://3.224.211.116", // Production frontend
      ];
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle OPTIONS requests - Must come BEFORE rate limiting
app.options("*", (req, res) => {
  res.status(204).end();
});

// Configure main API rate limiter based on environment settings
const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for OPTIONS requests
  skip: (req) => req.method === "OPTIONS",
});

// Configure auth-specific rate limiter (more restrictive in production)
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for OPTIONS requests
  skip: (req) => req.method === "OPTIONS",
});

// Apply rate limiters
app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Setup Swagger API docs (must be before routes)
setupSwagger(app);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running properly",
    timestamp: new Date().toISOString(),
  });
});

// Health check with diagnostic information
app.get("/health-diagnostic", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running properly",
    timestamp: new Date().toISOString(),
    config: {
      environment: NODE_ENV,
      port: port,
      isDevelopment: isDevelopment,
      rateLimit: {
        windowMs: RATE_LIMIT.WINDOW_MS,
        maxRequests: RATE_LIMIT.MAX_REQUESTS,
        authMaxRequests: RATE_LIMIT.AUTH_MAX_REQUESTS,
      },
      cors: {
        origins: CORS_ORIGINS,
      },
    },
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Skill Assessment Portal API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth/*",
      users: "/api/users/*",
      skills: "/api/skills/*",
      questions: "/api/questions/*",
      quiz: "/api/quiz/*",
      reports: "/api/reports/*",
    },
    documentation: "Visit /health for server status",
  });
});

// API routes
console.log("Mounting auth routes...");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quiz", quizRoutes);
// Mount reports router for admin dashboard analytics
app.use("/api/reports", reportsRouter);
app.use("/api/admin", adminReportsRoutes);
app.use("/api/admin", adminSkillsRouter);
app.use("/api/admin", adminQuestionsRouter);
app.use("/api/admin", adminUsersRouter);
app.use("/api/admin", adminSeedMergeRouter);
import adminDashboardStatsRouter from "./routes/adminDashboardStats";
app.use("/api/admin", adminDashboardStatsRouter);
app.use("/api/admin", importSeedQuestionRouter);
app.use("/api", notificationsRoutes);
import userSkillUsageRouter from "./routes/userSkillUsage";
app.use("/api/reports", userSkillUsageRouter);
console.log("All routes mounted successfully");

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Get port from environment config
const port = process.env.PORT || 5002;

// Initialize database and Redis connections
const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(
        `Rate limiting: ${
          isDevelopment ? "Relaxed (Development)" : "Strict (Production)"
        }`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
