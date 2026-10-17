// src/sections/Sectors.jsx
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import pipe from "../assets/pipes2.jpg";
import al from "../assets/al2.jpg";
import plast from "../assets/plast2.jpg";

const sectors = [
  {
    id: "plastic",
    title: "قطاع العبوات ومواد التعبئة والتغليف",
    category: "عبوات وتغليف",
    tag: "بلاستيك وكرتون غذائي وصناعي",
    desc: "حلول إنتاجية متكاملة للعبوات البلاستيكية، العلب، حاويات الأغذية، وحلول الكرتون ومواد التعبئة المصنعة وفق أعلى المعايير الصحية لخدمة كبرى المصانع والمطاعم والشركات.",
    ctaLabel: "استكشف كتالوج مواد التعبئة والعبوات",
    image: plast,
    alt: "حلول العبوات البلاستيكية ومواد التعبئة والتغليف من مجموعة حكيم",
  },
  {
    id: "pipes",
    title: "قطاع المواسير وشبكات البنية",
    category: "مواسير",
    tag: "مشاريع وبنية تحتية",
    desc: "مواسير وقطع شبكات الري والتغذية والصرف عالية التحمل (PVC, HDPE) المعتمدة للمشروعات القومية والإنشائية الكبرى في مصر والشرق الأوسط.",
    ctaLabel: "استكشف كتالوج المواسير",
    image: pipe,
    alt: "مواسير وشبكات البنية التحتية من مجموعة حكيم",
  },
  {
    id: "aluminium",
    title: "قطاع الألومنيوم والقطاعات الهندسية",
    category: "ألومنيوم",
    tag: "إنشاءات وهندسة معمارية",
    desc: "بروفيلات وقطاعات ألومنيوم معمارية وصناعية دقيقة تلبي متطلبات الواجهات الحديثة والمنشآت الهندسية بأعلى كفاءة ميكانيكية ومقاومة للعوامل الجوية.",
    ctaLabel: "تصفح كتالوج الألومنيوم",
    image: al,
    alt: "بروفيلات وقطاعات ألومنيوم مجموعة حكيم",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

function SectorCard({ sector }) {
  return (
    <motion.div
      variants={cardVariants}
      className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden relative"
    >
      {/* Sector Image with Smooth Zoom */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
        <img
          src={sector.image}
          alt={sector.alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Soft gradient bottom fade on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Sector Tag Badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm border border-slate-100">
            {sector.tag}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-brand-blue transition-colors mb-3">
          {sector.title}
        </h3>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 flex-1">
          {sector.desc}
        </p>

        {/* Animated Accent Line */}
        <div className="w-full h-[2px] bg-slate-100 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-0 group-hover:w-full bg-brand-blue transition-all duration-400 ease-out" />
        </div>

        {/* Action Button */}
        <Link
          to={sector.id === "aluminium" ? "/aluminium" : `/products?category=${encodeURIComponent(sector.category)}`}
          className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold text-brand-blue bg-slate-50 border border-slate-200/80 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue transition-all duration-200"
        >
          <span>{sector.ctaLabel}</span>
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function Sectors() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="sectors" dir="rtl" className="py-20 sm:py-28 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <span className="section-badge">
            ركائزنا الإنتاجية
          </span>
          <h2 className="section-title mb-4">
            القطاعات الصناعية الرئيسية
          </h2>

          {/* Decorative accent line that draws in */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-16 h-1 bg-brand-blue mx-auto rounded-full mb-5 origin-center"
          />

          <p className="section-subtitle mx-auto">
            منظومة تصنيع متكاملة تغطي احتياجات كبرى المؤسسات الصناعية وشركات المقاولات وتجارة الجملة عبر خطوط إنتاج حديثة ومواصفات عالمية.
          </p>
        </div>

        {/* 3 Large Sector Cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {sectors.map((sector) => (
            <SectorCard key={sector.id} sector={sector} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}