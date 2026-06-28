import { pool } from './connection.js';

async function run() {
  try {
    const [courses] = await pool.query('SELECT id, title, status FROM courses');
    console.log('Courses count:', courses.length);
    console.log('Courses:', courses);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
