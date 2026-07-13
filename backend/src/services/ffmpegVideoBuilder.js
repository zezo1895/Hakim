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

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 25;
const TRANSITION_DUR = 1.2; // مدة التلاشي (Crossfade) بين كل مقطع والتاني بالثانية — تلاشي بطيء وهادئ

// عدد المقاطع اللي بيتم دمجها مع بعض جوه أمر FFmpeg واحد (filter_complex واحد).
// ده اللي بيتحكم فى استهلاك الـ RAM: كل ما رقم أقل كل ما الـ Filter Graph أصغر
// وعدد الـ decoders الشغالة فى نفس اللحظة أقل. مش مفروض تقل عن 3 (عشان يفضل
// فيه فايدة من الدمج على دفعات)، و6 قيمة متوازنة كويسة بين استهلاك الرام
// وعدد المستويات (levels) اللازمة.
//
// ⚠️ ملاحظة عن السرعة: رقم أصغر = مستويات دمج أكتر = نفس المقطع بيتعمله
// re-encode أكتر من مرة = وقت أطول. لو السيرفر عنده رامّ كفاية (مثلاً 4GB+
// فاضية وقت التصدير)، رفع الرقم ده لـ 10 أو 12 بيقلل عدد المستويات ويسرّع
// العملية بشكل ملحوظ من غير ما يرجّع مشكلة الذاكرة اللي كانت موجودة أصلاً
// (لأن المشكلة الأصلية كانت مع مئات المقاطع فى أمر واحد، مش مع دفعات من
// 10-12). جرّب وشوف السيرفر بيستحمل قد إيه.
const MERGE_BATCH_SIZE = 6;

// ⚠️ عدّل الدومين ده لدومين موقعك الفعلي — بيُستخدم جوه كود الـ QR أسفل كل منتج
const PUBLIC_SITE_URL = "https://hakim-chi.vercel.app";
const SITE_DISPLAY_URL = "www.hakimgroup.com";

// ── تشغيل أمر FFmpeg ─────────────────────────────────────────
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(
      ffmpegPath,
      args,
      { maxBuffer: 1024 * 1024 * 50 },
      (err, stdout, stderr) => {
        if (err) {
          console.error("FFmpeg stderr:\n", stderr?.slice(-3000));
          return reject(new Error(`FFmpeg failed: ${err.message}`));
        }
        resolve();
      },
    );
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
        const m = matches[matches.length - 1].match(
          /time=(\d+):(\d+):(\d+\.\d+)/,
        );
        if (m) {
          const seconds =
            Number(m[1]) * 3600 + Number(m[2]) * 60 + parseFloat(m[3]);
          const pct = Math.min(
            99,
            Math.max(0, (seconds / totalDurationSec) * 100),
          );
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

// نص طويل جدًا بيتقصّ عشان مايكسرش عرض شريط اسم المنتج الثابت العرض
function truncate(str = "", max = 42) {
  const s = String(str).trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
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

// ── بناء طبقة شفافة (الشعار فوق + اللينك تحت شمال + QR تحت يمين، واختياريًا
//    اسم المنتج فى شريط منفصل) ───────────────────────────────────────────
// نفس تصميم النسخة الأصلية بالظبط، بس بثلاث تعديلات مطلوبة فقط:
//   1) شريط الشعار اتوسّع شوية (كان 132px وبيقصّ كلمة "حكيم جروب")
//   2) اللينك بقى جوه شريط أبيض خلفه (كان من غير خلفية فبيدوب فوق الصور الفاتحة)
//   3) لو productName اتبعتت، بتتحط فى شريطها الخاص بمسافة أمان واضحة عن
//      الشعار فوق وعن اللينك/الـ QR تحت — عشان محدش يغطي التاني
async function buildOverlayPng(product, outPath, { productName = null } = {}) {
  const qrValue = product.id
    ? `${PUBLIC_SITE_URL}/products/${product.id}`
    : PUBLIC_SITE_URL;
  const qrBuffer = await QRCode.toBuffer(qrValue, {
    width: 90,
    margin: 1,
    color: { dark: "#1a3a6bff", light: "#ffffffff" },
  });

  const LOGO_W = 168; // كانت 132 — مش كفاية لكلمة "حكيم جروب" كاملة
  const LOGO_H = 38;
  const LOGO_X = WIDTH - LOGO_W - 24;
  const LOGO_Y = 24;

  const LINK_PILL_W = 210;
  const LINK_PILL_H = 34;
  const LINK_PILL_X = 24;
  const LINK_PILL_Y = HEIGHT - LINK_PILL_H - 22;

  const qrBoxSize = 108;
  const QR_X = WIDTH - qrBoxSize - 28;
  const QR_Y = HEIGHT - qrBoxSize - 28;

  // شريط اسم المنتج (لو موجود) — فوق سطر اللينك/QR بمسافة أمان 20px،
  // ومحصور فى النص عشان بعيد تمامًا عن الشعار فوق وعن الـ QR جنبه
  const NAME_PILL_H = 54;
  const NAME_PILL_MAX_W = 620;
  const NAME_PILL_Y = LINK_PILL_Y - 20 - NAME_PILL_H;
  const NAME_PILL_X = (WIDTH - NAME_PILL_MAX_W) / 2;

  const nameSvg = productName
    ? `
      <rect x="${NAME_PILL_X}" y="${NAME_PILL_Y}" width="${NAME_PILL_MAX_W}" height="${NAME_PILL_H}"
            rx="16" fill="#ffffff" fill-opacity="0.92" />
      <text x="${WIDTH / 2}" y="${NAME_PILL_Y + NAME_PILL_H / 2 + 9}" font-size="28" font-weight="800"
            fill="#1f2937" text-anchor="middle">${escapeXml(truncate(productName, 40))}</text>`
    : "";

  // شعار "حكيم جروب" + شريط اللينك + شريط اسم المنتج (اختياري) كـ SVG شفاف الخلفية
  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>text { font-family: 'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif; }</style>

      <!-- الشعار: أعلى يمين -->
      <rect x="${LOGO_X}" y="${LOGO_Y}" width="${LOGO_W}" height="${LOGO_H}" rx="10" fill="#1a3a6b" />
      <text x="${LOGO_X + LOGO_W / 2}" y="${LOGO_Y + LOGO_H / 2 + 6}" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">حكيم جروب</text>

      <!-- اسم المنتج (اختياري) -->
      ${nameSvg}

      <!-- اللينك: أسفل يسار، جوه شريط أبيض عشان يفضل واضح فوق أي صورة -->
      <rect x="${LINK_PILL_X}" y="${LINK_PILL_Y}" width="${LINK_PILL_W}" height="${LINK_PILL_H}" rx="10" fill="#ffffff" fill-opacity="0.92" />
      <circle cx="${LINK_PILL_X + 18}" cy="${LINK_PILL_Y + LINK_PILL_H / 2}" r="5" fill="#4ade80" />
      <text x="${LINK_PILL_X + 34}" y="${LINK_PILL_Y + LINK_PILL_H / 2 + 6}" font-size="17" font-weight="700" fill="#374151" text-anchor="start">${escapeXml(SITE_DISPLAY_URL)}</text>
    </svg>`;

  const logoLayer = await sharp(Buffer.from(svg)).png().toBuffer();

  // كارت أبيض حوالين الـ QR: أسفل يمين
  const qrBox = await sharp({
    create: {
      width: qrBoxSize,
      height: qrBoxSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(qrBuffer).resize(90, 90).toBuffer(),
        left: 9,
        top: 9,
      },
    ])
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: logoLayer, left: 0, top: 0 },
      { input: qrBox, left: QR_X, top: QR_Y },
    ])
    .png()
    .toFile(outPath);

  return outPath;
}

// ── بناء مقطع فيديو لصورة واحدة بحركة Ken Burns + الطبقة الشفافة ─
async function buildImageClip(
  imagePath,
  overlayPath,
  durationSec,
  outPath,
  variantSeed = 0,
) {
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
    "-loop",
    "1",
    "-i",
    imagePath,
    "-loop",
    "1",
    "-i",
    overlayPath,
    "-t",
    String(durationSec),
    "-filter_complex",
    filterComplex,
    "-map",
    "[out]",
    "-r",
    String(FPS),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
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
    "-loop",
    "1",
    "-i",
    imagePath,
    "-loop",
    "1",
    "-i",
    overlayPath,
    "-t",
    String(durationSec),
    "-filter_complex",
    filterComplex,
    "-map",
    "[out]",
    "-r",
    String(FPS),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    outPath,
  ]);
}

// ── بناء صورة "كارت التفاصيل الكاملة" لمنتج واحد عبر Sharp ────
async function buildDetailCardImage(product, localImagePaths, outPath) {
  const collageW = Math.round(WIDTH * 0.46);
  const panelX = collageW + 60;
  const panelY = 40;
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
      .resize(cellW, cellH, {
        fit: "contain",
        background: { r: 250, g: 250, b: 250, alpha: 1 },
      })
      .toBuffer();
    composites.push({
      input: resized,
      left: 30 + col * (cellW + gap),
      top: 30 + row * (cellH + gap),
    });
  }

  const temp =
    product.temp === "hot"
      ? "يتحمل الحرارة العالية"
      : product.temp === "cold"
        ? "للاستخدام البارد فقط"
        : "يتحمل الساخن والبارد معاً";

  const rows_ = [
    ["الكود", product.code],
    ["النوع", product.type_name],
    [
      "الخامة",
      product.material_name
        ? `${product.material_name}${product.material_category ? ` (${product.material_category})` : ""}`
        : null,
    ],
    ["المقاس", product.size],
    ["المجموعة", product.group_name],
    ["يتحمل", temp],
    product.lids?.length
      ? [
          "الأغطية المتوافقة",
          product.lids
            .map((l) => l.name)
            .filter(Boolean)
            .join("، "),
        ]
      : null,
    product.notes?.trim() ? ["ملاحظات", product.notes.trim()] : null,
  ]
    .filter(Boolean)
    .filter(([, v]) => v);

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
  composites.push({
    input: panelPng,
    left: panelX,
    top: panelY,
  });

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);
}

// ============================================================================
// ── دمج المقاطع بتلاشي (Crossfade) — نسخة "دمج على دفعات" (Batch / Progressive
//    Merge) بدل الـ filter_complex الواحد الضخم اللي كان بيحمّل كل الـ Streams
//    فى نفس اللحظة جوه FFmpeg ويطلع "Cannot allocate memory" مع أعداد كبيرة
//    من المنتجات أو دقة عالية.
//
//    الفكرة: بدل ما ندمج كل المقاطع (ممكن يكونوا مئات) فى أمر واحد، بنقسمهم
//    لمجموعات صغيرة (MERGE_BATCH_SIZE مقطع فى المرة)، وندمج كل مجموعة لوحدها
//    (xfade chain عادي زي الأصلي، بس على عدد أقل من المدخلات)، فينتج عنها
//    ملف مؤقت واحد لكل مجموعة. بعدين بنعامل الملفات المؤقتة دي كأنها "مقاطع"
//    جديدة ونكرر نفس الخطوة (مستوى/Level جديد) لحد ما يفضل ملف واحد بس — وهو
//    الناتج النهائي. النتيجة البصرية *مطابقة تمامًا* للدمج المباشر لأن معادلة
//    حساب الـ offset/duration فى الـ xfade هى نفسها بالظبط سواء اتعملت فى خطوة
//    واحدة أو على عدة مستويات (تجميعية/Associative) — فمفيش أي فرق فى التوقيت
//    أو شكل التلاشي، بس استهلاك الرام بقى محدود بعدد المقاطع فى الدفعة مش
//    بعدد المقاطع الكلي.
// ============================================================================

// حساب مدة نفس-معادلة-الأصلي: مجموع مدد المقاطع ناقص (عددهم - 1) × مدة التلاشي
function computeXfadeDuration(durations) {
  return (
    durations.reduce((a, b) => a + b, 0) -
    (durations.length - 1) * TRANSITION_DUR
  );
}

// محاكاة خطة الدمج بالكامل (من غير أي تنفيذ فعلي) عشان نعرف نحسب مقدمًا "كمية
// الشغل" الكلية (مجموع مدد كل مخرجات الدمج على كل المستويات)، ونستخدمها بعدين
// كمرجع لحساب نسبة تقدم واقعية عبر كل استدعاءات FFmpeg المتتالية.
function planMergeTotalWork(clipDurations) {
  let level = clipDurations.slice();
  let totalWork = 0;

  while (level.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < level.length; i += MERGE_BATCH_SIZE) {
      const chunk = level.slice(i, i + MERGE_BATCH_SIZE);
      if (chunk.length === 1) {
        nextLevel.push(chunk[0]);
        continue;
      }
      const dur = computeXfadeDuration(chunk);
      totalWork += dur;
      nextLevel.push(dur);
    }
    level = nextLevel;
  }

  return totalWork;
}

// دمج مجموعة صغيرة (Batch) من المقاطع بتلاشي (xfade chain) فى أمر FFmpeg واحد.
// نفس منطق بناء الفلتر الأصلي بالظبط، بس مطبّق على chunk صغير مش كل المقاطع.
//
// ملاحظة عن السرعة: مع أعداد كبيرة من المنتجات، الدمج بيحصل على أكتر من
// مستوى (Level) — يعني كل مقطع ممكن يتعمله re-encode أكتر من مرة قبل ما
// يوصل للناتج النهائي. عشان كده بنفرّق بين:
//   - مستويات وسيطة (isFinalLevel=false): بنستخدم preset سريع (veryfast)
//     عشان نقلل وقت الترميز المتكرر. الجودة (crf) بتفضل ثابتة فى كل مستوى،
//     والـ preset مش بيأثر على الجودة المرئية النهائية — بيأثر بس على سرعة
//     الترميز وحجم الملف الوسيط، فمفيش أي خسارة فى الجودة الظاهرة للمشاهد.
//   - المستوى الأخير (isFinalLevel=true): بنستخدم preset=medium (زي ما
//     اتطلب) عشان أفضل كفاءة ضغط/جودة فى الفيديو النهائي اللي هيتشاف فعلاً.
async function mergeBatchWithXfade(
  chunkClips,
  outPath,
  onLocalProgress,
  isFinalLevel,
) {
  const inputArgs = [];
  chunkClips.forEach((c) => {
    inputArgs.push("-i", c.path);
  });

  const filterParts = [];
  let cumulativeOffset = chunkClips[0].duration;
  let lastLabel = "0:v";

  for (let i = 1; i < chunkClips.length; i++) {
    const offset = Math.max(0, cumulativeOffset - TRANSITION_DUR);
    const isLast = i === chunkClips.length - 1;
    const outLabel = isLast ? "outv" : `v${i}`;
    const tail = isLast ? ",format=yuv420p" : "";
    filterParts.push(
      `[${lastLabel}][${i}:v]xfade=transition=fade:duration=${TRANSITION_DUR}:offset=${offset.toFixed(3)}${tail}[${outLabel}]`,
    );
    lastLabel = outLabel;
    cumulativeOffset = offset + chunkClips[i].duration;
  }

  const chunkDurationSec = cumulativeOffset;

  await runFfmpegWithProgress(
    [
      "-y",
      ...inputArgs,
      "-filter_complex",
      filterParts.join(";"),
      "-map",
      "[outv]",
      "-c:v",
      "libx264",
      "-preset",
      isFinalLevel ? "medium" : "veryfast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      outPath,
    ],
    chunkDurationSec,
    onLocalProgress,
  );

  return chunkDurationSec;
}

// ── دمج كل المقاطع مع بعض بتلاشي (Crossfade) — دمج على دفعات (Batch Merge) ─
async function mergeClipsWithCrossfade(clips, tmpDir, outPath, onStepProgress) {
  if (clips.length === 1) {
    await fsp.copyFile(clips[0].path, outPath);
    return;
  }

  // نحسب "الشغل الكلي" (بالثواني) اللي هيتعمل عبر كل مستويات الدمج مقدمًا،
  // عشان نقدر نطلع نسبة تقدم متصلة وواقعية من 0 لـ 99 مهما كان عدد المستويات.
  const totalWork = planMergeTotalWork(clips.map((c) => c.duration));
  let doneWork = 0;
  let tempCounter = 0;

  // كل عنصر: { path, duration, temp } — temp=true يعني ده ملف مؤقت ناتج من
  // دمج سابق (مش من مقاطع الصور الأصلية) وممكن نمسحه بعد ما نستخدمه.
  let level = clips.map((c) => ({
    path: c.path,
    duration: c.duration,
    temp: false,
  }));

  while (level.length > 1) {
    const nextLevel = [];

    for (let i = 0; i < level.length; i += MERGE_BATCH_SIZE) {
      const chunk = level.slice(i, i + MERGE_BATCH_SIZE);

      // دفعة من عنصر واحد بس: مفيش داعي لدمج، بتتنقل زي ما هي للمستوى الجاي
      if (chunk.length === 1) {
        nextLevel.push(chunk[0]);
        continue;
      }

      // لو المستوى الحالي كله هيتغطى بالدفعة دي (يعني هي آخر دمج هيفضل)،
      // نكتب الناتج على طول فى outPath بدل ما ننشئ ملف مؤقت زيادة.
      const willBeFinalOutput = level.length <= MERGE_BATCH_SIZE;

      tempCounter += 1;
      const chunkOutPath = willBeFinalOutput
        ? outPath
        : path.join(tmpDir, `merge-batch-${tempCounter}.mp4`);

      const expectedDuration = computeXfadeDuration(
        chunk.map((c) => c.duration),
      );

      const actualDuration = await mergeBatchWithXfade(
        chunk,
        chunkOutPath,
        (localPct) => {
          const overall =
            totalWork > 0
              ? Math.min(
                  99,
                  ((doneWork + (localPct / 100) * expectedDuration) /
                    totalWork) *
                    100,
                )
              : 99;
          onStepProgress?.(overall);
        },
        willBeFinalOutput,
      );

      doneWork += expectedDuration;

      // بعد ما استخدمنا مدخلات الدفعة دي، لو كانت هي نفسها ملفات مؤقتة ناتجة
      // من دمج سابق (مش مقاطع الصور الأصلية) بنمسحها لتقليل استهلاك الديسك.
      for (const c of chunk) {
        if (c.temp) {
          await fsp.unlink(c.path).catch(() => {});
        }
      }

      nextLevel.push({
        path: chunkOutPath,
        duration: actualDuration,
        temp: !willBeFinalOutput,
      });
    }

    level = nextLevel;
  }

  // إجراء احتياطي فقط (الحالة العادية بتوصل لـ outPath مباشرة جوه اللوب فوق)
  if (level.length === 1 && level[0].path !== outPath) {
    await fsp.copyFile(level[0].path, outPath);
    if (level[0].temp) {
      await fsp.unlink(level[0].path).catch(() => {});
    }
  }

  onStepProgress?.(99);
}

// ── دمج موسيقى خلفية اختيارية ──────────────────────────────────
async function addMusic(videoPath, musicUrl, finalOutPath, tmpDir) {
  const musicPath = path.join(tmpDir, "music.mp3");
  await downloadFile(musicUrl, musicPath);
  await runFfmpeg([
    "-y",
    "-i",
    videoPath,
    "-i",
    musicPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-shortest",
    finalOutPath,
  ]);
}

// ── الدالة الرئيسية: توليد الفيديو الكامل، مع تحديث نسبة التقدم ─
async function generateShowcaseVideo({
  jobId,
  products,
  imgDur = 2,
  detailDur = 6,
  musicUrl,
  onProgress,
}) {
  const tmpDir = tempDirFor(jobId);
  await fsp.mkdir(tmpDir, { recursive: true });

  const clips = []; // { path, duration }
  const totalSteps =
    products.reduce((sum, p) => sum + (p.images?.length || 1) + 1, 0) +
    products.length; // +overlay لكل منتج
  let doneSteps = 0;
  const bump = () => {
    doneSteps += 1;
    onProgress?.(Math.min(92, Math.round((doneSteps / totalSteps) * 100)));
  };

  try {
    for (const product of products) {
      const imageUrls = (product.images?.length ? product.images : [null]).map(
        (i) => (typeof i === "string" ? i : i?.url),
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

      // طبقة الشعار/اللينك/الـ QR + اسم المنتج — بتتحط فوق مقاطع الصور بس
      // (مش فوق كارت التفاصيل، عشان اسم المنتج أصلاً ظاهر كعنوان كبير جوه الكارت)
      const imageOverlayPath = path.join(
        tmpDir,
        `p${product.id}-overlay-img.png`,
      );
      await buildOverlayPng(product, imageOverlayPath, {
        productName: product.name,
      });
      bump();

      // مقطع فيديو لكل صورة (Ken Burns + الطبقة + اسم المنتج)
      for (let i = 0; i < localImgPaths.length; i++) {
        const clipPath = path.join(tmpDir, `p${product.id}-clip${i}.mp4`);
        await buildImageClip(
          localImgPaths[i],
          imageOverlayPath,
          imgDur,
          clipPath,
          Number(product.id) + i,
        );
        clips.push({ path: clipPath, duration: imgDur });
        bump();
      }

      // طبقة الشعار/اللينك/الـ QR بس (من غير اسم المنتج) — لكارت التفاصيل
      const cardOverlayPath = path.join(
        tmpDir,
        `p${product.id}-overlay-card.png`,
      );
      await buildOverlayPng(product, cardOverlayPath);

      // كارت التفاصيل (صورة ثابتة → فيديو + الطبقة)
      const cardImgPath = path.join(tmpDir, `p${product.id}-card.png`);
      await buildDetailCardImage(product, localImgPaths, cardImgPath);
      const cardClipPath = path.join(tmpDir, `p${product.id}-cardclip.mp4`);
      await buildStaticClip(
        cardImgPath,
        cardOverlayPath,
        detailDur,
        cardClipPath,
      );
      clips.push({ path: cardClipPath, duration: detailDur });
      bump();
    }

    // دمج كل المقاطع بتلاشي ناعم بدل القطع المفاجئ — على دفعات صغيرة (Batch
    // Merge) بدل تمريرة واحدة ضخمة، عشان نتجنب "Cannot allocate memory"
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