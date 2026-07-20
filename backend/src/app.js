const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

// اختبار اتصال قاعدة البيانات عند تشغيل السيرفر
require("./config/db");

const productRoutes = require("./routes/productRoutes");
const videoRoutes = require("./routes/videoRoutes");

const app = express();

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
app.use("/api/products", productRoutes);
app.use("/api/video", videoRoutes);

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