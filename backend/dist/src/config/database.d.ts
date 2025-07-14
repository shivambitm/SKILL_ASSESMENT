import Database from "better-sqlite3";
export declare const connectDB: () => Promise<void>;
export declare const getDB: () => Database.Database;
export declare const query: (sql: string, params?: any[]) => unknown[][] | Database.RunResult[];
export declare const pool: {
    execute: (sql: string, params?: any[]) => unknown[][] | Database.RunResult[];
    end: () => void;
};
export declare const registerUser: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "admin" | "user";
}) => Promise<{
    id: number | bigint;
    email: string;
    firstName: string;
    lastName: string;
    role: "admin" | "user";
}>;
//# sourceMappingURL=database.d.ts.map