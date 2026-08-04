import React, { useState, useEffect } from "react";
import { X, BarChart3, SearchX, Eye, TrendingUp, PackageSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AnalyticsModal({ onClose, authKey }) {
  const [data, setData] = useState({ topProducts: [], topSearches: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/products/analytics`, {
      headers: {
        Authorization: `Bearer ${authKey}`
      }
    })
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [authKey]);

  // ألوان الجراف لتكون متناسقة وجذابة
  const COLORS = ['#FF7F50', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-[2rem] w-full max-w-6xl max-h-[95vh] overflow-y-auto p-6 md:p-10 relative shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute left-6 top-6 p-3 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-brand-blue flex justify-center items-center gap-3">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 10 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
              >
                <BarChart3 className="text-brand-orange" size={32} />
              </motion.div>
              إحصائيات الموقع الذكية
            </h2>
            <p className="text-gray-500 mt-2">راقب أداء المنتجات واكتشف احتياجات عملائك</p>
          </div>

          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
              <p className="text-gray-500 font-bold">جاري تحميل البيانات...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* === Top Products Chart === */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">المنتجات الأكثر طلباً</h3>
                    <p className="text-sm text-gray-400">أعلى 10 منتجات مشاهدة</p>
                  </div>
                </div>

                {data.topProducts?.length === 0 ? (
                  <div className="py-20 text-center text-gray-400">لا توجد مشاهدات كافية بعد</div>
                ) : (
                  <div className="h-72 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.topProducts} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#9ca3af', fontSize: 12 }} 
                          tickLine={false}
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          cursor={{ fill: '#f9fafb' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="views_count" name="المشاهدات" radius={[8, 8, 0, 0]}>
                          {data.topProducts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>

              {/* === Missed Searches Chart === */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                    <PackageSearch size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">كلمات بحث مفقودة</h3>
                    <p className="text-sm text-gray-400">كلمات بحث عنها العملاء ولم يجدوها</p>
                  </div>
                </div>

                {data.topSearches?.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <SearchX size={48} className="opacity-20" />
                    <p>المخزن يغطي جميع طلبات البحث بامتياز!</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 max-h-72">
                    {data.topSearches?.map((s, i) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        key={i} 
                        className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-100/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-gray-400 shadow-sm border border-gray-100 text-sm">
                            {i + 1}
                          </span>
                          <span className="font-bold text-gray-700">"{s.query}"</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-400 mb-1">تكرر البحث</span>
                          <span className="text-sm font-black bg-red-100 text-red-600 px-3 py-1 rounded-full">
                            {s.count} مرات
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
