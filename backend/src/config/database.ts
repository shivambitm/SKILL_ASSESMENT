import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/skill_assessment";

export const connectDB = async () => {
  try {
    console.log('🔌 [Database] Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.DB_NAME || 'skill_assessment'
    });
    
    console.log('✅ [Database] MongoDB connected successfully');
    console.log('📊 [Database] Database:', mongoose.connection.name);
    
  } catch (error) {
    console.error('❌ [Database] MongoDB connection failed:', error);
    throw error;
  }
};

// Get MongoDB connection
export const getDB = () => {
  if (!mongoose.connection.readyState) {
    throw new Error("Database not connected");
  }
  return mongoose.connection.db;
};

// Import all models to ensure they're registered
import '../models/User';
import '../models/Skill';
import '../models/Question';
import '../models/QuizAttempt';
import '../models/QuizAnswer';
import '../models/PasswordResetOtp';
import '../models/LoginOtp';

// For compatibility with existing code - now throws helpful error
export const pool = {
  execute: async (sql: string, params: any[] = []) => {
    throw new Error(`SQL query attempted: "${sql}". Use Mongoose models instead. Available models: User, Skill, Question, QuizAttempt, QuizAnswer, PasswordResetOtp`);
  },
  end: async () => {
    await mongoose.connection.close();
  },
};

// Helper function for legacy compatibility
export const query = async (sql: string, params: any[] = []) => {
  throw new Error(`SQL query attempted: "${sql}". Use Mongoose models instead.`);
};