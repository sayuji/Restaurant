const pool = require('./config/database');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
    
    // Test table exists
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('📊 Tables:', tables.rows);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

testConnection();