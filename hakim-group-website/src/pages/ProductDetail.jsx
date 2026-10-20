// src/pages/ProductDetail.jsx
import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Snowflake,
  ChevronLeft,
  Layers,
  Hash,
  Ruler,
  MessageCircle,
  ZoomIn,
  X,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  ShoppingCart,
  Box,
  Sparkles,
} from "lucide-react";
import Loader from "../components/Loader";
import { Helmet } from "react-helmet-async";
import { useQuote } from "../context/QuoteContext";
import { getCachedProductDetail } from "../services/productCache";
import { isAluminiumProduct } from "../data/aluminiumProfiles";

import ProductViewer3D from "../components/ProductViewer3D";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ⚠️ غيّر الرقم ده برقم الواتساب بتاع الشركة (بصيغة دولية بدون + أو أصفار في الأول)
// مثال لمصر: 201001234567
const WHATSAPP_NUMBER = "201144505575";

// بناء رسالة تفصيلية كاملة عن المنتج (الاسم، الكود، الخامة، النوع، المقاس، الحرارة، رابط الصورة، ورابط صفحة المنتج)
function buildWhatsappMessage(product, imageUrl) {
  const lines = [
    "مرحباً، أريد طلب تسعير للمنتج التالي:",
    "",
    `📦 *الاسم:* ${product.name}`,
  ];

  if (product.code) lines.push(`🔖 *الكود:* ${product.code}`);
  if (product.material_name) lines.push(`🧱 *الخامة:* ${product.material_name}`);
  if (product.type_name) lines.push(`🏷️ *النوع:* ${product.type_name}`);
  if (product.size) lines.push(`📏 *المقاس:* ${product.size}`);
  if (product.temp) {
    const tempLabel = product.temp === "both" ? "ساخن وبارد" : product.temp === "hot" ? "ساخن" : "بارد";
    lines.push(`🌡️ *يتحمل:* ${tempLabel}`);
  }

  lines.push("");
  lines.push(`🔗 *رابط المنتج:* ${window.location.href}`);

  if (imageUrl) {
    lines.push(`🖼️ *صورة المنتج:* ${imageUrl}`);
  }

  return encodeURIComponent(lines.join("\n"));
}

const materialTone = {
  "بلاستيك": { text: "text-sky-700", bg: "bg-sky-50", ring: "ring-sky-200" },
  "كرتون":   { text: "text-amber-800", bg: "bg-amber-50", ring: "ring-amber-200" },
  "فوم":     { text: "text-violet-700", bg: "bg-violet-50", ring: "ring-violet-200" },
};

// نص ولون ووصف حالة الحرارة: ساخن / بارد / يتحمل الاتنين
function tempInfo(temp) {
  if (temp === "both") {
    return {
      label: "ساخن وبارد",
      desc: "يتحمل الاستخدام الساخن والبارد معاً",
      color: "text-emerald-600",
    };
  }
  if (temp === "hot") {
    return { label: "ساخن", desc: "يتحمل الحرارة العالية", color: "text-orange-600" };
  }
  return { label: "بارد", desc: "للاستخدام البارد والمبرد", color: "text-sky-600" };
}

function TempIcon({ temp, size = 22 }) {
  if (temp === "both") {
    return (
      <span className="flex items-center -space-x-1.5 -space-x-reverse mb-1.5">
        <Flame size={size} className="text-orange-500" />
        <Snowflake size={size} className="text-sky-500" />
      </span>
    );
  }
  return temp === "hot" ? (
    <Flame size={size} className="text-orange-500 mb-1.5" />
  ) : (
    <Snowflake size={size} className="text-sky-500 mb-1.5" />
  );
}

export default function ProductDetail({ popupId, isPopup = false }) {
  const { id: paramId } = useParams();
  const id = popupId || paramId;
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [sameGroupProducts, setSameGroupProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [autoDimensions, setAutoDimensions] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFinish = searchParams.get("finish");
  const { addToCart } = useQuote();

  // إعادة تعيين مؤشر الصورة النشطة عند تغيير المنتج
  useEffect(() => {
    setActiveImg(0);
  }, [id]);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        setActiveImg(0);
        
        const lookup = decodeURIComponent(id || "").trim();
        const lookupSpaces = lookup.replace(/-/g, " ");
        const lookupHyphens = lookup.replace(/\s+/g, "-");
        const cleanLookup = lookup.replace(/^(al-)/i, "");
        const cleanLookupHyphens = cleanLookup.replace(/\s+/g, "-");
        const cleanLookupSpaces = cleanLookup.replace(/-/g, " ");

        let productData = null;
        try {
          productData = await getCachedProductDetail(API, id);
        } catch (fetchErr) {
          console.warn("Product fetch from DB failed:", fetchErr);
        }

        if (!productData || !productData.id) {
          if (!isPopup) {
            navigate("/products", { replace: true });
          }
          throw new Error("Product not found in database");
        }
        setProduct(productData);

        // إذا تم استدعاء المنتج باسمه أو كوده بدلاً من الـ UUID في الـ URL، نحدث الرابط فوراً إلى الـ UUID الحقيقي
        if (!isPopup && productData.id && String(id).toLowerCase() !== String(productData.id).toLowerCase()) {
          navigate(`/products/${productData.id}`, { replace: true });
        }
        
        if (!isPopup) {
          fetch(`${API}/products/${id}/view`, { method: "POST" }).catch(console.error);
        }

        // المنتجات من نفس المجموعة (الأصناف المشابهة / المقاسات الأخرى)
        const siblings = (productData.siblings || []).map((s) => ({
          ...s,
          images: s.images || (s.thumbnail ? [{ url: s.thumbnail }] : []),
        }));
        setSameGroupProducts(siblings);

        // منتجات من نفس الخامة من قاعدة البيانات
        let related = (productData.related || []).map((r) => ({
          ...r,
          images: r.images || (r.thumbnail ? [{ url: r.thumbnail }] : []),
        }));

        // إذا كان قطاع ألومنيوم، نجلب فقط القطاعات الحقيقية الأخرى من قاعدة البيانات
        if (isAluminiumProduct(productData) && related.length === 0 && siblings.length === 0) {
          try {
            const relRes = await fetch(`${API}/products?category=${encodeURIComponent("ألومنيوم")}`);
            if (relRes.ok) {
              const allAl = await relRes.json();
              if (Array.isArray(allAl)) {
                related = allAl.filter(
                  (p) => isAluminiumProduct(p) && String(p.id) !== String(productData.id) && String(p.code || "") !== String(productData.code || "")
                );
              }
            }
          } catch (e) {
            console.debug("Failed to fetch related aluminium from DB:", e);
          }
        }

        setRelatedProducts(related);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("فشل تحميل بيانات المنتج. يرجى المحاولة مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id, isPopup, navigate]);

  // التنقل بين الصور
  const nextImage = () => {
    setActiveImg((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setActiveImg((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  // عرض حالة التحميل
  if (loading) {
    return <Loader label="جاري تحميل المنتج" />;
  }

  // عرض حالة الخطأ
  if (error || !product) {
    return (
      <div dir="rtl" className="pt-32 pb-20 text-center min-h-screen">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">😅</div>
          <p className="text-gray-500 mb-4">{error || "المنتج غير موجود."}</p>
          <button 
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/products");
              }
            }}
            className="inline-flex items-center gap-2 text-brand-blue font-semibold hover:underline cursor-pointer"
          >
            <ChevronLeft size={16} />
            العودة للكتالوج
          </button>
        </div>
      </div>
    );
  }

  const hasLids = Array.isArray(product.lids) && product.lids.length > 0;
  const hasCode = Boolean(product.code);
  const hasNotes = Boolean(product.notes);
  const tone = materialTone[product.material_name] || materialTone["بلاستيك"];
  
  const isAluminium = isAluminiumProduct(product);

  const displayAluminiumRelated = (relatedProducts.length > 0 ? relatedProducts : sameGroupProducts).filter(
    (p) => String(p.id) !== String(product.id) && String(p.code || "") !== String(product.code || "")
  );

  // الحصول على صور المنتج
  const productImages = product.images && product.images.length > 0 
    ? product.images.map(img => img.url || img) 
    : ['/placeholder-image.jpg'];

  // الحصول على الأغطية بدون الأغطية اليدوية
  const productLids = product.lids && product.lids.length > 0
    ? product.lids.filter(lid => isPopup ? true : (!lid.isManual && !lid.manual && lid.source !== 'manual'))
    : [];

  return (
    <div dir="rtl" className={isPopup ? "bg-[#fafafa]" : "pt-20 min-h-screen bg-[#fafafa]"}>
      {!isPopup && (
        <Helmet>
          <title>{product.name} | مجموعة حكيم الصناعية</title>
          <meta name="description" content={`مواصفات وتفاصيل ${product.name} من مجموعة حكيم الصناعية منذ 1975. الخامة: ${product.material_name || "منتج صناعي"}. ${product.notes || ""}`} />
          {productImages[0] && <meta property="og:image" content={productImages[0]} />}
        </Helmet>
      )}
      {/* Breadcrumb strip */}
      {!isPopup && (
        <div className="border-b border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-1.5 text-xs text-gray-400">
            {isAluminium ? (
              <Link
                to="/aluminium"
                className="hover:text-brand-blue transition-colors font-semibold cursor-pointer"
              >
                كتالوج الألومنيوم
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/products");
                  }
                }}
                className="hover:text-brand-blue transition-colors font-semibold cursor-pointer"
              >
                الكتالوج
              </button>
            )}
            <ChevronLeft size={13} />
            <span className="text-gray-500">{isAluminium ? "قطاعات ألومنيوم" : (product.material_name || 'منتج')}</span>
            <ChevronLeft size={13} />
            <span className="text-gray-700 font-semibold truncate">{product.name}</span>
          </div>
        </div>
      )}

      <section className={isPopup ? "py-4 px-2 sm:px-4" : "py-10 sm:py-14 px-4 sm:px-6 lg:px-8"}>
        <div className="max-w-6xl mx-auto">
          {isAluminium ? (
            /* ===== ALUMIMIUM 3D & 2D VIEW ===== */
            <div>
              {/* Top Section: 3D viewer and 2D image SIDE BY SIDE (equal height cards; stacked on mobile with 3D viewer first) */}
              {product.model_url ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-10">
                  {/* 1. 3D Viewer Card */}
                  <div className="h-[480px] sm:h-[540px] rounded-3xl overflow-hidden border border-slate-800/90 bg-[#0c121e] shadow-xl flex flex-col relative">
                    <Suspense
                      fallback={
                        <div className="h-full flex items-center justify-center bg-[#0c121e] text-slate-400">
                          <Loader label="جاري تشغيل العارض ثلاثي الأبعاد..." />
                        </div>
                      }
                    >
                      <ProductViewer3D
                        modelUrl={product.model_url}
                        productName={product.name || product.code}
                        profileDimensions={{
                          widthMm: product.width_mm,
                          heightMm: product.height_mm,
                          lengthMm: product.length_mm,
                        }}
                        initialFinishId={urlFinish || product.finish_id || product.finish}
                        onDimensionsCalculated={setAutoDimensions}
                      />
                    </Suspense>
                  </div>

                  {/* 2. 2D Image Card (Equal height) */}
                  <div className="h-[480px] sm:h-[540px] rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-sm relative group flex flex-col">
                    <div className="relative flex-1 w-full bg-slate-50 overflow-hidden">
                      <button
                        onClick={() => setZoomed(true)}
                        className="w-full h-full block relative cursor-zoom-in"
                        title="انقر لتكبير الصورة الرسمية"
                      >
                        <img
                          src={productImages[activeImg]}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder-image.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 flex items-center justify-center">
                          <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                            <ZoomIn size={24} className="text-brand-blue" />
                          </div>
                        </div>
                      </button>

                      {/* Badges */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-slate-700 shadow-sm border border-slate-100 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-brand-blue" />
                          صورة هندسية ثنائية الأبعاد (2D)
                        </span>
                      </div>
                      {product.code && (
                        <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-sm text-white text-xs font-mono tracking-wider shadow">
                          {product.code}
                        </span>
                      )}
                    </div>

                    {/* Thumbnails if multiple images */}
                    {productImages.length > 1 && (
                      <div className="flex gap-2.5 p-3.5 bg-white border-t border-slate-100 overflow-x-auto">
                        {productImages.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                              activeImg === i ? "border-brand-blue ring-2 ring-brand-blue/30 scale-105" : "border-slate-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={img} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* If a product has no GLB, show the 2D image full width */
                <div className="max-w-4xl mx-auto mb-10">
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[500px] rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-sm group">
                    <button
                      onClick={() => setZoomed(true)}
                      className="w-full h-full block relative cursor-zoom-in"
                    >
                      <img
                        src={productImages[activeImg]}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder-image.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 flex items-center justify-center">
                        <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                          <ZoomIn size={26} className="text-brand-blue" />
                        </div>
                      </div>
                    </button>
                    {product.code && (
                      <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-sm text-white text-xs font-mono tracking-wider shadow">
                        {product.code}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Product Details & Actions Card below */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm mb-12">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        <Layers size={13} className="text-brand-blue" />
                        قطاع ألومنيوم هندسي
                      </span>
                      {product.model_url && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-brand-blue border border-blue-200/60">
                          <Box size={13} />
                          يدعم العرض التفاعلي 3D
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
                      {product.name}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {product.code && (
                      <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-center sm:text-right">
                        <span className="text-[11px] font-bold text-slate-400 block mb-0.5">كود البروفيل الهندسي</span>
                        <span className="font-mono font-black text-xl text-brand-blue tracking-wide">{product.code}</span>
                      </div>
                    )}
                    {autoDimensions && (
                      <div className="shrink-0 bg-blue-50/70 border border-blue-200/80 rounded-2xl px-5 py-3.5 text-center sm:text-right">
                        <span className="text-[11px] font-bold text-blue-600 block mb-0.5">📐 المقاس التلقائي من الـ 3D</span>
                        <span className="font-mono font-bold text-base text-brand-blue tracking-wide">
                          {autoDimensions.widthMm} × {autoDimensions.heightMm} mm
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes / Description */}
                {product.notes && (
                  <div className="py-6 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">الوصف الهندسي والملاحظات</h3>
                    <p className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                      {product.notes}
                    </p>
                  </div>
                )}

                {/* Actions (Quote Cart & WhatsApp CTA) */}
                <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!isPopup && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(product)}
                      className="relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 bg-gray-900 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-gray-900/20 transition-all group cursor-pointer"
                    >
                      <span className="absolute inset-0 w-full h-full -ml-[100%] group-hover:ml-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-all duration-700 ease-in-out"></span>
                      <ShoppingCart size={22} className="group-hover:animate-bounce" />
                      إضافة لسلة التسعير المجمع
                    </motion.button>
                  )}

                  <motion.a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsappMessage(product, productImages[0])}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2.5 w-full py-4 bg-brand-green/10 text-brand-green font-bold text-base sm:text-lg rounded-2xl border-2 border-brand-green hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
                  >
                    <MessageCircle size={20} />
                    طلب تسعير فوري عبر الواتساب
                  </motion.a>
                </div>
              </div>

              {/* Related Profiles if any */}
              {displayAluminiumRelated.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-6">
                    <Layers size={18} className="text-brand-blue" />
                    <h3 className="text-lg font-extrabold text-slate-800">قطاعات ألومنيوم أخرى</h3>
                    <span className="text-sm text-slate-400 mr-2">({displayAluminiumRelated.length})</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayAluminiumRelated.map((p) => (
                      <Link
                        key={p.id}
                        to={`/products/${p.id}`}
                        className="group rounded-2xl overflow-hidden border border-slate-200/80 bg-white hover:shadow-lg hover:border-brand-blue/40 transition-all flex flex-col h-full"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
                          {p.images && p.images.length > 0 ? (
                            <img
                              src={p.images[0].url || p.images[0]}
                              alt={p.name}
                              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder-image.jpg";
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-50">
                              <span className="text-slate-400 text-sm">لا توجد صورة</span>
                            </div>
                          )}
                          {p.model_url && (
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-blue/90 backdrop-blur-sm text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                              <Box size={12} />
                              3D
                            </span>
                          )}
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <p className="text-sm font-bold text-slate-800 mb-1 line-clamp-1">{p.name}</p>
                          {p.code && (
                            <span className="font-mono text-xs font-semibold text-brand-blue mt-auto">{p.code}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ===== EXISTING PLASTIC / PIPES VIEW ===== */
            <>
              <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-start">
            {/* ===== Gallery ===== */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:sticky lg:top-28"
            >
              {/* الصورة الرئيسية - بنسبة ثابتة 4:3 ومقاس متناسق */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
                <button
                  onClick={() => setZoomed(true)}
                  className="w-full h-full block relative group"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImg}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      src={productImages[activeImg]}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </AnimatePresence>
                  
                  {/* طبقة التكبير */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                      <ZoomIn size={28} className="text-brand-blue" />
                    </div>
                  </div>
                </button>

                {/* أزرار التنقل بين الصور */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={nextImage}
                      className="absolute top-1/2 -translate-y-1/2 left-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                    >
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                    <button
                      onClick={prevImage}
                      className="absolute top-1/2 -translate-y-1/2 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                    >
                      <ChevronLeftIcon size={20} className="text-gray-700" />
                    </button>
                  </>
                )}

                {/* عداد الصور */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-mono">
                  {activeImg + 1} / {productImages.length}
                </div>

                {/* بادجات اضافية */}
                {product.size && (
                  <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-gray-700 shadow-md border border-gray-100">
                    {product.size}
                  </span>
                )}
                {product.code && (
                  <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono tracking-wider">
                    {product.code}
                  </span>
                )}
              </div>

              {/* معرض الصور المصغرة - محسن (تلتف لسطر جديد بدل ما تخرج بره الكونتينر) */}
              {productImages.length > 1 && (
                <div className="flex flex-wrap gap-3 mt-4 px-1">
                  {productImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`relative w-[calc(25%-0.5625rem)] sm:w-24 aspect-square shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-gray-50 ${
                        activeImg === i
                          ? "border-brand-blue shadow-lg scale-105"
                          : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`صورة ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      {activeImg === i && (
                        <div className="absolute inset-0 bg-brand-blue/10 border-2 border-brand-blue rounded-2xl" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ===== Info ===== */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ring-1 ${tone.bg} ${tone.text} ${tone.ring} mb-4`}
              >
                <Layers size={12} />
                خامة {product.material_name || 'غير محدد'}
              </span>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-3">
                {product.name}
              </h1>

              {product.size && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 mb-5">
                  <Ruler size={14} className="text-gray-400" />
                  المقاس: <span className="text-gray-800">{product.size}</span>
                </span>
              )}

              {/* ===== Spec ticket ===== */}
              <div className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden mb-6">
                <div className="absolute top-0 bottom-0 right-[88px] sm:right-28 w-px border-r border-dashed border-gray-200" />

                <div className="flex divide-x divide-x-reverse divide-gray-100">
                  <div className="w-[88px] sm:w-28 shrink-0 p-4 flex flex-col items-center justify-center text-center bg-gray-50/60">
                    <TempIcon temp={product.temp || 'both'} />
                    <span className={`text-xs font-extrabold ${tempInfo(product.temp || 'both').color}`}>
                      {tempInfo(product.temp || 'both').label}
                    </span>
                  </div>

                  <div className="flex-1 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">درجة الاستخدام</span>
                      <span className="text-sm font-bold text-gray-700">
                        {tempInfo(product.temp || 'both').desc}
                      </span>
                    </div>

                    {hasCode && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                          <Hash size={12} />
                          كود المنتج
                        </span>
                        <span className="font-mono font-bold text-gray-800 tracking-wide">
                          {product.code}
                        </span>
                      </div>
                    )}

                    {product.material_category && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                          <Layers size={12} />
                          فئة الخامة
                        </span>
                        <span className="text-sm font-bold text-gray-700">
                          {product.material_category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== Lids ===== */}
              {hasLids && (
                <div className="mb-6">
                  <h3 className="text-sm font-extrabold text-gray-800 mb-3">
                    الأغطية المتوافقة مع هذا المنتج
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {productLids.map((lid, i) => {
                      const lidName = typeof lid === 'object' ? (lid.name || lid) : lid;
                      const lidImage = typeof lid === 'object' ? lid.thumbnail : null;
                      const lidId = typeof lid === 'object' && !lid.isManual && lid.id ? lid.id : null;
                      
                      const isLidManual = typeof lid === 'object' && (lid.isManual || lid.manual || lid.source === 'manual');
                      const innerContent = (
                        <>
                          {lidImage ? (
                            <div className="relative w-20 sm:w-24 aspect-square shrink-0 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                              <img 
                                src={lidImage} 
                                alt={lidName} 
                                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                              <span className="w-2.5 h-2.5 rounded-full bg-brand-green" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-center">
                            <span className="font-bold text-gray-800 text-sm sm:text-base leading-tight" title={lidName}>{lidName}</span>
                            {isLidManual && (
                              <span className="text-[10px] text-orange-500 font-bold mt-1 bg-orange-50 w-fit px-1.5 py-0.5 rounded">غطاء يدوي</span>
                            )}
                          </div>
                        </>
                      );
                      
                      const wrapperClass = "flex items-center gap-3.5 rounded-xl border border-gray-100 bg-white p-2.5 hover:shadow-md hover:border-brand-blue/30 hover:-translate-y-0.5 transition-all group";

                      return lidId ? (
                        <Link key={i} to={`/products/${lidId}`} className={wrapperClass}>
                          {innerContent}
                        </Link>
                      ) : (
                        <div key={i} className={wrapperClass}>
                          {innerContent}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===== Notes ===== */}
              {hasNotes && (
                <div className="mb-7 border-r-2 border-brand-green/40 bg-green-50/40 rounded-l-xl px-4 py-3.5 text-sm text-gray-600 leading-relaxed">
                  {product.notes}
                </div>
              )}

              <div className="flex flex-col gap-3 mt-8">
                {/* Add to Quote Button (Primary) */}
                {!isPopup && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                    className="relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 bg-gray-900 text-white font-black text-lg rounded-2xl shadow-xl shadow-gray-900/30 transition-all group"
                  >
                    <span className="absolute inset-0 w-full h-full -ml-[100%] group-hover:ml-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-all duration-700 ease-in-out"></span>
                    <ShoppingCart size={24} className="group-hover:animate-bounce" />
                    إضافة لسلة التسعير المجمع
                  </motion.button>
                )}

                <motion.a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsappMessage(product, productImages[0])}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-brand-green/10 text-brand-green font-bold rounded-2xl border-2 border-brand-green hover:bg-brand-green hover:text-white transition-colors"
                >
                  <MessageCircle size={18} />
                  طلب تسعير فوري للقطعة عبر الواتساب
                </motion.a>
              </div>
            </motion.div>
          </div>

          {/* ===== أصناف مشابهة (تم التعديل هنا) ===== */}
          {sameGroupProducts.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <Layers size={18} className="text-brand-blue" />
                <h3 className="text-lg font-extrabold text-gray-800">أصناف مشابهة</h3>
                <span className="text-sm text-gray-400 mr-2">({sameGroupProducts.length})</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {sameGroupProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="group rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg hover:border-brand-blue/30 transition-all flex flex-col h-full"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
                      {p.images && p.images.length > 0 ? (
                        <img
                          src={p.images[0].url || p.images[0]}
                          alt={p.name}
                          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400 text-sm">لا توجد صورة</span>
                        </div>
                      )}
                      {p.size && (
                        <span className="absolute top-2.5 left-2.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-gray-700 shadow-md border border-gray-100">
                          {p.size}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      {/* عرض اسم المنتج بدلاً من المقاس */}
                      <p className="text-sm font-bold text-gray-800 mb-1 line-clamp-1">{p.name}</p>
                      {p.code && (
                        <span className="font-mono text-[10px] text-gray-400 mt-auto">{p.code}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ===== Related products ===== */}
          {relatedProducts.length > 0 && (
            <div className={sameGroupProducts.length > 0 ? "mt-12" : "mt-16 pt-10 border-t border-gray-100"}>
              <h3 className="text-lg font-extrabold text-gray-800 mb-5">
                منتجات أخرى من {product.material_name || 'نفس الخامة'}
              </h3>
              <div className="grid sm:grid-cols-3 gap-5">
                {relatedProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="group rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg transition-shadow flex flex-col h-full"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
                      {p.images && p.images.length > 0 ? (
                        <img
                          src={p.images[0].url || p.images[0]}
                          alt={p.name}
                          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400 text-sm">لا توجد صورة</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{p.name}</p>
                      <span className={`inline-flex items-center gap-1 mt-auto pt-1 text-[11px] font-bold ${tempInfo(p.temp || 'both').color}`}>
                        {p.temp === "both" ? (
                          <span className="flex items-center -space-x-0.5 -space-x-reverse">
                            <Flame size={11} className="text-orange-500" />
                            <Snowflake size={11} className="text-sky-500" />
                          </span>
                        ) : p.temp === "hot" ? (
                          <Flame size={11} />
                        ) : (
                          <Snowflake size={11} />
                        )}
                        {tempInfo(p.temp || 'both').label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </section>

      {/* ===== Lightbox ===== */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setZoomed(false)}
              className="absolute top-6 left-6 text-white/80 hover:text-white p-2 bg-white/10 rounded-full transition-all hover:bg-white/20"
            >
              <X size={24} />
            </button>
            
            {/* أزرار التنقل في وضع التكبير */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all hover:scale-110"
                >
                  <ChevronRight size={28} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all hover:scale-110"
                >
                  <ChevronLeftIcon size={28} />
                </button>
              </>
            )}

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              src={productImages[activeImg]}
              alt={product.name}
              className="max-w-[95%] max-h-[90vh] rounded-xl object-contain cursor-default shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.jpg';
              }}
            />

            {/* عداد الصور في وضع التكبير */}
            {productImages.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-mono">
                {activeImg + 1} / {productImages.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}