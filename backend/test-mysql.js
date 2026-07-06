import mysql from 'mysql2/promise';

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kefta_talent_hunt'
  });
  
  try {
    const [rows] = await pool.query('SELECT exam_start_date FROM public_exams LIMIT 1');
    console.log('Current DB:', rows[0].exam_start_date);
    
    // simulate formatMySQL
    const dateStr = "2026-07-10T12:00";
    const d = new Date(dateStr);
    const formatted = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    
    console.log('Formatted string:', formatted);
    
    // simulate update
    // await pool.query('UPDATE public_exams SET exam_start_date = ? LIMIT 1', [formatted]);
    // const [rows2] = await pool.query('SELECT exam_start_date FROM public_exams LIMIT 1');
    // console.log('After update:', rows2[0].exam_start_date);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

test();
