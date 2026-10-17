// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { Menu, X, Phone, ArrowUpRight, ChevronDown, Box, Package, ShieldCheck, ArrowLeft, Sparkles } from "lucide-react";
import logo from "../assets/product_1079686086__employee.png";

const navLinks = [
  { label: "الرئيسية",        to: "/" },
  { label: "عن المجموعة",      to: "/about" },
  { label: "المنتجات",        to: "/products", hasDropdown: true },
  { label: "الجودة والسلامة", to: "/quality" },
  { label: "الشهادات",        to: "/certificates" },
  { label: "اتصل بنا",        to: "/contact" },
];

export const productSectors = [
  {
    title: "قطاع العبوات ومواد التعبئة والتغليف",
    desc: "حلول البلاستيك والفوم والكرتون الغذائي والصناعي",
    to: "/products?category=بلاستيك",
    badge: "بلاستيك وفومو كرتون",
    icon: Package,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "قطاع بروفيلات الألومنيوم والمعاينة 3D",
    desc: "بروفيلات معمارية مع فحص الأبعاد وتغيير الألوان 3D",
    to: "/aluminium",
    badge: "معاينة 3D",
    icon: Box,
    color: "text-brand-blue bg-blue-50",
  },
  {
    title: "قطاع المواسير وشبكات البنية التحتية",
    desc: "مواسير وقطع شبكات متينة لمشروعات البنية والري",
    to: "/products?category=مواسير",
    badge: "مواسير PVC",
    icon: ShieldCheck,
    color: "text-amber-600 bg-amber-50",
  },
  
];

const WHATSAPP = "https://wa.me/201144505575?text=أريد طلب تسعير";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(true);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setIsOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setProductsDropdownOpen(false);
  }, [location.pathname, location.search]);

  return (
    <>
      <header
        dir="rtl"
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-2.5"
            : "bg-white border-b border-slate-100 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="شعار مجموعة حكيم الصناعية"
                className={`w-auto object-contain transition-all duration-300 ${
                  scrolled ? "h-10 sm:h-11" : "h-12 sm:h-14"
                }`}
              />
              <div className="flex flex-col border-r border-slate-200 pr-3">
                <span className="text-base sm:text-lg font-black text-brand-blue tracking-tight leading-none">
                  مجموعة حكيم
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 tracking-wider mt-1">
                  HAKIM GROUP · منذ 1975
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const isProducts = link.hasDropdown;
                const active = isProducts
                  ? location.pathname.startsWith("/products") || location.pathname === "/aluminium"
                  : location.pathname === link.to;

                if (isProducts) {
                  return (
                    <div
                      key={link.to}
                      className="relative"
                      onMouseEnter={() => setProductsDropdownOpen(true)}
                      onMouseLeave={() => setProductsDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setProductsDropdownOpen((v) => !v)}
                        className={`relative px-3.5 py-2 text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 rounded-lg ${
                          active ? "text-brand-blue font-bold" : "text-slate-600 hover:text-brand-blue"
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${productsDropdownOpen ? "rotate-180 text-brand-blue" : "text-slate-400"}`}
                        />
                        {active && (
                          <motion.span
                            layoutId={shouldReduceMotion ? undefined : "navbarUnderline"}
                            className="absolute bottom-0 right-3.5 left-3.5 h-[2px] bg-brand-blue rounded-full"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {productsDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="absolute right-0 top-full pt-2 w-96 z-50"
                          >
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 overflow-hidden">
                              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                                  اختر قطاع المنتجات للتصفح
                                </span>
                              </div>
                              <div className="space-y-1">
                                {productSectors.map((sector) => {
                                  const SectorIcon = sector.icon;
                                  return (
                                    <Link
                                      key={sector.to}
                                      to={sector.to}
                                      onClick={() => setProductsDropdownOpen(false)}
                                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                                    >
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sector.color} group-hover:scale-105 transition-transform`}>
                                        <SectorIcon size={18} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-brand-blue transition-colors">
                                            {sector.title}
                                          </h4>
                                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                            {sector.badge}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                          {sector.desc}
                                        </p>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-3.5 py-2 text-sm font-semibold transition-colors duration-200 ${
                      active ? "text-brand-blue font-bold" : "text-slate-600 hover:text-brand-blue"
                    }`}
                  >
                    <span>{link.label}</span>
                    {active && (
                      <motion.span
                        layoutId={shouldReduceMotion ? undefined : "navbarUnderline"}
                        className="absolute bottom-0 right-3.5 left-3.5 h-[2px] bg-brand-blue rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions / CTA Button */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-green hover:bg-brand-greenDark shadow-sm hover:shadow transition-all duration-200"
              >
                <Phone size={15} />
                <span>طلب عرض سعر</span>
                <ArrowUpRight size={14} className="opacity-75 -mr-0.5" />
              </a>
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isOpen ? "close" : "open"}
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {isOpen ? <X size={22} /> : <Menu size={22} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Scroll Progress Bar directly under Navbar */}
        <motion.div
          style={{ scaleX }}
          className="absolute bottom-0 right-0 left-0 h-[2px] bg-brand-blue origin-right"
        />
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="mobile-drawer"
              dir="rtl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col border-l border-slate-100 lg:hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="شعار مجموعة حكيم" className="h-9 w-auto object-contain" />
                  <span className="font-extrabold text-sm text-brand-blue">مجموعة حكيم</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
                {navLinks.map((link) => {
                  if (link.hasDropdown) {
                    const isProductsActive = location.pathname.startsWith("/products") || location.pathname === "/aluminium";
                    return (
                      <div key={link.to} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setMobileProductsOpen((v) => !v)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            isProductsActive
                              ? "bg-brand-blue/10 text-brand-blue font-bold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-brand-blue"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{link.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue font-bold">
                              قطاعات
                            </span>
                          </span>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${mobileProductsOpen ? "rotate-180 text-brand-blue" : "text-slate-400"}`}
                          />
                        </button>

                        <AnimatePresence>
                          {mobileProductsOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden pr-3 pl-1 space-y-1 border-r-2 border-slate-100 mr-2"
                            >
                              {productSectors.map((sector) => {
                                const SectorIcon = sector.icon;
                                const isSectorActive = location.pathname + location.search === sector.to;
                                return (
                                  <Link
                                    key={sector.to}
                                    to={sector.to}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                                      isSectorActive
                                        ? "bg-brand-blue/15 text-brand-blue font-bold"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-brand-blue"
                                    }`}
                                  >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${sector.color}`}>
                                      <SectorIcon size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold truncate text-slate-800">{sector.title}</div>
                                      <div className="text-[10px] text-slate-400 truncate">{sector.badge}</div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  const active = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? "bg-brand-blue/10 text-brand-blue font-bold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-brand-blue"
                      }`}
                    >
                      <span>{link.label}</span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-brand-green text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brand-greenDark transition-colors"
                >
                  <Phone size={16} />
                  <span>طلب عرض سعر عبر الواتساب</span>
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}