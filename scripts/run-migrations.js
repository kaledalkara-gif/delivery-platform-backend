// scripts/run-migrations.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  console.log(`📡 Host: ${process.env.DB_HOST}`);
  console.log(`📊 Database: ${process.env.DB_DATABASE}`);

  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
      rejectUnauthorized: false  // ✅ Add this for Render PostgreSQL
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database (SSL enabled)');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../dist/database/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️ No migrations directory found. Skipping.');
      await client.end();
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    console.log(`📁 Found ${files.length} migration files`);

    // Get executed migrations
    const result = await client.query('SELECT name FROM migrations');
    const executedMigrations = new Set(result.rows.map(r => r.name));

    // Run pending migrations
    let ranCount = 0;
    for (const file of files) {
      if (!executedMigrations.has(file)) {
        console.log(`▶️ Running migration: ${file}`);
        
        const migration = require(path.join(migrationsDir, file));
        
        // Run the migration's up method
        if (migration.up) {
          await migration.up(client);
        } else if (migration.default && migration.default.up) {
          await migration.default.up(client);
        }
        
        // Record the migration
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        console.log(`✅ Completed: ${file}`);
        ranCount++;
      }
    }

    console.log(`🎉 Migration complete! Ran ${ranCount} migrations.`);
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await client.end();
    process.exit(1);
  }
}

runMigrations();
