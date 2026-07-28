const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  // Compare the provided password with the backend ADMIN_SECRET
  if (password !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // If valid, generate a JWT token
  // The token is signed with a JWT_SECRET, or fallback to ADMIN_SECRET if not set
  const secret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;
  
  const token = jwt.sign(
    { role: "admin" },
    secret,
    { expiresIn: "7d" } // Token valid for 7 days
  );

  res.json({ token });
});

module.exports = router;
