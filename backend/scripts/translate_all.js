require('dotenv').config();
const db = require('./src/config/db');
const { translateProduct } = require('./src/services/translationService');

async function translateAll() {
  console.log("Fetching all products missing English translations...");
  try {
    const [products] = await db.query('SELECT id, name, size, notes FROM products WHERE name_en IS NULL');
    console.log(`Found ${products.length} products to translate.`);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      console.log(`Translating ${i + 1}/${products.length}: ${p.name}`);
      
      const { name_en, size_en, notes_en } = await translateProduct({
        name: p.name,
        size: p.size,
        notes: p.notes
      });

      await db.query(
        'UPDATE products SET name_en = ?, size_en = ?, notes_en = ? WHERE id = ?',
        [name_en, size_en, notes_en, p.id]
      );
      
      // Delay to avoid hitting Gemini rate limits too hard
      await new Promise(res => setTimeout(res, 500));
    }
    console.log("Translation complete!");
  } catch (err) {
    console.error("Migration error:", err);
  }
  process.exit(0);
}

translateAll();
