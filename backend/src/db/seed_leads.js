import { pool } from './connection.js';
import { v4 as uuidv4 } from 'uuid';

async function seedLeads() {
  const connection = await pool.getConnection();
  try {
    console.log('Seeding lead form configurations...');
    await connection.beginTransaction();

    const formFields = [
      { field_key: 'name', label: 'Full Name', type: 'text', required: true, order: 1, placeholder: 'Enter your full name' },
      { field_key: 'email', label: 'Email Address', type: 'email', required: true, order: 2, placeholder: 'example@mail.com' },
      { field_key: 'phone', label: 'Phone Number', type: 'phone', required: true, order: 3, placeholder: '' },
      { field_key: 'course_interest', label: 'Interested Course', type: 'dropdown', required: true, order: 4, options: ['Web Development', 'Data Science', 'Finance', 'Language', 'Other'], placeholder: 'Select a course' },
      { field_key: 'message', label: 'Your Message', type: 'textarea', required: false, order: 5, placeholder: 'How can we help you?' }
    ];

    // Check if default form exists
    const [existing] = await connection.query('SELECT id FROM lead_form_configs WHERE id = ?', ['default-inquiry-form']);
    
    if (existing.length === 0) {
      await connection.query(
        'INSERT INTO lead_form_configs (id, form_name, fields_json, is_active) VALUES (?, ?, ?, ?)',
        ['default-inquiry-form', 'Homepage Inquiry Form', JSON.stringify(formFields), true]
      );
      console.log('Created default-inquiry-form');
    } else {
      console.log('default-inquiry-form already exists, skipping.');
    }

    await connection.commit();
    console.log('Lead seeding completed.');
  } catch (error) {
    await connection.rollback();
    console.error('Error seeding leads:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedLeads();
