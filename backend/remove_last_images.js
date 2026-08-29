require('dotenv').config();
const db = require('./src/config/db');
const { cloudinary } = require('./src/config/cloudinary');

async function run() {
  try {
    console.log("?? Backup product_images table...");
    await db.query(`CREATE TABLE IF NOT EXISTS product_images_backup AS SELECT * FROM product_images`);
    console.log("? Backup created: product_images_backup");

    console.log("?? Fetching products with more than 1 image...");
    const [products] = await db.query(`
      SELECT product_id, COUNT(id) as count 
      FROM product_images 
      GROUP BY product_id 
      HAVING count > 1
    `);

    console.log(`Found ${products.length} products with multiple images.`);

    let deletedCount = 0;

    for (const p of products) {
      // Find the last image for this product (highest sort_order, or id if sort_order is same)
      const [images] = await db.query(`
        SELECT id, public_id, url, sort_order 
        FROM product_images 
        WHERE product_id = ? 
        ORDER BY sort_order DESC, id DESC 
        LIMIT 1
      `, [p.product_id]);

      if (images.length > 0) {
        const img = images[0];
        console.log(`??? Deleting last image for product ${p.product_id}: ${img.public_id} (Sort Order: ${img.sort_order})`);
        
        // 1. Delete from Cloudinary
        if (img.public_id) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
            console.log(`   ? Deleted from Cloudinary`);
          } catch (cloudErr) {
            console.error(`   ? Failed to delete from Cloudinary:`, cloudErr.message);
          }
        }

        // 2. Delete from DB
        await db.query(`DELETE FROM product_images WHERE id = ?`, [img.id]);
        console.log(`   ? Deleted from Database`);
        deletedCount++;
      }
    }

    console.log(`\n?? Process completed successfully! Deleted ${deletedCount} images.`);
    process.exit(0);

  } catch (err) {
    console.error("? Fatal Error:", err);
    process.exit(1);
  }
}

run();
