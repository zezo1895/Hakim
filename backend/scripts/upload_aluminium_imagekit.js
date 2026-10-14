require('dotenv').config();
const fs = require('fs');
const ImageKit = require('imagekit');

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const appDataFile = 'C:/Users/Desgin/Desktop/My Projects/hakim-group-app/src/data/aluminiumModelsData.js';
const content = fs.readFileSync(appDataFile, 'utf8');

function extractBase64(varName) {
  const marker = 'export const ' + varName + ' = "data:';
  const startIdx = content.indexOf(marker);
  if (startIdx === -1) throw new Error('Could not find ' + varName);
  const commaIdx = content.indexOf(',', startIdx);
  const quoteIdx = content.indexOf('";', commaIdx);
  const base64Str = content.substring(commaIdx + 1, quoteIdx);
  return Buffer.from(base64Str, 'base64');
}

async function main() {
  const glb587 = extractBase64('IF_587_GLB');
  const png587 = extractBase64('IF_587_PNG');

  const websiteModels = 'C:/Users/Desgin/Desktop/My Projects/hakim-clean/hakim-clean/hakim-group-website/public/models';
  fs.writeFileSync(websiteModels + '/IF-587.glb', glb587);
  fs.writeFileSync(websiteModels + '/IF-587.png', png587);
  console.log('Saved IF-587 locally in website public/models');

  const resGlb = await ik.upload({
    file: glb587,
    fileName: 'IF-587.glb',
    folder: 'hakim/aluminium/models',
    useUniqueFileName: false,
  });
  console.log('Uploaded IF-587.glb =>', resGlb.url);

  const resPng = await ik.upload({
    file: png587,
    fileName: 'IF-587.png',
    folder: 'hakim/aluminium/models',
    useUniqueFileName: false,
  });
  console.log('Uploaded IF-587.png =>', resPng.url);
}

main().catch(console.error);
