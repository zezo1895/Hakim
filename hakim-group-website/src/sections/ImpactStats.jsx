// src/sections/ImpactStats.jsx
import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

const impactStats = [
  { value: 2500, suffix: "",  label: "عمالة مدربة" },
  { value: 250,  suffix: "K", label: "طن من منتجات البلاستيك سنوياً" },
  { value: 50,   suffix: "K", label: "طن من صادرات البلاستيك سنوياً" },
];

function useCounter(target, isInView, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
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
  }, [isInView, target, duration]);
  return count;
}

function ImpactItem({ s, isInView, index }) {
  const count = useCounter(s.value, isInView);
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col items-center text-center px-6 py-6 sm:py-2"
    >
      <h3 className="font-black text-white text-4xl sm:text-5xl mb-3 tabular-nums">
        + {count.toLocaleString("ar-EG")}
        {s.suffix}
      </h3>
      <p className="text-white/85 text-sm sm:text-base font-medium">{s.label}</p>
    </motion.div>
  );
}

export default function ImpactStats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      dir="rtl"
      className="relative py-16 sm:py-20 bg-brand-blue overflow-hidden"
    >
      {/* subtle decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 60%, #ffffff 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      {/* accent green stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-green" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-white/15">
          {impactStats.map((s, i) => (
            <ImpactItem key={s.label} s={s} isInView={inView} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
