import { pool } from './src/db/connection.js';

async function migrate() {
  console.log('Starting migration...');
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Add login_count
    try {
      await connection.query('ALTER TABLE public_exam_candidates ADD COLUMN login_count INT DEFAULT 0');
      console.log('✅ Added login_count column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ login_count column already exists');
      } else {
        throw err;
      }
    }

    // Add last_login_at
    try {
      await connection.query('ALTER TABLE public_exam_candidates ADD COLUMN last_login_at DATETIME');
      console.log('✅ Added last_login_at column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ last_login_at column already exists');
      } else {
        throw err;
      }
    }

    // Create proctoring_events table if not exists
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS proctoring_events (
          id VARCHAR(36) PRIMARY KEY,
          attempt_id VARCHAR(36) NOT NULL,
          type VARCHAR(50) NOT NULL,
          metadata_json JSON,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (attempt_id) REFERENCES public_exam_attempts(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Checked/Created proctoring_events table');
    } catch (err) {
      console.error('❌ Failed to create proctoring_events table:', err.message);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

migrate();
