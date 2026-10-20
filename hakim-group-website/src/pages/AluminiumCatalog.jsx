// src/pages/AluminiumCatalog.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Box,
  ArrowLeft,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import Loader from "../components/Loader";
import AluminiumCardViewer3D from "../components/AluminiumCardViewer3D";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ITEMS_PER_PAGE = 12;

import { isAluminiumProduct } from "../data/aluminiumProfiles";
export { isAluminiumProduct };

export default function AluminiumCatalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // جلب قطاعات الألومنيوم الصادرة من قاعدة البيانات فقط (API Database Only)
  useEffect(() => {
    let isMounted = true;
    const fetchAluminium = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/products?category=${encodeURIComponent("ألومنيوم")}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            // تصفية المنتجات التابعة للألومنيوم الواردة من قاعدة البيانات حصراً
            const dbAluminiumProducts = Array.isArray(data) ? data.filter(isAluminiumProduct) : [];
            setProducts(dbAluminiumProducts);
          }
        } else {
          if (isMounted) setProducts([]);
        }
      } catch (err) {
        console.error("Backend fetch error:", err);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAluminium();
    return () => { isMounted = false; };
  }, []);

  // Filter products by search term (name or code)
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;

    return products.filter((p) => {
      const matchName = p.name && p.name.toLowerCase().includes(term);
      const matchCode = p.code && p.code.toLowerCase().includes(term);
      return matchName || matchCode;
    });
  }, [products, searchTerm]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    document.getElementById("aluminium-catalog-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return <Loader label="جاري تحميل كتالوج قطاعات الألومنيوم..." />;
  }

  return (
    <div dir="rtl" className="pt-20 min-h-screen bg-[#f8fafc]">
      <Helmet>
        <title>كتالوج قطاعات وبروفيلات الألومنيوم 3D | مجموعة حكيم</title>
        <meta
          name="description"
          content="استكشف كتالوج قطاعات وبروفيلات الألومنيوم الهندسية والمعمارية من مجموعة حكيم مع ميزة المعاينة ثلاثية الأبعاد 3D وقياس الأبعاد وتغيير الألوان."
        />
        <meta property="og:title" content="كتالوج قطاعات الألومنيوم 3D | مجموعة حكيم" />
        <meta
          property="og:description"
          content="معاينة هندسية ثلاثية الأبعاد 3D لقطاعات وبروفيلات الألومنيوم مع قياس الأبعاد وتغيير التشطيبات."
        />
      </Helmet>

      {/* Hero Header Section */}
      <section className="bg-white border-b border-slate-200/80 py-14 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="section-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-bold mb-4">
            <Box size={14} />
            معاينة هندسية 3D تفاعلية
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            كتالوج قطاعات وبروفيلات الألومنيوم
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            استعرض بروفيلات الألومنيوم المعمارية والصناعية بدقة فائقة. اضغط على أي قطاع للدخول في وضع المعاينة ثلاثية الأبعاد (3D)، فحص الأبعاد بالملليمتر وتغيير ألوان وتشطيبات الأكسدة.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {products.length} قطاع متاح
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Box size={14} className="text-brand-blue" />
              دعم ملفات CAD بصيغة GLB
            </span>
          </div>
        </div>
      </section>

      {/* Search & Content Container */}
      <section id="aluminium-catalog-grid" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Search Box */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative shadow-sm rounded-2xl">
            <Search
              size={19}
              className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم القطاع أو الكود الهندسي (مثل: IF 588)..."
              className="w-full bg-white border border-slate-200/90 rounded-2xl py-3.5 pr-12 pl-11 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400 hover:text-slate-600 p-1"
                aria-label="مسح البحث"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              تم العثور على {filteredProducts.length} نتيجة بحث
            </p>
          )}
        </div>

        {/* Product Grid */}
        {paginatedProducts.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {paginatedProducts.map((p) => {
                const thumb = p.images?.[0]?.url || p.images?.[0] || "/placeholder-image.jpg";
                const hasModel = Boolean(p.model_url);

                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    whileHover={{ y: -5, boxShadow: "0 16px 36px rgba(0,0,0,0.08)" }}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-300 overflow-hidden flex flex-col h-full group"
                  >
                    <div className="flex flex-col flex-1 h-full">
                      {/* عارض ثلاثي الأبعاد 3D مباشر للقطاع بدلاً من الصورة الثابتة */}
                      <AluminiumCardViewer3D
                        modelUrl={p.model_url}
                        thumbnail={thumb}
                        productName={p.name}
                        productCode={p.code}
                        onCardClick={() => navigate(`/products/${p.id}`)}
                      />

                      {/* Content Body */}
                      <div
                        onClick={() => navigate(`/products/${p.id}`)}
                        className="p-5 flex flex-col flex-1 cursor-pointer"
                      >
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold mb-2 w-fit">
                          {p.material_name || "قطاع ألومنيوم"}
                        </span>

                        <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-1 group-hover:text-brand-blue transition-colors">
                          {p.name}
                        </h3>

                        {p.notes && (
                          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4">
                            {p.notes}
                          </p>
                        )}

                        {/* Card Footer CTA */}
                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-blue">
                          <span>{hasModel ? "معاينة هندسية وتغيير الألوان 3D" : "عرض التفاصيل"}</span>
                          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-4">
              <Box size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">لا توجد قطاعات مطابقة</h3>
            <p className="text-sm text-slate-400 mb-5">
              لم نتمكن من العثور على قطاع ألومنيوم يطابق بحثك الحالي "{searchTerm}".
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="px-5 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold shadow hover:opacity-90 transition-opacity"
            >
              عرض جميع القطاعات
            </button>
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="الصفحة السابقة"
            >
              <ChevronRight size={18} />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const page = idx + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-brand-blue hover:text-brand-blue"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="الصفحة التالية"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
