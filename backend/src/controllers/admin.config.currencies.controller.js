import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const AdminCurrenciesController = {
  // GET /api/admin/config/currencies
  async getCurrencies(req, res) {
    try {
      const [currencies] = await pool.query('SELECT * FROM currencies ORDER BY is_base DESC, code ASC');
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // POST /api/admin/config/currencies
  async addCurrency(req, res) {
    try {
      const { code, symbol, name, exchange_rate, is_active } = req.body;
      const id = uuidv4();

      await pool.query(
        'INSERT INTO currencies (id, code, symbol, name, exchange_rate, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [id, code.toUpperCase(), symbol, name, exchange_rate || 1.0, is_active ?? true]
      );

      res.status(201).json({ id, message: 'Currency added successfully' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Currency code already exists' });
      }
      res.status(500).json({ message: error.message });
    }
  },

  // PUT /api/admin/config/currencies/:id
  async updateCurrency(req, res) {
    try {
      const { id } = req.params;
      const { code, symbol, name, exchange_rate, is_active } = req.body;

      await pool.query(
        'UPDATE currencies SET code = ?, symbol = ?, name = ?, exchange_rate = ?, is_active = ? WHERE id = ?',
        [code.toUpperCase(), symbol, name, exchange_rate, is_active, id]
      );

      res.json({ message: 'Currency updated successfully' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Currency code already exists' });
      }
      res.status(500).json({ message: error.message });
    }
  },

  // DELETE /api/admin/config/currencies/:id
  async deleteCurrency(req, res) {
    try {
      const { id } = req.params;

      const [rows] = await pool.query('SELECT is_base FROM currencies WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].is_base) {
        return res.status(400).json({ message: 'Cannot delete the base currency. Set a different base currency first.' });
      }

      await pool.query('DELETE FROM currencies WHERE id = ?', [id]);
      res.json({ message: 'Currency deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // PATCH /api/admin/config/currencies/:id/set-base
  async setBaseCurrency(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;

      // Unset existing base currencies
      await connection.query('UPDATE currencies SET is_base = FALSE WHERE is_base = TRUE');

      // Set new base currency and force exchange rate to 1.0000
      await connection.query('UPDATE currencies SET is_base = TRUE, exchange_rate = 1.0000 WHERE id = ?', [id]);

      await connection.commit();
      res.json({ message: 'Base currency updated successfully' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: error.message });
    } finally {
      connection.release();
    }
  }
};
