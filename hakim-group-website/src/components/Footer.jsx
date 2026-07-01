// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, MapPin, Mail, Share2, MessageSquare, Camera } from "lucide-react";

const WHATSAPP = "https://wa.me/201234567890";

const quickLinks = [
  { label: "الصفحة الرئيسية", to: "/" },
  { label: "عن الشركة",       to: "/about" },
  { label: "المنتجات",         to: "/products" },
  { label: "الجودة والسلامة", to: "/quality" },
  { label: "شهاداتنا",         to: "/certificates" },
  { label: "اتصل بنا",         to: "/contact" },
];

const sectors = [
  { label: "التغليف الغذائي" },
  { label: "مواسير PVC & HDPE" },
  { label: "بروفيلات الألومنيوم" },
  { label: "كتالوج المنتجات" },
];

export default function Footer() {
  return (
    <footer dir="rtl" className="bg-brand-blue text-white pt-14 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 w-fit">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center select-none">
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-black text-brand-blue tracking-tighter">HG</span>
                  <span className="text-[4.5px] font-bold text-brand-green">Hakim Group</span>
                </div>
              </div>
              <span className="text-white font-extrabold text-sm">حكيم جروب</span>
            </Link>
            <p className="text-blue-200 text-sm leading-relaxed mb-5">
              شركاؤكم في التعبئة والتغليف منذ عام 1975. حلول متكاملة لقطاعات الأغذية والمواسير والألومنيوم.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Share2,        href: "#" },
                { icon: MessageSquare, href: "#" },
                { icon: Camera,        href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  whileHover={{ scale: 1.15, backgroundColor: "rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.92 }}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-colors"
                >
                  <Icon size={15} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white border-r-2 border-brand-green pr-2">
              روابط سريعة
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-blue-200 text-sm hover:text-white transition-colors hover:translate-x-1 inline-block transition-transform"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sectors */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white border-r-2 border-brand-green pr-2">
              قطاعاتنا
            </h4>
            <ul className="space-y-2.5">
              {sectors.map((s) => (
                <li key={s.label}>
                  <Link
                    to="/products"
                    className="text-blue-200 text-sm hover:text-white transition-colors"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white border-r-2 border-brand-green pr-2">
              تواصل معنا
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-blue-200 text-sm">
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand-greenBright" />
                <span>مدينة نصر / العاشر من رمضان، مصر</span>
              </li>
              <li>
                <a
                  href="tel:+201234567890"
                  className="flex items-center gap-2 text-blue-200 text-sm hover:text-white transition-colors"
                >
                  <Phone size={15} className="shrink-0 text-brand-greenBright" />
                  <span>+079 9215370</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@hakimgroup.com"
                  className="flex items-center gap-2 text-blue-200 text-sm hover:text-white transition-colors"
                >
                  <Mail size={15} className="shrink-0 text-brand-greenBright" />
                  <span>info@hakimgroup.com</span>
                </a>
              </li>
            </ul>

            {/* WhatsApp CTA */}
            <motion.a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-brand-green text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              واتساب المبيعات الموحد
            </motion.a>
            <p className="text-center text-blue-300 text-xs mt-1">13563</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-blue-300 text-xs">
          <p>جميع الحقوق محفوظة لحكيم جروب © 2026</p>
          <p>تصميم وتطوير بواسطة فريق حكيم التقني</p>
        </div>
      </div>
    </footer>
  );
}