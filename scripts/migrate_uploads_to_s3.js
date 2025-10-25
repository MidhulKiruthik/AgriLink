#!/usr/bin/env node
/*
  Migrates legacy local /uploads images to S3 and updates DB image_url to S3 keys.
  Usage:
    1) Ensure you have already synced files to S3 (recommended via AWS CLI on EC2):
       aws s3 sync ./uploads s3://$S3_BUCKET/uploads/
    2) Set environment variables (or .env in project root):
       DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
       S3_BUCKET, S3_REGION
    3) Dry run (no DB writes):
       node scripts/migrate_uploads_to_s3.js --dry-run
    4) Apply changes:
       node scripts/migrate_uploads_to_s3.js
*/

require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const dryRun = process.argv.includes('--dry-run');

  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = Number(process.env.DB_PORT || 3306);
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASSWORD = process.env.DB_PASSWORD || '';
  const DB_NAME = process.env.DB_NAME || 'agrilink';

  const S3_BUCKET = process.env.S3_BUCKET;
  const S3_REGION = process.env.S3_REGION || 'eu-north-1';

  if (!S3_BUCKET) {
    console.error('S3_BUCKET env is required.');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    // Find products with image_url starting with '/uploads/'
    const [rows] = await conn.execute(
      "SELECT id, image_url FROM products WHERE image_url LIKE '/uploads/%'"
    );

    if (!rows.length) {
      console.log('No products found with /uploads/ paths. Nothing to migrate.');
      process.exit(0);
    }

    console.log(`Found ${rows.length} products to update.`);

    // Prepare updates: strip the leading slash so '/uploads/abc.jpg' -> 'uploads/abc.jpg'
    const updates = rows.map(r => ({ id: r.id, from: r.image_url, to: r.image_url.replace(/^\//, '') }));

    if (dryRun) {
      console.log('Dry run. Sample updates (first 10):');
      console.table(updates.slice(0, 10));
      process.exit(0);
    }

    await conn.beginTransaction();
    for (const u of updates) {
      await conn.execute('UPDATE products SET image_url = ? WHERE id = ?', [u.to, u.id]);
    }
    await conn.commit();

    console.log(`Updated ${updates.length} products. Values are now S3 keys like 'uploads/...'.`);
    console.log('Ensure your frontend env variables are set so keys resolve to CDN/S3 URLs:');
    console.log('  NEXT_PUBLIC_CDN_URL (preferred after CloudFront) or');
    console.log('  NEXT_PUBLIC_S3_BUCKET and NEXT_PUBLIC_S3_REGION');
  } catch (err) {
    console.error('Migration failed:', err);
    try { await conn.rollback(); } catch {}
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
