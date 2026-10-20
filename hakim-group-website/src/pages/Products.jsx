// src/pages/Products.jsx
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, Layers, Tag as TagIcon, ChevronLeft, ChevronRight, ZoomIn, Search, X } from "lucide-react";
import Loader from "../components/Loader";
import { getCachedProducts } from "../services/productCache";
import { isAluminiumProduct } from "./AluminiumCatalog";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ITEMS_PER_PAGE = 21;

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

function FilterRow({ label, options, active, onChange, displayMapper }) {
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
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              active === c
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-brand-blue hover:text-brand-blue"
            }`}
          >
            {displayMapper ? displayMapper(c) : c}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// شريط الترقيم (Pagination)
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // نحدد أي أرقام نعرضها (نتجنب عرض 50 رقم لو الصفحات كتير جدًا)
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 mt-10 flex-wrap" dir="ltr">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-brand-blue hover:text-brand-blue transition-all"
        aria-label="السابق"
      >
        <ChevronRight size={16} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:border-brand-blue hover:text-brand-blue transition-all"
          >
            1
          </button>
          {start > 2 && <span className="text-gray-300 px-1">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
            p === currentPage
              ? "bg-brand-blue text-white shadow"
              : "border border-gray-200 text-gray-600 hover:border-brand-blue hover:text-brand-blue"
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-300 px-1">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:border-brand-blue hover:text-brand-blue transition-all"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-brand-blue hover:text-brand-blue transition-all"
        aria-label="التالي"
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // قراءة القطاع والفلاتر ورقم الصفحة من الرابط أو من sessionStorage لحفظ مكان المستخدم بدقة عند الرجوع
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialState = () => {
    let saved = {};
    try {
      saved = JSON.parse(sessionStorage.getItem("hakim_catalog_state") || "{}");
    } catch (e) {}

    const urlCat = searchParams.get("category");
    const urlPage = parseInt(searchParams.get("page"), 10);
    const urlMat = searchParams.get("material");
    const urlType = searchParams.get("type");
    const urlQuery = searchParams.get("q");

    return {
      category: urlCat !== null ? urlCat : "الكل",
      page: urlPage && !isNaN(urlPage) && urlPage > 0 ? urlPage : (saved.page || 1),
      material: urlMat !== null ? urlMat : (saved.material || "الكل"),
      type: urlType !== null ? urlType : (saved.type || "الكل"),
      search: urlQuery !== null ? urlQuery : (saved.search || ""),
    };
  };

  const [initial] = useState(getInitialState);
  const [activeCategory, setActiveCategory] = useState(initial.category);
  const [activeMaterial, setActiveMaterial] = useState(initial.material);
  const [activeType, setActiveType] = useState(initial.type);
  const [searchTerm, setSearchTerm] = useState(initial.search);
  const [currentPage, setCurrentPage] = useState(initial.page);

  // قوائم الفئات والخامات والأنواع المستخرجة من البيانات
  const [categoriesList, setCategoriesList] = useState(["الكل"]);
  const [materialsList, setMaterialsList] = useState(["الكل"]);
  const [typesList, setTypesList] = useState(["الكل"]);
  
  const getMaterialLabel = (mat) => {
    if (mat === "الكل") return "الكل";
    if (mat.toUpperCase() === "PP") return "من -20°C إلى 120°C";
    if (mat.toUpperCase() === "PET") return "من -40°C إلى 70°C";
    if (mat.toUpperCase() === "PS") return "من -10°C إلى 85°C";
    return mat; 
  };

  // مزامنة الحالة مع عنوان الرابط ومع الذاكرة المؤقتة للجلسة (sessionStorage)
  const syncStateToUrl = (newCat, newMat, newType, newSearch, newPage) => {
    const params = {};
    if (newCat && newCat !== "الكل") params.category = newCat;
    if (newMat && newMat !== "الكل") params.material = newMat;
    if (newType && newType !== "الكل") params.type = newType;
    if (newSearch && newSearch.trim()) params.q = newSearch.trim();
    if (newPage && newPage > 1) params.page = String(newPage);

    setSearchParams(params, { replace: true });

    try {
      sessionStorage.setItem(
        "hakim_catalog_state",
        JSON.stringify({
          category: newCat,
          material: newMat,
          type: newType,
          search: newSearch,
          page: newPage,
        })
      );
    } catch (e) {}
  };

  // تغيير الفلاتر يعيد الصفحة للأولى تلقائياً ويحدّث الرابط
  const handleCategoryChange = (c) => {
    setActiveCategory(c);
    setCurrentPage(1);
    syncStateToUrl(c, activeMaterial, activeType, searchTerm, 1);
  };

  const handleMaterialChange = (m) => {
    setActiveMaterial(m);
    setCurrentPage(1);
    syncStateToUrl(activeCategory, m, activeType, searchTerm, 1);
  };

  const handleTypeChange = (t) => {
    setActiveType(t);
    setCurrentPage(1);
    syncStateToUrl(activeCategory, activeMaterial, t, searchTerm, 1);
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
    syncStateToUrl(activeCategory, activeMaterial, activeType, val, 1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    syncStateToUrl(activeCategory, activeMaterial, activeType, searchTerm, page);
    document.getElementById("products-grid-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // لو الرابط اتغير من الخارج (مثلاً الضغط على رابط قطاع من الهيرو)
  const categoryFromUrl = searchParams.get("category");
  useEffect(() => {
    const targetCat = categoryFromUrl || "الكل";
    if (targetCat !== activeCategory) {
      setActiveCategory(targetCat);
      setCurrentPage(1);
      syncStateToUrl(targetCat, activeMaterial, activeType, searchTerm, 1);
    }
  }, [categoryFromUrl]);

  // جلب المنتجات باستخدام الكاش الذكي (تحميل فوري 0ms عند التردد بين الصفحات)
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const data = await getCachedProducts(API);
        if (!isMounted) return;

        // استبعاد قطاعات الألومنيوم من كتالوج البلاستيك ومواد التعبئة (لأن لها كتالوج مستقل على /aluminium)
        const packagingProducts = Array.isArray(data)
          ? data.filter((p) => !isAluminiumProduct(p))
          : [];
        setProducts(packagingProducts);
        
        // استخراج قوائم الفئات والخامات والأنواع الفريدة الخاصة بمنتجات التعبئة فقط
        if (packagingProducts.length > 0) {
          const cats = [...new Set(packagingProducts.map(p => p.material_category).filter(Boolean))];
          const materials = [...new Set(packagingProducts.map(p => p.material_name).filter(Boolean))];
          const types = [...new Set(packagingProducts.map(p => p.type_name).filter(Boolean))];
          setCategoriesList(["الكل", ...cats]);
          setMaterialsList(["الكل", ...materials]);
          setTypesList(["الكل", ...types]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching products:", err);
        setError("فشل تحميل المنتجات. يرجى المحاولة مرة أخرى.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  // تصفية المنتجات
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (activeCategory === "الكل" || p.material_category === activeCategory) &&
      (activeMaterial === "الكل" || p.material_name === activeMaterial) &&
      (activeType === "الكل" || p.type_name === activeType) &&
      (normalizedSearch === "" ||
        p.name?.toLowerCase().includes(normalizedSearch) ||
        p.code?.toLowerCase().includes(normalizedSearch))
  );

  // تقسيم النتائج المفلترة على صفحات (21 منتج لكل صفحة)
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (normalizedSearch && filtered.length === 0) {
        fetch(`${API}/products/analytics/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: normalizedSearch })
        }).catch(console.error);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [normalizedSearch, filtered.length]);

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
    <div dir="rtl" className="pt-20 min-h-screen bg-[#f8fafc]">
      <section className="bg-white border-b border-slate-200/80 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="section-badge">
            الكتالوج الرقمي
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
            {activeCategory === "الكل" ? "كتالوج المنتجات الصناعية" : `كتالوج ${activeCategory}`}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            تصفح منتجات مجموعة حكيم في قطاعات البلاستيك، المواسير، والألومنيوم بالمواصفات الفنية والمقاسات الكاملة.
          </p>
          <p className="text-slate-400 text-xs mt-2 font-medium">
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ابحث باسم المنتج أو الكود..."
              className="w-full bg-white border border-gray-200 rounded-2xl py-3 pr-11 pl-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
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
              label="القطاع"
              options={categoriesList}
              active={activeCategory}
              onChange={handleCategoryChange}
            />
            <FilterRow 
              label="درجات الحرارة" 
              options={materialsList} 
              active={activeMaterial} 
              onChange={handleMaterialChange}
              displayMapper={getMaterialLabel}
            />
            <FilterRow 
              label="النوع" 
              options={typesList} 
              active={activeType} 
              onChange={handleTypeChange} 
            />
            
            {/* عرض عدد النتائج */}
            <div className="text-xs text-gray-400 mt-2">
              {filtered.length} منتج {activeCategory !== "الكل" && `في ${activeCategory}`} {activeMaterial !== "الكل" && `(تحمل حراري: ${getMaterialLabel(activeMaterial)})`} {activeType !== "الكل" && `من نوع ${activeType}`}
            </div>
          </div>

          <div id="products-grid-top" />

          {/* Product grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {paginated.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full group"
                >
                  <Link to={`/products/${p.id}`} className="flex flex-col flex-1 h-full">
                    {/* صندوق الصورة بنسبة ثابتة 4:3 ومقاس متطابق لجميع المنتجات */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 group">
                      {p.images && p.images.length > 0 ? (
                        <>
                          <img
                            src={p.images[0].url || p.images[0]}
                            alt={p.name}
                            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                          {/* أيقونة التكبير */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center pointer-events-none">
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                              <ZoomIn size={24} className="text-brand-blue" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-50">
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
                  setActiveCategory("الكل");
                  setActiveMaterial("الكل");
                  setActiveType("الكل");
                  setSearchTerm("");
                  setCurrentPage(1);
                  syncStateToUrl("الكل", "الكل", "الكل", "", 1);
                }}
                className="mt-4 text-brand-blue text-sm font-bold hover:underline"
              >
                عرض جميع المنتجات
              </button>
            </div>
          )}

          {/* شريط الترقيم */}
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
    </div>
  );
}