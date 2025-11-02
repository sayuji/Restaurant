const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');
const config = require('./config');
const MigrationTracker = require('./tracker');

class MigrationRunner {
  constructor() {
    this.tracker = new MigrationTracker();
    this.client = null;
  }

  async connect() {
    this.client = new Client(config.database);
    await this.client.connect();
    await this.tracker.connect();
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
    await this.tracker.disconnect();
  }

  log(level, message) {
    if (!config.logging.enabled) return;
    
    const timestamp = new Date().toISOString();
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(config.logging.level);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel >= configLevel) {
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(config.migrations.directory);
      return files
        .filter(file => config.migrations.pattern.test(file))
        .sort();
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.log('warn', `Migration directory not found: ${config.migrations.directory}`);
        return [];
      }
      throw error;
    }
  }

  async loadMigration(filename) {
    const filePath = path.join(config.migrations.directory, filename);
    
    // Clear require cache to ensure fresh load
    delete require.cache[require.resolve(filePath)];
    
    const migration = require(filePath);
    
    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${filename} must export an 'up' function`);
    }
    
    if (typeof migration.down !== 'function') {
      throw new Error(`Migration ${filename} must export a 'down' function`);
    }
    
    return migration;
  }

  async calculateChecksum(filename) {
    const filePath = path.join(config.migrations.directory, filename);
    const content = await fs.readFile(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async runMigration(filename, direction = 'up') {
    const startTime = Date.now();
    
    try {
      this.log('info', `Running migration ${filename} (${direction})`);
      
      const migration = await this.loadMigration(filename);
      const checksum = await this.calculateChecksum(filename);
      
      // Begin transaction
      await this.client.query('BEGIN');
      
      try {
        // Execute migration
        await migration[direction](this.client);
        
        const executionTime = Date.now() - startTime;
        
        // Update migration tracking
        if (direction === 'up') {
          await this.tracker.recordMigration(filename, executionTime, checksum);
        } else {
          await this.tracker.removeMigration(filename);
        }
        
        // Commit transaction
        await this.client.query('COMMIT');
        
        this.log('info', `Migration ${filename} completed successfully (${executionTime}ms)`);
        
        return { success: true, executionTime };
        
      } catch (error) {
        // Rollback transaction
        await this.client.query('ROLLBACK');
        throw error;
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.log('error', `Migration ${filename} failed: ${error.message}`);
      
      return { 
        success: false, 
        error: error.message, 
        executionTime 
      };
    }
  }

  async up(targetMigration = null) {
    await this.connect();
    
    try {
      const allMigrations = await this.getMigrationFiles();
      const executedMigrations = await this.tracker.getExecutedMigrations();
      const executedFilenames = new Set(executedMigrations.map(m => m.filename));
      
      const pendingMigrations = allMigrations.filter(filename => 
        !executedFilenames.has(filename)
      );
      
      if (pendingMigrations.length === 0) {
        this.log('info', 'No pending migrations to run');
        return { success: true, migrationsRun: 0 };
      }
      
      let migrationsToRun = pendingMigrations;
      
      if (targetMigration) {
        const targetIndex = pendingMigrations.indexOf(targetMigration);
        if (targetIndex === -1) {
          throw new Error(`Target migration ${targetMigration} not found in pending migrations`);
        }
        migrationsToRun = pendingMigrations.slice(0, targetIndex + 1);
      }
      
      this.log('info', `Running ${migrationsToRun.length} migration(s)`);
      
      const results = [];
      
      for (const filename of migrationsToRun) {
        const result = await this.runMigration(filename, 'up');
        results.push({ filename, ...result });
        
        if (!result.success) {
          break; // Stop on first failure
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      this.log('info', `Migration batch completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: failureCount === 0,
        migrationsRun: successCount,
        results
      };
      
    } finally {
      await this.disconnect();
    }
  }

  async down(steps = 1) {
    await this.connect();
    
    try {
      const executedMigrations = await this.tracker.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        this.log('info', 'No migrations to rollback');
        return { success: true, migrationsRolledBack: 0 };
      }
      
      const migrationsToRollback = executedMigrations
        .slice(-steps)
        .reverse(); // Rollback in reverse order
      
      this.log('info', `Rolling back ${migrationsToRollback.length} migration(s)`);
      
      const results = [];
      
      for (const migration of migrationsToRollback) {
        const result = await this.runMigration(migration.filename, 'down');
        results.push({ filename: migration.filename, ...result });
        
        if (!result.success) {
          break; // Stop on first failure
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      this.log('info', `Rollback completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: failureCount === 0,
        migrationsRolledBack: successCount,
        results
      };
      
    } finally {
      await this.disconnect();
    }
  }

  async status() {
    await this.connect();
    
    try {
      const allMigrations = await this.getMigrationFiles();
      const executedMigrations = await this.tracker.getExecutedMigrations();
      const executedFilenames = new Set(executedMigrations.map(m => m.filename));
      
      const status = allMigrations.map(filename => ({
        filename,
        executed: executedFilenames.has(filename),
        executedAt: executedMigrations.find(m => m.filename === filename)?.executed_at || null
      }));
      
      return {
        total: allMigrations.length,
        executed: executedMigrations.length,
        pending: allMigrations.length - executedMigrations.length,
        migrations: status
      };
      
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = MigrationRunner;