import { pool } from '../config/database';

beforeAll(async () => {
  // Setup test database or use existing connection
});

afterAll(async () => {
  // Clean up database connection
  if (pool) {
    await pool.end();
  }
});