const { Client } = require('pg');
const config = require('./config');

class MigrationTracker {
  constructor() {
    this.client = null;
  }

  async connect() {
    this.client = new Client(config.database);
    await this.client.connect();
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }

  async ensureMigrationsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${config.migrations.tableName} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time INTEGER, -- in milliseconds
        checksum VARCHAR(64)
      );
    `;
    
    await this.client.query(createTableQuery);
  }

  async getExecutedMigrations() {
    await this.ensureMigrationsTable();
    
    const result = await this.client.query(
      `SELECT filename, executed_at, execution_time 
       FROM ${config.migrations.tableName} 
       ORDER BY filename ASC`
    );
    
    return result.rows;
  }

  async recordMigration(filename, executionTime, checksum) {
    const query = `
      INSERT INTO ${config.migrations.tableName} (filename, execution_time, checksum)
      VALUES ($1, $2, $3)
    `;
    
    await this.client.query(query, [filename, executionTime, checksum]);
  }

  async removeMigration(filename) {
    const query = `
      DELETE FROM ${config.migrations.tableName}
      WHERE filename = $1
    `;
    
    await this.client.query(query, [filename]);
  }

  async isMigrationExecuted(filename) {
    const result = await this.client.query(
      `SELECT 1 FROM ${config.migrations.tableName} WHERE filename = $1`,
      [filename]
    );
    
    return result.rows.length > 0;
  }

  async getLastExecutedMigration() {
    const result = await this.client.query(
      `SELECT filename FROM ${config.migrations.tableName} 
       ORDER BY filename DESC LIMIT 1`
    );
    
    return result.rows.length > 0 ? result.rows[0].filename : null;
  }
}

module.exports = MigrationTracker;