/**
 * Migration: Remove orders payment_method constraint
 * Description: Removes the CHECK constraint on payment_method to allow any value
 */

module.exports = {
  up: async (client) => {
    // Drop the existing constraint
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check
    `);

    console.log('✓ Orders payment_method constraint removed');
  },

  down: async (client) => {
    // Add back the constraint
    await client.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
      CHECK (payment_method IN ('cash', 'card', 'digital'))
    `);

    console.log('✓ Orders payment_method constraint restored');
  }
};
