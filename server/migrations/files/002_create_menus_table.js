/**
 * Migration: Create menus table
 * Description: Creates the menus table for restaurant menu items
 */

module.exports = {
  up: async (client) => {
    // Create menus table
    await client.query(`
      CREATE TABLE menus (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        image TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX idx_menus_category ON menus(category)
    `);

    await client.query(`
      CREATE INDEX idx_menus_name ON menus(name)
    `);

    await client.query(`
      CREATE INDEX idx_menus_price ON menus(price)
    `);

    // Insert sample menu items
    await client.query(`
      INSERT INTO menus (name, price, description, category, image) VALUES
        ('Nasi Goreng', 15000, 'Nasi goreng spesial dengan telur dan sayuran', 'Makanan', '/assets/nasigoreng.jpg'),
        ('Mie Ayam', 13000, 'Mie ayam dengan topping ayam dan pangsit', 'Makanan', '/assets/mieayam.jpg'),
        ('Ayam Bakar', 18000, 'Ayam bakar bumbu kecap dengan nasi putih', 'Makanan', '/assets/ayambakar.jpg'),
        ('Teh Manis', 5000, 'Teh manis hangat atau dingin', 'Minuman', '/assets/esteh.jpg'),
        ('Jus Jeruk', 7000, 'Jus jeruk segar tanpa gula tambahan', 'Minuman', '/assets/jusjeruk.jpg')
    `);

    console.log('✓ Menus table created with sample data');
  },

  down: async (client) => {
    // Drop indexes first
    await client.query(`DROP INDEX IF EXISTS idx_menus_price`);
    await client.query(`DROP INDEX IF EXISTS idx_menus_name`);
    await client.query(`DROP INDEX IF EXISTS idx_menus_category`);
    
    // Drop the table
    await client.query(`DROP TABLE IF EXISTS menus`);
    
    console.log('✓ Menus table dropped');
  }
};