import { pool } from './src/db/connection.js';
async function test() {
  const [rows] = await pool.query('DESCRIBE public_exams');
  console.log(rows.map(r => r.Field).join(', '));
  process.exit(0);
}
test();
