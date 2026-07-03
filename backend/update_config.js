import { pool } from './src/db/connection.js';

async function updateDb() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM global_config LIMIT 1');
    console.log('Current config:', rows[0]);
    if (rows.length > 0) {
      await connection.query('UPDATE global_config SET institute_name = "Kefta Talent Hunt"');
      console.log('Updated institute_name to Kefta Talent Hunt');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

updateDb();
