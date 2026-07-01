// src/pages/Quality.jsx
import { motion } from "framer-motion";
import { ShieldCheck, FlaskConical, Truck, Recycle } from "lucide-react";

const pillars = [
  { icon: ShieldCheck,   title: "معايير السلامة الغذائية", text: "جميع منتجات التغليف الغذائي مطابقة لمعايير هيئة الغذاء والدواء المصرية والمواصفات القياسية الدولية." },
  { icon: FlaskConical,  title: "مختبرات الجودة الداخلية", text: "نمتلك مختبرات متطورة لاختبار الضغط، المقاومة، والخواص الكيميائية لكل دفعة إنتاجية." },
  { icon: Truck,         title: "التتبع من المصنع للعميل",  text: "نظام متكامل لتتبع الدُفعات وضمان وصول المنتج بنفس جودة خط الإنتاج." },
  { icon: Recycle,       title: "الاستدامة والبيئة",        text: "نستخدم مواد قابلة لإعادة التدوير ونعمل على تقليل البصمة الكربونية لعملياتنا الإنتاجية." },
];

export default function Quality() {
  return (
    <div dir="rtl" className="pt-20 min-h-screen">
      {/* Header */}
      <section className="bg-brand-blue text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-bold mb-4"
        >
          ISO & HACCP
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-black mb-3"
        >
          الجودة والسلامة
        </motion.h1>
        <p className="text-blue-200 text-sm max-w-lg mx-auto">
          التزامنا بالجودة ليس شعاراً — إنه نظام متكامل يبدأ من اختيار المادة الخام ولا ينتهي إلا بوصول المنتج لعميلنا.
        </p>
      </section>

      {/* Pillars */}
      <section className="py-16 sm:py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="card p-7 flex gap-5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon size={24} className="text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">{p.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{p.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
