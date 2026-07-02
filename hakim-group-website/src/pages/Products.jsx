// src/pages/Products.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, Layers, Tag as TagIcon, ChevronLeft, ZoomIn, Search, X } from "lucide-react";
import Loader from "../components/Loader";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// حالة الحرارة: ساخن / بارد / يتحمل الاتنين
function TempBadge({ temp }) {
  if (temp === "both") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
        <span className="inline-flex items-center -space-x-1 -space-x-reverse">
          <Flame size={13} className="text-orange-500" />
          <Snowflake size={13} className="text-sky-500" />
        </span>
        ساخن وبارد
      </span>
    );
  }
  const isHot = temp === "hot";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${isHot ? "text-orange-600" : "text-sky-600"}`}>
      {isHot ? <Flame size={14} /> : <Snowflake size={14} />}
      {isHot ? "ساخن" : "بارد"}
    </span>
  );
}

function FilterRow({ label, options, active, onChange }) {
  return (
    <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap mb-4">
      <span className="text-xs font-bold text-gray-400 pt-2 shrink-0 w-16">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map((c) => (
          <motion.button
            key={c}
            onClick={() => onChange(c)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              active === c
                ? "bg-brand-blue text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-brand-blue hover:text-brand-blue"
            }`}
          >
            {c}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // الفلاتر
  const [activeMaterial, setActiveMaterial] = useState("الكل");
  const [activeType, setActiveType] = useState("الكل");
  const [searchTerm, setSearchTerm] = useState("");
  
  // قوائم الخامات والأنواع المستخرجة من البيانات
  const [materialsList, setMaterialsList] = useState(["الكل"]);
  const [typesList, setTypesList] = useState(["الكل"]);

  // جلب المنتجات من قاعدة البيانات
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API}/products`);
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
        
        // استخراج قوائم الخامات والأنواع الفريدة
        if (Array.isArray(data) && data.length > 0) {
          const materials = [...new Set(data.map(p => p.material_name).filter(Boolean))];
          const types = [...new Set(data.map(p => p.type_name).filter(Boolean))];
          setMaterialsList(["الكل", ...materials]);
          setTypesList(["الكل", ...types]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("فشل تحميل المنتجات. يرجى المحاولة مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // تصفية المنتجات
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (activeMaterial === "الكل" || p.material_name === activeMaterial) &&
      (activeType === "الكل" || p.type_name === activeType) &&
      (normalizedSearch === "" ||
        p.name?.toLowerCase().includes(normalizedSearch) ||
        p.code?.toLowerCase().includes(normalizedSearch))
  );

  // عرض حالة التحميل
  if (loading) {
    return <Loader label="جاري تحميل المنتجات" />;
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <div dir="rtl" className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😅</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">عذراً!</h3>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-brand-blue text-white rounded-xl hover:opacity-90 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="pt-20 min-h-screen bg-gray-50">
      <section className="bg-brand-blue text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-bold mb-4">
            الكتالوج الرقمي
          </span>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">كتالوج المنتجات</h1>
          <p className="text-blue-200 text-sm sm:text-base">
            تصفح منتجاتنا من البلاستيك والكرتون والفوم بالأنواع والمقاسات والمواصفات الكاملة
          </p>
          <p className="text-blue-300 text-xs mt-2">
            {products.length} منتج متاح
          </p>
        </div>
      </section>

      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search box */}
          <div className="relative mb-5">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المنتج أو الكود..."
              className="w-full bg-white border border-gray-200 rounded-2xl py-3 pr-11 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400 hover:text-gray-600"
                aria-label="مسح البحث"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 mb-8">
            <FilterRow 
              label="الخامة" 
              options={materialsList} 
              active={activeMaterial} 
              onChange={setActiveMaterial} 
            />
            <FilterRow 
              label="النوع" 
              options={typesList} 
              active={activeType} 
              onChange={setActiveType} 
            />
            
            {/* عرض عدد النتائج */}
            <div className="text-xs text-gray-400 mt-2">
              {filtered.length} منتج {activeMaterial !== "الكل" && `من ${activeMaterial}`} {activeType !== "الكل" && `من نوع ${activeType}`}
            </div>
          </div>

          {/* Product grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
                  className="card overflow-hidden flex flex-col bg-white"
                >
                  <Link to={`/products/${p.id}`} className="flex flex-col flex-1">
                    {/* تحسين عرض الصورة - جعلها أكبر وأوضح */}
                    <div className="h-64 sm:h-72 md:h-80 overflow-hidden bg-gray-100 relative group">
                      {p.images && p.images.length > 0 ? (
                        <>
                          <img
                            src={p.images[0].url || p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 bg-white"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                          {/* أيقونة التكبير */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                              <ZoomIn size={24} className="text-brand-blue" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400 text-sm">لا توجد صورة</span>
                        </div>
                      )}
                      
                      {/* تحسين ظهور البادجات */}
                      {p.size && (
                        <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-gray-700 shadow-md border border-gray-100">
                          {p.size}
                        </span>
                      )}
                      {p.code && (
                        <span className="absolute bottom-3 right-3 px-3 py-1 rounded bg-black/70 text-white text-[10px] font-mono tracking-wider">
                          {p.code}
                        </span>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                        {p.material_name && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-blue text-[11px] font-semibold">
                            <Layers size={10} />
                            {p.material_name}
                          </span>
                        )}
                        {p.type_name && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">
                            <TagIcon size={10} />
                            {p.type_name}
                          </span>
                        )}
                        {p.material_category && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-semibold">
                            {p.material_category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-gray-800 font-bold text-sm mb-2 line-clamp-2">{p.name}</h3>

                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                        <TempBadge temp={p.temp || "both"} />
                        <span className="flex items-center gap-1 text-xs font-semibold text-brand-green hover:text-brand-blue transition-colors">
                          التفاصيل
                          <ChevronLeft size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-400 text-sm">
                {searchTerm
                  ? `لا توجد نتائج مطابقة لـ "${searchTerm}"`
                  : "لا توجد منتجات في هذا التصنيف حالياً."}
              </p>
              <button 
                onClick={() => {
                  setActiveMaterial("الكل");
                  setActiveType("الكل");
                  setSearchTerm("");
                }}
                className="mt-4 text-brand-blue text-sm font-bold hover:underline"
              >
                عرض جميع المنتجات
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}