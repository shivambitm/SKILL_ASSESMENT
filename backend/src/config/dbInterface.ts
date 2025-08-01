import { pool as pgPool } from './postgres';
import { pool as sqlitePool } from './database';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';

export const query = async (sql: string, params: any[] = []) => {
  if (DATABASE_TYPE === 'postgresql') {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    let pgSql = sql;
    let paramIndex = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${paramIndex}`);
      paramIndex++;
    }
    const result = await pgPool.query(pgSql, params);
    return [result.rows];
  } else {
    return sqlitePool.execute(sql, params);
  }
};

export const pool = {
  execute: query,
  query: query
};