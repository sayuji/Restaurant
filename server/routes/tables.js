const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @route   GET /api/tables
 * @desc    Get all tables with optional pagination
 * @access  Public
 * @query   page (number) - Page number (default: 1)
 * @query   limit (number) - Items per page (default: 10, max: 100)
 * @query   status (string) - Filter by status (optional)
 * @query   search (string) - Search by table name (optional)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    // Build dynamic query with filters
    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += `WHERE status = $${paramCount}`;
      queryParams.push(status);
    }

    if (search) {
      paramCount++;
      whereClause += whereClause ? ` AND name ILIKE $${paramCount}` : `WHERE name ILIKE $${paramCount}`;
      queryParams.push(`%${search}%`);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM restaurant_tables ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated results
    const dataQuery = `
      SELECT id, name, capacity, status, created_at, updated_at 
      FROM restaurant_tables 
      ${whereClause} 
      ORDER BY name ASC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(dataQuery, queryParams);

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
    console.error('Error fetching tables:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: 'Gagal mengambil data meja' 
    });
  }
});

/**
 * @route   GET /api/tables/:id
 * @desc    Get single table by ID
 * @access  Public
 * @param   id (number) - Table ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID',
        message: 'ID meja tidak valid'
      });
    }

    const result = await pool.query(
      'SELECT id, name, capacity, status, created_at, updated_at FROM restaurant_tables WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
        message: 'Meja tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: 'Gagal mengambil data meja' 
    });
  }
});

/**
 * @route   POST /api/tables
 * @desc    Create a new table
 * @access  Public
 * @body    name (string, required) - Table name (unique)
 * @body    capacity (number, required) - Table capacity (min: 1, max: 20)
 * @body    status (string, optional) - Table status (default: 'kosong')
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { name, capacity, status = 'kosong' } = req.body;

    // Input validation
    const errors = [];
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Nama meja harus diisi');
    } else if (name.trim().length > 100) {
      errors.push('Nama meja maksimal 100 karakter');
    }

    if (!capacity || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
      errors.push('Kapasitas meja harus berupa angka antara 1-20');
    }

    const validStatuses = ['kosong', 'tersedia', 'terisi', 'reserved'];
    if (status && !validStatuses.includes(status)) {
      errors.push(`Status meja harus salah satu dari: ${validStatuses.join(', ')}`);
    }

    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Data tidak valid',
        details: errors
      });
    }

    // Check for duplicate table name
    const duplicateCheck = await client.query(
      'SELECT id FROM restaurant_tables WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Duplicate table name',
        message: 'Nama meja sudah digunakan'
      });
    }

    // Insert new table
    const result = await client.query(
      `INSERT INTO restaurant_tables (name, capacity, status, created_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       RETURNING id, name, capacity, status, created_at, updated_at`,
      [name.trim(), capacity, status]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Meja berhasil dibuat'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating table:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        error: 'Duplicate table name',
        message: 'Nama meja sudah digunakan'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: 'Gagal membuat meja baru' 
      });
    }
  } finally {
    client.release();
  }
});

/**
 * @route   PUT /api/tables/:id
 * @desc    Update entire table entry
 * @access  Public
 * @param   id (number) - Table ID
 * @body    name (string, required) - Table name
 * @body    capacity (number, required) - Table capacity
 * @body    status (string, required) - Table status
 */
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { name, capacity, status } = req.body;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID',
        message: 'ID meja tidak valid'
      });
    }

    // Input validation
    const errors = [];
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Nama meja harus diisi');
    } else if (name.trim().length > 100) {
      errors.push('Nama meja maksimal 100 karakter');
    }

    if (!capacity || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
      errors.push('Kapasitas meja harus berupa angka antara 1-20');
    }

    const validStatuses = ['kosong', 'tersedia', 'terisi', 'reserved'];
    if (!status || !validStatuses.includes(status)) {
      errors.push(`Status meja harus salah satu dari: ${validStatuses.join(', ')}`);
    }

    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Data tidak valid',
        details: errors
      });
    }

    // Check if table exists
    const existingTable = await client.query(
      'SELECT id, name FROM restaurant_tables WHERE id = $1',
      [id]
    );

    if (existingTable.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Table not found',
        message: 'Meja tidak ditemukan'
      });
    }

    // Check for duplicate table name (excluding current table)
    const duplicateCheck = await client.query(
      'SELECT id FROM restaurant_tables WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name.trim(), id]
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Duplicate table name',
        message: 'Nama meja sudah digunakan'
      });
    }

    // Update table
    const result = await client.query(
      `UPDATE restaurant_tables 
       SET name = $1, capacity = $2, status = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, name, capacity, status, created_at, updated_at`,
      [name.trim(), capacity, status, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Meja berhasil diperbarui'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating table:', error);
    
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        error: 'Duplicate table name',
        message: 'Nama meja sudah digunakan'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: 'Gagal memperbarui meja' 
      });
    }
  } finally {
    client.release();
  }
});

/**
 * @route   PATCH /api/tables/:id
 * @desc    Partially update table entry
 * @access  Public
 * @param   id (number) - Table ID
 * @body    name (string, optional) - Table name
 * @body    capacity (number, optional) - Table capacity
 * @body    status (string, optional) - Table status
 */
router.patch('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { name, capacity, status } = req.body;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID',
        message: 'ID meja tidak valid'
      });
    }

    // Check if table exists
    const existingTable = await client.query(
      'SELECT id, name, capacity, status FROM restaurant_tables WHERE id = $1',
      [id]
    );

    if (existingTable.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Table not found',
        message: 'Meja tidak ditemukan'
      });
    }

    // Validate provided fields
    const errors = [];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Nama meja harus diisi');
      } else if (name.trim().length > 100) {
        errors.push('Nama meja maksimal 100 karakter');
      } else {
        // Check for duplicate name
        const duplicateCheck = await client.query(
          'SELECT id FROM restaurant_tables WHERE LOWER(name) = LOWER($1) AND id != $2',
          [name.trim(), id]
        );

        if (duplicateCheck.rows.length > 0) {
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
        errors.push('Kapasitas meja harus berupa angka antara 1-20');
      } else {
        paramCount++;
        updateFields.push(`capacity = $${paramCount}`);
        updateValues.push(capacity);
      }
    }

    if (status !== undefined) {
      const validStatuses = ['kosong', 'tersedia', 'terisi', 'reserved'];
      if (!validStatuses.includes(status)) {
        errors.push(`Status meja harus salah satu dari: ${validStatuses.join(', ')}`);
      } else {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        updateValues.push(status);
      }
    }

    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Data tidak valid',
        details: errors
      });
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'Tidak ada data yang akan diperbarui'
      });
    }

    // Add updated_at field (no parameter needed for CURRENT_TIMESTAMP)
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add WHERE clause parameter
    paramCount++;
    updateValues.push(id);

    // Update table
    const updateQuery = `
      UPDATE restaurant_tables 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, name, capacity, status, created_at, updated_at
    `;

    const result = await client.query(updateQuery, updateValues);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Meja berhasil diperbarui'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating table:', error);
    
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        error: 'Duplicate table name',
        message: 'Nama meja sudah digunakan'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: 'Gagal memperbarui meja' 
      });
    }
  } finally {
    client.release();
  }
});

/**
 * @route   PUT /api/tables/:id/status
 * @desc    Update table status only (legacy endpoint for compatibility)
 * @access  Public
 * @param   id (number) - Table ID
 * @body    status (string, required) - New table status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID',
        message: 'ID meja tidak valid'
      });
    }

    // Validate status
    const validStatuses = ['kosong', 'tersedia', 'terisi', 'reserved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status harus salah satu dari: ${validStatuses.join(', ')}`
      });
    }

    const result = await pool.query(
      'UPDATE restaurant_tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
        message: 'Meja tidak ditemukan'
      });
    }

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Status meja berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: 'Gagal update status meja' 
    });
  }
});

/**
 * @route   DELETE /api/tables/:id
 * @desc    Delete a table
 * @access  Public
 * @param   id (number) - Table ID
 */
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Invalid table ID',
        message: 'ID meja tidak valid'
      });
    }

    // Check if table exists
    const existingTable = await client.query(
      'SELECT id, name, status FROM restaurant_tables WHERE id = $1',
      [id]
    );

    if (existingTable.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Table not found',
        message: 'Meja tidak ditemukan'
      });
    }

    // Check if table is currently in use (has active orders)
    const activeOrdersCheck = await client.query(
      'SELECT COUNT(*) as count FROM orders WHERE table_id = $1 AND status NOT IN (\'completed\', \'cancelled\')',
      [id]
    );

    if (parseInt(activeOrdersCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Table in use',
        message: 'Tidak dapat menghapus meja yang sedang digunakan'
      });
    }

    // Delete the table
    const result = await client.query(
      'DELETE FROM restaurant_tables WHERE id = $1 RETURNING id, name',
      [id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Meja berhasil dihapus'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting table:', error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      res.status(409).json({
        success: false,
        error: 'Table has dependencies',
        message: 'Tidak dapat menghapus meja yang memiliki data terkait'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: 'Gagal menghapus meja' 
      });
    }
  } finally {
    client.release();
  }
});

module.exports = router;