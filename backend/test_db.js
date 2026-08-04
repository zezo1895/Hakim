require('dotenv').config({path: '.env'});
const mysql = require('mysql2/promise');
(async () => {
  try {
    const db = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: '1832003Ziadz',
      database: process.env.DB_NAME
    });
    console.log("DB connected");
    const [manualLids] = await db.query("SELECT * FROM manual_lids");
    console.log("Manual Lids:", manualLids);
    const [productManualLids] = await db.query("SELECT * FROM product_manual_lids");
    console.log("Product Manual Lids:", productManualLids);
    const [query] = await db.query("SELECT ml.id, ml.name, ml.created_at, GROUP_CONCAT(p.name SEPARATOR ', ') AS linked_products FROM manual_lids ml LEFT JOIN product_manual_lids pml ON pml.manual_lid_id = ml.id LEFT JOIN products p ON p.id = pml.product_id GROUP BY ml.id ORDER BY ml.name");
    console.log("Result:", query);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
})();
