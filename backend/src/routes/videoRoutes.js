// backend/src/routes/videoRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const crypto = require("crypto");
const productModel = require("../models/productModel");
const { generateShowcaseVideo } = require("../services/ffmpegVideoBuilder");
const localOnly = require("../middlewares/localOnly");

// كل راوت هنا محصور على جهازك (localhost) بس — راجع localOnly.js للتفاصيل
router.use(localOnly);

const VIDEOS_DIR = path.join(__dirname, "../public/videos");
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// ── تخزين حالة كل عملية توليد فيديو في الذاكرة (Job) ──────────
const jobs = new Map();

function cleanupOldJobs() {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > ONE_HOUR) jobs.delete(id);
  }
}

async function runRender(jobId, products, imgDur, detailDur, musicUrl) {
  try {
    const { finalPath, tmpDir } = await generateShowcaseVideo({
      jobId,
      products,
      imgDur: Number(imgDur),
      detailDur: Number(detailDur),
      musicUrl,
      onProgress: (pct) => {
        console.log(`⏳ [${jobId}] تقدم التوليد: ${pct}%`);
        const job = jobs.get(jobId);
        if (job) job.progress = pct;
      },
    });

    // نقل الفيديو النهائي لمجلد public/videos الدائم
    const destPath = path.join(VIDEOS_DIR, `showcase-${jobId}.mp4`);
    await fsp.copyFile(finalPath, destPath);
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    const videoUrl = `/videos/showcase-${jobId}.mp4`;
    console.log(`✅ [${jobId}] تم توليد الفيديو: ${videoUrl}`);

    const job = jobs.get(jobId);
    if (job) {
      job.status = "done";
      job.progress = 100;
      job.videoUrl = videoUrl;
    }
  } catch (error) {
    console.error(`❌ [${jobId}] فشل التوليد:`, error);
    const job = jobs.get(jobId);
    if (job) {
      job.status = "error";
      job.error = error.message;
    }
  }
}

router.post("/render", async (req, res) => {
  try {
    const { order, imgDur = 2, detailDur = 6, musicUrl } = req.body;

    if (!order || !Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: "order array is required" });
    }

    const allProducts = await productModel.getAll();
    const byId = new Map(allProducts.map((p) => [p.id, p]));
    const products = order.map((id) => byId.get(id)).filter(Boolean);

    if (products.length === 0) {
      return res.status(400).json({ error: "No valid products found" });
    }

    cleanupOldJobs();

    const jobId = crypto.randomUUID();
    jobs.set(jobId, {
      status: "processing",
      progress: 0,
      videoUrl: null,
      error: null,
      createdAt: Date.now(),
    });

    console.log(`🎥 [${jobId}] بدء توليد فيديو (${products.length} منتج) عبر FFmpeg...`);

    runRender(jobId, products, imgDur, detailDur, musicUrl);

    res.json({ success: true, jobId });
  } catch (error) {
    console.error("❌ Render start error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/progress/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json({
    status: job.status,
    progress: job.progress,
    videoUrl: job.videoUrl,
    error: job.error,
  });
});

module.exports = router;