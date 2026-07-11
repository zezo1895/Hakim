// backend/src/services/ffmpegVideoBuilder.js
// ============================================================================
// توليد فيديو عرض المنتجات بدون Remotion — باستخدام FFmpeg (لحركة الزووم +
// الـ Crossfade) و Sharp (لبناء صورة التفاصيل + طبقة الشعار/الرابط/الـ QR)
// ============================================================================

const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const os = require("os");
const { execFile, spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const sharp = require("sharp");
const QRCode = require("qrcode");

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 25;
const TRANSITION_DUR = 1.2; // مدة التلاشي (Crossfade) بين كل مقطع والتاني بالثانية — تلاشي بطيء وهادئ

// ⚠️ عدّل الدومين ده لدومين موقعك الفعلي — بيُستخدم جوه كود الـ QR أسفل كل منتج
const PUBLIC_SITE_URL = "https://hakim-chi.vercel.app";
const SITE_DISPLAY_URL = "www.hakimgroup.com";

// ── تشغيل أمر FFmpeg ─────────────────────────────────────────
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) {
        console.error("FFmpeg stderr:\n", stderr?.slice(-3000));
        return reject(new Error(`FFmpeg failed: ${err.message}`));
      }
      resolve();
    });
  });
}

// ── نفس تشغيل FFmpeg، لكن بيتابع نسبة التقدم أثناء التنفيذ (للعمليات الطويلة) ─
function runFfmpegWithProgress(args, totalDurationSec, onStepProgress) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args);
    let stderrBuf = "";
    proc.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderrBuf += text;
      if (stderrBuf.length > 20000) stderrBuf = stderrBuf.slice(-20000);
      const matches = text.match(/time=(\d+):(\d+):(\d+\.\d+)/g);
      if (matches && totalDurationSec > 0) {
        const m = matches[matches.length - 1].match(/time=(\d+):(\d+):(\d+\.\d+)/);
        if (m) {
          const seconds = Number(m[1]) * 3600 + Number(m[2]) * 60 + parseFloat(m[3]);
          const pct = Math.min(99, Math.max(0, (seconds / totalDurationSec) * 100));
          onStepProgress?.(pct);
        }
      }
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        console.error("FFmpeg stderr:\n", stderrBuf.slice(-3000));
        return reject(new Error(`FFmpeg exited with code ${code}`));
      }
      resolve();
    });
  });
}

// ── تحميل ملف (صورة/موسيقى) من رابط لمسار محلي ─────────────────
async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`فشل تحميل: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(destPath, buffer);
  return destPath;
}

function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tempDirFor(jobId) {
  return path.join(os.tmpdir(), `hakim-video-${jobId}`);
}

// ── تنويعات حركة Ken Burns (اتجاهات مختلفة لكل صورة) ──────────
const KEN_BURNS = [
  { from: 1.0, to: 1.08, x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
  { from: 1.08, to: 1.0, x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
  { from: 1.0, to: 1.08, x: "0", y: "0" },
  { from: 1.0, to: 1.08, x: "iw-(iw/zoom)", y: "0" },
  { from: 1.0, to: 1.08, x: "0", y: "ih-(ih/zoom)" },
  { from: 1.0, to: 1.08, x: "iw-(iw/zoom)", y: "ih-(ih/zoom)" },
];

// ── بناء طبقة شفافة (الشعار فوق + اللينك تحت شمال + QR تحت يمين) ─
// نفس تصميم النسخة الأصلية — بتتبني مرة واحدة لكل منتج (الـ QR بيختلف
// حسب رابط المنتج)، وبتتحط فوق كل مقاطع الفيديو الخاصة بالمنتج ده
async function buildOverlayPng(product, outPath) {
  const qrValue = product.id ? `${PUBLIC_SITE_URL}/products/${product.id}` : PUBLIC_SITE_URL;
  const qrBuffer = await QRCode.toBuffer(qrValue, {
    width: 90,
    margin: 1,
    color: { dark: "#1a3a6bff", light: "#ffffffff" },
  });

  // شعار "حكيم جروب" + شريط اللينك كـ SVG شفاف الخلفية
  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>text { font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif; }</style>

      <!-- الشعار: أعلى يمين -->
      <rect x="${WIDTH - 160}" y="24" width="132" height="38" rx="10" fill="#1a3a6b" />
      <text x="${WIDTH - 94}" y="49" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">حكيم جروب</text>

      <!-- اللينك: أسفل يسار -->
      <circle cx="34" cy="${HEIGHT - 34}" r="5" fill="#4ade80" />
      <text x="50" y="${HEIGHT - 28}" font-size="17" font-weight="700" fill="#6b7280" text-anchor="start">${escapeXml(SITE_DISPLAY_URL)}</text>
    </svg>`;

  const logoLayer = await sharp(Buffer.from(svg)).png().toBuffer();

  // كارت أبيض حوالين الـ QR: أسفل يمين
  const qrBoxSize = 108;
  const qrBox = await sharp({
    create: { width: qrBoxSize, height: qrBoxSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: await sharp(qrBuffer).resize(90, 90).toBuffer(), left: 9, top: 9 }])
    .png()
    .toBuffer();

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: logoLayer, left: 0, top: 0 },
      { input: qrBox, left: WIDTH - qrBoxSize - 28, top: HEIGHT - qrBoxSize - 28 },
    ])
    .png()
    .toFile(outPath);

  return outPath;
}

// ── بناء مقطع فيديو لصورة واحدة بحركة Ken Burns + الطبقة الشفافة ─
async function buildImageClip(imagePath, overlayPath, durationSec, outPath, variantSeed = 0) {
  const kb = KEN_BURNS[Math.abs(variantSeed) % KEN_BURNS.length];
  const frames = Math.round(durationSec * FPS);
  const zoomStep = (kb.to - kb.from) / frames;
  const zoomExpr =
    kb.to >= kb.from
      ? `min(zoom+${zoomStep.toFixed(6)},${kb.to})`
      : `max(zoom-${Math.abs(zoomStep).toFixed(6)},${kb.to})`;

  // بنخلي الصورة تاخد 74% بس من مساحة الفريم (مش full-bleed) عشان تبان أبعد
  // شوية وفيه مساحة فاضية حواليها، بدل ما تكون قريبة جدًا وملزّقة في الحواف
  const IMAGE_FILL_RATIO = 0.74;
  const scaledW = Math.round(WIDTH * 2 * IMAGE_FILL_RATIO);
  const scaledH = Math.round(HEIGHT * 2 * IMAGE_FILL_RATIO);

  const filterComplex =
    `[0:v]scale=${scaledW}:${scaledH}:force_original_aspect_ratio=decrease,` +
    `pad=${WIDTH * 2}:${HEIGHT * 2}:(ow-iw)/2:(oh-ih)/2:color=white,` +
    `zoompan=z='${zoomExpr}':x='${kb.x}':y='${kb.y}':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}[bg];` +
    `[bg][1:v]overlay=0:0:format=auto,format=yuv420p[out]`;

  await runFfmpeg([
    "-y",
    "-loop", "1", "-i", imagePath,
    "-loop", "1", "-i", overlayPath,
    "-t", String(durationSec),
    "-filter_complex", filterComplex,
    "-map", "[out]",
    "-r", String(FPS),
    "-an",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-pix_fmt", "yuv420p",
    outPath,
  ]);
}

// ── بناء مقطع فيديو من صورة ثابتة (كارت التفاصيل) + الطبقة الشفافة ─
async function buildStaticClip(imagePath, overlayPath, durationSec, outPath) {
  const filterComplex =
    `[0:v]scale=${WIDTH}:${HEIGHT}[bg];` +
    `[bg][1:v]overlay=0:0:format=auto,format=yuv420p[out]`;

  await runFfmpeg([
    "-y",
    "-loop", "1", "-i", imagePath,
    "-loop", "1", "-i", overlayPath,
    "-t", String(durationSec),
    "-filter_complex", filterComplex,
    "-map", "[out]",
    "-r", String(FPS),
    "-an",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-pix_fmt", "yuv420p",
    outPath,
  ]);
}

// ── بناء صورة "كارت التفاصيل الكاملة" لمنتج واحد عبر Sharp ────
async function buildDetailCardImage(product, localImagePaths, outPath) {
  const collageW = Math.round(WIDTH * 0.46);
  const panelX = collageW + 60;
  const panelW = WIDTH - panelX - 30;

  const composites = [];
  const imgs = localImagePaths.slice(0, 4);
  const cols = imgs.length > 1 ? 2 : 1;
  const rows = imgs.length > 2 ? 2 : 1;
  const gap = 10;
  const cellW = Math.floor((collageW - gap * (cols - 1)) / cols);
  const cellH = Math.floor((HEIGHT - 60 - gap * (rows - 1)) / rows);

  for (let i = 0; i < imgs.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const resized = await sharp(imgs[i])
      .resize(cellW, cellH, { fit: "contain", background: { r: 250, g: 250, b: 250, alpha: 1 } })
      .toBuffer();
    composites.push({
      input: resized,
      left: 30 + col * (cellW + gap),
      top: 30 + row * (cellH + gap),
    });
  }

  const temp = product.temp === "hot" ? "يتحمل الحرارة العالية" : product.temp === "cold" ? "للاستخدام البارد فقط" : "يتحمل الساخن والبارد معاً";

  const rows_ = [
    ["الكود", product.code],
    ["النوع", product.type_name],
    ["الخامة", product.material_name ? `${product.material_name}${product.material_category ? ` (${product.material_category})` : ""}` : null],
    ["المقاس", product.size],
    ["المجموعة", product.group_name],
    ["يتحمل", temp],
    product.lids?.length ? ["الأغطية المتوافقة", product.lids.map((l) => l.name).filter(Boolean).join("، ")] : null,
    product.notes?.trim() ? ["ملاحظات", product.notes.trim()] : null,
  ].filter(Boolean).filter(([, v]) => v);

  let rowsSvg = "";
  let y = 150;
  for (const [label, value] of rows_) {
    rowsSvg += `
      <text x="${panelW - 10}" y="${y}" font-size="17" font-weight="700" fill="#9ca3af" text-anchor="end">${escapeXml(label)}</text>
      <text x="${panelW - 10}" y="${y + 28}" font-size="24" font-weight="700" fill="#1f2937" text-anchor="end">${escapeXml(String(value).slice(0, 60))}</text>
      <line x1="0" y1="${y + 42}" x2="${panelW}" y2="${y + 42}" stroke="#f3f4f6" stroke-width="2" />`;
    y += 70;
  }

  const svg = `
    <svg width="${panelW}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>text { font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif; }</style>
      <rect width="100%" height="100%" fill="#ffffff" />
      <text x="${panelW - 10}" y="50" font-size="16" font-weight="700" fill="#2d7a3a" text-anchor="end">بطاقة المواصفات الكاملة</text>
      <text x="${panelW - 10}" y="95" font-size="32" font-weight="900" fill="#1f2937" text-anchor="end">${escapeXml(product.name || "")}</text>
      ${rowsSvg}
    </svg>`;

  const panelPng = await sharp(Buffer.from(svg)).png().toBuffer();
  composites.push({ input: panelPng, left: panelX, top: 0 });

  await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite(composites)
    .png()
    .toFile(outPath);
}

// ── دمج كل المقاطع مع بعض بتلاشي (Crossfade) في تمريرة واحدة بس ──
// (بدل الدمج المتتابع اللي كان بيعيد ترميز الفيديو المتراكم من الأول كل مرة،
// وده اللي كان بيخلي العملية بطيئة جدًا وتفضل "واقفة" من غير أي مؤشر تقدم)
async function mergeClipsWithCrossfade(clips, tmpDir, outPath, onStepProgress) {
  if (clips.length === 1) {
    await fsp.copyFile(clips[0].path, outPath);
    return;
  }

  const inputArgs = [];
  clips.forEach((c) => {
    inputArgs.push("-i", c.path);
  });

  const filterParts = [];
  let cumulativeOffset = clips[0].duration;
  let lastLabel = "0:v";

  for (let i = 1; i < clips.length; i++) {
    const offset = Math.max(0, cumulativeOffset - TRANSITION_DUR);
    const isLast = i === clips.length - 1;
    const outLabel = isLast ? "outv" : `v${i}`;
    const tail = isLast ? ",format=yuv420p" : "";
    filterParts.push(
      `[${lastLabel}][${i}:v]xfade=transition=fade:duration=${TRANSITION_DUR}:offset=${offset.toFixed(3)}${tail}[${outLabel}]`
    );
    lastLabel = outLabel;
    cumulativeOffset = offset + clips[i].duration;
  }

  const totalDurationSec = cumulativeOffset; // المدة الكلية التقريبية للفيديو الناتج

  await runFfmpegWithProgress(
    [
      "-y",
      ...inputArgs,
      "-filter_complex", filterParts.join(";"),
      "-map", "[outv]",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-pix_fmt", "yuv420p",
      outPath,
    ],
    totalDurationSec,
    onStepProgress
  );
}

// ── دمج موسيقى خلفية اختيارية ──────────────────────────────────
async function addMusic(videoPath, musicUrl, finalOutPath, tmpDir) {
  const musicPath = path.join(tmpDir, "music.mp3");
  await downloadFile(musicUrl, musicPath);
  await runFfmpeg([
    "-y", "-i", videoPath, "-i", musicPath,
    "-c:v", "copy", "-c:a", "aac",
    "-map", "0:v:0", "-map", "1:a:0",
    "-shortest",
    finalOutPath,
  ]);
}

// ── الدالة الرئيسية: توليد الفيديو الكامل، مع تحديث نسبة التقدم ─
async function generateShowcaseVideo({ jobId, products, imgDur = 2, detailDur = 6, musicUrl, onProgress }) {
  const tmpDir = tempDirFor(jobId);
  await fsp.mkdir(tmpDir, { recursive: true });

  const clips = []; // { path, duration }
  const totalSteps = products.reduce((sum, p) => sum + (p.images?.length || 1) + 1, 0) + products.length; // +overlay لكل منتج
  let doneSteps = 0;
  const bump = () => {
    doneSteps += 1;
    onProgress?.(Math.min(92, Math.round((doneSteps / totalSteps) * 100)));
  };

  try {
    for (const product of products) {
      const imageUrls = (product.images?.length ? product.images : [null]).map((i) =>
        typeof i === "string" ? i : i?.url
      );

      const localImgPaths = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        if (!url) continue;
        const dest = path.join(tmpDir, `p${product.id}-img${i}.jpg`);
        await downloadFile(url, dest);
        localImgPaths.push(dest);
      }
      if (localImgPaths.length === 0) continue;

      // طبقة الشعار/اللينك/الـ QR الخاصة بالمنتج ده (مرة واحدة، بتتكرر على كل مقاطعه)
      const overlayPath = path.join(tmpDir, `p${product.id}-overlay.png`);
      await buildOverlayPng(product, overlayPath);
      bump();

      // مقطع فيديو لكل صورة (Ken Burns + الطبقة)
      for (let i = 0; i < localImgPaths.length; i++) {
        const clipPath = path.join(tmpDir, `p${product.id}-clip${i}.mp4`);
        await buildImageClip(localImgPaths[i], overlayPath, imgDur, clipPath, Number(product.id) + i);
        clips.push({ path: clipPath, duration: imgDur });
        bump();
      }

      // كارت التفاصيل (صورة ثابتة → فيديو + الطبقة)
      const cardImgPath = path.join(tmpDir, `p${product.id}-card.png`);
      await buildDetailCardImage(product, localImgPaths, cardImgPath);
      const cardClipPath = path.join(tmpDir, `p${product.id}-cardclip.mp4`);
      await buildStaticClip(cardImgPath, overlayPath, detailDur, cardClipPath);
      clips.push({ path: cardClipPath, duration: detailDur });
      bump();
    }

    // دمج كل المقاطع بتلاشي ناعم بدل القطع المفاجئ — في تمريرة واحدة
    const mergedPath = path.join(tmpDir, "merged.mp4");
    await mergeClipsWithCrossfade(clips, tmpDir, mergedPath, (mergePct) => {
      // نحول نسبة تقدم الدمج (0-99) لمدى 92-99 من التقدم الكلي للعملية
      onProgress?.(92 + Math.round((mergePct / 100) * 7));
    });

    let finalPath = mergedPath;
    if (musicUrl) {
      const withMusicPath = path.join(tmpDir, "final_with_music.mp4");
      await addMusic(mergedPath, musicUrl, withMusicPath, tmpDir);
      finalPath = withMusicPath;
    }

    onProgress?.(100);
    return { finalPath, tmpDir };
  } catch (err) {
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

module.exports = { generateShowcaseVideo, tempDirFor };