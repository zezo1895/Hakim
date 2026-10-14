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

// Test connection on startup
pool.getConnection()
  .then(async (c) => { 
    console.log("✅ MySQL connected"); 
    try {
      await c.query('ALTER TABLE products ADD COLUMN views_count INT DEFAULT 0');
    } catch (e) {}
    try {
      await c.query('ALTER TABLE products ADD COLUMN model_url VARCHAR(1000) DEFAULT NULL');
    } catch (e) {}
    try {
      await c.query('ALTER TABLE products ADD COLUMN model_file_id VARCHAR(255) DEFAULT NULL');
    } catch (e) {}
    try {
      await c.query(`INSERT INTO material_categories (id, name) VALUES ('al-cat-01', 'ألومنيوم') ON DUPLICATE KEY UPDATE name = VALUES(name)`);
      await c.query(`INSERT INTO materials (id, category_id, name) VALUES ('al-mat-01', 'al-cat-01', 'قطاعات ألومنيوم') ON DUPLICATE KEY UPDATE name = VALUES(name)`);
      await c.query(`INSERT INTO product_types (id, name) VALUES ('al-type-01', 'قطاع ألومنيوم') ON DUPLICATE KEY UPDATE name = VALUES(name)`);
      await c.query(`INSERT INTO material_categories (id, name) VALUES ('pipes-cat-01', 'مواسير') ON DUPLICATE KEY UPDATE name = VALUES(name)`);
      await c.query(`INSERT INTO materials (id, category_id, name) VALUES ('pipes-mat-01', 'pipes-cat-01', 'مواسير بلاستيك') ON DUPLICATE KEY UPDATE name = VALUES(name)`);
      await c.query(`INSERT INTO material_categories (id, name) VALUES ('plastic-cat-01', 'بلاستيك') ON DUPLICATE KEY UPDATE name = VALUES(name)`);

      // ── تحديث أي منتجات ألومنيوم قديمة لضمان امتلاكها UUID v4 قياسي ──
      try {
        await c.query(`UPDATE products SET id = 'a39b4d82-9f12-4e89-8d54-1b98cf587001' WHERE (code = 'IF-587' OR id = 'IF-587' OR id = 'al-if-587') AND id != 'a39b4d82-9f12-4e89-8d54-1b98cf587001'`);
        await c.query(`UPDATE products SET id = '0ea1518e-7853-48ad-94a1-7d24b20f846c' WHERE (code = 'IF-588' OR id = 'IF-588' OR id = 'al-if-588') AND id != '0ea1518e-7853-48ad-94a1-7d24b20f846c'`);
        await c.query(`UPDATE products SET id = 'c2e13df2-b032-42f4-a4b4-619d3c0fd645' WHERE (code = 'IF-589' OR id = 'IF-589' OR id = 'al-if-589') AND id != 'c2e13df2-b032-42f4-a4b4-619d3c0fd645'`);
        await c.query(`UPDATE products SET id = UUID() WHERE (material_id = 'al-mat-01' OR model_url IS NOT NULL) AND LENGTH(id) != 36`);
      } catch (upErr) {}

      // ── إدراج القطاعات الافتراضية الثلاثة بمعرفات UUID وروابط ImageKit السحابية ──
      try {
        // IF-587
        await c.query(`
          INSERT INTO products (id, name, code, material_id, type_id, temp, size, notes, model_url)
          VALUES ('a39b4d82-9f12-4e89-8d54-1b98cf587001', 'IF-587', 'IF-587', 'al-mat-01', 'al-type-01', 'both', '46.2 × 20.4 mm', 'بروفيل ألومنيوم معماري عالي الدقة (IF-587).', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-587.glb')
          ON DUPLICATE KEY UPDATE model_url = VALUES(model_url), size = VALUES(size), material_id = VALUES(material_id), type_id = VALUES(type_id)
        `);
        await c.query(`
          INSERT INTO product_images (id, product_id, url, public_id)
          VALUES ('img-if-587', 'a39b4d82-9f12-4e89-8d54-1b98cf587001', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-587.png', 'hakim_al_if_587')
          ON DUPLICATE KEY UPDATE url = VALUES(url)
        `);

        // IF-588
        await c.query(`
          INSERT INTO products (id, name, code, material_id, type_id, temp, size, notes, model_url)
          VALUES ('0ea1518e-7853-48ad-94a1-7d24b20f846c', 'IF-588', 'IF-588', 'al-mat-01', 'al-type-01', 'both', '75.0 × 17.5 mm', 'بروفيل ألومنيوم معماري عالي الدقة (IF-588).', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-588.glb')
          ON DUPLICATE KEY UPDATE model_url = VALUES(model_url), size = VALUES(size), material_id = VALUES(material_id), type_id = VALUES(type_id)
        `);
        await c.query(`
          INSERT INTO product_images (id, product_id, url, public_id)
          VALUES ('img-if-588', '0ea1518e-7853-48ad-94a1-7d24b20f846c', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-588.png', 'hakim_al_if_588')
          ON DUPLICATE KEY UPDATE url = VALUES(url)
        `);

        // IF-589
        await c.query(`
          INSERT INTO products (id, name, code, material_id, type_id, temp, size, notes, model_url)
          VALUES ('c2e13df2-b032-42f4-a4b4-619d3c0fd645', 'IF-589', 'IF-589', 'al-mat-01', 'al-type-01', 'both', '61.5 × 20.0 mm', 'بروفيل ألومنيوم إنشائي للزجاج المزدوج (IF-589).', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-589.glb')
          ON DUPLICATE KEY UPDATE model_url = VALUES(model_url), size = VALUES(size), material_id = VALUES(material_id), type_id = VALUES(type_id)
        `);
        await c.query(`
          INSERT INTO product_images (id, product_id, url, public_id)
          VALUES ('img-if-589', 'c2e13df2-b032-42f4-a4b4-619d3c0fd645', 'https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-589.png', 'hakim_al_if_589')
          ON DUPLICATE KEY UPDATE url = VALUES(url)
        `);
      } catch (seedErr) {}
    } catch (e) {}
    try {
      await c.query('ALTER TABLE products ADD CONSTRAINT unique_code UNIQUE (code)');
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
    
    // Add app_version table for OTA/APK updates management
    try {
      await c.query(`
        CREATE TABLE IF NOT EXISTS app_version (
          id INT PRIMARY KEY DEFAULT 1,
          latest_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
          download_url TEXT NOT NULL,
          force_update BOOLEAN DEFAULT TRUE,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Initialize with default values if empty
      const [rows] = await c.query('SELECT COUNT(*) as count FROM app_version');
      if (rows[0].count === 0) {
        await c.query(`
          INSERT INTO app_version (id, latest_version, download_url, force_update) 
          VALUES (1, '1.0.0', 'https://expo.dev/', true)
        `);
      }
    } catch (e) {
      console.error("Failed to create app_version table:", e.message);
    }

    c.release(); 
  })
  .catch((e) => { console.error("❌ MySQL connection failed:", e.message); process.exit(1); });

module.exports = pool;