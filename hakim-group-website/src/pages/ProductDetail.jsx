// src/pages/ProductDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import Loader from "../components/Loader";

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

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [sameGroupProducts, setSameGroupProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  // جلب بيانات المنتج والمنتجات المرتبطة
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // جلب المنتج الحالي
        const productResponse = await fetch(`${API}/products/${id}`);
        if (!productResponse.ok) {
          throw new Error(`Failed to fetch product: ${productResponse.status}`);
        }
        const productData = await productResponse.json();
        setProduct(productData);

        // جلب جميع المنتجات للعثور على المنتجات المرتبطة
        const allProductsResponse = await fetch(`${API}/products`);
        if (!allProductsResponse.ok) {
          throw new Error(`Failed to fetch all products: ${allProductsResponse.status}`);
        }
        const allProducts = await allProductsResponse.json();

        if (Array.isArray(allProducts)) {
          // المنتجات من نفس المجموعة (نفس المقاسات المختلفة)
          const sameGroup = allProducts.filter(
            (p) => 
              p.group_id === productData.group_id && 
              p.id !== productData.id &&
              p.group_id !== null &&
              p.group_id !== ""
          );
          setSameGroupProducts(sameGroup);

          // منتجات من نفس الخامة (باستثناء نفس المجموعة)
          const sameMaterial = allProducts
            .filter(
              (p) => 
                p.material_id === productData.material_id && 
                p.id !== productData.id &&
                !sameGroup.some(g => g.id === p.id)
            )
            .slice(0, 3);
          setRelatedProducts(sameMaterial);
        }
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
  }, [id]);

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
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-brand-blue font-semibold hover:underline"
          >
            <ChevronLeft size={16} />
            العودة للكتالوج
          </Link>
        </div>
      </div>
    );
  }

  const hasLids = Array.isArray(product.lids) && product.lids.length > 0;
  const hasCode = Boolean(product.code);
  const hasNotes = Boolean(product.notes);
  const tone = materialTone[product.material_name] || materialTone["بلاستيك"];
  
  // الحصول على صور المنتج
  const productImages = product.images && product.images.length > 0 
    ? product.images.map(img => img.url || img) 
    : ['/placeholder-image.jpg'];

  // الحصول على أسماء الأغطية
  const lidNames = product.lids && product.lids.length > 0
    ? product.lids.map(lid => lid.name || lid)
    : [];

  return (
    <div dir="rtl" className="pt-20 min-h-screen bg-[#fafafa]">
      {/* Breadcrumb strip */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/products" className="hover:text-brand-blue transition-colors font-semibold">
            الكتالوج
          </Link>
          <ChevronLeft size={13} />
          <span className="text-gray-500">{product.material_name || 'منتج'}</span>
          <ChevronLeft size={13} />
          <span className="text-gray-700 font-semibold truncate">{product.name}</span>
        </div>
      </div>

      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-start">
            {/* ===== Gallery ===== */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:sticky lg:top-28"
            >
              {/* الصورة الرئيسية - محسنة للعرض الكامل */}
              <div className="relative w-full rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.05)] h-96 sm:h-[30rem] lg:h-[32rem]">
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
                      className="w-full h-full object-contain bg-white p-2"
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

              {/* معرض الصور المصغرة - محسن */}
              {productImages.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 px-1">
                  {productImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                        activeImg === i
                          ? "border-brand-blue shadow-lg scale-105"
                          : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`صورة ${i + 1}`}
                        className="w-full h-full object-cover"
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
                    {lidNames.map((lid, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3.5 py-3 text-sm text-gray-700 font-medium"
                      >
                        <span className="w-2 h-2 rounded-full bg-brand-green shrink-0" />
                        {lid}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== Notes ===== */}
              {hasNotes && (
                <div className="mb-7 border-r-2 border-brand-green/40 bg-green-50/40 rounded-l-xl px-4 py-3.5 text-sm text-gray-600 leading-relaxed">
                  {product.notes}
                </div>
              )}

              <motion.a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsappMessage(product, productImages[0])}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2.5 w-full py-4 bg-brand-green text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(45,122,58,0.25)] hover:opacity-95 transition-opacity"
              >
                <MessageCircle size={18} />
                طلب تسعير هذا المنتج عبر الواتساب
              </motion.a>
            </motion.div>
          </div>

          {/* ===== أصناف مشابهة ===== */}
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
                    className="group rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg hover:border-brand-blue/30 transition-all"
                  >
                    <div className="h-48 overflow-hidden bg-gray-100 relative">
                      {p.images && p.images.length > 0 ? (
                        <img
                          src={p.images[0].url || p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-contain bg-white p-2 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400 text-sm">لا توجد صورة</span>
                        </div>
                      )}
                      {p.size && (
                        <span className="absolute top-2.5 left-2.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-gray-700 shadow-md border border-gray-100">
                          {p.size}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-bold text-gray-800 mb-1 line-clamp-1">{p.name}</p>
                      {p.code && (
                        <span className="font-mono text-[10px] text-gray-400">{p.code}</span>
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
                    className="group rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 overflow-hidden bg-gray-100">
                      {p.images && p.images.length > 0 ? (
                        <img
                          src={p.images[0].url || p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-contain bg-white p-2 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400 text-sm">لا توجد صورة</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-bold text-gray-800">{p.name}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 text-[11px] font-bold ${tempInfo(p.temp || 'both').color}`}>
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