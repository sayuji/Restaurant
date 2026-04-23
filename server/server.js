const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'restaurant_jwt_secret_2024';

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
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Halo bang! Backend RESTAURANT dengan Multi-Restaurant System udah jalan! 🚀',
    status: 'OK'
  });
});

// ==========================================
// 🔐 AUTHENTICATION MIDDLEWARE & ROUTES
// ==========================================

// 🔐 ENHANCED AUTHENTICATION MIDDLEWARE - PASTIKAN SEPERTI INI
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token akses diperlukan' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('❌ JWT verification failed:', err.message);
      return res.status(403).json({ 
        success: false, 
        message: 'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.' 
      });
    }
    
    // ✅ PASTIKAN baca restaurantId dari token, BUKAN hardcode
    req.user = {
      userId: decoded.userId,
      username: decoded.username, 
      role: decoded.role,
      restaurantId: decoded.restaurantId || null // ← Fallback to null if not present
    };
    
    console.log('🔐 Auth successful - User:', req.user.username, 'Restaurant:', req.user.restaurantId);
    
    // Warning jika restaurantId tidak ada
    if (!req.user.restaurantId) {
      console.warn('⚠️ User authenticated but has no restaurantId. Token might be old.');
    }
    
    next();
  });
};

// 🔐 LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt for user:', username);

    // Find user in database
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }

    // Auto-assign restaurant jika user belum punya
    let restaurantId = user.restaurant_id;
    if (!restaurantId) {
      console.log('⚠️ User has no restaurant_id, auto-assigning default restaurant...');
      try {
        // Cek apakah tabel restaurants ada
        const tableCheck = await pool.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'restaurants')"
        );
        
        if (tableCheck.rows[0].exists) {
          const defaultRestaurant = await pool.query(
            'SELECT id FROM restaurants WHERE is_active = true ORDER BY id ASC LIMIT 1'
          );
          if (defaultRestaurant.rows.length > 0) {
            restaurantId = defaultRestaurant.rows[0].id;
            await pool.query(
              'UPDATE users SET restaurant_id = $1 WHERE id = $2',
              [restaurantId, user.id]
            );
            console.log('✅ Auto-assigned restaurant_id:', restaurantId, 'to user:', username);
          } else {
            // Tidak ada restaurant aktif, buat default
            const newRestaurant = await pool.query(
              "INSERT INTO restaurants (name, address, phone) VALUES ('Restaurant Utama', 'Alamat default', '000') RETURNING id"
            );
            restaurantId = newRestaurant.rows[0].id;
            await pool.query(
              'UPDATE users SET restaurant_id = $1 WHERE id = $2',
              [restaurantId, user.id]
            );
            console.log('✅ Created default restaurant and assigned to user:', username);
          }
        } else {
          console.warn('⚠️ Table restaurants belum ada. Jalankan migration terlebih dahulu.');
        }
      } catch (assignError) {
        console.warn('⚠️ Gagal auto-assign restaurant:', assignError.message);
        // Tetap lanjut login tanpa restaurantId
      }
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Include restaurant_id in JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        restaurantId: restaurantId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for user:', username, 'Restaurant:', restaurantId);
    
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        email: user.email,
        restaurantId: restaurantId
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat login' 
    });
  }
});

// ==========================================
// 🏪 RESTAURANT MANAGEMENT ROUTES
// ==========================================

// 🔐 GET ALL RESTAURANTS FOR DROPDOWN
app.get('/api/restaurants', authenticateToken, async (req, res) => {
  try {
    // Hanya admin yang bisa akses
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang bisa mengakses.'
      });
    }

    const result = await pool.query(`
      SELECT id, name, address, phone 
      FROM restaurants 
      WHERE is_active = true
      ORDER BY name ASC
    `);

    console.log('🏪 GET /api/restaurants - Total:', result.rows.length);
    
    res.json({
      success: true,
      restaurants: result.rows
    });
  } catch (error) {
    console.error('❌ Get restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data restaurants'
    });
  }
});

// 🔐 CREATE NEW RESTAURANT (ADMIN ONLY)
app.post('/api/restaurants', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang bisa menambah restaurant baru'
      });
    }

    const { name, address, phone } = req.body;
    
    console.log('➕ POST /api/restaurants - Data:', { name, address, phone });

    // Validasi input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama restaurant harus diisi'
      });
    }

    const result = await pool.query(
      `INSERT INTO restaurants (name, address, phone) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, address || null, phone || null]
    );

    const newRestaurant = result.rows[0];
    
    console.log('✅ Restaurant created - ID:', newRestaurant.id);
    
    res.status(201).json({
      success: true,
      message: 'Restaurant berhasil dibuat',
      restaurant: newRestaurant
    });

  } catch (error) {
    console.error('❌ Create restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat restaurant'
    });
  }
});

// ==========================================
// 👥 USER MANAGEMENT ROUTES (ADMIN ONLY)
// ==========================================

// 🔐 GET ALL USERS
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Cuma admin yang bisa lihat semua user
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang bisa mengakses.'
      });
    }

    const result = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.role, 
        u.full_name, 
        u.email, 
        u.is_active, 
        u.last_login, 
        u.created_at,
        u.updated_at,
        u.restaurant_id,
        r.name as restaurant_name
      FROM users u
      LEFT JOIN restaurants r ON u.restaurant_id = r.id
      ORDER BY u.created_at DESC
    `);

    console.log('📋 GET /api/users - Total users:', result.rows.length);
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data users'
    });
  }
});

// 🔐 REGISTER NEW USER
app.post('/api/auth/register', authenticateToken, async (req, res) => {
  const client = await pool.connect(); // ✅ TAMBAH INI UNTUK TRANSACTION
  
  try {
    await client.query('BEGIN'); // ✅ START TRANSACTION

    // Cuma admin yang bisa register user baru
    if (req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang bisa menambah user baru'
      });
    }

    const { username, password, role, fullName, email, restaurantId } = req.body;
    
    console.log('👤 Register attempt by admin:', req.user.username, 'for user:', username);
    console.log('📝 Request data:', { username, role, fullName, email, restaurantId });

    // Validasi input
    if (!username || !password || !role) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Username, password, dan role harus diisi'
      });
    }

    // Validasi role
    const validRoles = ['admin', 'manager', 'kitchen', 'cashier', 'staff'];
    if (!validRoles.includes(role)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid'
      });
    }

    // Cek apakah username sudah ada
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    // Validasi restaurantId
    if (!restaurantId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Restaurant harus dipilih'
      });
    }

    // Cek jika restaurant exists
    const restaurantCheck = await client.query(
      'SELECT id FROM restaurants WHERE id = $1',
      [restaurantId]
    );

    if (restaurantCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Restaurant tidak valid'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user baru ke database
    const result = await client.query(
      `INSERT INTO users (username, password_hash, role, full_name, email, restaurant_id, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, username, role, full_name, email, restaurant_id, is_active, created_at`,
      [username, hashedPassword, role, fullName || null, email || null, restaurantId, true]
    );

    await client.query('COMMIT'); // ✅ COMMIT TRANSACTION

    const newUser = result.rows[0];
    
    console.log('✅ User registered successfully:', newUser);
    
    res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        fullName: newUser.full_name,
        email: newUser.email,
        restaurantId: newUser.restaurant_id,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK'); // ✅ ROLLBACK JIKA ERROR
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mendaftarkan user: ' + error.message
    });
  } finally {
    client.release(); // ✅ RELEASE CLIENT
  }
});

// 🔐 UPDATE USER
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }

    const userId = parseInt(req.params.id);
    const { username, role, fullName, email, isActive, restaurantId } = req.body;

    console.log('✏️ UPDATE /api/users/' + userId, { username, role, isActive, restaurantId });

    // Cek jika user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Update user
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, role = $2, full_name = $3, email = $4, is_active = $5, restaurant_id = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING id, username, role, full_name, email, is_active, restaurant_id, last_login, created_at, updated_at`,
      [username, role, fullName || null, email || null, isActive, restaurantId || null, userId]
    );

    console.log('✅ User updated - ID:', userId);
    
    res.json({
      success: true,
      message: 'User berhasil diupdate',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate user'
    });
  }
});

// 🔐 DELETE USER
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }

    const userId = parseInt(req.params.id);
    console.log('🗑️ DELETE /api/users/' + userId);

    // Cek jika user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Jangan allow delete sendiri
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Tidak bisa menghapus akun sendiri'
      });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log('✅ User deleted - ID:', userId);
    
    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus user'
    });
  }
});

// 🔐 UPDATE USER STATUS (Active/Inactive)
app.put('/api/users/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }

    const userId = parseInt(req.params.id);
    const { isActive } = req.body;

    console.log('🔧 UPDATE STATUS /api/users/' + userId, { isActive });

    // Cek jika user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Jangan allow non-active sendiri
    if (userId === req.user.userId && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tidak bisa menonaktifkan akun sendiri'
      });
    }

    // Update status
    const result = await pool.query(
      `UPDATE users 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING id, username, role, is_active`,
      [isActive, userId]
    );

    console.log('✅ User status updated - ID:', userId, 'Status:', isActive);
    
    res.json({
      success: true,
      message: `User berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupdate status user'
    });
  }
});

// 🔐 GET USER PROFILE
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.role, u.full_name, u.email, u.last_login, u.restaurant_id, r.name as restaurant_name
       FROM users u
       LEFT JOIN restaurants r ON u.restaurant_id = r.id
       WHERE u.id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan' 
    });
  }
});

// ==========================================
// 📋 MENU ROUTES (WITH RESTAURANT FILTER)
// ==========================================

// GET all menus - FILTER BY RESTAURANT
app.get('/api/menu', authenticateToken, async (req, res) => {
  try {
    // Check if user has restaurantId
    if (!req.user.restaurantId) {
      console.log('⚠️ User has no restaurantId, returning empty array');
      return res.json([]);
    }
    
    const result = await pool.query(
      'SELECT * FROM menus WHERE restaurant_id = $1 ORDER BY created_at DESC',
      [req.user.restaurantId] // ✅ Filter by restaurant
    );
    
    const menusWithCategoryObject = result.rows.map(menu => ({
      ...menu,
      category: menu.category ? { 
        value: menu.category, 
        label: menu.category 
      } : null
    }));
    
    console.log('📦 GET /api/menu - Restaurant:', req.user.restaurantId, 'Total:', menusWithCategoryObject.length);
    res.json(menusWithCategoryObject);
  } catch (error) {
    console.error('❌ Error fetching menus:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST create new menu - AUTO SET RESTAURANT_ID
app.post('/api/menu', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    
    if (!req.user.restaurantId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'User tidak terhubung ke restaurant. Silakan login ulang.' });
    }

    console.log('➕ POST /api/menu - Restaurant:', req.user.restaurantId, 'Data:', {
      name, price, hasImage: !!req.file
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
      `INSERT INTO menus (name, price, description, category, image, restaurant_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, price, description, categoryValue, imagePath, req.user.restaurantId] // ✅ Auto-set restaurant_id
    );

    const menuWithCategoryObject = {
      ...result.rows[0],
      category: result.rows[0].category ? {
        value: result.rows[0].category,
        label: result.rows[0].category
      } : null
    };

    console.log('✅ Menu created - ID:', menuWithCategoryObject.id, 'Restaurant:', req.user.restaurantId);
    res.status(201).json(menuWithCategoryObject);
  } catch (error) {
    console.error('❌ Error creating menu:', error);
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update menu - VERIFY RESTAURANT OWNERSHIP
app.put('/api/menu/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const menuId = parseInt(req.params.id);
    const { name, price, description, category } = req.body;
    
    if (!req.user.restaurantId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'User tidak terhubung ke restaurant' });
    }

    console.log('✏️ PUT /api/menu/' + menuId, 'Restaurant:', req.user.restaurantId);

    // Cek apakah menu milik restaurant user
    const menuCheck = await pool.query(
      'SELECT id, image FROM menus WHERE id = $1 AND restaurant_id = $2',
      [menuId, req.user.restaurantId]
    );

    if (menuCheck.rows.length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Menu not found or access denied' });
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

    let result;
    if (req.file) {
      const newImagePath = `/uploads/menu-images/${req.file.filename}`;
      
      // Delete old image
      const oldImagePath = menuCheck.rows[0]?.image;
      if (oldImagePath && oldImagePath.startsWith('/uploads/')) {
        const fullOldPath = oldImagePath.substring(1);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
          console.log('🗑️ Old image deleted:', fullOldPath);
        }
      }

      result = await pool.query(
        `UPDATE menus 
         SET name = $1, price = $2, description = $3, category = $4, image = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND restaurant_id = $7
         RETURNING *`,
        [name, price, description, categoryValue, newImagePath, menuId, req.user.restaurantId]
      );
    } else {
      result = await pool.query(
        `UPDATE menus 
         SET name = $1, price = $2, description = $3, category = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 AND restaurant_id = $6
         RETURNING *`,
        [name, price, description, categoryValue, menuId, req.user.restaurantId]
      );
    }

    if (result.rows.length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Menu not found' });
    }

    const menuWithCategoryObject = {
      ...result.rows[0],
      category: result.rows[0].category ? {
        value: result.rows[0].category,
        label: result.rows[0].category
      } : null
    };

    console.log('✅ Menu updated - ID:', menuId, 'Restaurant:', req.user.restaurantId);
    res.json(menuWithCategoryObject);
  } catch (error) {
    console.error('❌ Error updating menu:', error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE menu - VERIFY RESTAURANT OWNERSHIP
app.delete('/api/menu/:id', authenticateToken, async (req, res) => {
  try {
    const menuId = parseInt(req.params.id);
    
    if (!req.user.restaurantId) {
      return res.status(400).json({ error: 'User tidak terhubung ke restaurant' });
    }

    console.log('🗑️ DELETE /api/menu/' + menuId, 'Restaurant:', req.user.restaurantId);

    // Cek apakah menu milik restaurant user
    const menuResult = await pool.query(
      'SELECT image FROM menus WHERE id = $1 AND restaurant_id = $2',
      [menuId, req.user.restaurantId]
    );
    
    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found or access denied' });
    }

    const imagePath = menuResult.rows[0].image;
    if (imagePath && imagePath.startsWith('/uploads/')) {
      const fullPath = imagePath.substring(1);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('🗑️ Image file deleted:', fullPath);
      }
    }

    const result = await pool.query(
      'DELETE FROM menus WHERE id = $1 AND restaurant_id = $2 RETURNING *',
      [menuId, req.user.restaurantId]
    );

    console.log('✅ Menu deleted - ID:', menuId, 'Restaurant:', req.user.restaurantId);
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 🛒 ORDERS ROUTES (WITH RESTAURANT FILTER)
// ==========================================

// GET all orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    if (!req.user.restaurantId) {
      console.log('⚠️ User has no restaurantId, returning empty orders');
      return res.json([]);
    }

    const result = await pool.query(
      'SELECT * FROM orders WHERE restaurant_id = $1 ORDER BY created_at DESC',
      [req.user.restaurantId]
    );
    console.log('📦 GET /api/orders - Restaurant:', req.user.restaurantId, 'Total:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET order by ID
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (!req.user.restaurantId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND restaurant_id = $2',
      [orderId, req.user.restaurantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE new order
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { tableId, tableName, items, totalHarga, paymentMethod = 'cash' } = req.body;
    
    if (!req.user.restaurantId) {
      return res.status(400).json({ error: 'User tidak terhubung ke restaurant. Silakan login ulang.' });
    }

    console.log('➕ POST /api/orders - Data:', {
      tableId, tableName, totalHarga, paymentMethod, items_count: items.length,
      restaurantId: req.user.restaurantId
    });

    const result = await pool.query(
      `INSERT INTO orders (table_id, table_name, items, total_price, payment_method, restaurant_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [tableId, tableName, JSON.stringify(items), totalHarga, paymentMethod, req.user.restaurantId]
    );

    console.log('✅ Order created - ID:', result.rows[0].id);
    res.status(201).json({ 
      success: true, 
      orderId: result.rows[0].id,
      message: 'Order berhasil dibuat' 
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: 'Gagal membuat order' });
  }
});

// UPDATE ORDER STATUS
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!req.user.restaurantId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('✏️ UPDATE /api/orders/' + orderId + '/status - Status:', status);
    
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND restaurant_id = $3 RETURNING *',
      [status, orderId, req.user.restaurantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('✅ Order status updated - ID:', orderId, 'Status:', status);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE ORDER (FULL UPDATE)
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { tableId, tableName, items, totalHarga, status } = req.body;
    
    if (!req.user.restaurantId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('✏️ PUT /api/orders/' + orderId, { 
      tableId, tableName, totalHarga, status, items_count: items.length 
    });
    
    const result = await pool.query(
      `UPDATE orders 
       SET table_id = $1, table_name = $2, items = $3, total_price = $4, status = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND restaurant_id = $7
       RETURNING *`,
      [tableId, tableName, JSON.stringify(items), totalHarga, status, orderId, req.user.restaurantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('✅ Order updated - ID:', orderId);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE ORDER
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    if (!req.user.restaurantId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('🗑️ DELETE /api/orders/' + orderId);
    
    const result = await pool.query(
      'DELETE FROM orders WHERE id = $1 AND restaurant_id = $2 RETURNING *',
      [orderId, req.user.restaurantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('✅ Order deleted - ID:', orderId);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 🏪 TABLES ROUTES (WITH RESTAURANT FILTER)
// ==========================================
const tablesRouter = require('./routes/tables');
app.use('/api/tables', authenticateToken, tablesRouter); // ✅ Add auth middleware to tables routes

app.listen(PORT, () => {
  console.log(`🍔 Backend dengan Multi-Restaurant System jalan di http://localhost:${PORT}`);
  console.log(`📱 Database: PostgreSQL - restomaster_db`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET}`);
  console.log(`🏪 MULTI-RESTAURANT: READY!`);
  console.log(`👥 USER MANAGEMENT: READY! (Admin only)`);
  console.log(`🖼️ File Upload: READY!`);
  console.log(`🔥 AUTH API: READY!`);
  console.log(`🛒 ORDERS API: READY!`);
  console.log(`📋 MENU API: READY!`);
  console.log(`🏪 TABLES API: READY!`);
});