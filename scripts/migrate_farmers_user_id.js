/*
  One-off migration: add farmers.user_id and backfill
  Usage: node scripts/migrate_farmers_user_id.js
*/
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agrilink',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    multipleStatements: true,
  });
  try {
    console.log('Running migration: farmers.user_id...');
    try {
      await conn.query('ALTER TABLE farmers ADD COLUMN user_id INT NULL');
      console.log('Added column farmers.user_id');
    } catch (e) {
      if (e && e.code === 'ER_DUP_FIELDNAME') console.log('Column already exists: farmers.user_id');
      else console.log('Note:', e.message);
    }

    // Backfill using email
    await conn.query('UPDATE farmers f JOIN users u ON f.email = u.email SET f.user_id = u.id WHERE f.user_id IS NULL');
    // Backfill using id==id where applicable
    await conn.query('UPDATE farmers f JOIN users u ON f.id = u.id AND u.role = "farmer" SET f.user_id = u.id WHERE f.user_id IS NULL');
    console.log('Backfilled user_id using email/id matches');

    // Add FK if missing
    const [fkRows] = await conn.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='farmers' AND COLUMN_NAME='user_id' AND REFERENCED_TABLE_NAME='users'"
    );
    if (fkRows.length === 0) {
      await conn.query('ALTER TABLE farmers ADD CONSTRAINT fk_farmers_user_id FOREIGN KEY (user_id) REFERENCES users(id)');
      console.log('Added FK farmers.user_id -> users.id');
    } else {
      console.log('FK already exists');
    }

    console.log('Migration complete.');
  } finally {
    await conn.end();
  }
}

run().catch((err) => { console.error('Migration failed:', err); process.exitCode = 1; });
