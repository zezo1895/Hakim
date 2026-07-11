// src/pages/TVShowcase.jsx
// ============================================================================
// شاشة عرض المنتجات للتلفزيون (Kiosk Display) — 1920×1080
// تشغيل تلقائي أبدي، بدون أي تفاعل (ماوس/كيبورد)، مثالية للتسجيل والعرض في المعارض.
//
// التحكم في المنتجات المعروضة يتم عن طريق رابط الصفحة (query params) اللي بتتولد
// من صفحة الإعدادات /tv-config، مثال:
//   /tv?groups=3,7            → مجموعة/مجموعات مقاسات معينة بس
//   /tv?products=12,13,14     → منتجات محددة بالاسم
//   /tv                       → كل المنتجات
// وممكن كمان تتحكم في التوقيت من نفس الرابط:
//   /tv?groups=3&imgDur=3&detailDur=8
// ============================================================================

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Flame,
  Snowflake,
  Layers,
  Hash,
  Ruler,
  Tag,
  Boxes,
  StickyNote,
  PackageCheck,
  Wifi,
  WifiOff,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import logo from "../assets/product_1079686086__employee.png";

// ────────────────────────────────────────────────────────────────
// تنويعات حركة Ken Burns — بدل زوم واحد ثابت، بندوّر على مجموعة
// حركات مختلفة (زوم لجوه/لبرة من زوايا مختلفة) وبنختار واحدة منهم
// بشكل شبه عشوائي لكل صورة، عشان العرض يبقى حيوي وملموش رتابة.
// ────────────────────────────────────────────────────────────────
const KEN_BURNS_VARIANTS = [
  { from: 1,    to: 1.14, origin: "50% 50%" },  // زوم للداخل من النص
  { from: 1.14, to: 1,    origin: "50% 50%" },  // زوم للخارج من النص
  { from: 1,    to: 1.16, origin: "25% 30%" },  // زوم للداخل من أعلى الشمال
  { from: 1,    to: 1.16, origin: "75% 30%" },  // زوم للداخل من أعلى اليمين
  { from: 1,    to: 1.16, origin: "25% 75%" },  // زوم للداخل من أسفل الشمال
  { from: 1,    to: 1.16, origin: "75% 75%" },  // زوم للداخل من أسفل اليمين
  { from: 1.16, to: 1,    origin: "30% 40%" },  // زوم للخارج بميل خفيف
  { from: 1,    to: 1.12, origin: "60% 55%" },  // زوم للداخل هادئ ومتوسط
];

function pickKenBurns(seed) {
  const i = Math.abs(seed) % KEN_BURNS_VARIANTS.length;
  return KEN_BURNS_VARIANTS[i];
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ────────────────────────────────────────────────────────────────
// إعدادات سهلة التغيير — كل التوقيتات بالميلي ثانية
// ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  IMAGE_DURATION: 2000,     // مدة ظهور كل صورة فردية قبل الانتقال للي بعدها
  DETAIL_DURATION: 6000,    // مدة شاشة "التفاصيل الكاملة" في نهاية كل منتج
  IMAGE_FADE: 700,          // مدة الفيد بين الصور
  PRODUCT_SLIDE: 900,       // مدة السلايد بين المنتجات
  KEN_BURNS_SCALE: 1.1,     // مقدار الزووم الهادئ على الصورة (Ken Burns) — احتياطي، الزووم الفعلي متنوع الآن
  PRELOAD_AHEAD: 1,         // كام منتج قدام يتم تجهيز صوره وتفاصيله مقدمًا
  FINISHED_DURATION: 8000,  // مدة شاشة "انتهى العرض" قبل ما يبدأ من الأول (لو اللوب مفعّل)
};

// الاسم/الرابط اللي هيظهر تحت على الشاشة — غيّره براحتك
const SITE_DISPLAY_URL = "www.hakimgroup.com";

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
       <rect width='100%' height='100%' fill='#f3f4f6'/>
       <text x='50%' y='50%' font-size='28' fill='#9ca3af' text-anchor='middle' dy='.3em' font-family='sans-serif'>لا توجد صورة</text>
     </svg>`
  );

function tempInfo(temp) {
  if (temp === "hot") return { label: "يتحمل الحرارة العالية", color: "text-orange-600", bg: "bg-orange-50" };
  if (temp === "cold") return { label: "للاستخدام البارد والمبرد", color: "text-sky-600", bg: "bg-sky-50" };
  return { label: "يتحمل الساخن والبارد معاً", color: "text-emerald-600", bg: "bg-emerald-50" };
}

function TempIcon({ temp, size = 26 }) {
  if (temp === "both") {
    return (
      <span className="flex items-center -space-x-1.5 -space-x-reverse">
        <Flame size={size} className="text-orange-500" />
        <Snowflake size={size} className="text-sky-500" />
      </span>
    );
  }
  return temp === "hot" ? (
    <Flame size={size} className="text-orange-500" />
  ) : (
    <Snowflake size={size} className="text-sky-500" />
  );
}

function getImages(product) {
  if (product?.images?.length) return product.images.map((i) => i.url || i);
  return [PLACEHOLDER_IMG];
}

function buildDescription(product) {
  if (product?.notes?.trim()) return product.notes.trim();
  const parts = [];
  if (product?.type_name) parts.push(product.type_name);
  if (product?.material_name) parts.push(`من ${product.material_name}`);
  if (product?.size) parts.push(`مقاس ${product.size}`);
  return parts.length ? parts.join(" — ") : "منتج من إنتاج حكيم جروب";
}

// ────────────────────────────────────────────────────────────────
// كولاج الصور لشاشة التفاصيل النهائية
// ────────────────────────────────────────────────────────────────
function ImageCollage({ images }) {
  const n = images.length;
  const Img = ({ src, className }) => (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-50 shadow-[0_15px_45px_rgba(15,42,86,0.12)] ${className}`}>
      <img src={src} alt="" className="w-full h-full object-contain p-3" />
    </div>
  );

  if (n === 1) return <div className="grid grid-cols-1 h-full"><Img src={images[0]} className="h-full" /></div>;
  if (n === 2)
    return (
      <div className="grid grid-cols-2 gap-4 h-full">
        <Img src={images[0]} className="h-full" />
        <Img src={images[1]} className="h-full" />
      </div>
    );
  if (n === 3)
    return (
      <div className="grid grid-cols-2 gap-4 h-full">
        <Img src={images[0]} className="row-span-2 h-full" />
        <Img src={images[1]} className="h-full" />
        <Img src={images[2]} className="h-full" />
      </div>
    );
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
      {images.slice(0, 4).map((src, i) => (
        <Img key={i} src={src} className="h-full" />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// صف تفصيلة واحدة (سبك) في شاشة التفاصيل
// ────────────────────────────────────────────────────────────────
function SpecRow({ icon: Icon, label, value, delay, accent = "text-brand-blue", chip }) {
  if (!value) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0"
    >
      <div className={`shrink-0 mt-0.5 ${accent}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-gray-400 mb-0.5">{label}</p>
        {chip ? (
          chip
        ) : (
          <p className="text-[22px] font-bold text-gray-800 leading-snug break-words">{value}</p>
        )}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────
// شاشة الصور المتتابعة للمنتج (المرحلة الأولى)
// ────────────────────────────────────────────────────────────────
function ImagesPhase({ product, images, imageIndex, cfg }) {
  const temp = tempInfo(product.temp);
  // كل صورة بتاخد نفسها تنويعة زوم مختلفة عن اللي قبلها، بناءً على المنتج ورقم الصورة
  const kb = pickKenBurns((product.id || 0) * 7 + imageIndex * 3);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-24">
      <div className="relative w-[62vw] h-[58vh] flex items-center justify-center">
        <AnimatePresence mode="sync">
          <motion.img
            key={imageIndex}
            src={images[imageIndex]}
            alt={product.name}
            initial={{ opacity: 0, scale: kb.from }}
            animate={{ opacity: 1, scale: kb.to }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: cfg.IMAGE_FADE / 1000, ease: "easeInOut" },
              scale: { duration: (cfg.IMAGE_DURATION + cfg.IMAGE_FADE) / 1000, ease: "linear" },
            }}
            style={{ willChange: "transform, opacity", transformOrigin: kb.origin }}
            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_35px_60px_rgba(15,42,86,0.18)]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = PLACEHOLDER_IMG;
            }}
          />
        </AnimatePresence>

        {/* عداد الصور الصغير */}
        {images.length > 1 && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === imageIndex ? "w-8 bg-brand-blue" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <motion.div
        key={`text-${product.id}`}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mt-14 text-center max-w-4xl"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <TempIcon temp={product.temp} />
          {product.size && (
            <span className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500 font-bold text-lg">
              {product.size}
            </span>
          )}
        </div>
        <h1 className="text-[56px] leading-tight font-black text-gray-900 mb-4 tracking-tight">
          {product.name}
        </h1>
        <p className="text-[24px] text-gray-500 font-medium leading-relaxed line-clamp-2">
          {buildDescription(product)}
        </p>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// شاشة التفاصيل الكاملة (المرحلة الثانية) — الصورة المجمعة + كل بيانات الداتابيز
// ────────────────────────────────────────────────────────────────
function DetailPhase({ product, images }) {
  const temp = tempInfo(product.temp);
  const hasLids = Array.isArray(product.lids) && product.lids.length > 0;
  const lidNames = hasLids
    ? product.lids.map((l) => l.name).filter(Boolean)
    : [];

  return (
    <div className="w-full h-full flex items-center justify-center px-20">
      <div className="w-full max-w-[1600px] grid grid-cols-[1.05fr_1fr] gap-16 items-center">
        {/* الكولاج */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-[62vh]"
        >
          <ImageCollage images={images} />
        </motion.div>

        {/* بطاقة التفاصيل */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-3 text-brand-green font-bold"
          >
            <PackageCheck size={20} />
            <span className="text-lg">بطاقة المواصفات الكاملة</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-[42px] font-black text-gray-900 mb-2 leading-tight"
          >
            {product.name}
          </motion.h2>

          <div className="bg-white/60 rounded-3xl">
            <SpecRow icon={Hash} label="الكود" value={product.code} delay={0.15} />
            <SpecRow icon={Tag} label="النوع" value={product.type_name} delay={0.22} />
            <SpecRow
              icon={Boxes}
              label="الخامة"
              value={
                product.material_name
                  ? `${product.material_name}${product.material_category ? ` (${product.material_category})` : ""}`
                  : null
              }
              delay={0.29}
            />
            <SpecRow icon={Ruler} label="المقاس" value={product.size} delay={0.36} />
            <SpecRow icon={Layers} label="المجموعة" value={product.group_name} delay={0.43} />
            <SpecRow
              icon={product.temp === "hot" ? Flame : Snowflake}
              label="يتحمل"
              value={temp.label}
              accent={temp.color}
              delay={0.5}
            />
            {hasLids && (
              <SpecRow
                icon={Layers}
                label="الأغطية المتوافقة"
                value=" "
                delay={0.57}
                chip={
                  <div className="flex flex-wrap gap-2 mt-1">
                    {lidNames.slice(0, 6).map((n, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-brand-blueLight text-brand-blue text-[15px] font-bold border border-brand-blue/10"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                }
              />
            )}
            {product.notes?.trim() && (
              <SpecRow icon={StickyNote} label="ملاحظات" value={product.notes} delay={0.64} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// شاشة "انتهى العرض" — بتظهر بعد ما كل المنتجات تتعرض مرة كاملة.
// مثالية لقطع الفيديو عندها لو بتسجل، أو لو مش بتلوب بتفضل ثابتة.
// ────────────────────────────────────────────────────────────────
function FinishedScreen({ willLoop }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex flex-col items-center justify-center text-center px-10"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-24 h-24 rounded-full bg-brand-greenLight flex items-center justify-center mb-8"
      >
        <CheckCircle2 size={46} className="text-brand-green" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-[52px] font-black text-gray-900 mb-4 tracking-tight"
      >
        انتهى العرض
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-[22px] text-gray-500 font-medium max-w-2xl"
      >
        شكراً لمتابعتكم — ده كان عرض كامل لمنتجات حكيم جروب
      </motion.p>

      {willLoop ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex items-center gap-2 text-gray-400 text-sm font-semibold"
        >
          <RotateCcw size={16} className="animate-spin [animation-duration:2.5s]" />
          هيبدأ العرض من الأول تلقائيًا خلال ثوانٍ...
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 text-gray-300 text-sm font-semibold"
        >
          نهاية التسجيل
        </motion.div>
      )}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────
// المكوّن الرئيسي
// ────────────────────────────────────────────────────────────────
export default function TVShowcase({ 
  products: propProducts, 
  isRemotion = false,
  imgDur: propImgDur,
  detailDur: propDetailDur,
  ...props 
}) {
  const [searchParams] = useSearchParams();

  const cfg = useMemo(() => {
    const sec = (key, fallback) => {
      const v = parseFloat(searchParams.get(key));
      return Number.isFinite(v) && v > 0 ? v * 1000 : fallback;
    };
    return {
      ...DEFAULTS,
      IMAGE_DURATION: sec("imgDur", DEFAULTS.IMAGE_DURATION),
      DETAIL_DURATION: sec("detailDur", DEFAULTS.DETAIL_DURATION),
    };
  }, [searchParams]);

  const loop = searchParams.get("loop") !== "false";

  const groupIds = useMemo(() => {
    const raw = searchParams.get("groups");
    return raw ? raw.split(",").map((s) => Number(s.trim())).filter(Boolean) : [];
  }, [searchParams]);

  const productIds = useMemo(() => {
    const raw = searchParams.get("products");
    return raw ? raw.split(",").map((s) => Number(s.trim())).filter(Boolean) : [];
  }, [searchParams]);

  const explicitOrder = useMemo(() => {
    const raw = searchParams.get("order");
    return raw ? raw.split(",").map((s) => Number(s.trim())).filter(Boolean) : [];
  }, [searchParams]);

  // ← هنا التصحيح المهم
  const [playlist, setPlaylist] = useState(propProducts || null);
  const [detailsCache, setDetailsCache] = useState({});
  const [productIndex, setProductIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [phase, setPhase] = useState("images");
  const [offline, setOffline] = useState(false);

  const detailsCacheRef = useRef(detailsCache);
  detailsCacheRef.current = detailsCache;

  // ── تحميل قائمة المنتجات ──
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (propProducts?.length > 0) {
          setPlaylist(propProducts);
          setOffline(false);
          return;
        }

        const res = await fetch(`${API}/products`);
        if (!res.ok) throw new Error("failed");
        
        const all = await res.json();
        if (cancelled) return;

        let filtered;
        if (explicitOrder.length) {
          const byId = new Map(all.map((p) => [p.id, p]));
          filtered = explicitOrder.map((id) => byId.get(id)).filter(Boolean);
        } else if (groupIds.length) {
          filtered = all.filter((p) => groupIds.includes(p.group_id));
        } else if (productIds.length) {
          filtered = all.filter((p) => productIds.includes(p.id));
        } else {
          filtered = all;
        }

        setPlaylist(filtered);
        setOffline(false);
      } catch (e) {
        if (!cancelled) setOffline(true);
      }
    }

    load();

    const refresh = !propProducts ? setInterval(load, 10 * 60 * 1000) : null;

    return () => {
      cancelled = true;
      if (refresh) clearInterval(refresh);
    };
  }, [groupIds, productIds, explicitOrder, propProducts]);

  // باقي الكود (ensureDetail, useEffects, return ...) كما هو بدون تغيير

  // ── جلب التفاصيل الكاملة (الأغطية إلخ) لمنتج معيّن مرة واحدة فقط ──
  const ensureDetail = useCallback(async (id) => {
    if (!id || detailsCacheRef.current[id]) return;
    try {
      const res = await fetch(`${API}/products/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setDetailsCache((prev) => ({ ...prev, [id]: data }));
    } catch (e) {
      /* تجاهل — هنعتمد على البيانات الأساسية بدل الكاملة */
    }
  }, []);

  // ── تجهيز الصور والتفاصيل مقدمًا للمنتج الحالي والقادم ──
  useEffect(() => {
    if (!playlist?.length) return;
    const current = playlist[productIndex];
    const next = playlist[(productIndex + 1) % playlist.length];
    if (current) ensureDetail(current.id);
    if (next) {
      ensureDetail(next.id);
      getImages(next).forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    }
  }, [productIndex, playlist, ensureDetail]);

  // ── ماكينة الحالة: صورة بصورة، ثم شاشة تفاصيل، ثم المنتج التالي،
  //    وبعد آخر منتج بتظهر شاشة "انتهى العرض" (بدل ما تلوب على طول) ──
  useEffect(() => {
    if (!playlist?.length) return;

    if (phase === "finished") {
      if (!loop) return; // العرض واقف عند شاشة النهاية — مفيد وقت التسجيل
      const t = setTimeout(() => {
        setProductIndex(0);
        setImageIndex(0);
        setPhase("images");
      }, cfg.FINISHED_DURATION);
      return () => clearTimeout(t);
    }

    const product = playlist[productIndex];
    if (!product) return;
    const images = getImages(product);
    const isLastProduct = productIndex === playlist.length - 1;

    const t = setTimeout(() => {
      if (phase === "images") {
        if (imageIndex + 1 < images.length) {
          setImageIndex((i) => i + 1);
        } else {
          setPhase("detail");
        }
      } else if (isLastProduct) {
        setPhase("finished");
      } else {
        setImageIndex(0);
        setPhase("images");
        setProductIndex((i) => i + 1);
      }
    }, phase === "images" ? cfg.IMAGE_DURATION : cfg.DETAIL_DURATION);

    return () => clearTimeout(t);
  }, [productIndex, imageIndex, phase, playlist, cfg, loop]);

  // ── منع أي تفاعل: كليك يمين / تحديد نص / كيبورد ──
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    document.body.style.cursor = "none";
    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.body.style.cursor = "auto";
    };
  }, []);

  const product = playlist?.[productIndex];
  const images = product ? getImages(product) : [];
  const fullProduct = product ? detailsCache[product.id] || product : null;

  const qrValue = product
    ? `${window.location.origin}/products/${product.id}`
    : window.location.origin;

  // نسبة التقدم لبروجريس بار السيجنتشر تحت الشاشة
  const totalPhaseDuration =
    phase === "images" ? cfg.IMAGE_DURATION :
    phase === "detail" ? cfg.DETAIL_DURATION :
    cfg.FINISHED_DURATION;

  return (
    <div
      className="fixed inset-0 bg-white overflow-hidden select-none font-arabic"
      dir="rtl"
      style={{ cursor: "none" }}
    >
      {/* خلفية متدرجة خفيفة جدًا لإحساس فاخر بدل الأبيض الفلات */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 90% at 12% 8%, rgba(26,58,107,0.05) 0%, rgba(255,255,255,0) 55%), radial-gradient(110% 90% at 90% 100%, rgba(45,122,58,0.05) 0%, rgba(255,255,255,0) 55%)",
        }}
      />

      {/* لمسة حيوية خفيفة جدًا — بقعتا لون بتتحرك ببطء شديد فى الخلفية */}
      <motion.div
        aria-hidden
        className="absolute -top-40 -right-40 w-[36vw] h-[36vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(26,58,107,0.06) 0%, rgba(255,255,255,0) 70%)" }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -left-40 w-[30vw] h-[30vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(45,122,58,0.06) 0%, rgba(255,255,255,0) 70%)" }}
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* الشعار — أعلى اليسار */}
      <div className="absolute top-10 right-10 z-20 flex items-center gap-3">
        <img src={logo} alt="Hakim Group" className="h-16 w-auto object-contain drop-shadow-md" />
      </div>

      {/* رابط الموقع — أسفل اليسار (RTL: يظهر يسار الشاشة فعليًا) */}
      <div className="absolute bottom-10 left-10 z-20 flex items-center gap-2 text-gray-400" dir="ltr">
        {offline ? <WifiOff size={16} className="text-red-300" /> : <Wifi size={16} className="text-brand-green/50" />}
        <span className="font-bold tracking-wide text-lg">{SITE_DISPLAY_URL}</span>
      </div>

      {/* QR كود — أسفل اليمين */}
      <div className="absolute bottom-10 right-10 z-20 bg-white p-3 rounded-2xl shadow-[0_15px_40px_rgba(15,42,86,0.15)] border border-gray-100">
        <QRCodeSVG value={qrValue} size={104} fgColor="#1a3a6b" level="M" />
      </div>

      {/* المحتوى الرئيسي */}
      {!playlist ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-gray-100 border-t-brand-blue rounded-full animate-spin" />
        </div>
      ) : playlist.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-10">
          <Boxes size={48} className="text-gray-300" />
          <p className="text-2xl font-bold text-gray-400">
            لا توجد منتجات مطابقة لإعدادات هذا العرض
          </p>
          <Link to="/tv-config" className="text-brand-blue font-semibold underline">
            الرجوع لإعدادات العرض
          </Link>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={productIndex}
            initial={{ x: "6%", opacity: 0 }}
            animate={{ x: "0%", opacity: 1 }}
            exit={{ x: "-6%", opacity: 0 }}
            transition={{ duration: cfg.PRODUCT_SLIDE / 1000, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ willChange: "transform, opacity" }}
          >
            {phase === "images" ? (
              <ImagesPhase product={product} images={images} imageIndex={imageIndex} cfg={cfg} />
            ) : phase === "detail" ? (
              <DetailPhase product={fullProduct} images={images} />
            ) : (
              <FinishedScreen willLoop={loop} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* بروجريس بار السيجنتشر — خط رفيع بيتحرك بيعبّر عن الوقت المتبقي للسلايد الحالي */}
      {playlist?.length > 0 && !(phase === "finished" && !loop) && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-100 z-30 overflow-hidden">
          <motion.div
            key={`${productIndex}-${phase}-${imageIndex}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: totalPhaseDuration / 1000, ease: "linear" }}
            style={{ originX: 0 }}
            className="h-full w-full bg-gradient-to-l from-brand-green via-brand-blue to-brand-blue"
          />
        </div>
      )}
    </div>
  );
}