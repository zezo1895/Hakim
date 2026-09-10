
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("./src/config/db");
const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: "public_Urx29JKHy85dJSwn2PNZlN7oSjQ=",
  privateKey: "private_mqqwFXq27Y2znfdxpzgkbtm1Eus=",
  urlEndpoint: "https://ik.imagekit.io/h9g2sgf8k"
});

const BASE_FOLDER = path.join("C:\\Users\\Desgin\\Desktop", Buffer.from('2LTYutmE', 'base64').toString('utf8'));

async function run() {
  try {
    console.log("⏳ Starting FULL image re-upload to ImageKit...");
    
    if (!fs.existsSync(BASE_FOLDER)) {
      console.error(`❌ Folder not found: ${BASE_FOLDER}`);
      process.exit(1);
    }

    const folders = fs.readdirSync(BASE_FOLDER).filter(f => fs.statSync(path.join(BASE_FOLDER, f)).isDirectory());
    console.log(`📁 Found ${folders.length} product folders.`);

    let processedCount = 0;
    let uploadedImagesCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < folders.length; i++) {
      const productCode = folders[i];
      const folderPath = path.join(BASE_FOLDER, productCode);
      
      const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(jpg|jpeg|png|webp|avif)$/i)).sort();
      
      if (files.length === 0) continue;

      // Find product in DB by code
      const [products] = await db.query(`SELECT id FROM products WHERE code = ?`, [productCode]);
      if (products.length === 0) {
        console.log(`⚠️ [${i+1}/${folders.length}] Product code ${productCode} not found in DB. Skipping.`);
        skippedCount++;
        continue;
      }

      const productId = products[0].id;

      console.log(`🔄 [${i+1}/${folders.length}] Product ${productCode}: Uploading ${files.length} images...`);

      // 1. Delete ALL old images from DB (no need to delete from cloud - old URLs are dead anyway)
      await db.query(`DELETE FROM product_images WHERE product_id = ?`, [productId]);

      // 2. Upload ALL local files to ImageKit
      for (let j = 0; j < files.length; j++) {
        const filePath = path.join(folderPath, files[j]);
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = files[j];
        
        console.log(`   📤 [${j+1}/${files.length}] ${fileName}`);
        const safeCode = productCode.replace(/[^a-zA-Z0-9_-]/g, '_');
        const result = await imagekit.upload({
          file: fileBuffer,
          fileName: fileName,
          folder: `hakim-group/products/${safeCode}`,
          useUniqueFileName: false
        });

        await db.query(
          `INSERT INTO product_images (id, product_id, url, public_id, sort_order) VALUES (?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), productId, result.url, result.fileId, j]
        );
        uploadedImagesCount++;
      }
      
      processedCount++;
      console.log(`   ✅ Done.`);
    }

    console.log(`\n🎉 Finished! ${processedCount} products, ${uploadedImagesCount} images uploaded, ${skippedCount} skipped.`);
    process.exit(0);

  } catch (err) {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
  }
}

run();
