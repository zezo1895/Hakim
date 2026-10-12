/**
 * Admin Authentication Middleware
 * 
 * Supported Auth Mechanisms:
 * 1. Bearer JWT (Standard for Frontend Web App):
 *    Passed in `Authorization: Bearer <token>` header, signed with HS256.
 * 2. x-admin-secret (Restricted to CI/CD and Server-to-Server Webhooks):
 *    Direct header matching process.env.ADMIN_SECRET via timingSafeEqual.
 * 
 * Note: Query parameter authentication (?secret=) is strictly disallowed for security.
 */
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
