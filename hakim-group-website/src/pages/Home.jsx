// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Hero from "../sections/Hero";
import StatsBar from "../sections/StatsBar";
import Sectors from "../sections/Sectors";
import ImpactStats from "../sections/ImpactStats";
import Clients from "../sections/Clients";
import Loader from "../components/Loader";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // إزالة التأخير الإجباري (900ms) - التحقق فقط من اكتمال تحميل عناصر الصفحة الأساسية
    if (document.readyState === "complete") {
      setReady(true);
    } else {
      const onReady = () => setReady(true);
      window.addEventListener("load", onReady, { once: true });
      // حد أقصى احتياطي في حال تأخر حدث load بسبب موارد خارجية
      const fallbackTimer = setTimeout(onReady, 350);
      return () => {
        window.removeEventListener("load", onReady);
        clearTimeout(fallbackTimer);
      };
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!ready ? (
        <motion.div key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <Loader label="جاري تحميل مجموعة حكيم" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <Helmet>
            <title>مجموعة حكيم الصناعية | تصنيع البلاستيك، المواسير، والألومنيوم منذ 1975</title>
            <meta
              name="description"
              content="مجموعة حكيم الصناعية منذ عام 1975 - حلول صناعية متكاملة ومتقدمة في مجالات التغليف البلاستيكي، شبكات ومواسير البنية التحتية، وبروفيلات الألومنيوم للشركات والمصانع."
            />
          </Helmet>

          <Hero />
          <StatsBar />
          <Sectors />
          <ImpactStats />
          <Clients />
        </motion.div>
      )}
    </AnimatePresence>
  );
}