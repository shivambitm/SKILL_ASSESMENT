"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const environment_1 = require("./config/environment");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const skills_1 = __importDefault(require("./routes/skills"));
const questions_1 = __importDefault(require("./routes/questions"));
const quiz_1 = __importDefault(require("./routes/quiz"));
const reports_1 = __importDefault(require("./routes/reports"));
const adminReports_1 = __importDefault(require("./routes/adminReports"));
const adminSkills_1 = __importDefault(require("./routes/adminSkills"));
const adminQuestions_1 = __importDefault(require("./routes/adminQuestions"));
const adminUsers_1 = __importDefault(require("./routes/adminUsers"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const adminSeedMerge_1 = __importDefault(require("./routes/adminSeedMerge"));
const importSeedQuestion_1 = __importDefault(require("./routes/importSeedQuestion"));
// Swagger API docs
const swagger_1 = require("./swagger");
// Load environment variables
dotenv_1.default.config();
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
console.log(`Starting server in ${environment_1.NODE_ENV} environment`);
if (environment_1.isDevelopment) {
    console.log("Development mode: Rate limiting is relaxed");
}
const app = (0, express_1.default)();
app.use(express_1.default.static("public")); // Serve static files from the "public" directory
// Security middleware
app.use((0, helmet_1.default)());
// Setup CORS - must come BEFORE rate limiting
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            "http://localhost:5173", // Development frontend
            "https://skills.shivastra.in", // Production frontend
        ];
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
}));
// Handle OPTIONS requests - Must come BEFORE rate limiting
app.options("*", (req, res) => {
    res.status(204).end();
});
// Configure main API rate limiter based on environment settings
const limiter = (0, express_rate_limit_1.default)({
    windowMs: environment_1.RATE_LIMIT.WINDOW_MS,
    max: environment_1.RATE_LIMIT.MAX_REQUESTS,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for OPTIONS requests
    skip: (req) => req.method === "OPTIONS",
});
// Configure auth-specific rate limiter (more restrictive in production)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: environment_1.RATE_LIMIT.WINDOW_MS,
    max: environment_1.RATE_LIMIT.AUTH_MAX_REQUESTS,
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
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Setup Swagger API docs (must be before routes)
(0, swagger_1.setupSwagger)(app);
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
            environment: environment_1.NODE_ENV,
            port: port,
            isDevelopment: environment_1.isDevelopment,
            rateLimit: {
                windowMs: environment_1.RATE_LIMIT.WINDOW_MS,
                maxRequests: environment_1.RATE_LIMIT.MAX_REQUESTS,
                authMaxRequests: environment_1.RATE_LIMIT.AUTH_MAX_REQUESTS,
            },
            cors: {
                origins: environment_1.CORS_ORIGINS,
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
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/skills", skills_1.default);
app.use("/api/questions", questions_1.default);
app.use("/api/quiz", quiz_1.default);
// Mount reports router for admin dashboard analytics
app.use("/api/reports", reports_1.default);
app.use("/api/admin", adminReports_1.default);
app.use("/api/admin", adminSkills_1.default);
app.use("/api/admin", adminQuestions_1.default);
app.use("/api/admin", adminUsers_1.default);
app.use("/api/admin", adminSeedMerge_1.default);
const adminDashboardStats_1 = __importDefault(require("./routes/adminDashboardStats"));
app.use("/api/admin", adminDashboardStats_1.default);
app.use("/api/admin", importSeedQuestion_1.default);
app.use("/api", notifications_1.default);
const userSkillUsage_1 = __importDefault(require("./routes/userSkillUsage"));
app.use("/api/reports", userSkillUsage_1.default);
console.log("All routes mounted successfully");
// Error handling middleware
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
// Get port from environment config
const port = process.env.PORT || 5002;
// Initialize database and Redis connections
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        await (0, redis_1.connectRedis)();
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Environment: ${environment_1.NODE_ENV}`);
            console.log(`Rate limiting: ${environment_1.isDevelopment ? "Relaxed (Development)" : "Strict (Production)"}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map