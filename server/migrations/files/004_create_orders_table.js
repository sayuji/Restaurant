/**
 * Migration: Create orders table
 * Description: Creates the orders table for managing customer orders
 */

module.exports = {
  up: async (client) => {
    // Create orders table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        table_id INTEGER,
        table_name VARCHAR(100),
        items JSONB NOT NULL DEFAULT '[]',
        total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'digital'))
      )
    `);

    // Create indexes if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method)
    `);

    // Create GIN index for JSONB items column if it doesn't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON orders USING GIN(items)
    `);

    console.log('✓ Orders table created/verified with indexes');
  },

  down: async (client) => {
    // Drop indexes first
    await client.query(`DROP INDEX IF EXISTS idx_orders_items_gin`);
    await client.query(`DROP INDEX IF EXISTS idx_orders_payment_method`);
    await client.query(`DROP INDEX IF EXISTS idx_orders_created_at`);
    await client.query(`DROP INDEX IF EXISTS idx_orders_status`);
    await client.query(`DROP INDEX IF EXISTS idx_orders_table_id`);
    
    // Drop the table
    await client.query(`DROP TABLE IF EXISTS orders`);
    
    console.log('✓ Orders table and related indexes dropped');
  }
};