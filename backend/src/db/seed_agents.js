import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from './connection.js';

async function seedAgents() {
  const agents = [
    { name: 'Agent Smith', email: 'smith@aems.local' },
    { name: 'Agent Johnson', email: 'johnson@aems.local' },
    { name: 'Agent Brown', email: 'brown@aems.local' }
  ];

  const password = await bcrypt.hash('Agent@123', 10);

  for (const agent of agents) {
    await pool.query(
      'INSERT INTO users (id, role, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [uuidv4(), 'crm_agent', agent.name, agent.email, password, 'active']
    );
  }

  console.log('CRM agents seeded successfully.');
}

seedAgents().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
