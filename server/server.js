const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Multer untuk file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/menu-images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'menu-' + uniqueSuffix + fileExtension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'), false);
    }
  }
});

// Serve static files untuk akses gambar
app.use('/uploads', express.static('uploads'));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Halo bang! Backend RESTAURANT dengan File Upload udah jalan! 🚀',
    status: 'OK'
  });
});

// POSTGRESQL ROUTES

// GET all menus
app.get('/api/menu', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menus ORDER BY created_at DESC');
    
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
app.post('/api/menu', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    
    console.log('➕ POST /api/menu - Data received:', {
      name, price, category: category?.value, hasImage: !!req.file
    });

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/menu-images/${req.file.filename}`;
      console.log('🖼️ Image saved:', imagePath);
    }

    let categoryValue = category;
    if (typeof category === 'string') {
      try {
        const categoryObj = JSON.parse(category);
        categoryValue = categoryObj.value;
      } catch (e) {
        categoryValue = category;
      }
    } else {
      categoryValue = category?.value;
    }

    const result = await pool.query(
      `INSERT INTO menus (name, price, description, category, image) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, price, description, categoryValue, imagePath]
    );

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
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update menu
app.put('/api/menu/:id', upload.single('image'), async (req, res) => {
  try {
    const menuId = parseInt(req.params.id);
    const { name, price, description, category } = req.body;
    
    console.log('✏️ PUT /api/menu/' + menuId, { 
      name, price, 
      category: typeof category === 'string' ? JSON.parse(category)?.value : category?.value,
      hasNewImage: !!req.file 
    });

    let categoryValue = category;
    if (typeof category === 'string') {
      try {
        const categoryObj = JSON.parse(category);
        categoryValue = categoryObj.value;
      } catch (e) {
        categoryValue = category;
      }
    } else {
      categoryValue = category?.value;
    }

    let imageUpdate = '';
    let queryParams = [name, price, description, categoryValue, menuId];
    
    if (req.file) {
      const newImagePath = `/uploads/menu-images/${req.file.filename}`;
      imageUpdate = ', image = $6';
      queryParams.push(newImagePath);
      
      const oldMenu = await pool.query('SELECT image FROM menus WHERE id = $1', [menuId]);
      if (oldMenu.rows[0]?.image && oldMenu.rows[0].image.startsWith('/uploads/')) {
        const oldImagePath = oldMenu.rows[0].image.substring(1);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('🗑️ Old image deleted:', oldImagePath);
        }
      }
    }

    const result = await pool.query(
      `UPDATE menus 
       SET name = $1, price = $2, description = $3, category = $4, 
           updated_at = CURRENT_TIMESTAMP ${imageUpdate}
       WHERE id = $5 
       RETURNING *`,
      queryParams
    );

    if (result.rows.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Menu not found' });
    }

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
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE menu
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const menuId = parseInt(req.params.id);
    console.log('🗑️ DELETE /api/menu/' + menuId);

    const menuResult = await pool.query('SELECT image FROM menus WHERE id = $1', [menuId]);
    
    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    const imagePath = menuResult.rows[0].image;
    if (imagePath && imagePath.startsWith('/uploads/')) {
      const fullPath = imagePath.substring(1);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('🗑️ Image file deleted:', fullPath);
      }
    }

    const result = await pool.query('DELETE FROM menus WHERE id = $1 RETURNING *', [menuId]);

    console.log('✅ Menu deleted - ID:', menuId);
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🍔 Backend dengan File Upload jalan di http://localhost:${PORT}`);
  console.log(`📱 Database: PostgreSQL - restaurant_db`);
  console.log(`🖼️ File Upload: READY!`);
  console.log(`📁 Upload folder: /uploads/menu-images/`);
});