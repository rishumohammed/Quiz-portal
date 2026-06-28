import { pool } from './connection.js';

async function run() {
  try {
    const [users] = await pool.query("SELECT id, name, email, role, status FROM users WHERE name LIKE '%Sarah%' OR email LIKE '%sarah%'");
    console.log('Sarah Users:', users);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
