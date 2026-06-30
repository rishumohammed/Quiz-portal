import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { pool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log(`[DEBUG] Attempting to connect to database...`);
  console.log(`[DEBUG] DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`[DEBUG] DB_USER: ${process.env.DB_USER || 'root'}`);
  console.log(`[DEBUG] DB_NAME: ${process.env.DB_NAME || 'aems_db'}`);
  console.log(`[DEBUG] Did it load from process.env? DB_USER=${process.env.DB_USER}`);

  const rootPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Ensuring database exists...');
  await rootPool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'aems_db'}`);
  await rootPool.end();

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split SQL by semicolons, but be careful with delimiters if they were there (not here)
    // mysql2/promise query doesn't support multiple statements by default for security
    // We can enable it in connection pool or split. Splitting is safer for simple scripts.
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (queryError) {
          const ignoreCodes = [
            'ER_DUP_FIELDNAME',
            'ER_TABLE_EXISTS_ERROR',
            'ER_DUP_KEYNAME',
            'ER_FK_DUP_NAME',
            'ER_DUP_UNIQUE',
            'ER_CANT_CREATE_TABLE',
            'ER_BAD_FIELD_ERROR',
            1005, 1050, 1060, 1061, 1091, 1054, 1826
          ];
          const isIgnored = ignoreCodes.includes(queryError.code) || 
                            ignoreCodes.includes(queryError.errno) ||
                            (queryError.sqlMessage && queryError.sqlMessage.includes('Duplicate key'));
          if (isIgnored) {
            console.log(`  [Ignored expected error]: ${queryError.sqlMessage}`);
          } else {
            throw queryError;
          }
        }
      }
      await connection.commit();
      console.log(`Successfully completed migration: ${file}`);
    } catch (error) {
      await connection.rollback();
      console.error(`Error in migration ${file}:`, error);
      process.exit(1);
    } finally {
      connection.release();
    }
  }

  console.log('All migrations completed successfully.');
  process.exit(0);
}

runMigrations();
