const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: "public_Urx29JKHy85dJSwn2PNZlN7oSjQ=",
  privateKey: "private_mqqwFXq27Y2znfdxpzgkbtm1Eus=",
  urlEndpoint: "https://ik.imagekit.io/h9g2sgf8k"
});

const getHash = (str) => crypto.createHash('md5').update(str).digest('hex');

const offlineImagesDir = 'C:/Users/Desgin/AppData/Roaming/hakim-display-manager/offline_cache/images';
const dbPath = 'C:/Users/Desgin/AppData/Roaming/hakim-display-manager/offline_cache/database.json';

const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const products = data.products || [];

let totalImages = 0;
let uploadedImages = 0;
const sqlUpdates = [];

async function uploadImages() {
  console.log(`Starting migration to ImageKit...`);
  
  for (const product of products) {
    if (!product.raw_images) continue;
    
    // SAFE FOLDER NAME
    const safeCode = product.code ? product.code.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'general';
    const folder = `hakim-group/products/${safeCode}`; // No leading slash
    
    const parts = product.raw_images.split('||');
    for (const part of parts) {
      const [imgId, oldUrl, oldPubId] = part.split('::');
      if (!imgId || !oldUrl) continue;
      
      totalImages++;
      const ext = path.extname(oldUrl.split('?')[0]) || '.jpg';
      const filename = getHash(oldUrl) + ext;
      const localPath = path.join(offlineImagesDir, filename);
      
      if (fs.existsSync(localPath)) {
        try {
          const fileBuffer = fs.readFileSync(localPath);
          const origName = path.basename(oldPubId || imgId) + ext;
          
          console.log(`Uploading ${uploadedImages + 1}: ${origName} -> ${folder}`);
          const res = await imagekit.upload({
            file: fileBuffer,
            fileName: origName,
            folder: folder,
            useUniqueFileName: false
          });
          
          sqlUpdates.push(`UPDATE product_images SET url = '${res.url}', public_id = '${res.fileId}' WHERE id = '${imgId}';`);
          uploadedImages++;
        } catch (err) {
          console.error(`Failed to upload ${localPath}:`, err.message);
        }
      } else {
        console.log(`Missing local file: ${localPath}`);
      }
    }
  }
  
  console.log(`\nFinished! Uploaded ${uploadedImages} out of ${totalImages} images.`);
  
  const sqlPath = 'C:/Users/Desgin/Desktop/update_images_imagekit.sql';
  fs.writeFileSync(sqlPath, sqlUpdates.join('\n'), 'utf8');
  console.log(`Generated SQL updates at: ${sqlPath}`);
}

uploadImages();
