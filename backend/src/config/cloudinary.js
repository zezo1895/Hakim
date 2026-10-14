const ImageKit = require("imagekit");
const multer = require("multer");
const crypto = require("crypto");
require("dotenv").config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB limit for images
const MAX_GLB_SIZE_MB = parseInt(process.env.MAX_GLB_SIZE_MB || "30", 10);
const MAX_GLB_SIZE_BYTES = MAX_GLB_SIZE_MB * 1024 * 1024;
const OVERALL_MAX_SIZE = Math.max(MAX_IMAGE_SIZE_BYTES, MAX_GLB_SIZE_BYTES);

const storage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: OVERALL_MAX_SIZE },
  fileFilter: (_, file, cb) => {
    const isModelField =
      file.fieldname === "model" ||
      file.fieldname === "glb" ||
      file.fieldname === "model_file" ||
      file.originalname.toLowerCase().endsWith(".glb");

    if (isModelField) {
      if (file.originalname.toLowerCase().endsWith(".glb")) {
        cb(null, true);
      } else {
        cb(new Error("صيغة غير مدعومة. يسمح فقط بملفات ثلاثية الأبعاد بصيغة .glb"), false);
      }
    } else {
      // Must be an image
      if (
        file.mimetype.startsWith("image/") ||
        /\.(jpe?g|png|webp|gif|svg)$/i.test(file.originalname)
      ) {
        cb(null, true);
      } else {
        cb(new Error("يسمح فقط بملفات الصور أو ملفات 3D بصيغة .glb"), false);
      }
    }
  },
});

const uploadToImageKit = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const rawFiles = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

    const imageFiles = [];
    let modelFile = null;

    // First validate each file's size and GLB header
    for (const file of rawFiles) {
      const isModel =
        file.fieldname === "model" ||
        file.fieldname === "glb" ||
        file.fieldname === "model_file" ||
        file.originalname.toLowerCase().endsWith(".glb");

      if (isModel) {
        // 1. Check GLB size
        if (file.buffer.length > MAX_GLB_SIZE_BYTES) {
          return res.status(400).json({
            error: `حجم ملف المجسم يتجاوز الحد المسموح به (${MAX_GLB_SIZE_MB} ميجابايت).`,
          });
        }

        // 2. Validate GLB magic header (first 4 bytes must be ASCII "glTF")
        const isGltfMagic =
          file.buffer.length >= 4 &&
          file.buffer.slice(0, 4).toString("ascii") === "glTF";

        if (!isGltfMagic) {
          return res.status(400).json({
            error: "ملف غير صالح. يجب أن يكون الملف بصيغة 3D GLB صالحة وبترويسة glTF.",
          });
        }

        modelFile = file;
      } else {
        // Image size check
        if (file.buffer.length > MAX_IMAGE_SIZE_BYTES) {
          return res.status(400).json({
            error: "حجم الصورة يتجاوز الحد المسموح به (8 ميجابايت).",
          });
        }
        imageFiles.push(file);
      }
    }

    // Determine safe code
    let productCode = req.body.code ? req.body.code.trim() : "general";
    const safeCode = productCode.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Upload 3D GLB Model if present
    if (modelFile) {
      const uniqueModelName = `${safeCode}-${crypto.randomUUID()}.glb`;
      const modelResponse = await imagekit.upload({
        file: modelFile.buffer,
        fileName: uniqueModelName,
        folder: "hakim/aluminium/models",
        useUniqueFileName: false,
      });

      req.modelFile = {
        url: modelResponse.url,
        fileId: modelResponse.fileId,
        name: modelFile.originalname,
        size: modelFile.size,
      };
    }

    // Upload 2D images
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file) => {
        let codeForFolder = safeCode;
        const match = file.fieldname.match(/^new_images_(.+)$/);
        if (match) {
          const pid = match[1];
          if (req.body[`code_${pid}`]) {
            codeForFolder = req.body[`code_${pid}`].trim().replace(/[^a-zA-Z0-9_-]/g, "_");
          }
        }

        const folder = `hakim-group/products/${codeForFolder}`;
        const nameParts = file.originalname.split(".");
        const ext = nameParts.length > 1 ? nameParts.pop() : "";
        const baseName = nameParts.join(".");
        const timestamp = Date.now();
        const uniqueName = `${baseName}_${timestamp}.${ext}`;

        const response = await imagekit.upload({
          file: file.buffer,
          fileName: uniqueName,
          folder: folder,
          useUniqueFileName: true,
        });

        file.path = response.url;
        file.filename = response.fileId;
      });

      await Promise.all(uploadPromises);
    }

    // Keep req.files populated only with 2D image files for backwards compatibility
    req.files = imageFiles;

    next();
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    res.status(500).json({ error: "فشل رفع الملفات إلى خدمة التخزين السحابي ImageKit" });
  }
};

const multerErrorHandler = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "حجم الملف المرفوع أكبر من الحد الأقصى المسموح به." });
      }
      return res.status(400).json({ error: err.message || "خطأ أثناء معالجة الملفات المرفوعة." });
    }
    next();
  });
};

const upload = {
  array: (name, maxCount) => [multerErrorHandler(uploadMiddleware.array(name, maxCount)), uploadToImageKit],
  any: () => [multerErrorHandler(uploadMiddleware.any()), uploadToImageKit],
};

const cloudinary = {
  uploader: {
    destroy: async (fileId) => {
      try {
        if (!fileId) return;
        await imagekit.deleteFile(fileId);
      } catch (err) {
        console.log("Delete file failed/skipped:", err.message);
      }
    },
  },
  api: {
    delete_folder: async (folderPath) => {
      try {
        if (!folderPath) return;
        await imagekit.deleteFolder(folderPath);
      } catch (err) {
        console.log("Delete folder failed/skipped:", err.message);
      }
    },
  },
};

module.exports = { cloudinary, upload };