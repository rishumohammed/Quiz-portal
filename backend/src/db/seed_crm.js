import { v4 as uuidv4 } from 'uuid';
import { pool } from './connection.js';

async function seedCRM() {
  const connection = await pool.getConnection();
  try {
    console.log('Seeding CRM data...');
    await connection.beginTransaction();

    // Find the agent smith@aems.local
    const [agents] = await connection.query('SELECT id FROM users WHERE email = "smith@aems.local"');
    if (agents.length === 0) {
      console.error('Agent smith@aems.local not found. Run seed_agents.js first.');
      return;
    }
    const agentId = agents[0].id;

    // Find some courses
    const [courses] = await connection.query('SELECT id FROM courses LIMIT 3');
    const courseId = courses.length > 0 ? courses[0].id : null;

    const leads = [
      { name: 'John Doe', email: 'john@example.com', phone: '+919999999999', status: 'open', source: 'website' },
      { name: 'Jane Roe', email: 'jane@example.com', phone: '+918888888888', status: 'interested', source: 'whatsapp' },
      { name: 'Bob Vance', email: 'bob@vance.com', phone: '+917777777777', status: 'called', source: 'manual' },
      { name: 'Alice Wonder', email: 'alice@wonder.com', phone: '+916666666666', status: 'converted', source: 'website' }
    ];

    for (const lead of leads) {
      const leadId = uuidv4();
      await connection.query(
        'INSERT INTO leads (id, name, email, phone, status, source, assigned_to, course_interest_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [leadId, lead.name, lead.email, lead.phone, lead.status, lead.source, agentId, courseId]
      );

      // Add some activities
      await connection.query(
        'INSERT INTO lead_activities (id, lead_id, agent_id, type, content) VALUES (?, ?, ?, "note", ?)',
        [uuidv4(), leadId, agentId, `Initial lead capture from ${lead.source}`]
      );
    }

    await connection.commit();
    console.log('CRM seeding completed successfully.');
  } catch (error) {
    await connection.rollback();
    console.error('Error seeding CRM:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedCRM();
