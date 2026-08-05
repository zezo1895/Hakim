const mysql  = require("mysql2/promise");
require("dotenv").config();

// معظم خدمات استضافة MySQL الخارجية (Aiven, Railway, PlanetScale, ...)
// بتطلب اتصال مشفّر بـ SSL. لو DB_SSL=true في الـ env هنفعّله تلقائيًا.
const useSSL = process.env.DB_SSL === "true";

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  timezone:         "+00:00",
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Test connection on startup
pool.getConnection()
  .then(async (c) => { 
    console.log("✅ MySQL connected"); 
    try {
      await c.query('ALTER TABLE products ADD COLUMN views_count INT DEFAULT 0');
    } catch (e) {}
    try {
      await c.query(`
        CREATE TABLE IF NOT EXISTS search_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          query VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {}
    try {
      await c.query(`
        CREATE TABLE IF NOT EXISTS product_related_groups (
          product_id VARCHAR(36) NOT NULL,
          group_id VARCHAR(36) NOT NULL,
          PRIMARY KEY (product_id, group_id)
        )
      `);
    } catch (e) {
      console.error("Failed to create product_related_groups table:", e.message);
    }
    c.release(); 
  })
  .catch((e) => { console.error("❌ MySQL connection failed:", e.message); process.exit(1); });

module.exports = pool;