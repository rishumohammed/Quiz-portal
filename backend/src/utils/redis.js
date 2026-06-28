import IORedis from 'ioredis';
import RedisMock from 'ioredis-mock';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const Redis = process.env.USE_MOCK_REDIS === 'true' ? RedisMock : IORedis;

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    // Only retry 3 times, then stop to avoid blocking the app if Redis is down
    if (times > 3) {
      return null;
    }
    return Math.min(times * 100, 3000);
  }
});

redis.on('error', (err) => {
  console.error('Redis Error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

export default redis;
