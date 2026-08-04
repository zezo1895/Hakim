const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

// اختبار اتصال قاعدة البيانات عند تشغيل السيرفر
require("./config/db");

const productRoutes = require("./routes/productRoutes");
const videoRoutes = require("./routes/videoRoutes");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// إعداد السيرفر للعمل خلف Reverse Proxy (مهم عشان Railway)
app.set("trust proxy", 1);

// إضافة حماية الـ Headers الأساسية
app.use(helmet({
  crossOriginResourcePolicy: false, // عشان الصور والفيديوهات تظهر عادي لو من دومين تاني
}));

// نظام الحماية من الـ Spam (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 300, // أقصى حد 300 طلب لكل IP خلال الـ 15 دقيقة
  message: { error: "طلبات كثيرة جداً، يرجى المحاولة بعد 15 دقيقة." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// السماح بتطبيق React/Electron أثناء التطوير المحلي
for (const localOrigin of [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]) {
  if (!allowedOrigins.includes(localOrigin)) {
    allowedOrigins.push(localOrigin);
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // السماح بطلبات Postman وHealth Checks بدون Origin
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "x-admin-secret",
      "Authorization",
    ],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إتاحة ملفات الفيديو الناتجة
app.use(
  "/videos",
  express.static(
    path.join(__dirname, "public/videos")
  )
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});