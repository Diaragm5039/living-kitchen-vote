/**
 * Database Migration Runner
 * Usage: node migrate.js [sql-file]
 * Default: runs migrate-votes.sql
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load .env manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[ERROR] DATABASE_URL not found in .env file');
  process.exit(1);
}

const sqlFile = process.argv[2] || 'migrate-votes.sql';
const sqlPath = path.join(__dirname, sqlFile);

if (!fs.existsSync(sqlPath)) {
  console.error(`[ERROR] SQL file not found: ${sqlFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    console.log(`Running: ${sqlFile}`);
    console.log('---');
    // Split by semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const stmt of statements) {
      if (stmt) {
        await pool.query(stmt + ';');
        // Print first line of statement as confirmation
        const firstLine = stmt.split('\n')[0].replace(/^--.*/g, '').trim();
        if (firstLine) console.log(`  ✓ ${firstLine.slice(0, 60)}`);
      }
    }
    console.log('---');
    console.log('Migration complete!');
  } catch (e) {
    console.error('[ERROR]', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
