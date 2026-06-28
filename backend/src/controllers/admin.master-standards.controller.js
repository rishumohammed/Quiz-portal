import { pool as db } from '../db/connection.js';

export const getStandards = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM master_standards ORDER BY sort_order ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching standards:', error);
    res.status(500).json({ message: 'Failed to fetch standards' });
  }
};

export const createStandard = async (req, res) => {
  const { name, sub, icon, color, is_active, sort_order } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO master_standards (name, sub, icon, color, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name, sub, icon, color, is_active ?? true, sort_order ?? 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Standard created successfully' });
  } catch (error) {
    console.error('Error creating standard:', error);
    res.status(500).json({ message: 'Failed to create standard' });
  }
};

export const updateStandard = async (req, res) => {
  const { id } = req.params;
  const { name, sub, icon, color, is_active, sort_order } = req.body;
  try {
    await db.query(
      'UPDATE master_standards SET name = ?, sub = ?, icon = ?, color = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [name, sub, icon, color, is_active, sort_order, id]
    );
    res.json({ message: 'Standard updated successfully' });
  } catch (error) {
    console.error('Error updating standard:', error);
    res.status(500).json({ message: 'Failed to update standard' });
  }
};

export const deleteStandard = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM master_standards WHERE id = ?', [id]);
    res.json({ message: 'Standard deleted successfully' });
  } catch (error) {
    console.error('Error deleting standard:', error);
    res.status(500).json({ message: 'Failed to delete standard' });
  }
};
