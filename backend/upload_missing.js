
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("./src/config/db");
const { cloudinary } = require("./src/config/cloudinary");

const BASE_FOLDER = path.join("C:\\Users\\Desgin\\Desktop", Buffer.from('2LTYutmE', 'base64').toString('utf8'));

async function run() {
  try {
    console.log("?? Starting missing images upload process...");
    
    // Check if folder exists
    if (!fs.existsSync(BASE_FOLDER)) {
      console.error(`? Folder not found: ${BASE_FOLDER}`);
      process.exit(1);
    }

    const folders = fs.readdirSync(BASE_FOLDER).filter(f => fs.statSync(path.join(BASE_FOLDER, f)).isDirectory());
    console.log(`?? Found ${folders.length} product folders.`);

    let processedCount = 0;
    let uploadedImagesCount = 0;

    for (let i = 0; i < folders.length; i++) {
      const productCode = folders[i];
      const folderPath = path.join(BASE_FOLDER, productCode);
      
      // Get local images
      const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(jpg|jpeg|png|webp|avif)$/i)).sort();
      
      if (files.length === 0) continue;

      // Find product in DB by code
      const [products] = await db.query(`SELECT id FROM products WHERE code = ?`, [productCode]);
      if (products.length === 0) {
        console.log(`?? [${i+1}/${folders.length}] Product code ${productCode} not found in DB. Skipping.`);
        continue;
      }

      const productId = products[0].id;

      // Get current images in DB
      const [dbImages] = await db.query(`SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`, [productId]);

      // If local folder has more images than DB
      if (files.length > dbImages.length) {
        console.log(`? [${i+1}/${folders.length}] Product ${productCode}: DB has ${dbImages.length}, Local has ${files.length}. Updating...`);
        
        // 1. Delete from Cloudinary
        for (const img of dbImages) {
          if (img.public_id) {
            await cloudinary.uploader.destroy(img.public_id).catch(() => {});
          }
        }
        // 2. Delete from DB
        await db.query(`DELETE FROM product_images WHERE product_id = ?`, [productId]);

        // 3. Upload all local files with their original names
        for (let j = 0; j < files.length; j++) {
          const filePath = path.join(folderPath, files[j]);
          const fileNameWithoutExt = path.parse(files[j]).name; // get filename without extension
          console.log(`   ?? Uploading ${files[j]} (${j+1}/${files.length})...`);
          
          const result = await cloudinary.uploader.upload(filePath, {
            folder: `hakim-group/products/${productCode}`,
            public_id: fileNameWithoutExt // Preserve the original name in Cloudinary
          });

          await db.query(
            `INSERT INTO product_images (id, product_id, url, public_id, sort_order) VALUES (?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), productId, result.secure_url, result.public_id, j]
          );
          uploadedImagesCount++;
        }
        
        processedCount++;
        console.log(`   ? Product ${productCode} updated successfully.`);
      } else {
        console.log(`?? [${i+1}/${folders.length}] Product ${productCode}: Up to date (DB: ${dbImages.length}, Local: ${files.length}).`);
      }
    }

    console.log(`\n?? Process completed! Updated ${processedCount} products and uploaded ${uploadedImagesCount} images.`);
    process.exit(0);

  } catch (err) {
    console.error("? Fatal Error:", err);
    process.exit(1);
  }
}

run();

