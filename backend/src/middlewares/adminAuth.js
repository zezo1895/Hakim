require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // Fallback to query param secret for backward compatibility or direct links
    const secret = req.headers["x-admin-secret"] || req.query.secret;
    if (secret && secret === process.env.ADMIN_SECRET) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden — missing or invalid token" });
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden — invalid token" });
    }
    req.user = user;
    next();
  });
};
