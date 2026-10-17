// src/sections/StatsBar.jsx
import { useRef, useState, useEffect } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const stats = [
  { value: 50, suffix: "+", label: "عاماً من الخبرة الصناعية", sub: "تأسست في 1975" },
  { value: 2000, suffix: "+", label: "عميل وشريك نجاح", sub: "في السوق المحلي والدولي" },
  { value: 1000, suffix: "+", label: "منتج ومواصفة قياسية", sub: "بجودة معتمدة" },
  { value: 3, suffix: "", label: "مجمعات تصنيع متطورة", sub: "في العاشر من رمضان" },
];

function useCounter(target, isInView, shouldReduceMotion, duration = 1600) {
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

function StatItem({ s, isInView, shouldReduceMotion, index }) {
  const count = useCounter(s.value, isInView, shouldReduceMotion);

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col items-center justify-center py-6 px-4 sm:px-6 relative text-center"
    >
      {/* Thin Vertical Divider */}
      {index < stats.length - 1 && (
        <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-slate-200" />
      )}

      {/* Number */}
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-blue tracking-tight tabular-nums mb-2">
        {count.toLocaleString("ar-EG")}
        <span className="text-brand-green mr-0.5">{s.suffix}</span>
      </div>

      {/* Label */}
      <div className="text-slate-800 text-sm sm:text-base font-bold mb-0.5">
        {s.label}
      </div>

      {/* Sublabel */}
      {s.sub && (
        <div className="text-slate-400 text-xs font-medium">
          {s.sub}
        </div>
      )}
    </motion.div>
  );
}

export default function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section dir="rtl" className="relative z-20 -mt-8 sm:-mt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-200/90 overflow-hidden"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-x sm:divide-x-reverse divide-slate-100 py-2">
            {stats.map((s, index) => (
              <StatItem
                key={s.label}
                s={s}
                isInView={inView}
                shouldReduceMotion={shouldReduceMotion}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}