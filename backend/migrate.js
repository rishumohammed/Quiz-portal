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

    // Add active_question_bank to public_exams
    try {
      await connection.query("ALTER TABLE public_exams ADD COLUMN active_question_bank VARCHAR(255) DEFAULT 'Default Bank'");
      console.log('✅ Added active_question_bank column to public_exams');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ active_question_bank column already exists');
      else throw err;
    }

    // Add bank_name to public_exam_questions
    try {
      await connection.query("ALTER TABLE public_exam_questions ADD COLUMN bank_name VARCHAR(255) DEFAULT 'Default Bank'");
      console.log('✅ Added bank_name column to public_exam_questions');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ bank_name column already exists');
      else throw err;
    }

    // Add reminder_24h_sent to public_exam_candidates
    try {
      await connection.query("ALTER TABLE public_exam_candidates ADD COLUMN reminder_24h_sent TINYINT(1) DEFAULT 0");
      console.log('✅ Added reminder_24h_sent column to public_exam_candidates');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ reminder_24h_sent column already exists');
      else throw err;
    }

    // Add certificate_number to public_exam_issued_certificates
    try {
      await connection.query("ALTER TABLE public_exam_issued_certificates ADD COLUMN certificate_number VARCHAR(100) NULL");
      console.log('✅ Added certificate_number column to public_exam_issued_certificates');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ certificate_number column already exists');
      else throw err;
    }

    // Set Default Bank for all existing questions and exams
    try {
      await connection.query("UPDATE public_exam_questions SET bank_name = 'Default Bank' WHERE bank_name IS NULL");
      await connection.query("UPDATE public_exams SET active_question_bank = 'Default Bank' WHERE active_question_bank IS NULL");
      console.log('✅ Backfilled existing questions and exams to "Default Bank"');
    } catch (err) {
      console.warn('⚠️ Backfill warning:', err.message);
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
