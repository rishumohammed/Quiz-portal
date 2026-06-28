import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const FormController = {
  async createConfig(req, res) {
    try {
      const { form_name, fields_json, is_active } = req.body;
      const id = uuidv4();

      await pool.query(
        'INSERT INTO lead_form_configs (id, form_name, fields_json, is_active) VALUES (?, ?, ?, ?)',
        [id, form_name, JSON.stringify(fields_json), is_active ?? true]
      );

      res.status(201).json({ message: 'Form configuration created', id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateConfig(req, res) {
    try {
      const { id } = req.params;
      const { form_name, fields_json, is_active } = req.body;

      await pool.query(
        'UPDATE lead_form_configs SET form_name = ?, fields_json = ?, is_active = ? WHERE id = ?',
        [form_name, JSON.stringify(fields_json), is_active, id]
      );

      res.json({ message: 'Form configuration updated' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async listConfigs(req, res) {
    try {
      const [forms] = await pool.query('SELECT * FROM lead_form_configs ORDER BY created_at DESC');
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getConfig(req, res) {
    try {
      const { id } = req.params;
      const [forms] = await pool.query('SELECT * FROM lead_form_configs WHERE id = ? AND is_active = TRUE', [id]);
      
      if (forms.length === 0) {
        return res.status(404).json({ message: 'Form not found' });
      }

      res.json(forms[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};
