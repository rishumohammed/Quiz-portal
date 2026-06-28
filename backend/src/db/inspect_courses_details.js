import { pool } from './connection.js';

async function run() {
  try {
    const [courses] = await pool.query(`
      SELECT c.id, c.title, c.category_id, c.status, c.price_type, c.price,
             u.name as tutor_name, cat.name as category_name
      FROM courses c
      LEFT JOIN users u ON c.tutor_id = u.id
      LEFT JOIN course_categories cat ON c.category_id = cat.id
      WHERE c.status = 'published'
    `);
    console.log('Courses:', JSON.stringify(courses, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
