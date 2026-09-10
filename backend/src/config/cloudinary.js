const ImageKit = require("imagekit");
const multer = require("multer");
require("dotenv").config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const storage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

const uploadToImageKit = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const uploadPromises = req.files.map(async (file) => {
      // For bulk uploads, fieldname is new_images_{pid}
      // If we pass the product code in req.body[`code_${pid}`], we can use it.
      let productCode = req.body.code ? req.body.code.trim() : 'general';
      const match = file.fieldname.match(/^new_images_(.+)$/);
      if (match) {
         const pid = match[1];
         if (req.body[`code_${pid}`]) {
            productCode = req.body[`code_${pid}`].trim();
         }
      }
      
      const safeCode = productCode.replace(/[^a-zA-Z0-9_-]/g, '_');
      const folder = `hakim-group/products/${safeCode}`;

      const nameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
      const response = await imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: folder,
        useUniqueFileName: false
      });
      
      // Mimic cloudinary fields for the controller
      file.path = response.url;
      file.filename = response.fileId; 
    });

    await Promise.all(uploadPromises);
    next();
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    res.status(500).json({ error: "Failed to upload images to ImageKit" });
  }
};

// We wrap the multer and custom upload into a single middleware object
const upload = {
  array: (name, maxCount) => [uploadMiddleware.array(name, maxCount), uploadToImageKit],
  any: () => [uploadMiddleware.any(), uploadToImageKit]
};

// Mock cloudinary object for delete functions in controller
const cloudinary = {
  uploader: {
    destroy: async (fileId) => {
      try {
        await imagekit.deleteFile(fileId);
      } catch (err) {
        console.log("Delete file failed/skipped:", err.message);
      }
    }
  },
  api: {
    delete_folder: async (folderPath) => {
      try {
        await imagekit.deleteFolder(folderPath);
      } catch (err) {
        console.log("Delete folder failed/skipped:", err.message);
      }
    }
  }
};

module.exports = { cloudinary, upload };