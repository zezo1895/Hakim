require('dotenv').config();
const db = require('./src/config/db');

// ===== القاموس الكامل للترجمة =====
const dict = {
  // === أنواع المنتجات ===
  'طبق فوم': 'Foam Plate',
  'طبق ريزو': 'Rizo Plate',
  'طبق لانش': 'Lunch Plate',
  'طبق': 'Plate',
  'علبة مستطيل': 'Rectangular Container',
  'علبة مستديره': 'Round Container',
  'علبة مستديرة': 'Round Container',
  'علبة لانش بوكس': 'Lunch Box Container',
  'علبة لانش': 'Lunch Box',
  'علبة': 'Container',
  'كوب ورق ايس كريم': 'Ice Cream Paper Cup',
  'كوب ورق': 'Paper Cup',
  'كوب كرافت': 'Kraft Cup',
  'كوب ربل': 'Ripple Cup',
  'كوب ريبل': 'Ripple Cup',
  'كوب اونز': 'Oz Cup',
  'كوب بوبا': 'Boba Cup',
  'كوب زبادى': 'Yogurt Cup',
  'كوب زبادي': 'Yogurt Cup',
  'كوب شطة': 'Sauce Cup',
  'كوب كولسلو': 'Coleslaw Cup',
  'كوب مسدس': 'Hexagonal Cup',
  'كوب همتو': 'Hamto Cup',
  'كوب صن داي': 'Sundae Cup',
  'كوب كنزى': 'Kunzi Cup',
  'كوب': 'Cup',
  'غطاء اونز تايت': 'Tight Oz Lid',
  'غطاء اونز': 'Oz Lid',
  'غطاء لانش': 'Lunch Lid',
  'غطاء كوب ورق': 'Paper Cup Lid',
  'غطاء كوب بوردة': 'Rose Pattern Cup Lid',
  'غطاء كوب فتحة شاليمو': 'Straw Hole Cup Lid',
  'غطاء كوب': 'Cup Lid',
  'غطاء علبة قشطة زيرو': 'Zero Cream Container Lid',
  'غطاء علبة قشطة': 'Cream Container Lid',
  'غطاء قشطة': 'Cream Lid',
  'غطاء قالب مربع': 'Square Mold Lid',
  'غطاء قالب مستطيل': 'Rectangular Mold Lid',
  'غطاء كشرى': 'Koshary Lid',
  'غطاء كشري': 'Koshary Lid',
  'غطاء مربع مصر للطيران بشفة': 'EgyptAir Square Lid with Lip',
  'غطاء مربع مصر للطيران': 'EgyptAir Square Lid',
  'غطاء مستطيل': 'Rectangular Lid',
  'غطاء همتو': 'Hamto Lid',
  'غطاء وسط مشرشر': 'Medium Serrated Lid',
  'غطاء وسط': 'Medium Lid',
  'غطاء كبير': 'Large Lid',
  'غطاء صغير': 'Small Lid',
  'غطاء سلطانية ورق': 'Paper Bowl Lid',
  'غطاء سلطانية': 'Bowl Lid',
  'غطاء': 'Lid',
  'سلطانية ورق': 'Paper Bowl',
  'سلطانية': 'Bowl',
  'جالون': 'Tub',
  'قالب فوم مربع صغير بالغطاء': 'Small Square Foam Mold with Lid',
  'قالب فوم مربع': 'Square Foam Mold',
  'قالب فوم مستطيل': 'Rectangular Foam Mold',
  'قالب فوم': 'Foam Mold',
  'قالب مربع': 'Square Mold',
  'قالب مستطيل': 'Rectangular Mold',
  'قالب': 'Mold',
  'حلة': 'Pot Container',
  'لانش بوكس': 'Lunch Box',
  'لانش': 'Lunch Box',
  'مربع': 'Square Hinged Container',
  'مستديرة': 'Round Container',
  'مستطيل': 'Rectangular Container',
  'مسدس': 'Hexagonal Hinged Container',
  'ملعقة جاروف': 'Shovel Spoon',
  'ملعقة صغيرة': 'Small Spoon',
  'ملعقة كبيرة': 'Large Spoon',
  'ملعقة': 'Spoon',
  'شوكة': 'Fork',
  'سكينة': 'Knife',
  'شاليمو عريض': 'Wide Straw',
  'شاليمو خفيف': 'Thin Straw',
  'شاليمو': 'Straw',
  
  // === الخامات ===
  'فوم': 'Foam',
  'ورق': 'Paper',
  'بلاستيك': 'Plastic',
  'كرافت': 'Kraft',
  
  // === الأوصاف ===
  'امتصاص ثقيل': 'Heavy Absorbent',
  'امتصاص عاده': 'Regular Absorbent',
  'امتصاص': 'Absorbent',
  'ثقيل': 'Heavy',
  'عاده': 'Regular',
  'عادة': 'Regular',
  'عادى': 'Regular',
  'لامع': 'Glossy',
  'معدل': 'Modified',
  'مشرشر ثقيل': 'Heavy Serrated',
  'مشرشر': 'Serrated',
  'بكعب': 'Footed',
  'بدون كعب': 'Without Base',
  'بدون قاعدة': 'Without Base',
  'بكعب': 'Footed',
  'بغطاء مفصلي': 'with Hinged Lid',
  'بغطاء مفصلى': 'with Hinged Lid',
  'مفصلي': 'Hinged',
  'مفصلى': 'Hinged',
  'مفصلية': 'Hinged',
  'بالغطاء': 'with Lid',
  'بشفة': 'with Lip',
  'جديد': 'New',
  'صغير': 'Small',
  'كبير': 'Large',
  'وسط': 'Medium',
  'تقسيمات': 'Compartment',
  'سرفيس': 'Serving',
  'فراخ': 'Chicken',
  'جاتوه': 'Gateau',
  'حلويات': 'Dessert',
  'زيرو': 'Zero',
  'فلات': 'Flat',
  'ديب': 'Deep',
  'سوشي': 'Sushi',
  
  // === الألوان ===
  'أبيض/شفاف': 'White/Clear',
  'أبيض/سوقي': 'White/Commercial',
  'ابيض/شفاف': 'White/Clear',
  'أبيض': 'White',
  'ابيض': 'White',
  'أسود': 'Black',
  'اسود': 'Black',
  'شفاف': 'Clear',
  'أصفر': 'Yellow',
  'اصفر': 'Yellow',
  'أخضر': 'Green',
  'اخضر': 'Green',
  'ازرق': 'Blue',
  'أزرق': 'Blue',
  'أحمر': 'Red',
  'احمر': 'Red',
  
  // === الأحجام ===
  'كيلو': 'kg',
  'جم': 'g',
  'سم مربع': 'Sq Cm',
  'سم': 'cc',
  'لتر': 'L',
  
  // === أخرى ===
  'عميل': 'Customer',
  'لون': 'Color',
  'ألوان': 'Colors',
  'حجم عائلى': 'Family Size',
  'حجم عائلي': 'Family Size',
};

function translateName(arabicName) {
  let en = arabicName;
  
  // Sort dictionary keys by length (longest first) to avoid partial matches
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);
  
  for (const ar of sortedKeys) {
    en = en.replace(new RegExp(ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), dict[ar]);
  }
  
  // Clean up parentheses content - translate color/count patterns
  // Pattern: (N لون) -> (N Colors) or (N Color)
  en = en.replace(/\((\d+)\s*Color\)/g, (m, n) => `(${n} ${parseInt(n) > 1 ? 'Colors' : 'Color'})`);
  en = en.replace(/\(Customer\s+(\d+)\s*Color\)/g, (m, n) => `(Customer ${n} ${parseInt(n) > 1 ? 'Colors' : 'Color'})`);
  en = en.replace(/\(Customer\s+(\d+)Color\)/g, (m, n) => `(Customer ${n} ${parseInt(n) > 1 ? 'Colors' : 'Color'})`);
  en = en.replace(/\((\d+)Color\)/g, (m, n) => `(${n} ${parseInt(n) > 1 ? 'Colors' : 'Color'})`);
  
  // Clean up extra spaces
  en = en.replace(/\s+/g, ' ').trim();
  
  return en;
}

function translateSize(arabicSize) {
  if (!arabicSize || arabicSize === '-' || arabicSize === '') return null;
  let en = arabicSize;
  const sizeKeys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const ar of sizeKeys) {
    en = en.replace(new RegExp(ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), dict[ar]);
  }
  return en.replace(/\s+/g, ' ').trim();
}

async function main() {
  try {
    const [products] = await db.query("SELECT id, name, size, notes FROM products WHERE name_en IS NULL OR name_en = ''");
    console.log(`Found ${products.length} products to translate (dictionary-based, no API needed)`);
    
    let count = 0;
    for (const p of products) {
      const name_en = translateName(p.name);
      const size_en = translateSize(p.size);
      const notes_en = p.notes ? translateName(p.notes) : null;
      
      await db.query(
        'UPDATE products SET name_en = ?, size_en = ?, notes_en = ? WHERE id = ?',
        [name_en, size_en, notes_en, p.id]
      );
      count++;
      if (count % 50 === 0) console.log(`  Progress: ${count}/${products.length}`);
    }
    
    console.log(`\n✅ Done! Translated ${count} products instantly!`);
    
    // Show some samples
    const [samples] = await db.query("SELECT name, name_en FROM products ORDER BY RAND() LIMIT 15");
    console.log('\n📋 Sample translations:');
    samples.forEach(s => console.log(`  ${s.name} → ${s.name_en}`));
    
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

main();
