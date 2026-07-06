import { pool } from './src/db/connection.js';

async function addMaxRetakesColumn() {
  try {
    console.log('Adding max_retakes column to public_exams table...');
    await pool.query('ALTER TABLE public_exams ADD COLUMN max_retakes INT DEFAULT 0 AFTER allow_retake');
    console.log('Successfully added max_retakes column!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('max_retakes column already exists. No action needed.');
    } else {
      console.error('Failed to add column:', err.message);
    }
  } finally {
    process.exit();
  }
}

addMaxRetakesColumn();
