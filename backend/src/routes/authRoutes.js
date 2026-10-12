const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Strict brute-force protection: max 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "تم تجاوز الحد الأقصى لمحاولات الدخول، يرجى المحاولة بعد 15 دقيقة." },
  standardHeaders: true,
  legacyHeaders: false,
});

const safeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

router.post("/login", loginLimiter, (req, res) => {
  const { password } = req.body;

  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required" });
  }

  // Timing-safe comparison of the provided password with ADMIN_SECRET
  if (!process.env.ADMIN_SECRET || !safeCompare(password.trim(), process.env.ADMIN_SECRET.trim())) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // Use dedicated JWT_SECRET, fallback to ADMIN_SECRET if not configured
  const secret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;
  if (!process.env.JWT_SECRET) {
    console.warn("⚠️ Warning: JWT_SECRET is not set in environment variables. Falling back to ADMIN_SECRET.");
  }
  
  // Issue token valid for 24 hours
  const token = jwt.sign(
    { role: "admin" },
    secret,
    { algorithm: "HS256", expiresIn: "24h" }
  );

  res.json({ token, expiresIn: "24h" });
});

module.exports = router;
