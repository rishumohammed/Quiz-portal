import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aems',
});

const statements = [
  "ALTER TABLE courses ADD COLUMN short_description TEXT AFTER description",
  "ALTER TABLE courses ADD COLUMN level VARCHAR(50) AFTER short_description",
  "ALTER TABLE courses ADD COLUMN language VARCHAR(50) DEFAULT 'English' AFTER level",
  "ALTER TABLE courses ADD COLUMN intro_video_source ENUM('youtube', 'vimeo') AFTER language",
  "ALTER TABLE courses ADD COLUMN intro_video_id VARCHAR(255) AFTER intro_video_source",
  "ALTER TABLE courses ADD COLUMN approval_required BOOLEAN DEFAULT FALSE AFTER status",
  "ALTER TABLE courses ADD COLUMN approved_by CHAR(36) AFTER approval_required",
  "ALTER TABLE courses ADD COLUMN published_at DATETIME AFTER approved_by",
  "ALTER TABLE courses ADD COLUMN rejection_reason TEXT AFTER published_at",
  "ALTER TABLE courses ADD CONSTRAINT fk_courses_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL",
  "ALTER TABLE courses ADD COLUMN is_featured BOOLEAN DEFAULT FALSE",
  "ALTER TABLE courses ADD COLUMN deleted_at DATETIME NULL",
  "ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL",
  "ALTER TABLE exams ADD COLUMN deleted_at DATETIME NULL",
  "ALTER TABLE public_exams ADD COLUMN deleted_at DATETIME NULL"
];

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Safely adding missing columns...');
    for (const stmt of statements) {
      try {
        await conn.query(stmt);
        console.log(`✅ Added: ${stmt.split('ADD COLUMN ')[1]?.split(' ')[0] || 'Constraint'}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_CANT_CREATE_TABLE') {
          console.log(`⏭️ Skipped (already exists): ${stmt.split('ADD COLUMN ')[1]?.split(' ')[0] || 'Constraint'}`);
        } else {
          console.error(`❌ Error on: ${stmt}\n   -> ${err.message}`);
        }
      }
    }
    console.log('🎉 All columns are set up correctly!');
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
