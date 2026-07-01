// src/pages/About.jsx
import { useState } from "react"; // 1. استيراد useState لتتبع الصورة النشطة
import { motion, AnimatePresence } from "framer-motion"; // 2. استيراد AnimatePresence لحركات الدخول والخروج الناعمة
import { CheckCircle2, Award, Target, Eye, Quote, X } from "lucide-react"; // استيراد أيقونة القفل X

// استيراد الصور من مجلد assets
import meeting1 from "../assets/photo_1_2026-06-28_23-56-18.jpg";
import chairmanWithMinister from "../assets/photo_2_2026-06-28_23-56-18.jpg";
import meeting2 from "../assets/photo_3_2026-06-28_23-56-18.jpg";

const values = [
  { icon: Award,        title: "الجودة أولاً",      text: "نلتزم بأعلى معايير الجودة والسلامة الغذائية في كل منتج." },
  { icon: Target,       title: "الابتكار المستمر",   text: "نستثمر في التقنيات الحديثة لتقديم حلول أفضل لعملائنا." },
  { icon: Eye,          title: "الشفافية والثقة",    text: "نبني علاقات طويلة الأمد قائمة على الصدق والوضوح." },
  { icon: CheckCircle2, title: "الالتزام بالمواعيد", text: "نحترم جدول التسليم ونعتبره عقداً ثانياً مع العميل." },
];

const chairmanQuote = {
  text: "نؤمن أن النجاح الحقيقي يأتي من الالتزام بالجودة والشفافية مع شركائنا، وسنستمر في بناء مستقبل صناعي مشرق لمصر.",
  name: "المهندس أحمد عبد الحكيم هاشم",
  position: "رئيس مجلس الإدارة - شركة حكيم جروب"
};

export default function About() {
  // كود الستيت لتخزين رابط الصورة المفتوحة حالياً
  const [selectedImg, setSelectedImg] = useState(null);

  return (
    <div dir="rtl" className="pt-20">
      {/* Hero Section */}
      <section className="bg-brand-blue text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-bold mb-5"
          >
            تأسست عام 1975
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black mb-5"
          >
            قصة نجاح تمتد لأكثر من 50 عاماً
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-200 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            بدأنا برؤية واحدة: أن نكون الشريك الصناعي الأكثر موثوقية في مصر. اليوم، نفخر
            بخدمة أكثر من 2000 عميل عبر ثلاثة قطاعات صناعية متكاملة.
          </motion.p>
        </div>
      </section>

      {/* Chairman Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-badge">قيادة الشركة</span>
            <h2 className="section-title">رئيس مجلس الإدارة</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Main Photo */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => setSelectedImg(chairmanWithMinister)} // فتح الصورة عند الضغط
              className="relative rounded-3xl overflow-hidden shadow-2xl cursor-pointer group"
            >
              <img 
                src={chairmanWithMinister} 
                alt="المهندس أحمد عبد الحكيم هاشم مع وزير العمل" 
                className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/60 to-transparent p-8 sm:p-10">
                <h3 className="text-white text-3xl font-bold mb-1">المهندس أحمد عبد الحكيم هاشم</h3>
                <p className="text-blue-200 text-lg font-medium">
                  مع معالي وزير العمل محمد جبران
                </p>
              </div>
            </motion.div>

            {/* Quote */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-50 border border-gray-100 rounded-3xl p-8 sm:p-10 shadow-sm"
            >
              <Quote size={48} className="text-brand-green mb-6 opacity-30" />
              
              <p className="text-gray-700 text-lg sm:text-xl leading-relaxed italic mb-8">
                "{chairmanQuote.text}"
              </p>

              <div>
                <p className="font-bold text-xl text-gray-900">{chairmanQuote.name}</p>
                <p className="text-brand-green font-medium">{chairmanQuote.position}</p>
              </div>
            </motion.div>
          </div>

          {/* Meetings Section */}
          <div className="mt-16">
            <h3 className="text-center text-xl font-semibold text-gray-700 mb-8">لقاءات واجتماعات مهمة</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={() => setSelectedImg(meeting1)} // فتح الصورة عند الضغط
                className="group cursor-pointer"
              >
                <div className="rounded-3xl overflow-hidden shadow-lg mb-4">
                  <img 
                    src={meeting1} 
                    alt="اجتماع عمل رسمي" 
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="font-semibold text-lg">اجتماع عمل رسمي</h4>
                <p className="text-gray-500 text-sm">مناقشة استراتيجيات التعاون والتطوير الصناعي</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={() => setSelectedImg(meeting2)} // فتح الصورة عند الضغط
                className="group cursor-pointer"
              >
                <div className="rounded-3xl overflow-hidden shadow-lg mb-4">
                  <img 
                    src={meeting2} 
                    alt="لقاء استراتيجي" 
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="font-semibold text-lg">لقاء استراتيجي</h4>
                <p className="text-gray-500 text-sm">تعزيز الشراكات وتطوير بيئة العمل</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-badge">قيمنا</span>
            <h2 className="section-title">ما الذي يميزنا؟</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="card p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Icon size={24} className="text-brand-blue" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{v.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{v.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox / Modal Module */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImg(null)} // يقفل لو دوست في أي مكان في الخلفية
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm cursor-zoom-out"
          >
            {/* زر الإغلاق العلوي */}
            <button 
              onClick={() => setSelectedImg(null)}
              className="absolute top-6 left-6 text-white/70 hover:text-white transition-colors p-2 bg-white/10 rounded-full"
            >
              <X size={24} />
            </button>

            {/* حاوية الصورة المتحركة */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()} // يمنع غلق الـ Modal لو دوست على الصورة نفسها
            >
              <img 
                src={selectedImg} 
                alt="معاينة ممتدة" 
                className="w-full h-auto max-h-[85vh] object-contain cursor-default"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}