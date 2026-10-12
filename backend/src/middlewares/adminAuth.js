require("dotenv").config();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const safeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    const secret = req.headers["x-admin-secret"];
    const expectedSecret = process.env.ADMIN_SECRET;

    if (secret && expectedSecret && safeCompare(secret, expectedSecret)) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden — missing or invalid token" });
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: "Server authentication misconfigured" });
  }

  jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden — invalid token" });
    }
    req.user = user;
    next();
  });
};
