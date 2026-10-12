const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();

const safeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  // Timing-safe comparison of the provided password with ADMIN_SECRET
  if (!process.env.ADMIN_SECRET || !safeCompare(password, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // If valid, generate a JWT token signed with HS256
  const secret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;
  
  const token = jwt.sign(
    { role: "admin" },
    secret,
    { algorithm: "HS256", expiresIn: "7d" } // Token valid for 7 days
  );

  res.json({ token });
});

module.exports = router;
