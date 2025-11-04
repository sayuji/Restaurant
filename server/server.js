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

// ==========================================
// 🔐 AUTHENTICATION MIDDLEWARE & ROUTES
// ==========================================

// 🔐 VERIFY TOKEN MIDDLEWARE
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token akses diperlukan' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token tidak valid' 
      });
    }
    req.user = user;
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

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for user:', username);
    
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        email: user.email
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
        id, 
        username, 
        role, 
        full_name, 
        email, 
        is_active, 
        last_login, 
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
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
  try {
    // Cuma admin yang bisa register user baru
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang bisa menambah user baru'
      });
    }

    const { username, password, role, fullName, email } = req.body;
    
    console.log('👤 [DEBUG] Register attempt by admin:', req.user.username, 'for user:', username);
    console.log('📝 [DEBUG] Request data:', { username, role, fullName, email });

    // Validasi input
    if (!username || !password || !role) {
      console.log('❌ [DEBUG] Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'Username, password, dan role harus diisi'
      });
    }

    // Validasi role
    const validRoles = ['admin', 'manager', 'kitchen', 'cashier', 'staff'];
    if (!validRoles.includes(role)) {
      console.log('❌ [DEBUG] Invalid role:', role);
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid'
      });
    }

    // Cek apakah username sudah ada
    console.log('🔍 [DEBUG] Checking if username exists:', username);
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ [DEBUG] Username already exists:', username);
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    // Hash password
    console.log('🔐 [DEBUG] Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user baru ke database
    console.log('💾 [DEBUG] Inserting new user to database...');
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, full_name, email, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, role, full_name, email, is_active, created_at`,
      [username, hashedPassword, role, fullName || null, email || null, true]
    );

    const newUser = result.rows[0];
    
    console.log('✅ [DEBUG] User registered successfully:', newUser);
    
    res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        fullName: newUser.full_name,
        email: newUser.email,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Register error details:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mendaftarkan user: ' + error.message
    });
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
    const { username, role, fullName, email, isActive } = req.body;

    console.log('✏️ UPDATE /api/users/' + userId, { username, role, isActive });

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
       SET username = $1, role = $2, full_name = $3, email = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, username, role, full_name, email, is_active, last_login, created_at, updated_at`,
      [username, role, fullName || null, email || null, isActive, userId]
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
      'SELECT id, username, role, full_name, email, last_login FROM users WHERE id = $1',
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
// 📋 MENU ROUTES
// ==========================================

// GET all menus
app.get('/api/menu', authenticateToken, async (req, res) => {
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
app.post('/api/menu', authenticateToken, upload.single('image'), async (req, res) => {
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
app.put('/api/menu/:id', authenticateToken, upload.single('image'), async (req, res) => {
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
app.delete('/api/menu/:id', authenticateToken, async (req, res) => {
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

// ==========================================
// 🛒 ORDERS ROUTES
// ==========================================

// GET all orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    console.log('📦 GET /api/orders - Total:', result.rows.length);
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
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    
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
    
    console.log('➕ POST /api/orders - Data received:', {
      tableId, tableName, totalHarga, paymentMethod, items_count: items.length
    });

    const result = await pool.query(
      `INSERT INTO orders (table_id, table_name, items, total_price, payment_method) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [tableId, tableName, JSON.stringify(items), totalHarga, paymentMethod]
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
    
    console.log('✏️ UPDATE /api/orders/' + orderId + '/status - Status:', status);
    
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, orderId]
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
    
    console.log('✏️ PUT /api/orders/' + orderId, { 
      tableId, tableName, totalHarga, status, items_count: items.length 
    });
    
    const result = await pool.query(
      `UPDATE orders 
       SET table_id = $1, table_name = $2, items = $3, total_price = $4, status = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING *`,
      [tableId, tableName, JSON.stringify(items), totalHarga, status, orderId]
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
    console.log('🗑️ DELETE /api/orders/' + orderId);
    
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [orderId]);
    
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
// 🏪 TABLES ROUTES
// ==========================================
const tablesRouter = require('./routes/tables');
app.use('/api/tables', tablesRouter);

app.listen(PORT, () => {
  console.log(`🍔 Backend dengan User Management jalan di http://localhost:${PORT}`);
  console.log(`📱 Database: PostgreSQL - restaurant_db`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET}`);
  console.log(`👥 USER MANAGEMENT: READY! (Admin only)`);
  console.log(`🖼️ File Upload: READY!`);
  console.log(`🔥 AUTH API: READY!`);
  console.log(`🛒 ORDERS API: READY!`);
  console.log(`📋 MENU API: READY!`);
  console.log(`🏪 TABLES API: READY!`);
});