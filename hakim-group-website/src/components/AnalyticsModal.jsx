import React, { useState, useEffect } from "react";
import { X, BarChart3, SearchX, Eye } from "lucide-react";
import Loader from "./Loader";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute left-6 top-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-brand-blue mb-8 text-center flex justify-center items-center gap-2">
          <BarChart3 className="text-brand-orange" /> إحصائيات الموقع
        </h2>

        {loading ? (
          <div className="py-20"><Loader /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Top Products */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Eye className="text-brand-blue" /> أكثر المنتجات مشاهدة
              </h3>
              {data.topProducts?.length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد بيانات مشاهدات حتى الآن.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.topProducts?.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-xs">{i + 1}</span>
                        <span className="font-bold text-sm text-gray-700">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full">
                        {p.views_count} مشاهدة
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missed Searches */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <SearchX className="text-red-500" /> كلمات بحث غير متوفرة
              </h3>
              {data.topSearches?.length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد كلمات بحث مفقودة.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.topSearches?.map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <span className="font-bold text-sm text-gray-700">"{s.query}"</span>
                      <span className="text-sm font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full">
                        تكررت {s.count} مرات
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                * هذه الكلمات تم البحث عنها ولم يجد لها العملاء أي نتائج. يفيدك هذا في معرفة متطلبات السوق وإضافة منتجات جديدة أو تعديل كلمات البحث للمنتجات الحالية.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
