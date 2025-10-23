const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Halo bang! Backend RESTAURANT dengan PostgreSQL udah jalan! 🚀',
    status: 'OK'
  });
});

// 🔥 POSTGRESQL ROUTES

// GET all menus
app.get('/api/menu', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menus ORDER BY created_at DESC');
    
    // 🔥 CONVERT category string ke object yang diexpect frontend
    const menusWithCategoryObject = result.rows.map(menu => ({
      ...menu,
      category: menu.category ? { 
        value: menu.category, 
        label: menu.category 
      } : null
    }));
    
    console.log('📦 GET /api/menu - Total:', menusWithCategoryObject.length);
    res.json(menusWithCategoryObject);
  } catch (error) {
    console.error('❌ Error fetching menus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create new menu
app.post('/api/menu', async (req, res) => {
  try {
    const { name, price, description, category, image, isAvailable } = req.body;
    
    console.log('➕ POST /api/menu - Data received:', {
      name, price, category: category?.value, hasImage: !!image
    });

    // Handle base64 image truncation
    let processedImage = image;
    if (processedImage && processedImage.length > 1000000) {
      console.log('🖼️ Image too large, truncating...');
      processedImage = processedImage.substring(0, 1000000);
    }

    const result = await pool.query(
      `INSERT INTO menus (name, price, description, category, image, is_available) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, price, description, category?.value, processedImage, isAvailable !== false]
    );

    // 🔥 CONVERT response ke format yang diexpect frontend
    const menuWithCategoryObject = {
      ...result.rows[0],
      category: result.rows[0].category ? {
        value: result.rows[0].category,
        label: result.rows[0].category
      } : null
    };

    console.log('✅ Menu created - ID:', menuWithCategoryObject.id);
    res.status(201).json(menuWithCategoryObject);
  } catch (error) {
    console.error('❌ Error creating menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update menu
app.put('/api/menu/:id', async (req, res) => {
  try {
    const menuId = parseInt(req.params.id);
    const { name, price, description, category, image, isAvailable } = req.body;
    
    console.log('✏️ PUT /api/menu/' + menuId, { name, price, category: category?.value });

    // Handle base64 image
    let processedImage = image;
    if (processedImage && processedImage.length > 1000000) {
      processedImage = processedImage.substring(0, 1000000);
    }

    const result = await pool.query(
      `UPDATE menus 
       SET name = $1, price = $2, description = $3, category = $4, image = $5, is_available = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [name, price, description, category?.value, processedImage, isAvailable !== false, menuId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    // 🔥 CONVERT response untuk update juga
    const menuWithCategoryObject = {
      ...result.rows[0],
      category: result.rows[0].category ? {
        value: result.rows[0].category,
        label: result.rows[0].category
      } : null
    };

    console.log('✅ Menu updated - ID:', menuId);
    res.json(menuWithCategoryObject);
  } catch (error) {
    console.error('❌ Error updating menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE menu
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const menuId = parseInt(req.params.id);
    console.log('🗑️ DELETE /api/menu/' + menuId);

    const result = await pool.query('DELETE FROM menus WHERE id = $1 RETURNING *', [menuId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    console.log('✅ Menu deleted - ID:', menuId);
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🍔 Backend dengan PostgreSQL jalan di http://localhost:${PORT}`);
  console.log(`📱 Database: PostgreSQL - restaurant_db`);
  console.log(`🔥 Category conversion: READY!`);
});