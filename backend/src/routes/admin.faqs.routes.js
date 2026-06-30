import express from 'express';
import pool from '../db/index.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles('super_admin'));

// Get all FAQs
router.get('/', async (req, res) => {
  try {
    const [faqs] = await pool.query('SELECT * FROM faqs ORDER BY order_index ASC, id DESC');
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Server error fetching FAQs' });
  }
});

// Create FAQ
router.post('/', async (req, res) => {
  const { question, answer, is_active } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO faqs (question, answer, is_active) VALUES (?, ?, ?)',
      [question, answer, is_active ?? true]
    );
    res.status(201).json({ id: result.insertId, message: 'FAQ created successfully' });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Server error creating FAQ' });
  }
});

// Update FAQ
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { question, answer, is_active, order_index } = req.body;
  
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

  try {
    await pool.query(
      'UPDATE faqs SET question = ?, answer = ?, is_active = ?, order_index = ? WHERE id = ?',
      [question, answer, is_active ?? true, order_index || 0, id]
    );
    res.json({ message: 'FAQ updated successfully' });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Server error updating FAQ' });
  }
});

// Delete FAQ
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM faqs WHERE id = ?', [id]);
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Server error deleting FAQ' });
  }
});

// Reorder FAQs
router.post('/reorder', async (req, res) => {
  const { items } = req.body; // Array of { id, order_index }
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      for (const item of items) {
        await connection.query('UPDATE faqs SET order_index = ? WHERE id = ?', [item.order_index, item.id]);
      }
      await connection.commit();
      res.json({ message: 'FAQs reordered successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error reordering FAQs:', error);
    res.status(500).json({ error: 'Server error reordering FAQs' });
  }
});

export default router;
