const express = require("express");
const cors    = require("cors");
require("dotenv").config();

// Boot DB connection check
require("./config/db");

const productRoutes = require("./routes/productRoutes");

const app = express();

// FRONTEND_URL ممكن يكون رابط واحد أو أكتر مفصولين بفاصلة
// (مثلاً دومين Vercel الأساسي + دومينات الـ preview)
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // اسمح بطلبات بدون origin (Postman, curl, health checks)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "x-admin-secret"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/products", productRoutes);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));