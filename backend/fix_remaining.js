require('dotenv').config();
const db = require('./src/config/db');

(async () => {
  const extraDict = {
    'سلطانيه': 'Bowl',
    'سلطانية': 'Bowl',
    'اونز': 'oz',
    'اونزات': 'oz',
    'أونز': 'oz',
    'بومبيه': 'Dome',
    'فتحة': 'with Opening',
    'صن داي': 'Sundae',
    'علبه': 'Container',
    'علبة': 'Container',
    'سكيور': 'Secure',
    'جيلي': 'Jelly',
    'ريزو': 'Rizo',
    'عالي': 'Tall',
    'قلاوظ': 'Threaded',
    'زبدية': 'Zabdia Bowl',
    'ايس كريم': 'Ice Cream',
    'آيس كريم': 'Ice Cream',
    'غويط': 'Deep',
    'غويطه': 'Deep',
    'غويطة': 'Deep',
    'مقسم': 'Divided',
    'مقcc': 'Divided',
    'كرتون': 'Cardboard',
    'كونو': 'Cone',
    'ميني': 'Mini',
    'رفيع خفيف': 'Thin Light',
    'رفيع': 'Thin',
    'خفيف': 'Light',
    'كريستال': 'Crystal',
    'اللؤلؤة': 'Al-Louloua',
    'اللؤلوة': 'Al-Louloua',
    'مدعم': 'Reinforced',
    'شطة': 'Sauce',
    'مضلع': 'Ribbed',
    'مسدسة': 'Hexagonal',
    'مسدسه': 'Hexagonal',
    'كنزى': 'Kunzi',
    'كنزي': 'Kunzi',
    'بدون': 'Without',
    'صغيرة': 'Small',
    'كبيرة': 'Large',
    'Largeة': 'Large',
    'Smallة': 'Small',
    'Hexagonal Hinged Containerة': 'Hexagonal',
  };

  const [rows] = await db.query("SELECT id, name, name_en FROM products WHERE name_en REGEXP '[ء-ي]'");
  console.log(`Fixing ${rows.length} products...`);
  
  const sortedKeys = Object.keys(extraDict).sort((a, b) => b.length - a.length);
  let fixed = 0;
  
  for (const r of rows) {
    let newName = r.name_en;
    for (const ar of sortedKeys) {
      newName = newName.replace(new RegExp(ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), extraDict[ar]);
    }
    newName = newName.replace(/\s+/g, ' ').trim();
    if (newName !== r.name_en) {
      await db.query('UPDATE products SET name_en = ? WHERE id = ?', [newName, r.id]);
      console.log(`  ✅ ${r.name_en} → ${newName}`);
      fixed++;
    }
  }
  
  console.log(`\nFixed ${fixed}. Checking remaining...`);
  const [remaining] = await db.query("SELECT name, name_en FROM products WHERE name_en REGEXP '[ء-ي]'");
  if (remaining.length === 0) {
    console.log('🎉 All clean! No Arabic remaining!');
  } else {
    console.log(`Still ${remaining.length} with Arabic:`);
    remaining.forEach(r => console.log(`  ${r.name_en}`));
  }
  
  process.exit(0);
})();
