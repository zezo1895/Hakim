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

// âš ï¸ ØºÙŠÙ‘Ø± Ø§Ù„Ø±Ù‚Ù… Ø¯Ù‡ Ø¨Ø±Ù‚Ù… Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ø¨ØªØ§Ø¹ Ø§Ù„Ø´Ø±ÙƒØ© (Ø¨ØµÙŠØºØ© Ø¯ÙˆÙ„ÙŠØ© Ø¨Ø¯ÙˆÙ† + Ø£Ùˆ Ø£ØµÙØ§Ø± ÙÙŠ Ø§Ù„Ø£ÙˆÙ„)
// Ù…Ø«Ø§Ù„ Ù„Ù…ØµØ±: 201001234567
const WHATSAPP_NUMBER = "201144505575";

// Ø¨Ù†Ø§Ø¡ Ø±Ø³Ø§Ù„Ø© ØªÙØµÙŠÙ„ÙŠØ© ÙƒØ§Ù…Ù„Ø© Ø¹Ù† Ø§Ù„Ù…Ù†ØªØ¬ (Ø§Ù„Ø§Ø³Ù…ØŒ Ø§Ù„ÙƒÙˆØ¯ØŒ Ø§Ù„Ø®Ø§Ù…Ø©ØŒ Ø§Ù„Ù†ÙˆØ¹ØŒ Ø§Ù„Ù…Ù‚Ø§Ø³ØŒ Ø§Ù„Ø­Ø±Ø§Ø±Ø©ØŒ Ø±Ø§Ø¨Ø· Ø§Ù„ØµÙˆØ±Ø©ØŒ ÙˆØ±Ø§Ø¨Ø· ØµÙØ­Ø© Ø§Ù„Ù…Ù†ØªØ¬)
function buildWhatsappMessage(product, imageUrl) {
  const lines = [
    "Ù…Ø±Ø­Ø¨Ø§Ù‹ØŒ Ø£Ø±ÙŠØ¯ Ø·Ù„Ø¨ ØªØ³Ø¹ÙŠØ± Ù„Ù„Ù…Ù†ØªØ¬ Ø§Ù„ØªØ§Ù„ÙŠ:",
    "",
    `ðŸ“¦ *Ø§Ù„Ø§Ø³Ù…:* ${product.name}`,
  ];

  if (product.code) lines.push(`ðŸ”– *Ø§Ù„ÙƒÙˆØ¯:* ${product.code}`);
  if (product.material_name) lines.push(`ðŸ§± *Ø§Ù„Ø®Ø§Ù…Ø©:* ${product.material_name}`);
  if (product.type_name) lines.push(`ðŸ·ï¸ *Ø§Ù„Ù†ÙˆØ¹:* ${product.type_name}`);
  if (product.size) lines.push(`ðŸ“ *Ø§Ù„Ù…Ù‚Ø§Ø³:* ${product.size}`);
  if (product.temp) {
    const tempLabel = product.temp === "both" ? "Ø³Ø§Ø®Ù† ÙˆØ¨Ø§Ø±Ø¯" : product.temp === "hot" ? "Ø³Ø§Ø®Ù†" : "Ø¨Ø§Ø±Ø¯";
    lines.push(`ðŸŒ¡ï¸ *ÙŠØªØ­Ù…Ù„:* ${tempLabel}`);
  }

  lines.push("");
  lines.push(`ðŸ”— *Ø±Ø§Ø¨Ø· Ø§Ù„Ù…Ù†ØªØ¬:* ${window.location.href}`);

  if (imageUrl) {
    lines.push(`ðŸ–¼ï¸ *ØµÙˆØ±Ø© Ø§Ù„Ù…Ù†ØªØ¬:* ${imageUrl}`);
  }

  return encodeURIComponent(lines.join("\n"));
}

const materialTone = {
  "Ø¨Ù„Ø§Ø³ØªÙŠÙƒ": { text: "text-sky-700", bg: "bg-sky-50", ring: "ring-sky-200" },
  "ÙƒØ±ØªÙˆÙ†":   { text: "text-amber-800", bg: "bg-amber-50", ring: "ring-amber-200" },
  "ÙÙˆÙ…":     { text: "text-violet-700", bg: "bg-violet-50", ring: "ring-violet-200" },
};

// Ù†Øµ ÙˆÙ„ÙˆÙ† ÙˆÙˆØµÙ Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø©: Ø³Ø§Ø®Ù† / Ø¨Ø§Ø±Ø¯ / ÙŠØªØ­Ù…Ù„ Ø§Ù„Ø§ØªÙ†ÙŠÙ†
function tempInfo(temp) {
  if (temp === "both") {
    return {
      label: "Ø³Ø§Ø®Ù† ÙˆØ¨Ø§Ø±Ø¯",
      desc: "ÙŠØªØ­Ù…Ù„ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø³Ø§Ø®Ù† ÙˆØ§Ù„Ø¨Ø§Ø±Ø¯ Ù…Ø¹Ø§Ù‹",
      color: "text-emerald-600",
    };
  }
  if (temp === "hot") {
    return { label: "Ø³Ø§Ø®Ù†", desc: "ÙŠØªØ­Ù…Ù„ Ø§Ù„Ø­Ø±Ø§Ø±Ø© Ø§Ù„Ø¹Ø§Ù„ÙŠØ©", color: "text-orange-600" };
  }
  return { label: "Ø¨Ø§Ø±Ø¯", desc: "Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¨Ø§Ø±Ø¯ ÙˆØ§Ù„Ù…Ø¨Ø±Ø¯", color: "text-sky-600" };
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

  // Ø¬Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù†ØªØ¬ ÙˆØ§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ø¬Ù„Ø¨ Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ø­Ø§Ù„ÙŠ
        const productResponse = await fetch(`${API}/products/${id}`);
        if (!productResponse.ok) {
          throw new Error(`Failed to fetch product: ${productResponse.status}`);
        }
        const productData = await productResponse.json();
        setProduct(productData);

        // Ø¬Ù„Ø¨ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù„Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©
        const allProductsResponse = await fetch(`${API}/products`);
        if (!allProductsResponse.ok) {
          throw new Error(`Failed to fetch all products: ${allProductsResponse.status}`);
        }
        const allProducts = await allProductsResponse.json();

        if (Array.isArray(allProducts)) {
          // Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù…Ù† Ù†ÙØ³ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© (Ù†ÙØ³ Ø§Ù„Ù…Ù‚Ø§Ø³Ø§Øª Ø§Ù„Ù…Ø®ØªÙ„ÙØ©)
          const sameGroup = allProducts.filter(
            (p) => 
              p.group_id === productData.group_id && 
              p.id !== productData.id &&
              p.group_id !== null &&
              p.group_id !== ""
          );
          setSameGroupProducts(sameGroup);

          // Ù…Ù†ØªØ¬Ø§Øª Ù…Ù† Ù†ÙØ³ Ø§Ù„Ø®Ø§Ù…Ø© (Ø¨Ø§Ø³ØªØ«Ù†Ø§Ø¡ Ù†ÙØ³ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©)
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
        setError("ÙØ´Ù„ ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù†ØªØ¬. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id]);

  // Ø§Ù„ØªÙ†Ù‚Ù„ Ø¨ÙŠÙ† Ø§Ù„ØµÙˆØ±
  const nextImage = () => {
    setActiveImg((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setActiveImg((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  // Ø¹Ø±Ø¶ Ø­Ø§Ù„Ø© Ø§Ù„ØªØ­Ù…ÙŠÙ„
  if (loading) {
    return <Loader label="Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬" />;
  }

  // Ø¹Ø±Ø¶ Ø­Ø§Ù„Ø© Ø§Ù„Ø®Ø·Ø£
  if (error || !product) {
    return (
      <div dir="rtl" className="pt-32 pb-20 text-center min-h-screen">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">ðŸ˜…</div>
          <p className="text-gray-500 mb-4">{error || "Ø§Ù„Ù…Ù†ØªØ¬ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯."}</p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-brand-blue font-semibold hover:underline"
          >
            <ChevronLeft size={16} />
            Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„ÙƒØªØ§Ù„ÙˆØ¬
          </Link>
        </div>
      </div>
    );
  }

  // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ø£ØºØ·ÙŠØ© Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© ÙÙ‚Ø·
  const productLids = product.lids && product.lids.length > 0
    ? product.lids.filter(lid => !lid.isManual && !lid.manual && lid.source !== 'manual')
    : [];

  const hasLids = productLids.length > 0;
  const hasCode = Boolean(product.code);
  const hasNotes = Boolean(product.notes);
  const tone = materialTone[product.material_name] || materialTone['بلاستيك'];
  const productImages = product.images && product.images.length > 0 ? product.images.map(img => img.url || img) : ['/placeholder-image.jpg'];

  return (
    <div dir="rtl" className="pt-20 min-h-screen bg-[#fafafa]">
      {/* Breadcrumb strip */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/products" className="hover:text-brand-blue transition-colors font-semibold">
            Ø§Ù„ÙƒØªØ§Ù„ÙˆØ¬
          </Link>
          <ChevronLeft size={13} />
          <span className="text-gray-500">{product.material_name || 'Ù…Ù†ØªØ¬'}</span>
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
              {/* Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© - Ù…Ø­Ø³Ù†Ø© Ù„Ù„Ø¹Ø±Ø¶ Ø§Ù„ÙƒØ§Ù…Ù„ */}
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
                  
                  {/* Ø·Ø¨Ù‚Ø© Ø§Ù„ØªÙƒØ¨ÙŠØ± */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                      <ZoomIn size={28} className="text-brand-blue" />
                    </div>
                  </div>
                </button>

                {/* Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„ Ø¨ÙŠÙ† Ø§Ù„ØµÙˆØ± */}
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

                {/* Ø¹Ø¯Ø§Ø¯ Ø§Ù„ØµÙˆØ± */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-mono">
                  {activeImg + 1} / {productImages.length}
                </div>

                {/* Ø¨Ø§Ø¯Ø¬Ø§Øª Ø§Ø¶Ø§ÙÙŠØ© */}
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

              {/* Ù…Ø¹Ø±Ø¶ Ø§Ù„ØµÙˆØ± Ø§Ù„Ù…ØµØºØ±Ø© - Ù…Ø­Ø³Ù† (ØªÙ„ØªÙ Ù„Ø³Ø·Ø± Ø¬Ø¯ÙŠØ¯ Ø¨Ø¯Ù„ Ù…Ø§ ØªØ®Ø±Ø¬ Ø¨Ø±Ù‡ Ø§Ù„ÙƒÙˆÙ†ØªÙŠÙ†Ø±) */}
              {productImages.length > 1 && (
                <div className="flex flex-wrap gap-3 mt-4 px-1">
                  {productImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`relative w-[calc(25%-0.5625rem)] sm:w-24 aspect-square shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                        activeImg === i
                          ? "border-brand-blue shadow-lg scale-105"
                          : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`ØµÙˆØ±Ø© ${i + 1}`}
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
                Ø®Ø§Ù…Ø© {product.material_name || 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯'}
              </span>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-3">
                {product.name}
              </h1>

              {product.size && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 mb-5">
                  <Ruler size={14} className="text-gray-400" />
                  Ø§Ù„Ù…Ù‚Ø§Ø³: <span className="text-gray-800">{product.size}</span>
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
                      <span className="text-xs text-gray-400">Ø¯Ø±Ø¬Ø© Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…</span>
                      <span className="text-sm font-bold text-gray-700">
                        {tempInfo(product.temp || 'both').desc}
                      </span>
                    </div>

                    {hasCode && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                          <Hash size={12} />
                          ÙƒÙˆØ¯ Ø§Ù„Ù…Ù†ØªØ¬
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
                          ÙØ¦Ø© Ø§Ù„Ø®Ø§Ù…Ø©
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
                    Ø§Ù„Ø£ØºØ·ÙŠØ© Ø§Ù„Ù…ØªÙˆØ§ÙÙ‚Ø© Ù…Ø¹ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {productLids.map((lid, i) => {
                      const lidName = typeof lid === 'object' ? (lid.name || lid) : lid;
                      const lidImage = typeof lid === 'object' ? lid.thumbnail : null;
                      const lidId = typeof lid === 'object' && !lid.isManual && lid.id ? lid.id : null;
                      
                      const innerContent = (
                        <>
                          {lidImage ? (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden p-2 flex items-center justify-center group-hover:bg-white transition-colors">
                              <img 
                                src={lidImage} 
                                alt={lidName} 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
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
                          <span className="flex-1 font-bold text-gray-800 text-sm sm:text-base leading-tight" title={lidName}>{lidName}</span>
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

              <motion.a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsappMessage(product, productImages[0])}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2.5 w-full py-4 bg-brand-green text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(45,122,58,0.25)] hover:opacity-95 transition-opacity"
              >
                <MessageCircle size={18} />
                Ø·Ù„Ø¨ ØªØ³Ø¹ÙŠØ± Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ Ø¹Ø¨Ø± Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨
              </motion.a>
            </motion.div>
          </div>

          {/* ===== Ø£ØµÙ†Ø§Ù Ù…Ø´Ø§Ø¨Ù‡Ø© (ØªÙ… Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ù‡Ù†Ø§) ===== */}
          {sameGroupProducts.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <Layers size={18} className="text-brand-blue" />
                <h3 className="text-lg font-extrabold text-gray-800">Ø£ØµÙ†Ø§Ù Ù…Ø´Ø§Ø¨Ù‡Ø©</h3>
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
                          <span className="text-gray-400 text-sm">Ù„Ø§ ØªÙˆØ¬Ø¯ ØµÙˆØ±Ø©</span>
                        </div>
                      )}
                      {p.size && (
                        <span className="absolute top-2.5 left-2.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-gray-700 shadow-md border border-gray-100">
                          {p.size}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      {/* Ø¹Ø±Ø¶ Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬ Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø§Ù„Ù…Ù‚Ø§Ø³ */}
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
                Ù…Ù†ØªØ¬Ø§Øª Ø£Ø®Ø±Ù‰ Ù…Ù† {product.material_name || 'Ù†ÙØ³ Ø§Ù„Ø®Ø§Ù…Ø©'}
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
                          <span className="text-gray-400 text-sm">Ù„Ø§ ØªÙˆØ¬Ø¯ ØµÙˆØ±Ø©</span>
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
            
            {/* Ø£Ø²Ø±Ø§Ø± Ø§Ù„ØªÙ†Ù‚Ù„ ÙÙŠ ÙˆØ¶Ø¹ Ø§Ù„ØªÙƒØ¨ÙŠØ± */}
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

            {/* Ø¹Ø¯Ø§Ø¯ Ø§Ù„ØµÙˆØ± ÙÙŠ ÙˆØ¶Ø¹ Ø§Ù„ØªÙƒØ¨ÙŠØ± */}
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
