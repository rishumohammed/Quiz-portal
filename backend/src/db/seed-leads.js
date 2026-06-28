import { v4 as uuidv4 } from 'uuid';
import { pool } from './connection.js';

async function seedLeads() {
  const connection = await pool.getConnection();
  try {
    console.log('Seeding test leads...');
    
    // Get a course ID for interest
    const [courses] = await connection.query('SELECT id FROM courses LIMIT 1');
    const courseId = courses[0]?.id;

    const leads = [
      { id: uuidv4(), name: 'Test Interested Lead', email: 'interested@test.com', phone: '1234567890', status: 'interested' },
      { id: uuidv4(), name: 'Test Open Lead', email: 'open@test.com', phone: '9876543210', status: 'open' }
    ];

    for (const lead of leads) {
      await connection.query(
        'INSERT INTO leads (id, name, email, phone, source, status, course_interest_id) VALUES (?, ?, ?, ?, "website", ?, ?)',
        [lead.id, lead.name, lead.email, lead.phone, lead.status, courseId]
      );
    }

    console.log('Leads seeded successfully.');
  } catch (error) {
    console.error('Error seeding leads:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedLeads();
