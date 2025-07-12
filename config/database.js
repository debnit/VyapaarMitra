const { Pool } = require('pg');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/vyapaarmitra',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    logger.info('Connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection error:', error);
    // In production deployments, continue without DB for health checks
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Continuing without database connection in production');
      return false;
    }
    process.exit(1);
  }
};

module.exports = { pool, connectDB };