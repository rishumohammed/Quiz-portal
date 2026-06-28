import mysql from 'mysql2/promise';
import IORedis from 'ioredis';
import RedisMock from 'ioredis-mock';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const Redis = process.env.USE_MOCK_REDIS === 'true' ? RedisMock : IORedis;

// MySQL Connection Pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aems_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Redis Client
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 0
});

redis.on('error', (err) => console.error('Redis Error:', err));
redis.on('connect', () => console.log('Redis Connected'));

export default { pool, redis };
