import { pool } from './src/db/connection.js';

async function updateAdminEmail() {
  try {
    const [result] = await pool.query(
      "UPDATE users SET email = 'projects@kefta.in' WHERE email = 'admin@aems.local'"
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Admin email successfully updated to projects@kefta.in!');
    } else {
      console.log('⚠️ No user found with the email admin@aems.local.');
    }
  } catch (error) {
    console.error('❌ Failed to update admin email:', error);
  } finally {
    process.exit(0);
  }
}

updateAdminEmail();
