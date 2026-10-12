const db = require('./src/config/db');

async function checkImages() {
  console.log("Fetching all images from database...");
  const [images] = await db.query("SELECT * FROM product_images");
  console.log(`Found ${images.length} images. Checking for 404s...`);

  let brokenCount = 0;

  for (const img of images) {
    if (!img.url) continue;
    try {
      const response = await fetch(img.url, { method: 'HEAD' });
      if (response.status === 404) {
        console.log(`[404] Deleting broken image: ${img.url}`);
        await db.query("DELETE FROM product_images WHERE id=?", [img.id]);
        brokenCount++;
      }
    } catch (e) {
      console.log(`[Error] Failed to check ${img.url}: ${e.message}`);
    }
  }

  console.log(`\nCleanup complete! Removed ${brokenCount} broken images.`);
  process.exit(0);
}

checkImages();
