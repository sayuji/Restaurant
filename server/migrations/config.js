require('dotenv').config();
const path = require('path');

module.exports = {
  // Database connection settings
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'restomaster_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '050606',
  },

  // Migration settings
  migrations: {
    directory: path.join(__dirname, 'files'),
    tableName: 'schema_migrations',
    pattern: /^\d{3}_.*\.js$/
  },

  // Logging configuration
  logging: {
    enabled: true,
    level: 'info' // 'debug', 'info', 'warn', 'error'
  }
};