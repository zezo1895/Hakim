// src/sections/Clients.jsx
import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

// In production, replace these with real logo images from /assets/clients/
const clients = [
  { name: "الصيدليات",   placeholder: "الصيدليات" },
  { name: "صحدرين",      placeholder: "صحدرين" },
  { name: "Amzon Foob", placeholder: "Amzon Foob" },
  { name: "Food Gromus", placeholder: "Food Gromus" },
  { name: "Diamplato",   placeholder: "Diamplato" },
  { name: "سلسبيل",      placeholder: "سلسبيل" },
  { name: "لقيو البلصية", placeholder: "لقيو البلصية" },
  { name: "الوثائقيص",   placeholder: "الوثائقيص" },
];

// Duplicate for infinite marquee effect
const allClients = [...clients, ...clients];

function ClientLogo({ client }) {
  return (
    <motion.div
      whileHover={{ scale: 1.08, filter: "grayscale(0%)" }}
      className="shrink-0 w-32 h-16 mx-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center px-3 filter grayscale hover:grayscale-0 transition-all duration-300"
    >
      {/* Replace with <img src={`/assets/clients/${client.id}.png`} alt={client.name} className="max-h-10 max-w-full object-contain" /> */}
      <span className="text-xs font-bold text-gray-500 text-center leading-tight">
        {client.placeholder}
      </span>
    </motion.div>
  );
}

export default function Clients() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section dir="rtl" className="py-16 sm:py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="section-badge">شركاء النجاح</span>
          <h2 className="section-title mb-3">يثقون بنا</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            أكثر من 2000 شركة وعلامة تجارية تختار حكيم جروب شريكاً للتعبئة والتغليف.
          </p>
        </motion.div>

        {/* Marquee row 1 — right to left */}
        <div className="relative mb-4">
          {/* Left & right fade masks */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="flex w-max"
          >
            {allClients.map((c, i) => (
              <ClientLogo key={`a-${i}`} client={c} />
            ))}
          </motion.div>
        </div>

        {/* Marquee row 2 — left to right (reversed) */}
        <div className="relative">
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

          <motion.div
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="flex w-max"
          >
            {[...allClients].reverse().map((c, i) => (
              <ClientLogo key={`b-${i}`} client={c} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
