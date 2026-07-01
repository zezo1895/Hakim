// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Globe, Phone } from "lucide-react";

import logo from "../assets/product_1079686086__employee.png";   // ← غير اسم الملف لو مختلف

const navLinks = [
  { label: "الصفحة الرئيسية", to: "/" },
  { label: "عن الشركة",       to: "/about" },
  { label: "المنتجات",         to: "/products" },
  { label: "الجودة والسلامة", to: "/quality" },
  { label: "شهاداتنا",         to: "/certificates" },
  { label: "اتصل بنا",         to: "/contact" },
];

const WHATSAPP = "https://wa.me/201234567890?text=أريد طلب تسعير";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setIsOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  return (
    <>
      <motion.header
        dir="rtl"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/96 backdrop-blur-md shadow-md" : "bg-white shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* === Logo Curve Design === */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="relative self-start -mb-8 lg:-mb-12 z-10 pt-2"
            >
              <Link to="/" className="block">
                <div className="relative">
                  {/* الخلفية المنحنية الخارجية */}
                  <div className="absolute -inset-3 bg-gradient-to-br from-green-500/10 to-blue-600/10 rounded-[40px] rotate-[-3deg] scale-105" />

                  {/* الإطار الرئيسي */}
                  <div className="relative bg-white rounded-[35px] p-2 shadow-xl border border-green-200 overflow-hidden">
                    <div className="relative">
                      <img
                        src={logo}
                        alt="Hakim Group"
                        className="h-28 lg:h-32 w-auto object-contain drop-shadow-md relative z-10"
                      />

                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-green-400/20 to-transparent rounded-[30px] pointer-events-none" />
                    </div>
                  </div>

                  {/* Decorative bottom curve shine */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-white/60 blur-md rounded-full" />
                </div>
              </Link>
            </motion.div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      active
                        ? "text-white"
                        : "text-gray-600 hover:text-brand-blue hover:bg-blue-50"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="navPill"
                        className="absolute inset-0 bg-brand-blue rounded-lg -z-10"
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      />
                    )}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="بحث"
              >
                <Search size={17} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-full hover:border-brand-blue hover:text-brand-blue transition-all"
              >
                <Globe size={13} />
                <span>عربي / EN</span>
              </motion.button>

              <motion.a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(26,58,107,0.3)" }}
                whileTap={{ scale: 0.96 }}
                className="px-5 py-2 bg-brand-blue text-white text-sm font-bold rounded-full hover:bg-brand-blueDark transition-colors"
              >
                طلب تسعير
              </motion.a>
            </div>

            {/* Mobile hamburger */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setIsOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              aria-label="القائمة"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isOpen ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {isOpen ? <X size={22} /> : <Menu size={22} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              key="drawer"
              dir="rtl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-blue-50">
                <img src={logo} alt="Hakim Group" className="h-10 w-auto object-contain" />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600"
                >
                  <X size={19} />
                </motion.button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navLinks.map((link, i) => {
                  const active = location.pathname === link.to;
                  return (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.3 }}
                    >
                      <Link
                        to={link.to}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? "bg-brand-blue text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                        }`}
                      >
                        <span>{link.label}</span>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="p-4 space-y-2.5 border-t border-gray-100">
                <motion.a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-brand-green text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Phone size={15} />
                  طلب تسعير جملة
                </motion.a>
                <motion.button className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 text-gray-500 text-sm rounded-xl hover:border-brand-blue hover:text-brand-blue transition-all">
                  <Globe size={14} />
                  عربي / EN
                </motion.button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}