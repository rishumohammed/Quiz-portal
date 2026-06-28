import { pool } from './connection.js';
async function test() {
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM enrollments');
    const colNames = cols.map(c => c.Field);
    let alters = [];
    if (!colNames.includes('completed_at')) alters.push('ADD COLUMN completed_at TIMESTAMP NULL');
    if (!colNames.includes('email_sent_status')) alters.push('ADD COLUMN email_sent_status BOOLEAN DEFAULT FALSE');
    if (!colNames.includes('certificate_generated')) alters.push('ADD COLUMN certificate_generated BOOLEAN DEFAULT FALSE');
    
    if (alters.length > 0) {
      await pool.query(`ALTER TABLE enrollments ${alters.join(', ')}`);
      console.log('Added columns to enrollments table.');
    } else {
      console.log('Columns already exist.');
    }
    process.exit(0);
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
}
test();
