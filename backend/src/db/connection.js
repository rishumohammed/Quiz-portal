import mysql from 'mysql2/promise';
import IORedis from 'ioredis';
import RedisMock from 'ioredis-mock';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Redis = process.env.USE_MOCK_REDIS === 'true' ? RedisMock : IORedis;

// MySQL Connection Pool (Scaled for high concurrency up to 5,000 active users)
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aems_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 100,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Redis Client
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

redis.on('error', (err) => console.error('Redis Error:', err));
redis.on('connect', () => console.log('Redis Connected'));

export default { pool, redis };
