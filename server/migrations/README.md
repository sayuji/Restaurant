# Database Migrations

This directory contains database migration files for the Restaurant application.

## Structure

```
migrations/
├── README.md                    # This file
├── config.js                   # Migration configuration
├── runner.js                   # Migration runner utility
├── tracker.js                  # Migration state tracking
├── cli.js                      # Command line interface
└── files/                      # Migration files directory
    ├── 001_create_users_table.js
    ├── 002_create_menus_table.js
    ├── 003_create_orders_table.js
    ├── 004_create_order_items_table.js
    ├── 005_create_restaurant_tables_table.js
    └── 006_cleanup_legacy_tables.js
```

## Usage

### Run all pending migrations
```bash
node server/migrations/cli.js up
```

### Rollback last migration
```bash
node server/migrations/cli.js down
```

### Check migration status
```bash
node server/migrations/cli.js status
```

### Create new migration
```bash
node server/migrations/cli.js create "migration_name"
```

## Migration File Format

Each migration file should export `up` and `down` functions:

```javascript
module.exports = {
  up: async (client) => {
    // Migration logic here
    await client.query(`CREATE TABLE ...`);
  },
  
  down: async (client) => {
    // Rollback logic here
    await client.query(`DROP TABLE ...`);
  }
};
```