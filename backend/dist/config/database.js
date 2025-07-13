"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.query = exports.getDB = exports.connectDB = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const dbPath = process.env.DB_PATH || path_1.default.join(process.cwd(), "skill_assessment.db");
let db;
const connectDB = async () => {
    try {
        db = new better_sqlite3_1.default(dbPath);
        console.log("Database connected successfully");
        // Enable foreign keys
        db.pragma("foreign_keys = ON");
        // Run migrations
        await runMigrations();
    }
    catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
};
exports.connectDB = connectDB;
const runMigrations = async () => {
    // Create notifications table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    try {
        // Create users table
        db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create indexes for users table
        db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
        // Create skills table
        db.exec(`
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create indexes for skills table
        db.exec(`CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category)`);
        // Create questions table
        db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A', 'B', 'C', 'D')),
        difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
        points INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);
        // Create indexes for questions table
        db.exec(`CREATE INDEX IF NOT EXISTS idx_questions_skill_id ON questions(skill_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty)`);
        // Create quiz_attempts table
        db.exec(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_id INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        score_percentage REAL NOT NULL,
        time_taken INTEGER,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);
        // Create indexes for quiz_attempts table
        db.exec(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_skill_id ON quiz_attempts(skill_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON quiz_attempts(completed_at)`);
        // Create quiz_answers table
        db.exec(`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_attempt_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_answer TEXT NOT NULL CHECK(selected_answer IN ('A', 'B', 'C', 'D')),
        is_correct BOOLEAN NOT NULL,
        time_taken INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
        // Create indexes for quiz_answers table
        db.exec(`CREATE INDEX IF NOT EXISTS idx_quiz_answers_quiz_attempt_id ON quiz_answers(quiz_attempt_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id)`);
        console.log("Database migrations completed successfully");
    }
    catch (error) {
        console.error("Error running migrations:", error);
        throw error;
    }
};
const getDB = () => {
    if (!db) {
        throw new Error("Database not connected");
    }
    return db;
};
exports.getDB = getDB;
// Helper function to execute queries with parameters
const query = (sql, params = []) => {
    const db = (0, exports.getDB)();
    try {
        if (sql.trim().toLowerCase().startsWith("select")) {
            return [db.prepare(sql).all(...params)];
        }
        else {
            const result = db.prepare(sql).run(...params);
            return [result];
        }
    }
    catch (error) {
        console.error("Query error:", error);
        throw error;
    }
};
exports.query = query;
// For compatibility with existing code
exports.pool = {
    execute: exports.query,
    end: () => {
        if (db) {
            db.close();
        }
    },
};
//# sourceMappingURL=database.js.map