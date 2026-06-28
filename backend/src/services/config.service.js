import { pool } from '../db/connection.js';
import redis from '../utils/redis.js';

const CACHE_KEY = 'aems:config';
const CACHE_TTL = 300; // 5 minutes

export class ConfigService {
  static async getAll(maskSecrets = true) {
    // Try Redis cache first (non-fatal)
    if (maskSecrets) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (redisErr) {
        console.warn('ConfigService: Redis cache miss (Redis unavailable), falling back to DB:', redisErr.message);
      }
    }

    try {
      const [rows] = await pool.query('SELECT * FROM system_config');

      const config = rows.map(row => {
        if (maskSecrets && row.is_sensitive && row.value) {
          return { ...row, value: this.maskSecret(row.value) };
        }
        return row;
      });

      // Best-effort cache write (non-fatal)
      if (maskSecrets) {
        try {
          await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(config));
        } catch (redisErr) {
          console.warn('ConfigService: Could not cache config in Redis:', redisErr.message);
        }
      }

      return config;
    } catch (error) {
      console.error('Error in ConfigService.getAll:', error);
      throw error;
    }
  }

  static async getByGroup(group, maskSecrets = true) {
    const all = await this.getAll(maskSecrets);
    return all.filter(c => c.group === group);
  }

  static async getByKey(key, maskSecrets = true) {
    const [rows] = await pool.query('SELECT * FROM system_config WHERE `key` = ?', [key]);
    if (rows.length === 0) return null;
    
    const row = rows[0];
    if (maskSecrets && row.is_sensitive && row.value) {
      row.value = this.maskSecret(row.value);
    }
    return row;
  }

  static async update(key, value) {
    try {
      await pool.query('UPDATE system_config SET value = ? WHERE `key` = ?', [value, key]);
      // Invalidate cache (non-fatal)
      try { await redis.del(CACHE_KEY); } catch (e) { /* Redis unavailable */ }
      return true;
    } catch (error) {
      console.error('Error in ConfigService.update:', error);
      throw error;
    }
  }

  static async updateMultiple(configMap) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const [key, value] of Object.entries(configMap)) {
        // Skip updating if it's a masked sensitive value
        if (typeof value === 'string' && value.includes('...')) {
            continue;
        }
        await connection.query('INSERT INTO system_config (`key`, `value`, `group`) VALUES (?, ?, "branding") ON DUPLICATE KEY UPDATE `value` = ?', [key, value, value]);
      }
      await connection.commit();
      // Invalidate cache (non-fatal)
      try { await redis.del(CACHE_KEY); } catch (e) { /* Redis unavailable */ }
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error in ConfigService.updateMultiple:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static maskSecret(value) {
    if (!value) return '';
    if (value.length <= 8) return '********';
    return value.substring(0, 4) + '...' + value.substring(value.length - 4);
  }
}
