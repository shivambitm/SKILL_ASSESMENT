import mongoose from "mongoose";
export declare const connectDB: () => Promise<void>;
export declare const getDB: () => mongoose.mongo.Db | undefined;
import '../models/User';
import '../models/Skill';
import '../models/Question';
import '../models/QuizAttempt';
import '../models/QuizAnswer';
import '../models/PasswordResetOtp';
export declare const pool: {
    execute: (sql: string, params?: any[]) => Promise<never>;
    end: () => Promise<void>;
};
export declare const query: (sql: string, params?: any[]) => Promise<never>;
//# sourceMappingURL=database.d.ts.map