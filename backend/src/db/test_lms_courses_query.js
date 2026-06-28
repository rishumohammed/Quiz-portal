import { pool } from './connection.js';

async function run() {
  try {
    let query = `
      SELECT c.*, u.name as tutor_name, cat.name as category_name,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.tutor_id = u.id
      LEFT JOIN course_categories cat ON c.category_id = cat.id
    `;
    const params = [];
    const conditions = [];

    conditions.push('c.status = "published"');

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY c.created_at DESC';
    const [courses] = await pool.query(query, params);
    console.log('Query output count:', courses.length);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
