import { pool } from './connection.js';
import { v4 as uuidv4 } from 'uuid';

async function test() {
  try {
    const studentId = '24e54be2-7edf-4f6b-8dc3-93bdb1854449';
    const platform_name = 'Telegram';
    const statusToSet = 'followed';
    const statusId = uuidv4();

    console.log('Inserting with', {statusId, studentId, platform_name, statusToSet});
    const [result] = await pool.query(
      `INSERT INTO student_social_platform_status (id, student_id, platform_name, followed_status, followed_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        followed_status = VALUES(followed_status),
        followed_at = IF(VALUES(followed_status) = 'followed', CURRENT_TIMESTAMP, NULL)`,
      [statusId, studentId, platform_name, statusToSet]
    );
    console.log('Success:', result);
    process.exit(0);
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
test();
