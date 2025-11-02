#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const MigrationRunner = require('./runner');

class MigrationCLI {
  constructor() {
    this.runner = new MigrationRunner();
  }

  async showHelp() {
    console.log(`
🍽️  Restaurant Database Migration Tool

Usage: node cli.js <command> [options]

Commands:
  up [target]     Run all pending migrations (or up to target migration)
  down [steps]    Rollback migrations (default: 1 step)
  status          Show migration status
  create <name>   Create a new migration file
  help            Show this help message

Examples:
  node cli.js up                           # Run all pending migrations
  node cli.js up 003_create_orders_table   # Run migrations up to specific file
  node cli.js down                         # Rollback last migration
  node cli.js down 3                       # Rollback last 3 migrations
  node cli.js status                       # Show current migration status
  node cli.js create "add_user_avatar"     # Create new migration file

Environment Variables:
  DB_HOST         Database host (default: localhost)
  DB_PORT         Database port (default: 5432)
  DB_NAME         Database name (default: restaurant)
  DB_USER         Database user (default: postgres)
  DB_PASSWORD     Database password (default: password)
    `);
  }

  async showStatus() {
    try {
      console.log('📊 Checking migration status...\n');
      
      const status = await this.runner.status();
      
      console.log(`📈 Migration Summary:`);
      console.log(`   Total migrations: ${status.total}`);
      console.log(`   Executed: ${status.executed}`);
      console.log(`   Pending: ${status.pending}\n`);
      
      if (status.migrations.length === 0) {
        console.log('❌ No migration files found');
        return;
      }
      
      console.log('📋 Migration Details:');
      console.log('─'.repeat(80));
      console.log('Status   | Migration File                    | Executed At');
      console.log('─'.repeat(80));
      
      for (const migration of status.migrations) {
        const statusIcon = migration.executed ? '✅' : '⏳';
        const executedAt = migration.executedAt 
          ? new Date(migration.executedAt).toLocaleString()
          : 'Not executed';
        
        console.log(`${statusIcon}       | ${migration.filename.padEnd(32)} | ${executedAt}`);
      }
      
      console.log('─'.repeat(80));
      
    } catch (error) {
      console.error('❌ Error checking migration status:', error.message);
      process.exit(1);
    }
  }

  async runUp(targetMigration = null) {
    try {
      console.log('🚀 Running migrations...\n');
      
      const result = await this.runner.up(targetMigration);
      
      if (result.success) {
        if (result.migrationsRun === 0) {
          console.log('✅ No pending migrations to run');
        } else {
          console.log(`✅ Successfully ran ${result.migrationsRun} migration(s)`);
          
          if (result.results) {
            console.log('\n📋 Migration Results:');
            for (const migrationResult of result.results) {
              const icon = migrationResult.success ? '✅' : '❌';
              console.log(`${icon} ${migrationResult.filename} (${migrationResult.executionTime}ms)`);
            }
          }
        }
      } else {
        console.error('❌ Migration failed');
        if (result.results) {
          for (const migrationResult of result.results) {
            if (!migrationResult.success) {
              console.error(`❌ ${migrationResult.filename}: ${migrationResult.error}`);
            }
          }
        }
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error running migrations:', error.message);
      process.exit(1);
    }
  }

  async runDown(steps = 1) {
    try {
      const stepsNum = parseInt(steps, 10);
      if (isNaN(stepsNum) || stepsNum < 1) {
        console.error('❌ Invalid number of steps. Must be a positive integer.');
        process.exit(1);
      }
      
      console.log(`🔄 Rolling back ${stepsNum} migration(s)...\n`);
      
      const result = await this.runner.down(stepsNum);
      
      if (result.success) {
        if (result.migrationsRolledBack === 0) {
          console.log('✅ No migrations to rollback');
        } else {
          console.log(`✅ Successfully rolled back ${result.migrationsRolledBack} migration(s)`);
          
          if (result.results) {
            console.log('\n📋 Rollback Results:');
            for (const migrationResult of result.results) {
              const icon = migrationResult.success ? '✅' : '❌';
              console.log(`${icon} ${migrationResult.filename} (${migrationResult.executionTime}ms)`);
            }
          }
        }
      } else {
        console.error('❌ Rollback failed');
        if (result.results) {
          for (const migrationResult of result.results) {
            if (!migrationResult.success) {
              console.error(`❌ ${migrationResult.filename}: ${migrationResult.error}`);
            }
          }
        }
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error rolling back migrations:', error.message);
      process.exit(1);
    }
  }

  async createMigration(name) {
    try {
      if (!name) {
        console.error('❌ Migration name is required');
        console.log('Usage: node cli.js create "migration_name"');
        process.exit(1);
      }
      
      // Get next migration number
      const config = require('./config');
      const files = await fs.readdir(config.migrations.directory).catch(() => []);
      const migrationFiles = files.filter(file => config.migrations.pattern.test(file));
      
      const nextNumber = migrationFiles.length > 0 
        ? Math.max(...migrationFiles.map(f => parseInt(f.substring(0, 3)))) + 1
        : 1;
      
      const paddedNumber = nextNumber.toString().padStart(3, '0');
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${paddedNumber}_${sanitizedName}.js`;
      const filepath = path.join(config.migrations.directory, filename);
      
      const template = `/**
 * Migration: ${name}
 * Description: Add description here
 */

module.exports = {
  up: async (client) => {
    // Add your migration logic here
    // Example:
    // await client.query(\`
    //   CREATE TABLE example (
    //     id SERIAL PRIMARY KEY,
    //     name VARCHAR(255) NOT NULL
    //   )
    // \`);
    
    console.log('✓ Migration ${name} completed');
  },

  down: async (client) => {
    // Add your rollback logic here
    // Example:
    // await client.query(\`DROP TABLE IF EXISTS example\`);
    
    console.log('✓ Migration ${name} rolled back');
  }
};`;

      await fs.writeFile(filepath, template);
      
      console.log(`✅ Created migration file: ${filename}`);
      console.log(`📁 Location: ${filepath}`);
      console.log('\n💡 Next steps:');
      console.log('   1. Edit the migration file to add your changes');
      console.log('   2. Run: node cli.js up');
      
    } catch (error) {
      console.error('❌ Error creating migration:', error.message);
      process.exit(1);
    }
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command || command === 'help') {
      await this.showHelp();
      return;
    }
    
    switch (command) {
      case 'up':
        await this.runUp(args[1]);
        break;
        
      case 'down':
        await this.runDown(args[1]);
        break;
        
      case 'status':
        await this.showStatus();
        break;
        
      case 'create':
        await this.createMigration(args[1]);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node cli.js help" for usage information');
        process.exit(1);
    }
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new MigrationCLI();
  cli.run().catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = MigrationCLI;