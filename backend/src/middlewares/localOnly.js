// يسمح بتوليد الفيديو محليًا أثناء التطوير، وعلى Railway في production.
module.exports = (req, res, next) => {
  const rawIp = req.ip || req.socket?.remoteAddress || "";
  const ip = rawIp.replace("::ffff:", "");

  const isLoopback = ip === "127.0.0.1" || ip === "::1";
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction && !isLoopback) {
    return res.status(403).json({
      error: "Video generation is available only from localhost in development.",
    });
  }

  next();
};