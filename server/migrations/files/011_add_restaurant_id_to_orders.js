/**
 * Migration: Add restaurant_id to orders table
 */

module.exports = {
  up: async (client) => {
    // Add restaurant_id column to orders table
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN restaurant_id INTEGER,
      ADD CONSTRAINT fk_orders_restaurant 
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    `);

    // Assign existing orders to default restaurant (ID: 1)
    await client.query(`
      UPDATE orders SET restaurant_id = 1 WHERE restaurant_id IS NULL
    `);

    console.log('✓ Added restaurant_id to orders table');
  },

  down: async (client) => {
    // Remove foreign key and column
    await client.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS fk_orders_restaurant,
      DROP COLUMN IF EXISTS restaurant_id
    `);
    
    console.log('✓ Removed restaurant_id from orders table');
  }
};