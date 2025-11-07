/**
 * Migration: Add restaurant_id to restaurant_tables table
 */

module.exports = {
  up: async (client) => {
    // Add restaurant_id column to restaurant_tables table
    await client.query(`
      ALTER TABLE restaurant_tables 
      ADD COLUMN restaurant_id INTEGER,
      ADD CONSTRAINT fk_tables_restaurant 
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    `);

    // Assign existing tables to default restaurant (ID: 1)
    await client.query(`
      UPDATE restaurant_tables SET restaurant_id = 1 WHERE restaurant_id IS NULL
    `);

    console.log('✓ Added restaurant_id to restaurant_tables table');
  },

  down: async (client) => {
    // Remove foreign key and column
    await client.query(`
      ALTER TABLE restaurant_tables 
      DROP CONSTRAINT IF EXISTS fk_tables_restaurant,
      DROP COLUMN IF EXISTS restaurant_id
    `);
    
    console.log('✓ Removed restaurant_id from restaurant_tables table');
  }
};