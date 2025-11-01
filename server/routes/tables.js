const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all tables - SAMA PATTERN DENGAN menu.js
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurant_tables ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE table status - SAMA PATTERN DENGAN menu update
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE restaurant_tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    res.json({ success: true, table: result.rows[0] });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ error: 'Gagal update status meja' });
  }
});

module.exports = router;