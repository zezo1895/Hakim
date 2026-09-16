const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function run() {
  const sql = fs.readFileSync('C:/Users/Desgin/Desktop/update_images_imagekit.sql', 'utf8');
  const queries = sql.split(';').filter(q => q.trim().length > 0);
  console.log('Executing ' + queries.length + ' queries...');
  
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  
  let success = 0;
  for (const q of queries) {
    try {
      await db.query(q);
      success++;
    } catch(err) {
      console.error('Error on query:', err.message);
    }
  }
  
  console.log('Successfully executed ' + success + ' queries.');
  process.exit(0);
}

run().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
