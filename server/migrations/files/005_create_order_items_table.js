/**
 * Migration: Create order_items table
 * Description: Creates the order_items table for detailed order item tracking
 */

module.exports = {
  up: async (client) => {
    // Create order_items table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_menu_name ON order_items(menu_name);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);
    `);

    // Add foreign key constraint if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_order_items_order_id' 
          AND table_name = 'order_items'
        ) THEN
          ALTER TABLE order_items 
          ADD CONSTRAINT fk_order_items_order_id 
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    
    console.log('✓ Order items table created/verified with indexes and constraints');
  },

  down: async (client) => {
    // Drop foreign key constraint
    await client.query(`
      ALTER TABLE IF EXISTS order_items 
      DROP CONSTRAINT IF EXISTS fk_order_items_order_id;
    `);
    
    // Drop indexes
    await client.query(`DROP INDEX IF EXISTS idx_order_items_created_at`);
    await client.query(`DROP INDEX IF EXISTS idx_order_items_menu_name`);
    await client.query(`DROP INDEX IF EXISTS idx_order_items_order_id`);
    
    // Drop table
    await client.query(`DROP TABLE IF EXISTS order_items`);
    
    console.log('✓ Order items table and related objects dropped');
  }
};