"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = exports.getDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/skill_assessment";
const connectDB = async () => {
    try {
        console.log('🔌 [Database] Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI, {
            dbName: process.env.DB_NAME || 'skill_assessment'
        });
        console.log('✅ [Database] MongoDB connected successfully');
        console.log('📊 [Database] Database:', mongoose_1.default.connection.name);
    }
    catch (error) {
        console.error('❌ [Database] MongoDB connection failed:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
// Get MongoDB connection
const getDB = () => {
    if (!mongoose_1.default.connection.readyState) {
        throw new Error("Database not connected");
    }
    return mongoose_1.default.connection.db;
};
exports.getDB = getDB;
// Import all models to ensure they're registered
require("../models/User");
require("../models/Skill");
require("../models/Question");
require("../models/QuizAttempt");
require("../models/QuizAnswer");
require("../models/PasswordResetOtp");
// For compatibility with existing code - now throws helpful error
exports.pool = {
    execute: async (sql, params = []) => {
        throw new Error(`SQL query attempted: "${sql}". Use Mongoose models instead. Available models: User, Skill, Question, QuizAttempt, QuizAnswer, PasswordResetOtp`);
    },
    end: async () => {
        await mongoose_1.default.connection.close();
    },
};
// Helper function for legacy compatibility
const query = async (sql, params = []) => {
    throw new Error(`SQL query attempted: "${sql}". Use Mongoose models instead.`);
};
exports.query = query;
//# sourceMappingURL=database.js.map