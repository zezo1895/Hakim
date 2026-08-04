const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    await db.query('ALTER TABLE products ADD COLUMN views_count INT DEFAULT 0');
    console.log('Added views_count to products');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    console.log('views_count already exists');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS search_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      query VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('search_logs table ready');

  process.exit(0);
}

run().catch(console.error);
