#!/usr/bin/env node
/*
  Force or patch product image URLs to a known placeholder for demos.

  Usage:
    node scripts/set_placeholders.js           # force ALL products to placeholder
    node scripts/set_placeholders.js --only-null  # only where image_url is NULL/empty or not under /uploads

  Reads DB config from .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
*/

require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const onlyNull = process.argv.includes('--only-null');

  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = Number(process.env.DB_PORT || 3306);
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASSWORD = process.env.DB_PASSWORD || '';
  const DB_NAME = process.env.DB_NAME || 'agrilink';

  const placeholder = '/uploads/placeholder-product.jpg';

  console.log('Connecting to DB:', { host: DB_HOST, db: DB_NAME, port: DB_PORT, user: DB_USER });
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    let sql;
    if (onlyNull) {
      sql = `UPDATE products
             SET image_url = ?
             WHERE image_url IS NULL OR image_url = '' OR image_url NOT LIKE '/uploads/%'`;
      console.log('Updating only missing/invalid image_url rows...');
    } else {
      sql = `UPDATE products SET image_url = ?`;
      console.log('Forcing ALL products to use the placeholder image...');
    }

    const [result] = await conn.execute(sql, [placeholder]);
    console.log(`Rows matched: ${result.affectedRows ?? result.changedRows ?? 'n/a'}`);
    console.log('Done. You can refresh the app to see placeholder images.');
  } catch (err) {
    console.error('Update failed:', err);
    process.exitCode = 1;
  } finally {
    try { await conn.end(); } catch {}
  }
})();
