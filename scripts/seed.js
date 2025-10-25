/*
  Idempotent seed script for AgriLink.
  - Aligns schema with server expectations
    * products.farmer_id -> NULL allowed
    * orders.status -> include 'Cancelled','Paid'
    * cart unique index (user_id, product_id) for ON DUPLICATE KEY UPDATE
  - Seeds users (admin, farmer, customer), farmers, and sample products

  Run: node scripts/seed.js
  Reads DB config from .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
*/

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agrilink',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    multipleStatements: true,
  };

  console.log('Connecting to DB:', {
    host: config.host,
    db: config.database,
    port: config.port,
    user: config.user,
  });

  const conn = await mysql.createConnection(config);
  try {
    // --- Minimal migrations to match server expectations ---
    // Make products.farmer_id nullable
    try {
      await conn.query("ALTER TABLE products MODIFY farmer_id INT NULL");
      console.log('Migrated: products.farmer_id -> NULL');
    } catch (e) {
      if (e && e.code !== 'ER_BAD_FIELD_ERROR') console.log('Skip/Note:', e.message);
    }

    // Extend orders.status enum
    try {
      await conn.query(
        "ALTER TABLE orders MODIFY status ENUM('Pending','Shipped','Delivered','Cancelled','Paid') DEFAULT 'Pending'"
      );
      console.log("Migrated: orders.status includes 'Cancelled','Paid'");
    } catch (e) {
      console.log('Skip/Note:', e.message);
    }

    // Ensure unique index on cart(user_id, product_id)
    const [idxRows] = await conn.query(
      "SELECT COUNT(1) AS cnt FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart' AND INDEX_NAME = 'uniq_cart_user_product'"
    );
    if (idxRows[0].cnt === 0) {
      await conn.query('CREATE UNIQUE INDEX uniq_cart_user_product ON cart(user_id, product_id)');
      console.log('Created index: uniq_cart_user_product on cart(user_id, product_id)');
    } else {
      console.log('Index already exists: uniq_cart_user_product');
    }

    // --- Seed Users ---
    const seedUsers = [
      {
        name: 'Admin',
        email: 'admin@agrilink.local',
        password: 'Admin@123',
        phone: '9999999999',
        address: 'HQ',
        role: 'admin',
      },
      {
        name: 'Farmer One',
        email: 'farmer1@agrilink.local',
        password: 'Farmer@123',
        phone: '8888888888',
        address: 'Village',
        role: 'farmer',
      },
      {
        name: 'Test User',
        email: 'user@agrilink.local',
        password: 'User@123',
        phone: '7777777777',
        address: 'City',
        role: 'customer',
      },
    ];

    const userIdsByEmail = {};
    for (const u of seedUsers) {
      const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (rows.length > 0) {
        userIdsByEmail[u.email] = rows[0].id;
        console.log(`User exists: ${u.email} (id=${rows[0].id})`);
        continue;
      }
      const hash = await bcrypt.hash(u.password, 10);
      const [res] = await conn.query(
        'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
        [u.name, u.email, hash, u.phone, u.address, u.role]
      );
      userIdsByEmail[u.email] = res.insertId;
      console.log(`Created user: ${u.email} (id=${res.insertId})`);
    }

    // --- Seed Farmers ---
    // Keep farmers.id == users.id for farmer1 to match server.js signup behavior
    const farmerEmail = 'farmer1@agrilink.local';
    const farmerUserId = userIdsByEmail[farmerEmail];
    if (farmerUserId) {
      const [fRows] = await conn.query('SELECT id FROM farmers WHERE id = ? OR email = ?', [farmerUserId, farmerEmail]);
      if (fRows.length === 0) {
        await conn.query('INSERT INTO farmers (id, name, email, phone) VALUES (?, ?, ?, ?)', [
          farmerUserId,
          'Farmer One',
          farmerEmail,
          '8888888888',
        ]);
        console.log(`Created farmer for user id ${farmerUserId}`);
      } else {
        console.log('Farmer already exists for farmer1');
      }
    }

    // --- Seed Products ---
    const sampleProducts = [
      { name: 'Fresh Mango', description: 'Juicy ripe mangoes', price: 120.0, quantity: 50, category: 'Fruits', image_url: '/uploads/placeholder-product.jpg' },
      { name: 'Organic Tomatoes', description: 'Farm fresh tomatoes', price: 40.0, quantity: 100, category: 'Vegetables', image_url: '/uploads/placeholder-product.jpg' },
      { name: 'Baby Spinach', description: 'Tender green leaves', price: 60.0, quantity: 80, category: 'Leafy Greens', image_url: '/uploads/placeholder-product.jpg' },
      { name: 'Red Onions', description: 'Crisp and flavorful', price: 35.0, quantity: 120, category: 'Vegetables', image_url: '/uploads/placeholder-product.jpg' },
      { name: 'Sweet Oranges', description: 'Vitamin C rich', price: 90.0, quantity: 70, category: 'Fruits', image_url: '/uploads/placeholder-product.jpg' },
    ];

    const farmerIdForProducts = farmerUserId || null; // can be null after migration above
    for (const p of sampleProducts) {
      const [rows] = await conn.query('SELECT id FROM products WHERE name = ?', [p.name]);
      if (rows.length > 0) {
        console.log(`Product exists: ${p.name} (id=${rows[0].id})`);
        continue;
      }
      const [res] = await conn.query(
        'INSERT INTO products (farmer_id, name, description, price, quantity, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [farmerIdForProducts, p.name, p.description, p.price, p.quantity, p.category, p.image_url]
      );
      console.log(`Created product: ${p.name} (id=${res.insertId})`);
    }

    // Summary
    const [[{ products_count }]] = await conn.query('SELECT COUNT(*) AS products_count FROM products');
    console.log(`Seed complete. Products in DB: ${products_count}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
