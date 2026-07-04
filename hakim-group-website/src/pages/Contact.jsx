// src/pages/Contact.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";

const WHATSAPP = "https://wa.me/201144505575?text=مرحباً، أريد التواصل مع فريق المبيعات";

export default function Contact() {
  const [form, setForm] = useState({ name: "", company: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    // In production: POST to your backend or EmailJS
    const msg = `مرحباً، أنا ${form.name} من شركة ${form.company}.\nرقم تواصل: ${form.phone}\n${form.message}`;
    window.open(`https://wa.me/201144505575?text=${encodeURIComponent(msg)}`, "_blank");
    setSent(true);
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all bg-white";

  return (
    <div dir="rtl" className="pt-20 min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-brand-blue text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-black mb-3"
        >
          تواصل معنا
        </motion.h1>
        <p className="text-blue-200 text-sm max-w-md mx-auto">
          فريق المبيعات متاح لك الأحد–الجمعة من 9 صباحاً حتى 5 مساءً.
        </p>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Contact info */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-800 mb-6">معلومات التواصل</h2>

            {[
              { icon: MapPin, label: "العنوان",        value: "مدينة نصر / العاشر من رمضان، مصر" },
              { icon: Phone,  label: "تليفون الإدارة", value: "+079 9215370" },
              { icon: Mail,   label: "البريد الإلكتروني", value: "info@hakimgroup.com" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-brand-blue" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-gray-800 font-semibold text-sm">{value}</p>
                </div>
              </div>
            ))}

            {/* WhatsApp quick link */}
            <motion.a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03, boxShadow: "0 8px 28px rgba(45,122,58,0.35)" }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  "0 0 0 0px rgba(45,122,58,0.4)",
                  "0 0 0 10px rgba(45,122,58,0.1)",
                  "0 0 0 0px rgba(45,122,58,0)",
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="flex items-center justify-center gap-3 w-full py-4 bg-brand-green text-white font-bold rounded-2xl"
            >
              <MessageCircle size={20} />
              واتساب المبيعات الموحد — 13563
            </motion.a>
          </div>

          {/* Contact form */}
          <div className="card p-7">
            <h2 className="text-xl font-bold text-gray-800 mb-6">أرسل رسالة</h2>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Send size={28} className="text-brand-green" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">تم الإرسال!</h3>
                <p className="text-gray-400 text-sm">سيتواصل معك فريقنا في أقرب وقت.</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">الاسم</label>
                    <input
                      name="name" value={form.name} onChange={handle} required
                      placeholder="اسمك الكامل"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">الشركة</label>
                    <input
                      name="company" value={form.company} onChange={handle}
                      placeholder="اسم شركتك"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">رقم الهاتف</label>
                  <input
                    name="phone" value={form.phone} onChange={handle} required
                    placeholder="01x xxxx xxxx"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">رسالتك</label>
                  <textarea
                    name="message" value={form.message} onChange={handle} required
                    rows={4}
                    placeholder="اكتب تفاصيل طلبك أو استفسارك..."
                    className={inputClass + " resize-none"}
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(26,58,107,0.25)" }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blueDark transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  إرسال عبر الواتساب
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
