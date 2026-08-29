const cloudinary               = require("cloudinary").v2;
const { CloudinaryStorage }    = require("multer-storage-cloudinary");
const multer                   = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // جلب كود المنتج من الاستمارة، وفي حال لم يرسل نضع فولدر افتراضي 'general'
    const productCode = req.body.code ? req.body.code.trim() : 'general';
    const nameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
    
    return {
      folder: `hakim-group/products/${productCode}`, // مجلد باسم كود المنتج لكل كود مجلد خاص بِه
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: nameWithoutExt // Preserve the original filename on Cloudinary
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },   // 8 MB per file
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

module.exports = { cloudinary, upload };