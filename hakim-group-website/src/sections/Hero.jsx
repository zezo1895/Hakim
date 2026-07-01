// src/sections/Hero.jsx
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MessageCircle, ChevronDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const WHATSAPP = "https://wa.me/201234567890?text=أريد طلب تسعير جملة";

// Reusable fade-up variant
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay },
  },
});

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);

  return (
    <section
      ref={ref}
      dir="rtl"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* ── Background with parallax ── */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
        {/* 
          Replace the url() below with your real factory image:
          url('/assets/factory-hero.jpg')
        */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('hero2.jpg')",
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f3c]/85 via-[#0d1f3c]/65 to-[#0d1f3c]/90" />
        {/* Bottom fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </motion.div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
        <div className="max-w-3xl">

          {/* منذ 1975 badge */}
          <motion.div
            variants={fadeUp(0.1)}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-7"
          >
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-white text-sm font-semibold">منذ 1975</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={fadeUp(0.22)}
            initial="hidden"
            animate="visible"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3"
          >
        نصنع الجودة...
          </motion.h1>
          <motion.h1
            variants={fadeUp(0.36)}
            initial="hidden"
            animate="visible"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
          >
            <span className="text-brand-greenBright">ونبني الثقة منذ عام 1975</span>
          </motion.h1>

          {/* Sub-text */}
          <motion.p
            variants={fadeUp(0.5)}
            initial="hidden"
            animate="visible"
            className="text-white/75 text-base sm:text-lg md:text-xl mb-10 leading-relaxed max-w-xl"
          >
            حلول متكاملة لقطاعات الأغذية، المواسير، والألومنيوم
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp(0.65)}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-4 items-center"
          >
            {/* Pulsing WhatsApp button */}
            <motion.a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              animate={{
                boxShadow: [
                  "0 0 0 0px rgba(45,122,58,0.5)",
                  "0 0 0 12px rgba(45,122,58,0.15)",
                  "0 0 0 0px rgba(45,122,58,0)",
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              whileHover={{ scale: 1.06, boxShadow: "0 8px 30px rgba(45,122,58,0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 px-6 py-3.5 bg-brand-green text-white font-bold text-sm sm:text-base rounded-full border border-green-400/30"
            >
              <MessageCircle size={20} className="shrink-0" />
              <span>طلب تسعير جملة عبر الواتساب</span>
            </motion.a>

            {/* Secondary link */}
            <Link
              to="/products"
              className="flex items-center gap-2 text-white/80 text-sm sm:text-base font-semibold hover:text-white transition-colors group"
            >
              <span>تصفح منتجاتنا</span>
              <motion.span
                animate={{ x: [0, -4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowLeft size={16} />
              </motion.span>
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-36 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/40 text-[10px] select-none"
      >
        <span className="tracking-[0.2em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={17} />
        </motion.div>
      </motion.div>
    </section>
  );
}