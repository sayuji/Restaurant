/**
 * Migration: Create restaurant_tables table
 * Description: Creates the restaurant_tables table for managing table information
 */

module.exports = {
  up: async (client) => {
    // Create sequence if it doesn't exist
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS restaurant_tables_id_seq START 3;
    `);

    // Create restaurant_tables table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_tables (
        id INTEGER PRIMARY KEY DEFAULT nextval('restaurant_tables_id_seq'),
        name VARCHAR(100) NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 4,
        status VARCHAR(20) NOT NULL DEFAULT 'kosong' CHECK (status IN ('kosong', 'terisi', 'reserved')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_restaurant_tables_capacity ON restaurant_tables(capacity);
    `);

    // Insert sample data only if table is empty
    const result = await client.query('SELECT COUNT(*) FROM restaurant_tables');
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      await client.query(`
        INSERT INTO restaurant_tables (name, capacity, status) VALUES
        ('Meja 1', 4, 'kosong'),
        ('Meja 2', 6, 'kosong'),
        ('Meja 3 - VIP', 8, 'kosong'),
        ('Meja 4', 4, 'kosong'),
        ('Meja 5', 2, 'kosong')
      `);
    }
    
    console.log('✓ Restaurant tables table created/verified with sample data');
  },

  down: async (client) => {
    // Drop indexes
    await client.query(`DROP INDEX IF EXISTS idx_restaurant_tables_capacity`);
    await client.query(`DROP INDEX IF EXISTS idx_restaurant_tables_status`);
    
    // Drop table
    await client.query(`DROP TABLE IF EXISTS restaurant_tables`);
    
    // Drop sequence
    await client.query(`DROP SEQUENCE IF EXISTS restaurant_tables_id_seq`);
    
    console.log('✓ Restaurant tables table and related objects dropped');
  }
};