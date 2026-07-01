// src/pages/Certificates.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ShieldCheck, ZoomIn } from "lucide-react";

const categories = ["الكل", "شهادات الجودة (ISO)", "السلامة الغذائية", "شهادات بيئية وحكومية"];

// عدّل/أضف هنا أي شهادة جديدة — العنصر هيظهر تلقائياً في الصفحة
const certificates = [
  {
    id: 1,
    cat: "شهادات الجودة (ISO)",
    title: "ISO 9001:2015",
    subtitle: "نظام إدارة الجودة",
    issuer: "الهيئة العالمية للتوحيد القياسي",
    year: "2024",
    description:
      "تثبت هذه الشهادة أن نظام إدارة الجودة بالشركة مطابق للمعايير الدولية، وتشمل ضبط جميع مراحل الإنتاج من استقبال الخامة وحتى تسليم المنتج للعميل.",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&q=80",
  },
  {
    id: 2,
    cat: "شهادات الجودة (ISO)",
    title: "ISO 14001:2015",
    subtitle: "نظام الإدارة البيئية",
    issuer: "الهيئة العالمية للتوحيد القياسي",
    year: "2024",
    description:
      "تؤكد التزام الشركة بتقليل الأثر البيئي لعملياتها الصناعية، وترشيد استخدام الموارد، والتعامل الآمن مع المخلفات الصناعية.",
    img: "https://images.unsplash.com/photo-1554224155-8d2903b0a35c?w=500&q=80",
  },
  {
    id: 3,
    cat: "السلامة الغذائية",
    title: "ISO 22000:2018",
    subtitle: "نظام إدارة سلامة الغذاء",
    issuer: "الهيئة العالمية للتوحيد القياسي",
    year: "2023",
    description:
      "تخص خطوط تصنيع عبوات وأغطية التغليف الغذائي، وتضمن أن المواد المستخدمة وطرق التصنيع آمنة تماماً لتعبئة المنتجات الغذائية.",
    img: "https://images.unsplash.com/photo-1581093458791-9d09f4abbcc4?w=500&q=80",
  },
  {
    id: 4,
    cat: "السلامة الغذائية",
    title: "HACCP",
    subtitle: "تحليل المخاطر ونقاط التحكم الحرجة",
    issuer: "هيئة اعتماد دولية",
    year: "2023",
    description:
      "نظام رقابي يحدد ويتابع جميع نقاط الخطر المحتملة في خط إنتاج التغليف الغذائي لمنع أي تلوث قبل وصول المنتج للمستهلك.",
    img: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=500&q=80",
  },
  {
    id: 5,
    cat: "شهادات بيئية وحكومية",
    title: "شهادة الجهاز القومي لسلامة الغذاء",
    subtitle: "ترخيص تصنيع مستلزمات تعبئة غذائية",
    issuer: "الجهاز القومي لسلامة الغذاء - مصر",
    year: "2024",
    description:
      "ترخيص رسمي من الجهاز القومي لسلامة الغذاء يصرح للشركة بتصنيع وتوريد عبوات وأغطية التعبئة الغذائية داخل السوق المصري.",
    img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=500&q=80",
  },
  {
    id: 6,
    cat: "شهادات بيئية وحكومية",
    title: "شهادة الموافقة الصناعية",
    subtitle: "هيئة التنمية الصناعية",
    issuer: "وزارة التجارة والصناعة - مصر",
    year: "2022",
    description:
      "موافقة صناعية رسمية تؤكد التزام مصانع الشركة بكافة الاشتراطات الصناعية والبيئية المطلوبة لمزاولة النشاط.",
    img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca86?w=500&q=80",
  },
];

function CertCard({ c, onOpen, index }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
      className="card overflow-hidden flex flex-col group"
    >
      <button
        onClick={() => onOpen(c)}
        className="relative h-48 w-full overflow-hidden bg-gray-100"
      >
        <img
          src={c.img}
          alt={c.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
          <ZoomIn
            size={26}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </button>

      <div dir="rtl" className="p-5 flex flex-col flex-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-blue text-[11px] font-semibold mb-3 w-fit">
          <ShieldCheck size={11} />
          {c.cat}
        </span>
        <h3 className="text-gray-800 font-bold text-base mb-0.5">{c.title}</h3>
        <p className="text-brand-green text-xs font-semibold mb-2">{c.subtitle}</p>
        <p className="text-gray-400 text-xs leading-relaxed mb-3 flex-1">{c.description}</p>
        <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100 pt-2.5">
          <span>{c.issuer}</span>
          <span className="font-mono">{c.year}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Certificates() {
  const [active, setActive] = useState("الكل");
  const [selected, setSelected] = useState(null);

  const filtered =
    active === "الكل" ? certificates : certificates.filter((c) => c.cat === active);

  return (
    <div dir="rtl" className="pt-20 min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-brand-blue text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-bold mb-4"
        >
          ثقة موثّقة
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-black mb-3"
        >
          شهاداتنا واعتماداتنا
        </motion.h1>
        <p className="text-blue-200 text-sm max-w-lg mx-auto">
          مجموعة الشهادات والاعتمادات الدولية والمحلية التي تؤكد التزام حكيم جروب
          بأعلى معايير الجودة والسلامة في كل خطوط الإنتاج.
        </p>
      </section>

      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <Filter size={16} className="text-gray-400 shrink-0" />
            {categories.map((c) => (
              <motion.button
                key={c}
                onClick={() => setActive(c)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  active === c
                    ? "bg-brand-blue text-white shadow"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-brand-blue hover:text-brand-blue"
                }`}
              >
                {c}
              </motion.button>
            ))}
          </div>

          {/* Certificates grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <CertCard key={c.id} c={c} onOpen={setSelected} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-10">
              لا توجد شهادات في هذا التصنيف حالياً.
            </p>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[88vh] flex flex-col"
            >
              <div className="relative bg-gray-100 shrink-0">
                <img
                  src={selected.img}
                  alt={selected.title}
                  className="w-full max-h-[55vh] object-contain bg-white"
                />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
                  aria-label="إغلاق"
                >
                  <X size={18} className="text-gray-700" />
                </button>
              </div>
              <div dir="rtl" className="p-6 overflow-y-auto">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-blue text-[11px] font-semibold mb-3 w-fit">
                  <ShieldCheck size={11} />
                  {selected.cat}
                </span>
                <h3 className="text-gray-800 font-extrabold text-xl mb-1">{selected.title}</h3>
                <p className="text-brand-green text-sm font-semibold mb-3">{selected.subtitle}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{selected.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                  <span>الجهة المُصدِرة: {selected.issuer}</span>
                  <span className="font-mono">{selected.year}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}