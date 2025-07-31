import express from 'express';
import { pool } from '../config/postgres';
import logger from '../config/logger';

const router = express.Router();

router.get('/health', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: 'unknown',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  try {
    // Check database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    healthCheck.checks.database = 'connected';
  } catch (error) {
    healthCheck.checks.database = 'disconnected';
    healthCheck.message = 'Database connection failed';
    logger.error('Health check database error:', error);
  }

  const status = healthCheck.checks.database === 'connected' ? 200 : 503;
  res.status(status).json(healthCheck);
});

router.get('/metrics', (req, res) => {
  res.json({
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    version: process.version,
    platform: process.platform
  });
});

export default router;