import express from 'express';
import { pool } from '../db/connection.js';

const router = express.Router();

// GET /api/admin/email-templates
router.get('/', async (req, res) => {
  try {
    const [templates] = await pool.query('SELECT id, name, subject, body, updated_at FROM email_templates ORDER BY name ASC');
    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/admin/email-templates/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

    const [result] = await pool.query(
      'UPDATE email_templates SET subject = ?, body = ? WHERE id = ?',
      [subject, body, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
