require("dotenv").config();

module.exports = (req, res, next) => {
  const secret =
    req.headers["x-admin-secret"] ||
    req.query.secret;

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden — invalid or missing admin secret" });
  }
  next();
};
