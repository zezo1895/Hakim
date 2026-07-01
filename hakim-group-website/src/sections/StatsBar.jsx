// src/sections/StatsBar.jsx
import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Users, Settings2, Factory } from "lucide-react";

const stats = [
  { icon: CheckCircle2, value: 50, suffix: "+", label: "عام خبرة" },
  { icon: Users, value: 2000, suffix: "+", label: "عميل مستدام" },
  { icon: Settings2, value: 1000, suffix: "+", label: "منتج متنوع" },
  { icon: Factory, value: 3, suffix: "", label: "مصانعنا", sub: "في العاشر من رمضان" },
];

function useCounter(target, isInView, duration = 1600) {
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

function StatItem({ s, isInView, index }) {
  const Icon = s.icon;
  const count = useCounter(s.value, isInView);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex-1 flex flex-col items-center justify-center px-4 py-5 sm:py-6 relative mt-1"
    >
      {/* خط فاصل أنيق بين الأقسام */}
      {index < stats.length - 1 && (
        <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
      )}

      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums tracking-tight">
          {count.toLocaleString("ar-EG")}
          {s.suffix}
        </span>
        <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-brand-green" strokeWidth={1.75} />
        </div>
      </div>
      
      <span className="text-gray-600 text-xs sm:text-sm font-medium">{s.label}</span>
      {s.sub && (
        <span className="text-gray-400 text-[10px] sm:text-xs mt-0.5">{s.sub}</span>
      )}
    </motion.div>
  );
}

export default function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div dir="rtl" className=" ziad relative z-20  sm:-mt-24 px-4 sm:px-6 lg:px-8 lg:-mt-40">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-5xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80"
      >
        {/* شريط "منذ 1975" أنيق */}
        <div className="absolute -top-3.5 right-6 sm:right-10 flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full bg-white border border-gray-200/80 shadow-sm text-[11px] font-medium text-gray-600 tracking-wide">
            منذ 1975
          </span>
          <div className="w-2 h-2 bg-white border-b border-r border-gray-200/80 rotate-45 -mt-1" />
        </div>

        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-gray-100 py-1">
          {stats.map((s, index) => (
            <StatItem key={s.label} s={s} isInView={inView} index={index} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}