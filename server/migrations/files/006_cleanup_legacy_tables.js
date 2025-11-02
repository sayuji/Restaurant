/**
 * Migration: Cleanup legacy tables
 * Description: Removes legacy tables that are no longer needed
 */

module.exports = {
  up: async (client) => {
    // Check if legacy 'tables' table exists and drop it
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tables'
      )
    `);

    if (tableExists.rows[0].exists) {
      await client.query(`DROP TABLE tables`);
      console.log('✓ Legacy tables table removed');
    } else {
      console.log('✓ Legacy tables table does not exist, skipping');
    }

    // Add any other cleanup operations here
    // For example, removing unused indexes, constraints, etc.

    console.log('✓ Legacy cleanup completed');
  },

  down: async (client) => {
    // Recreate the legacy tables table if needed for rollback
    await client.query(`
      CREATE TABLE tables (
        id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        capacity INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'kosong',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add primary key constraint
    await client.query(`
      ALTER TABLE tables ADD CONSTRAINT tables_pkey PRIMARY KEY (id)
    `);

    // Insert sample data that was in the legacy table
    await client.query(`
      INSERT INTO tables (id, name, capacity, status, created_at) VALUES
        (1, 'Meja 1', 4, 'kosong', '2025-10-24 13:53:28.010257'),
        (2, 'Meja 2', 4, 'kosong', '2025-10-24 13:53:28.010257'),
        (3, 'Meja 3', 6, 'kosong', '2025-10-24 13:53:28.010257'),
        (4, 'Meja 4', 2, 'kosong', '2025-10-24 13:53:28.010257'),
        (5, 'Meja 5', 8, 'kosong', '2025-10-24 13:53:28.010257')
    `);
    
    console.log('✓ Legacy tables table recreated');
  }
};