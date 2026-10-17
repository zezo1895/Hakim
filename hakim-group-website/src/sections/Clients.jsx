// src/sections/Clients.jsx
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Building2 } from "lucide-react";

// قائمة شركاء النجاح والقطاعات الصناعية
const clients = [
  { name: "الصناعات الدوائية والطبية", label: "قطاع الأدوية" },
  { name: "سلاسل الأغذية والمشروبات", label: "الصناعات الغذائية" },
  { name: "شركات المقاولات الكبرى", label: "البنية التحتية" },
  { name: "مصانع التعبئة والتوزيع", label: "التغليف الصناعي" },
  { name: "مزارع ومشروعات الري الحديث", label: "شبكات الري" },
  { name: "شركات التطوير العقاري", label: "الواجهات المعمارية" },
  { name: "موزعو الجملة والتجارة", label: "توريدات شاملة" },
  { name: "المشروعات القومية للبنية", label: "مرافق وشبكات" },
];

const allClients = [...clients, ...clients];

function ClientCard({ client }) {
  return (
    <div className="shrink-0 mx-3 px-5 py-3.5 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-brand-blue/30 hover:shadow-md transition-all duration-200 flex items-center gap-3 select-none">
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-blue shrink-0">
        <Building2 size={16} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
          {client.name}
        </span>
        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5">
          {client.label}
        </span>
      </div>
    </div>
  );
}

export default function Clients() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section dir="rtl" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="text-center max-w-2xl mx-auto">
          <span className="section-badge">
            شركاء النجاح
          </span>
          <h2 className="section-title mb-3">
            يثق بنا رواد الصناعة والمقاولات
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-16 h-1 bg-brand-blue mx-auto rounded-full origin-center mb-4"
          />
          <p className="section-subtitle mx-auto">
            أكثر من 2000 مصنع وشركة ومقاول يعتمدون على منتجات مجموعة حكيم كشريك توريد استراتيجي معتمد.
          </p>
        </div>
      </div>

      {/* Marquee Row */}
      <div ref={ref} className="relative">
        {/* Soft edge fade masks */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-slate-50/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-slate-50/90 to-transparent z-10 pointer-events-none" />

        <motion.div
          animate={shouldReduceMotion ? {} : { x: ["0%", "-50%"] }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          className="flex w-max"
        >
          {allClients.map((client, idx) => (
            <ClientCard key={`${client.name}-${idx}`} client={client} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
