// src/sections/Sectors.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import pipe from "../assets/pipes2.jpg"
import al from "../assets/al2.jpg"
import plast from "../assets/plast2.jpg"

// ⚠️ قيمة "category" هنا لازم تطابق بالحرف اسم الفئة (material_categories.name)
// المُسجَّل فعليًا في قاعدة البيانات / لوحة التحكم. لو الاسم مختلف عندك،
// عدّل القيمة هنا فقط وكل حاجة هتشتغل صح تلقائيًا.
const sectors = [
  {
    id: "food",
    title: "قطاع البلاستيك",
    category: "بلاستيك",
    code: "10.8040",
    label: "علبة",
    ctaLabel: "تصفح كتالوج التغليف",
    images: [
      plast,
    ],
    alt: "علب ومنتجات التغليف الغذائي",
  },
  {
    id: "pipes",
    title: "قطاع المواسير",
    category: "مواسير",
    code: "10.531",
    label: "غطاء",
    ctaLabel: "تصفح كتالوج المواسير",
    images: [
      pipe,
    ],
    alt: "مواسير بلاستيكية صناعية",
  },
  {
    id: "aluminium",
    title: "قطاع الألومنيوم",
    category: "ألومنيوم",
    code: "AL.101",
    label: "بروفيل",
    ctaLabel: "تصفح كتالوج الألومنيوم",
    images: [
    al
    ],
    alt: "بروفيلات ألومنيوم",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};
const card = {
  hidden:  { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

function SectorCard({ s }) {
  return (
    <motion.div
      variants={card}
      whileHover={{ y: -8, boxShadow: "0 24px 56px rgba(0,0,0,0.13)" }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      dir="rtl"
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col"
    >
      {/* Header bar */}
      <div className="py-4 px-5 text-center">
        <h3 className="text-base sm:text-lg font-extrabold text-gray-800">{s.title}</h3>
      </div>

      {/* Image(s) */}
      <div className="px-5">
        <div className={`grid gap-2 ${s.images.length > 1 ? "grid-cols-2" : "grid-cols-1"} h-44 sm:h-48 rounded-xl overflow-hidden bg-gray-100`}>
          {s.images.map((img, i) => (
            <motion.img
              key={i}
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.45 }}
              src={img}
              alt={s.alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ))}
        </div>
      </div>

      {/* Code label */}
      <div className="px-5 pt-3 pb-1 flex items-center justify-start gap-2">
        <span className="font-mono font-bold text-gray-700 text-sm">{s.code}</span>
        <span className="text-gray-400 text-sm">{s.label}</span>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-3 mt-auto">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            to={`/products?category=${encodeURIComponent(s.category)}`}
            className="flex items-center justify-center w-full py-2.5 rounded-xl font-bold text-sm text-brand-blue bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            {s.ctaLabel}
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Sectors() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="sectors" dir="rtl" className="pt-10 pb-16 sm:pb-20 lg:pb-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {sectors.map((s) => <SectorCard key={s.id} s={s} />)}
        </motion.div>
      </div>
    </section>
  );
}