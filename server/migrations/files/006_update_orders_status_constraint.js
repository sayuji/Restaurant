/**
 * Migration: Update orders status constraint
 * Description: Adds 'completed' to the allowed status values for orders table
 */

module.exports = {
  up: async (client) => {
    // Drop the existing constraint
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check
    `);

    // Add the new constraint with 'completed' status
    await client.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'))
    `);

    console.log('✓ Orders status constraint updated to include "completed"');
  },

  down: async (client) => {
    // Drop the new constraint
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check
    `);

    // Add back the old constraint without 'completed'
    await client.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled'))
    `);

    console.log('✓ Orders status constraint reverted to exclude "completed"');
  }
};