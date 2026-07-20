const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const crypto = require("crypto");

const productModel = require("../models/productModel");
const { generateShowcaseVideo } = require("../services/ffmpegVideoBuilder");
const localOnly = require("../middlewares/localOnly");
const adminAuth = require("../middlewares/adminAuth");

router.use(localOnly);

const VIDEOS_DIR = path.join(__dirname, "../public/videos");

if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

const jobs = new Map();

function cleanupOldJobs() {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();

  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > ONE_HOUR) {
      jobs.delete(id);
    }
  }
}

async function runRender(
  jobId,
  products,
  imgDur,
  detailDur,
  musicUrl
) {
  try {
    const { finalPath, tmpDir } = await generateShowcaseVideo({
      jobId,
      products,
      imgDur: Number(imgDur),
      detailDur: Number(detailDur),
      musicUrl,

      onProgress: (pct) => {
        console.log(`[${jobId}] Video progress: ${pct}%`);

        const job = jobs.get(jobId);

        if (job) {
          job.progress = pct;
        }
      },
    });

    const destPath = path.join(
      VIDEOS_DIR,
      `showcase-${jobId}.mp4`
    );

    await fsp.copyFile(finalPath, destPath);

    await fsp
      .rm(tmpDir, {
        recursive: true,
        force: true,
      })
      .catch(() => {});

    const videoUrl = `/videos/showcase-${jobId}.mp4`;

    const job = jobs.get(jobId);

    if (job) {
      job.status = "done";
      job.progress = 100;
      job.videoUrl = videoUrl;
    }

    console.log(`[${jobId}] Video generated successfully`);
  } catch (error) {
    console.error(`[${jobId}] Video generation failed`, error);

    const job = jobs.get(jobId);

    if (job) {
      job.status = "error";
      job.error = error.message;
    }
  }
}

// مهم: adminAuth يسمح باستخدام ADMIN_SECRET من Railway
router.post("/render", adminAuth, async (req, res) => {
  try {
    const {
      order,
      imgDur = 2,
      detailDur = 6,
      musicUrl,
    } = req.body;

    if (!order || !Array.isArray(order) || order.length === 0) {
      return res.status(400).json({
        error: "order array is required",
      });
    }

    const allProducts = await productModel.getAll();

    const byId = new Map(
      allProducts.map((product) => [product.id, product])
    );

    const products = order
      .map((id) => byId.get(id))
      .filter(Boolean);

    if (products.length === 0) {
      return res.status(400).json({
        error: "No valid products found",
      });
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

    console.log(
      `[${jobId}] Starting video generation for ${products.length} products`
    );

    runRender(
      jobId,
      products,
      imgDur,
      detailDur,
      musicUrl
    );

    res.json({
      success: true,
      jobId,
    });
  } catch (error) {
    console.error("Render start error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

router.get("/progress/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      error: "Job not found",
    });
  }

  res.json({
    status: job.status,
    progress: job.progress,
    videoUrl: job.videoUrl,
    error: job.error,
  });
});

module.exports = router;