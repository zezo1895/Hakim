// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { Phone, MapPin, Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import logo from "../assets/product_1079686086__employee.png";

const WHATSAPP = "https://wa.me/201144505575?text=أريد طلب تسعير";

const quickLinks = [
  { label: "الصفحة الرئيسية", to: "/" },
  { label: "عن المجموعة",      to: "/about" },
  { label: "كتالوج المنتجات",  to: "/products" },
  { label: "الجودة والسلامة", to: "/quality" },
  { label: "شهادات الاعتماد", to: "/certificates" },
  { label: "تواصل معنا",      to: "/contact" },
];

const sectors = [
  { label: "قطاع العبوات ومواد التعبئة والتغليف", to: "/products" },
  { label: "مواسير PVC & HDPE وشبكات البنية", to: "/products?category=مواسير" },
  { label: "بروفيلات الألومنيوم المعمارية والصناعية", to: "/aluminium" },
  { label: "طلب تصنيع مواصفات خاصة", to: "/contact" },
];

export default function Footer() {
  return (
    <footer dir="rtl" className="bg-[#f8fafc] text-slate-700 border-t border-slate-200/80 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">

          {/* Column 1: Company Profile */}
          <div className="flex flex-col">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src={logo}
                alt="شعار مجموعة حكيم"
                className="h-12 w-auto object-contain"
              />
              <div className="flex flex-col border-r border-slate-200 pr-3">
                <span className="text-base font-black text-brand-blue tracking-tight">
                  مجموعة حكيم
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider">
                  HAKIM GROUP · منذ 1975
                </span>
              </div>
            </Link>

            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
              صرح صناعي رائد في مصر والشرق الأوسط منذ عام 1975. نقدم حلولاً إنتاجية متقدمة في قطاعات البلاستيك، شبكات البنية التحتية، وبروفيلات الألومنيوم بأعلى مواصفات هندسية.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200/90 rounded-lg px-3 py-1.5 w-fit">
              <span className="w-2 h-2 rounded-full bg-brand-green" />
              <span>مجمعات العاشر من رمضان الصناعية</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>روابط سريعة</span>
              <span className="w-2 h-2 rounded-full bg-brand-blue" />
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-slate-600 text-sm hover:text-brand-blue hover:translate-x-1 inline-block transition-all duration-150 font-medium"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Industrial Sectors */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>القطاعات الإنتاجية</span>
              <span className="w-2 h-2 rounded-full bg-brand-blue" />
            </h4>
            <ul className="space-y-2.5">
              {sectors.map((s) => (
                <li key={s.label}>
                  <Link
                    to={s.to}
                    className="text-slate-600 text-sm hover:text-brand-blue hover:translate-x-1 inline-block transition-all duration-150 font-medium"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Fast B2B Quotes */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>تواصل مع الإدارة</span>
              <span className="w-2 h-2 rounded-full bg-brand-green" />
            </h4>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2.5 text-slate-600 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-blue" />
                <span>المنطقة الصناعية، العاشر من رمضان / القاهرة، مصر</span>
              </li>
              <li>
                <a
                  href="tel:01144505575"
                  className="flex items-center gap-2.5 text-slate-600 text-sm hover:text-brand-blue transition-colors font-medium"
                >
                  <Phone size={16} className="shrink-0 text-brand-blue" />
                  <span dir="ltr">01144505575</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@hakimgroup.com"
                  className="flex items-center gap-2.5 text-slate-600 text-sm hover:text-brand-blue transition-colors font-medium"
                >
                  <Mail size={16} className="shrink-0 text-brand-blue" />
                  <span>info@hakimgroup.com</span>
                </a>
              </li>
            </ul>

            {/* Direct WhatsApp Quote Button */}
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-green text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brand-greenDark transition-colors"
            >
              <MessageCircle size={16} />
              <span>طلب تسعير جملة عبر الواتساب</span>
              <ArrowUpRight size={14} className="opacity-75" />
            </a>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} مجموعة حكيم الصناعية (Hakim Group). جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-brand-blue transition-colors">عن المجموعة</Link>
            <Link to="/products" className="hover:text-brand-blue transition-colors">المنتجات</Link>
            <Link to="/contact" className="hover:text-brand-blue transition-colors">اتصل بنا</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}