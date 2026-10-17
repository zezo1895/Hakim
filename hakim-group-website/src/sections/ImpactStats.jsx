// src/sections/ImpactStats.jsx
import { useRef, useState, useEffect } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const impactStats = [
  { value: 2500, suffix: "+", label: "كوادر وفنيين مدربين", desc: "فريق هندسي وتشغيلي بمعايير عالمية" },
  { value: 250,  suffix: "K+", label: "طن طاقة إنتاجية سنوية", desc: "تغطي متطلبات السوق المحلي والإقليمي" },
  { value: 50,   suffix: "K+", label: "طن صادرات صناعية سنوياً", desc: "نصل بمنتجاتنا لأكثر من 15 دولة" },
];

function useCounter(target, isInView, shouldReduceMotion, duration = 1800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target, duration, shouldReduceMotion]);

  return count;
}

function ImpactItem({ s, isInView, shouldReduceMotion, index }) {
  const count = useCounter(s.value, isInView, shouldReduceMotion);

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col items-center text-center px-6 py-8 relative"
    >
      {/* Thin divider line */}
      {index < impactStats.length - 1 && (
        <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-16 bg-slate-200" />
      )}

      <div className="font-black text-brand-blue text-4xl sm:text-5xl lg:text-6xl mb-3 tabular-nums tracking-tight">
        {count.toLocaleString("ar-EG")}
        <span className="text-brand-green mr-1">{s.suffix}</span>
      </div>

      <h3 className="text-slate-900 text-base sm:text-lg font-bold mb-1">
        {s.label}
      </h3>

      <p className="text-slate-500 text-xs sm:text-sm max-w-xs font-normal">
        {s.desc}
      </p>
    </motion.div>
  );
}

export default function ImpactStats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      dir="rtl"
      className="py-18 sm:py-24 bg-white border-y border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="section-badge">
            حجم التأثير والقدرة الإنتاجية
          </span>
          <h2 className="section-title mb-3">
            طاقات تصنيعية تخدم الاقتصاد الوطني
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-16 h-1 bg-brand-blue mx-auto rounded-full origin-center"
          />
        </div>

        {/* Stats Grid on Light Card */}
        <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 divide-slate-200">
            {impactStats.map((s, i) => (
              <ImpactItem
                key={s.label}
                s={s}
                isInView={inView}
                shouldReduceMotion={shouldReduceMotion}
                index={i}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
