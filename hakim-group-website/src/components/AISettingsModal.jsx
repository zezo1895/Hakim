import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Bot, Save, Loader2, CheckCircle2, Sparkles } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AISettingsModal({ authKey, onClose }) {
  const [instructions, setInstructions] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API}/ai/settings`, {
          headers: { Authorization: `Bearer ${authKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          setInstructions(data.custom_instructions || "");
          setWelcomeMsg(data.welcome_message || "");
        }
      } catch (e) {
        console.error("Failed to load AI settings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [authKey]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API}/ai/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify({
          custom_instructions: instructions,
          welcome_message: welcomeMsg,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save AI settings:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2.5 rounded-full">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">إعدادات المساعد الذكي</h2>
              <p className="text-blue-100 text-sm mt-0.5">علّم الذكاء الاصطناعي عن منتجاتك</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition">
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-blue" size={32} />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Welcome Message */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-500" />
                رسالة الترحيب
              </label>
              <p className="text-xs text-gray-400 mb-2">الرسالة اللي بتظهر للعميل أول ما يفتح الشات</p>
              <input
                type="text"
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition"
                placeholder="أهلاً بيك في حكيم جروب! 🌟"
              />
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Bot size={16} className="text-brand-blue" />
                تعليمات خاصة للمساعد الذكي
              </label>
              <p className="text-xs text-gray-400 mb-3">
                اكتب هنا أي تعليمات أو معلومات عاوز الذكاء الاصطناعي يعرفها عن منتجاتك. اكتب بأسلوبك العادي وهو هيفهم.
              </p>
              
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mb-3 text-xs text-blue-700 space-y-1.5">
                <p className="font-bold text-blue-800">💡 أمثلة على اللي تقدر تكتبه:</p>
                <p>• "علبة الـ 250 مل دي بتنفع لحصة أرز صغيرة أو سلطة فردي"</p>
                <p>• "كوباية الـ 8 أونصة بتنفع للشاي والقهوة والنسكافيه"</p>
                <p>• "سلطانية الـ 750 مل دي أحسن حاجة للكشري والفتة"</p>
                <p>• "لو العميل قال عاوز علب فول، رشحله علبة 200 مل PP"</p>
                <p>• "منتجات الـ PET الشفافة بتنفع للحلويات والسلطات والعصاير"</p>
                <p>• "لو سأل عن أكل سخن أو مايكرويف، لازم PP بس"</p>
              </div>

              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={12}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition resize-y leading-relaxed"
                placeholder="اكتب هنا التعليمات الخاصة بمنتجاتك...

مثال:
- علبة 250 مل PP بتنفع للأرز الفردي والكشري الصغير
- كوباية 12 أونصة PET شفافة بتنفع للعصاير والسموذي
- سلطانية 1000 مل PP بتنفع للوجبات العائلية الكبيرة
- لو العميل بيسأل عن صوص، رشحله أكواب الصوص الصغيرة 50 مل
- أي حاجة سخنة لازم PP مش PET ولا PS"
              />
              <p className="text-xs text-gray-400 mt-2 text-left">
                {instructions.length} / 5000 حرف
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "جاري الحفظ..." : "حفظ التعليمات"}
              </button>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-green-600 text-sm font-bold"
                >
                  <CheckCircle2 size={18} />
                  تم الحفظ بنجاح!
                </motion.span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
