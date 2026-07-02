// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Hero       from "../sections/Hero";
import StatsBar   from "../sections/StatsBar";
import Sectors    from "../sections/Sectors";
import ImpactStats from "../sections/ImpactStats";
import Loader     from "../components/Loader";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // نضمن ظهور الـ Loader لمدة أدنى (تجربة أفضل بصريًا حتى لو التحميل سريع جدًا)
    const minTime = new Promise((resolve) => setTimeout(resolve, 900));

    // ننتظر كمان تحميل كل الصفحة (صور، خطوط...) فعليًا
    const pageLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

    Promise.all([minTime, pageLoaded]).then(() => setReady(true));
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!ready ? (
        <motion.div key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <Loader label="جاري تحميل الصفحة" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Hero />
          <StatsBar />
          <Sectors />
          <ImpactStats />
        </motion.div>
      )}
    </AnimatePresence>
  );
}