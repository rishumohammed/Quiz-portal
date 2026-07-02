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

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

migrate();
