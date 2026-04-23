const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @route   GET /api/tables
 * @desc    Get all tables - FILTER BY RESTAURANT
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user.restaurantId) {
      return res.json({
        success: true,
        data: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10, hasNextPage: false, hasPrevPage: false }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    let whereClause = 'WHERE restaurant_id = $1';
    let queryParams = [req.user.restaurantId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND name ILIKE $${paramCount}`;
      queryParams.push(`%${search}%`);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM restaurant_tables ${whereClause}`,
      queryParams
    );
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    paramCount++;
    const limitIdx = paramCount;
    paramCount++;
    const offsetIdx = paramCount;

    const result = await pool.query(
      `SELECT id, name, capacity, status, created_at, updated_at 
       FROM restaurant_tables ${whereClause} 
       ORDER BY name ASC 
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...queryParams, limit, offset]
    );

    console.log('🏪 GET /api/tables - Restaurant:', req.user.restaurantId, 'Total:', result.rows.length);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching tables:', error);
    res.status(500).json({ success: false, error: 'Internal server error', message: 'Gagal mengambil data meja' });
  }
});

/**
 * @route   GET /api/tables/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'ID meja tidak valid' });
    }
    if (!req.user.restaurantId) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan' });
    }

    const result = await pool.query(
      'SELECT id, name, capacity, status, created_at, updated_at FROM restaurant_tables WHERE id = $1 AND restaurant_id = $2',
      [id, req.user.restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error fetching table:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data meja' });
  }
});

/**
 * @route   POST /api/tables
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, capacity, status = 'kosong' } = req.body;

    if (!req.user.restaurantId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'User tidak terhubung ke restaurant. Silakan login ulang.' });
    }

    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length === 0) errors.push('Nama meja harus diisi');
    else if (name.trim().length > 100) errors.push('Nama meja maksimal 100 karakter');
    if (!capacity || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) errors.push('Kapasitas harus 1-20');

    const validStatuses = ['kosong', 'tersedia', 'terisi', 'reserved'];
    if (status && !validStatuses.includes(status)) errors.push('Status tidak valid');

    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Data tidak valid', details: errors });
    }

    const dup = await client.query(
      'SELECT id FROM restaurant_tables WHERE LOWER(name) = LOWER($1) AND restaurant_id = $2',
      [name.trim(), req.user.restaurantId]
    );
    if (dup.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Nama meja sudah digunakan' });
    }

    const result = await client.query(
      `INSERT INTO restaurant_tables (name, capacity, status, restaurant_id, created_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id, name, capacity, status, created_at, updated_at`,
      [name.trim(), capacity, status, req.user.restaurantId]
    );
    await client.query('COMMIT');

    console.log('✅ Table created - ID:', result.rows[0].id, 'Restaurant:', req.user.restaurantId);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Meja berhasil dibuat' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating table:', error);
    if (error.code === '23505') {
      res.status(409).json({ success: false, message: 'Nama meja sudah digunakan' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal membuat meja baru' });
    }
  } finally {
    client.release();
  }
});

/**
 * @route   PUT /api/tables/:id
 */
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, capacity, status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ID meja tidak valid' });
    }
    if (!req.user.restaurantId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'User tidak terhubung ke restaurant' });
    }

    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length === 0) errors.push('Nama meja harus diisi');
    else if (name.trim().length > 100) errors.push('Nama meja maksimal 100 karakter');
    if (!capacity || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) errors.push('Kapasitas harus 1-20');
    const validStatuses = ['kosong', 'tersedia', 'terisi', 'reserved'];
    if (!status || !validStatuses.includes(status)) errors.push('Status tidak valid');

    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Data tidak valid', details: errors });
    }

    const existing = await client.query(
      'SELECT id FROM restaurant_tables WHERE id = $1 AND restaurant_id = $2',
      [id, req.user.restaurantId]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan' });
    }

    const dup = await client.query(
      'SELECT id FROM restaurant_tables WHERE LOWER(name) = LOWER($1) AND id != $2 AND restaurant_id = $3',
      [name.trim(), id, req.user.restaurantId]
    );
    if (dup.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Nama meja sudah digunakan' });
    }

    const result = await client.query(
      `UPDATE restaurant_tables SET name = $1, capacity = $2, status = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND restaurant_id = $5
       RETURNING id, name, capacity, status, created_at, updated_at`,
      [name.trim(), capacity, status, id, req.user.restaurantId]
    );
    await client.query('COMMIT');

    console.log('✅ Table updated - ID:', id);
    res.json({ success: true, data: result.rows[0], message: 'Meja berhasil diperbarui' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating table:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui meja' });
  } finally {
    client.release();
  }
});

/**
 * @route   PATCH /api/tables/:id
 */
router.patch('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, capacity, status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ID meja tidak valid' });
    }
    if (!req.user.restaurantId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'User tidak terhubung ke restaurant' });
    }

    const existing = await client.query(
      'SELECT id, name, capacity, status FROM restaurant_tables WHERE id = $1 AND restaurant_id = $2',
      [id, req.user.restaurantId]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan' });
    }

    const errors = [];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Nama meja harus diisi');
      } else {
        const dup = await client.query(
          'SELECT id FROM restaurant_tables WHERE LOWER(name) = LOWER($1) AND id != $2 AND restaurant_id = $3',
          [name.trim(), id, req.user.restaurantId]
        );
        if (dup.rows.length > 0) {
          errors.push('Nama meja sudah digunakan');
        } else {
          paramCount++;
          updateFields.push(`name = $${paramCount}`);
          updateValues.push(name.trim());
        }
      }
    }

    if (capacity !== undefined) {
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
        errors.push('Kapasitas harus 1-20');
      } else {
        paramCount++;
        updateFields.push(`capacity = $${paramCount}`);
        updateValues.push(capacity);
      }
    }

    if (status !== undefined) {
      const validStatuses = ['kosong', 'tersedia', 'terisi', 'reserved'];
      if (!validStatuses.includes(status)) {
        errors.push('Status tidak valid');
      } else {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        updateValues.push(status);
      }
    }

    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Data tidak valid', details: errors });
    }
    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Tidak ada data yang akan diperbarui' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    paramCount++;
    updateValues.push(id);
    paramCount++;
    updateValues.push(req.user.restaurantId);

    const result = await client.query(
      `UPDATE restaurant_tables SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount - 1} AND restaurant_id = $${paramCount}
       RETURNING id, name, capacity, status, created_at, updated_at`,
      updateValues
    );
    await client.query('COMMIT');

    console.log('✅ Table patched - ID:', id);
    res.json({ success: true, data: result.rows[0], message: 'Meja berhasil diperbarui' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error patching table:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui meja' });
  } finally {
    client.release();
  }
});

/**
 * @route   PUT /api/tables/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'ID meja tidak valid' });
    }
    if (!req.user.restaurantId) {
      return res.status(400).json({ success: false, message: 'User tidak terhubung ke restaurant' });
    }

    const validStatuses = ['kosong', 'tersedia', 'terisi', 'reserved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status harus salah satu dari: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE restaurant_tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND restaurant_id = $3 RETURNING *',
      [status, id, req.user.restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan' });
    }

    console.log('✅ Table status updated - ID:', id, 'Status:', status);
    res.json({ success: true, data: result.rows[0], message: 'Status meja berhasil diperbarui' });
  } catch (error) {
    console.error('❌ Error updating table status:', error);
    res.status(500).json({ success: false, message: 'Gagal update status meja' });
  }
});

/**
 * @route   DELETE /api/tables/:id
 */
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'ID meja tidak valid' });
    }
    if (!req.user.restaurantId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'User tidak terhubung ke restaurant' });
    }

    const existing = await client.query(
      'SELECT id, name FROM restaurant_tables WHERE id = $1 AND restaurant_id = $2',
      [id, req.user.restaurantId]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan' });
    }

    const activeOrders = await client.query(
      "SELECT COUNT(*) as count FROM orders WHERE table_id = $1 AND status NOT IN ('completed', 'cancelled') AND restaurant_id = $2",
      [id, req.user.restaurantId]
    );
    if (parseInt(activeOrders.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Tidak dapat menghapus meja yang sedang digunakan' });
    }

    const result = await client.query(
      'DELETE FROM restaurant_tables WHERE id = $1 AND restaurant_id = $2 RETURNING id, name',
      [id, req.user.restaurantId]
    );
    await client.query('COMMIT');

    console.log('✅ Table deleted - ID:', id);
    res.json({ success: true, data: result.rows[0], message: 'Meja berhasil dihapus' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting table:', error);
    if (error.code === '23503') {
      res.status(409).json({ success: false, message: 'Tidak dapat menghapus meja yang memiliki data terkait' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal menghapus meja' });
    }
  } finally {
    client.release();
  }
});

module.exports = router;
