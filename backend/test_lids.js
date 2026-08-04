require('dotenv').config({path: 'backend/.env'});
const mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME
  });
  const [rows] = await db.query("SELECT ml.id, ml.name, ml.created_at, GROUP_CONCAT(p.name SEPARATOR ', ') AS linked_products FROM manual_lids ml LEFT JOIN product_manual_lids pml ON pml.manual_lid_id = ml.id LEFT JOIN products p ON p.id = pml.product_id GROUP BY ml.id ORDER BY ml.name");
  console.log(rows);
  process.exit(0);
})();
