/**
 * Migration: Add restaurant_id to menus table
 */

module.exports = {
  up: async (client) => {
    // Add restaurant_id column to menus table
    await client.query(`
      ALTER TABLE menus 
      ADD COLUMN restaurant_id INTEGER,
      ADD CONSTRAINT fk_menus_restaurant 
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    `);

    // Assign existing menus to default restaurant (ID: 1)
    await client.query(`
      UPDATE menus SET restaurant_id = 1 WHERE restaurant_id IS NULL
    `);

    console.log('✓ Added restaurant_id to menus table');
  },

  down: async (client) => {
    // Remove foreign key and column
    await client.query(`
      ALTER TABLE menus 
      DROP CONSTRAINT IF EXISTS fk_menus_restaurant,
      DROP COLUMN IF EXISTS restaurant_id
    `);
    
    console.log('✓ Removed restaurant_id from menus table');
  }
};