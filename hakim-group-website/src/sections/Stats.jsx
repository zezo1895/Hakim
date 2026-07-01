// src/sections/Stats.jsx
import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Users, Package, Factory } from "lucide-react";

const stats = [
  {
    icon: Award,
    value: 50,
    suffix: "+",
    label: "عام خبرة",
    sub: "في صناعة التعبئة والتغليف",
    color: "#1a3a6b",
    bg: "#eff6ff",
  },
  {
    icon: Users,
    value: 2000,
    suffix: "+",
    label: "عميل مستدام",
    sub: "من كبرى شركات الغذاء والبناء",
    color: "#2d7a3a",
    bg: "#f0fdf4",
  },
  {
    icon: Package,
    value: 1000,
    suffix: "+",
    label: "منتج متنوع",
    sub: "بأحجام وأكواد مختلفة",
    color: "#1a3a6b",
    bg: "#eff6ff",
  },
  {
    icon: Factory,
    value: 3,
    suffix: "",
    label: "مصانعنا",
    sub: "في العاشر من رمضان",
    color: "#2d7a3a",
    bg: "#f0fdf4",
  },
];

// Animated counter hook
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

function StatCard({ stat, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCounter(stat.value, inView);
  const Icon = stat.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
      className="bg-white rounded-2xl p-6 flex flex-col items-center text-center border border-gray-100 shadow-sm transition-shadow"
    >
      <motion.div
        whileHover={{ rotate: 8, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: stat.bg }}
      >
        <Icon size={24} style={{ color: stat.color }} />
      </motion.div>

      <div className="flex items-end gap-1 mb-1">
        <span
          className="text-3xl sm:text-4xl font-black tabular-nums"
          style={{ color: stat.color }}
        >
          {count.toLocaleString("ar-EG")}
        </span>
        <span className="text-xl font-black mb-1" style={{ color: stat.color }}>
          {stat.suffix}
        </span>
      </div>

      <p className="text-gray-800 font-bold text-sm mb-1">{stat.label}</p>
      <p className="text-gray-400 text-xs">{stat.sub}</p>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section dir="rtl" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Badge منذ 1975 */}
        <div className="flex justify-end mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue text-white text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-greenBright animate-pulse" />
            منذ 1975
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
