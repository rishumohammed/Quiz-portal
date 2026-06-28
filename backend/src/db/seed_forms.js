import { pool } from './connection.js';
import { v4 as uuidv4 } from 'uuid';

async function seedForms() {
  const forms = [
    {
      id: 'default-inquiry-form',
      form_name: 'Homepage Inquiry',
      is_active: true,
      fields_json: JSON.stringify([
        { field_key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe', order: 1 },
        { field_key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com', order: 2 },
        { field_key: 'phone', label: 'Phone Number', type: 'phone', required: true, order: 3 },
        { field_key: 'course', label: 'Interested Course', type: 'dropdown', options: ['Full Stack Dev', 'UI/UX Design', 'Data Science', 'Digital Marketing'], required: true, order: 4 },
        { field_key: 'message', label: 'Your Message', type: 'textarea', required: false, placeholder: 'Tell us more about your goals', order: 5 }
      ])
    },
    {
      id: 'course-detail-form',
      form_name: 'Course Detail Inquiry',
      is_active: true,
      fields_json: JSON.stringify([
        { field_key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe', order: 1 },
        { field_key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com', order: 2 },
        { field_key: 'phone', label: 'Phone Number', type: 'phone', required: true, order: 3 },
        { field_key: 'qualification', label: 'Last Qualification', type: 'dropdown', options: ['10th', '12th', 'Graduate', 'Post Graduate'], required: true, order: 4 }
      ])
    }
  ];

  for (const form of forms) {
    await pool.query(
      'INSERT INTO lead_form_configs (id, form_name, fields_json, is_active) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE form_name = VALUES(form_name), fields_json = VALUES(fields_json)',
      [form.id, form.form_name, form.fields_json, form.is_active]
    );
  }

  console.log('Form configurations seeded successfully.');
}

seedForms().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
