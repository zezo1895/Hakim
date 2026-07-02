// src/components/Loader.jsx
import { motion } from "framer-motion";
import { Package } from "lucide-react";

/**
 * مكوّن تحميل احترافي بألوان الهوية البصرية (أزرق/أخضر)
 * fullScreen: true  -> يغطي الشاشة كاملة (للاستخدام في صفحة مستقلة)
 * fullScreen: false -> يتمركز جوه أي حاوية بارتفاع محدد
 */
export default function Loader({ label = "جاري التحميل...", fullScreen = true }) {
  return (
    <div
      dir="rtl"
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen bg-[#fafafa]" : "py-24"
      }`}
    >
      <div className="flex flex-col items-center">
        {/* الحلقات الدوارة */}
        <div className="relative w-24 h-24 mb-6">
          <motion.span
            className="absolute inset-0 rounded-full border-[3px] border-brand-blue/15 border-t-brand-blue"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute inset-3 rounded-full border-[3px] border-brand-green/15 border-b-brand-green"
            animate={{ rotate: -360 }}
            transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center shadow-lg shadow-brand-blue/20">
              <Package size={18} className="text-white" />
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-1 text-sm font-bold text-gray-500">
          <span>{label}</span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-brand-blue"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}