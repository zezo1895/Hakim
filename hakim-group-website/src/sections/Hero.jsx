// src/sections/Hero.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageCircle, ArrowLeft, Play, Pause, ChevronRight, ChevronLeft, ShieldCheck, Factory, Award } from "lucide-react";
import { Link } from "react-router-dom";

const WHATSAPP = "https://wa.me/201144505575?text=أريد طلب تسعير جملة لمنتجات مجموعة حكيم";

// ── الشرائح الثلاث المستوحاة من أسلوب سيمنز الصناعي العالمي ──
const SLIDES = [
  {
    id: "packaging",
    tag: "قطاع التعبئة والتغليف · PACKAGING SOLUTIONS",
    sector: "العبوات ومواد التعبئة",
    title: "حلول متكاملة للعبوات البلاستيكية ومواد التعبئة والتغليف",
    desc: "تصنيع وتوريد تشكيلة متكاملة من العبوات البلاستيكية، حاويات الأغذية، وحلول الكرتون ومواد التعبئة والتغليف لتلبية احتياجات كبرى شركات الأغذية والمصانع والموزعين.",
    highlight: "خامات غذائية وصناعية معتمدة وتوريد مباشر بأعلى جودة",
    image: "/hero-plastic-rv.jpg",
    fallbackImage: "/Generated Image October 13, 2026 - 3_49PM.jpg",
    categoryLink: "/products",
  },
  {
    id: "pipes",
    tag: "قطاع شبكات البنية التحتية · PIPES & FITTINGS",
    sector: "مواسير وشبكات",
    title: "أنظمة مواسير الـ PVC والـ HDPE للمشروعات الكبرى",
    desc: "خطوط سحب وبثق عملاقة لإنتاج مواسير مياه الشرب، الصرف الصحي، وشبكات الري الزراعي المتطورة، مصنعة وفق أعلى المواصفات القياسية للجودة والمتانة.",
    highlight: "معتمدة ومطابقة لمواصفات المشروعات القومية والبنية التحتية",
    image: "/hero-pipes-line.jpg",
    fallbackImage: "/Generated Image October 13, 2026 - 3_47PM.jpg",
    categoryLink: "/products?category=pipes",
  },
  {
    id: "aluminium",
    tag: "قطاع سحب وتشكيل الألومنيوم · ALUMINIUM EXTRUSION",
    sector: "قطاعات الألومنيوم",
    title: "مكابس بثق وتشكيل قطاعات الألومنيوم المعمارية والصناعية",
    desc: "أفران صهر ومكابس هيدروليكية ثقيلة لتوريد قطاعات الألومنيوم عالية المتانة لواجهات الأبراج، الإنشاءات الحديثة، والتشغيل الصناعي الدقيق.",
    highlight: "سبائك معتمدة مع معالجة حرارية فائقة ومقاومة قصوى للعوامل الجوية",
    image: "/hero-aluminium-press.jpg",
    fallbackImage: "/Generated Image October 13, 2026 - 3_42PM.jpg",
    categoryLink: "/products?category=aluminium",
  },
];

const AUTOPLAY_INTERVAL = 6000; // 6 ثوانٍ لكل شريحة

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const timerRef = useRef(null);

  const currentSlide = SLIDES[currentIndex];

  // ── التبديل التلقائي ──
  useEffect(() => {
    if (isPlaying && !isHovered) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
      }, AUTOPLAY_INTERVAL);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isHovered, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <section
      dir="rtl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative min-h-[92vh] lg:min-h-[95vh] flex items-center overflow-hidden bg-slate-950 pt-28 pb-32 sm:pb-36 select-none"
    >
      {/* ── 1. خلفية الصورة مع z-0 لضمان ظهورها أمام لون القسم ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0"
        >
          <motion.img
            src={currentSlide.image}
            onError={(e) => {
              if (e.currentTarget.src.indexOf(encodeURI(currentSlide.fallbackImage)) === -1 &&
                  e.currentTarget.src.indexOf(currentSlide.fallbackImage) === -1) {
                e.currentTarget.src = currentSlide.fallbackImage;
              }
            }}
            alt={currentSlide.title}
            initial={{ scale: shouldReduceMotion ? 1 : 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: "easeOut" }}
            className="w-full h-full object-cover object-center"
          />

          {/* التدرج الاتجاهي المستوحى من سيمنز: داكن من جهة النص وشفاف تماماً جهة الماكينات */}
          <div className="absolute inset-0 bg-gradient-to-l from-slate-950/95 via-slate-950/80 to-transparent sm:w-3/4 lg:w-3/5" />
          
          {/* تدرج سفلي وعلوى ناعم لحماية شريط التنقل والكبسولة السفلية */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/40" />

          {/* شبكة هندسية فائقة الدقة لإضفاء الطابع الصناعي */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── 2. محتوى النص الهرمي (Editorial Typography) ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl lg:max-w-3xl">
          
          {/* وسم التصنيف (Category Tag) مثل سيمنز */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`tag-${currentSlide.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-400 mb-5 text-xs sm:text-sm font-semibold tracking-wide"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentSlide.tag}</span>
            </motion.div>
          </AnimatePresence>

          {/* العنوان الرئيسي الضخم والواثق */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={`title-${currentSlide.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.18] tracking-tight mb-5 drop-shadow-sm"
            >
              {currentSlide.title}
            </motion.h1>
          </AnimatePresence>

          {/* الوصف المركز لقطاع التصنيع */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`desc-${currentSlide.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="text-slate-200/90 text-base sm:text-lg md:text-xl leading-relaxed mb-6 font-normal max-w-2xl"
            >
              {currentSlide.desc}
            </motion.p>
          </AnimatePresence>

          {/* ميزة القوة الصناعية (Highlight Pill) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`highlight-${currentSlide.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium mb-8"
            >
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              <span>{currentSlide.highlight}</span>
            </motion.div>
          </AnimatePresence>

          {/* أزرار اتخاذ القرار (CTAs) */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* زر الواتساب الرئيسي */}
            <motion.a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-brand-green hover:bg-brand-greenDark text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-brand-green/20 transition-all duration-200"
            >
              <MessageCircle size={20} className="shrink-0" />
              <span>طلب عرض سعر عبر الواتساب</span>
            </motion.a>

            {/* زر استكشاف منتجات القطاع */}
            <Link
              to={currentSlide.categoryLink}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md font-bold text-sm sm:text-base rounded-xl transition-all duration-200 group"
            >
              <span>تصفح منتجات {currentSlide.sector}</span>
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>

          {/* إحصائيات الثقة السريعة المصغرة */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-10 pt-6 border-t border-white/15 max-w-xl text-slate-300">
            <div className="flex items-center gap-2">
              <Factory size={16} className="text-sky-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">3 مجمعات صناعية</span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">خبرة منذ 1975</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs sm:text-sm font-semibold">توريد مباشر B2B</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. كبسولة التحكم الزجاجية العائمة المستوحاة 1:1 من سيمنز (Floating Glass Dock) ── */}
      <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {/* زر السهم الأيمن */}
        <button
          onClick={handleNext}
          aria-label="الشريحة السابقة"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
        >
          <ChevronRight size={18} />
        </button>

        {/* الكبسولة المركزية العائمة (Dock) */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl">
          {/* زر التشغيل / الإيقاف المؤقت (Play / Pause) مثل سيمنز */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "إيقاف السلايدر مؤقتاً" : "تشغيل السلايدر"}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <span className="w-[1px] h-3.5 bg-white/20" />

          {/* مؤشرات الشرائح الثلاثة: كبسولة ممتدة للشريحة النشطة ونقاط للأخرى */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`انتقال إلى ${slide.sector}`}
                  className="relative p-1 focus:outline-none"
                >
                  <motion.div
                    animate={{
                      width: isActive ? 28 : 8,
                      backgroundColor: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.35)",
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-2 rounded-full cursor-pointer hover:bg-white/70"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* زر السهم الأيسر */}
        <button
          onClick={handlePrev}
          aria-label="الشريحة التالية"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

    </section>
  );
}