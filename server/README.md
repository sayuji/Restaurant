# Restaurant Server

## Environment Configuration

This server uses environment variables for configuration. Create a `.env` file in the server directory with the following variables:

### Required Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resto
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret-key-here
```

### Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` with your actual configuration

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run migrations:
   ```bash
   npm run migrate:up
   ```

5. Start the server:
   ```bash
   npm start
   ```

### Migration Commands

- `npm run migrate:up` - Run pending migrations
- `npm run migrate:down` - Rollback last migration
- `npm run migrate:status` - Check migration status
- `npm run migrate:create <name>` - Create new migration file

### Security Notes

- Never commit `.env` files to version control
- Use strong, unique passwords for production
- Generate secure JWT secrets for production environments