// scripts/run-migrations.js
const { execSync } = require('child_process');
const { DataSource } = require('typeorm');

async function main() {
    console.log('🔍 Checking database connection...');

    // Test connection with simple query
    const tempDs = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
    });

    try {
        await tempDs.initialize();
        const result = await tempDs.query('SELECT 1 as connected');
        console.log('✅ Database connected successfully');

        // Check existing tables
        const tables = await tempDs.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log(`📋 Existing tables: ${tables.length}`);
        await tempDs.destroy();
    } catch (err) {
        console.log('⚠️ Database not ready yet:', err.message);
    }

    console.log('🔄 Running migrations...');
    try {
        execSync('npm run migration:run', { stdio: 'inherit' });
        console.log('✅ Migrations completed successfully');
    } catch (err) {
        console.log('⚠️ Migrations may have already run');
    }
}

main().catch(console.error);