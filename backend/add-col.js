import mysql from 'mysql2/promise';

async function addColumn() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kefta_talent_hunt'
  });
  
  try {
    console.log('Adding max_retakes column...');
    await pool.query('ALTER TABLE public_exams ADD COLUMN max_retakes INT DEFAULT 0 AFTER allow_retake');
    console.log('Column added successfully!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists!');
    } else {
      console.error(err);
    }
  }
  process.exit();
}

addColumn();
