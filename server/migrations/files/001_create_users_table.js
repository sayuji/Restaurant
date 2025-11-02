/**
 * Migration: Create users table
 * Description: Creates the users table for authentication and role management
 */

module.exports = {
  up: async (client) => {
    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'staff',
        full_name VARCHAR(100),
        email VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on username for faster lookups
    await client.query(`
      CREATE INDEX idx_users_username ON users(username)
    `);

    // Create index on role for role-based queries
    await client.query(`
      CREATE INDEX idx_users_role ON users(role)
    `);

    // Insert default admin user (password: 'password')
    await client.query(`
      INSERT INTO users (username, password_hash, role, full_name, is_active)
      VALUES 
        ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrator', true),
        ('manager', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Restaurant Manager', true),
        ('kitchen', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kitchen', 'Kitchen Staff', true),
        ('cashier', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier', 'Cashier Staff', true)
    `);

    console.log('✓ Users table created with default accounts');
  },

  down: async (client) => {
    // Drop indexes first
    await client.query(`DROP INDEX IF EXISTS idx_users_role`);
    await client.query(`DROP INDEX IF EXISTS idx_users_username`);
    
    // Drop the table
    await client.query(`DROP TABLE IF EXISTS users`);
    
    console.log('✓ Users table dropped');
  }
};