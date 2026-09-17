require('dotenv').config();
const db = require('./src/config/db');

(async () => {
  const [remaining] = await db.query("SELECT COUNT(*) as c FROM products WHERE name_en IS NULL OR name_en = ''");
  const [done] = await db.query("SELECT COUNT(*) as c FROM products WHERE name_en IS NOT NULL AND name_en != ''");
  console.log('Already translated:', done[0].c);
  console.log('Remaining:', remaining[0].c);
  
  // Show all remaining names
  const [rows] = await db.query("SELECT name FROM products WHERE name_en IS NULL OR name_en = '' ORDER BY name");
  rows.forEach(r => console.log(' -', r.name));
  process.exit(0);
})();
