const mysql  = require("mysql2/promise");
require("dotenv").config();

// معظم خدمات استضافة MySQL الخارجية (Aiven, Railway, PlanetScale, ...)
// بتطلب اتصال مشفّر بـ SSL. لو DB_SSL=true في الـ env هنفعّله تلقائيًا.
const useSSL = process.env.DB_SSL === "true";
const sslConfig = useSSL
  ? {
      ssl: process.env.DB_CA_CERT
        ? { ca: process.env.DB_CA_CERT, rejectUnauthorized: true }
        : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true" },
    }
  : {};

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  timezone:         "+00:00",
  ...sslConfig,
});

pool.on('connection', function (connection) {
  connection.query('SET SESSION group_concat_max_len = 1000000');
});

// Auto-migration & lookup seeder function that can be run anytime safely
async function runAutoMigrations(conn = null) {
  const shouldRelease = !conn;
  const connection = conn || (await pool.getConnection());

  const log = [];
  try {
    // 1. Check and add columns to products table safely
    try {
      const [cols] = await connection.query("SHOW COLUMNS FROM products");
      const colNames = cols.map(c => c.Field);

      if (!colNames.includes("views_count")) {
        await connection.query("ALTER TABLE products ADD COLUMN views_count INT DEFAULT 0");
        log.push("Added views_count column");
      }
      if (!colNames.includes("model_url")) {
        await connection.query("ALTER TABLE products ADD COLUMN model_url VARCHAR(1000) DEFAULT NULL");
        log.push("Added model_url column");
      }
      if (!colNames.includes("model_file_id")) {
        await connection.query("ALTER TABLE products ADD COLUMN model_file_id VARCHAR(255) DEFAULT NULL");
        log.push("Added model_file_id column");
      }
    } catch (colErr) {
      log.push(`Column check error: ${colErr.message}`);
    }

    // 2. Ensure aluminium categories, materials, and types exist
    try {
      await connection.query(`
        INSERT INTO material_categories (id, name)
        VALUES ('al-cat-01', 'ألومنيوم')
        ON DUPLICATE KEY UPDATE name = 'ألومنيوم'
      `);
      log.push("Seeded category al-cat-01");
    } catch (e) {
      log.push(`Category seed: ${e.message}`);
    }

    try {
      await connection.query(`
        INSERT INTO materials (id, category_id, name)
        VALUES ('al-mat-01', 'al-cat-01', 'قطاعات ألومنيوم')
        ON DUPLICATE KEY UPDATE name = 'قطاعات ألومنيوم'
      `);
      log.push("Seeded material al-mat-01");
    } catch (e) {
      log.push(`Material seed: ${e.message}`);
    }

    try {
      await connection.query(`
        INSERT INTO product_types (id, name)
        VALUES ('al-type-01', 'قطاع ألومنيوم')
        ON DUPLICATE KEY UPDATE name = 'قطاع ألومنيوم'
      `);
      log.push("Seeded type al-type-01");
    } catch (e) {
      log.push(`Type seed: ${e.message}`);
    }

    // 3. Unique code constraint
    try {
      await connection.query('ALTER TABLE products ADD CONSTRAINT unique_code UNIQUE (code)');
    } catch (e) {}

    // 4. search_logs table
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS search_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          query VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {}

    // 5. product_related_groups table
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS product_related_groups (
          product_id VARCHAR(36) NOT NULL,
          group_id VARCHAR(36) NOT NULL,
          PRIMARY KEY (product_id, group_id)
        )
      `);
    } catch (e) {}

    // 6. app_version table
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS app_version (
          id INT PRIMARY KEY DEFAULT 1,
          latest_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
          download_url TEXT NOT NULL,
          force_update BOOLEAN DEFAULT TRUE,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      const [rows] = await connection.query('SELECT COUNT(*) as count FROM app_version');
      if (rows[0].count === 0) {
        await connection.query(`
          INSERT INTO app_version (id, latest_version, download_url, force_update) 
          VALUES (1, '1.0.0', 'https://expo.dev/', true)
        `);
      }
    } catch (e) {}

    return log;
  } finally {
    if (shouldRelease) connection.release();
  }
}

// Test connection on startup and run auto-migrations
pool.getConnection()
  .then(async (c) => { 
    console.log("✅ MySQL connected");
    const logs = await runAutoMigrations(c);
    console.log("🛠️ Migrations complete:", logs);
    c.release(); 
  })
  .catch((e) => { 
    console.error("❌ MySQL connection failed:", e.message); 
    process.exit(1); 
  });

pool.runAutoMigrations = runAutoMigrations;

module.exports = pool;