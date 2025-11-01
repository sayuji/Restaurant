const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all orders - SAMA PATTERN DENGAN menu.js
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'menu_name', oi.menu_name, 
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'notes', oi.notes
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE new order - SAMA PATTERN DENGAN menu.js  
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { tableId, tableName, items, totalHarga } = req.body;
    
    // Insert order - SAMA PATTERN DENGAN menu create
    const orderResult = await client.query(
      'INSERT INTO orders (table_id, table_name, total_price) VALUES ($1, $2, $3) RETURNING *',
      [tableId, tableName, totalHarga]
    );
    
    const orderId = orderResult.rows[0].id;
    
    // Insert order items
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, menu_name, quantity, price, notes) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.nama, item.qty, item.harga, item.catatan || '']
      );
    }
    
    // Update table status
    await client.query(
      'UPDATE restaurant_tables SET status = $1 WHERE id = $2',
      ['terisi', tableId]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      orderId,
      message: 'Order berhasil dibuat' 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Gagal membuat order' });
  } finally {
    client.release();
  }
});

module.exports = router;