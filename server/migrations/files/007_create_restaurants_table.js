/**
 * Migration: Create restaurants table
 * Description: Creates the restaurants table for multi-tenant system
 */

module.exports = {
  up: async (client) => {
    // Create restaurants table
    await client.query(`
      CREATE TABLE restaurants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default restaurant
    await client.query(`
      INSERT INTO restaurants (name, address, phone) 
      VALUES 
        ('Restaurant Utama', 'Jl. Contoh No. 123', '081234567890'),
        ('Cabang Pusat', 'Jl. Cabang No. 456', '081298765432')
    `);

    console.log('✓ Restaurants table created with sample data');
  },

  down: async (client) => {
    // Drop the table
    await client.query(`DROP TABLE IF EXISTS restaurants`);
    
    console.log('✓ Restaurants table dropped');
  }
};