import { connectDB as connectSQLite } from './database';
import { connectPostgres } from './postgres';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite'; // 'sqlite' or 'postgresql'

export const connectDB = async () => {
  if (DATABASE_TYPE === 'postgresql') {
    console.log('🐘 Using PostgreSQL database');
    return await connectPostgres();
  } else {
    console.log('📁 Using SQLite database');
    return await connectSQLite();
  }
};

export { DATABASE_TYPE };