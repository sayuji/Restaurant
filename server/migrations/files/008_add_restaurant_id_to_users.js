/**
 * Migration: Add restaurant_id to users table
 */

module.exports = {
  up: async (client) => {
    // Add restaurant_id column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN restaurant_id INTEGER,
      ADD CONSTRAINT fk_users_restaurant 
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    `);

    // Assign existing users to default restaurant (ID: 1)
    await client.query(`
      UPDATE users SET restaurant_id = 1 WHERE restaurant_id IS NULL
    `);

    console.log('✓ Added restaurant_id to users table');
  },

  down: async (client) => {
    // Remove foreign key and column
    await client.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS fk_users_restaurant,
      DROP COLUMN IF EXISTS restaurant_id
    `);
    
    console.log('✓ Removed restaurant_id from users table');
  }
};