// src/components/TVGate.jsx
// ============================================================================
// حارس دخول لصفحات الكيوسك (/tv و /tv-config).
//
// دلوقتي الدخول مش بيتم بكتابة باسورد فى الصفحة نفسها ولا برابط فيه ?secret=،
// الطريقة الوحيدة للدخول هي زرار "فتح شاشة العرض" جوه لوحة تحكم الأدمن
// (/admin) بعد ما تسجّل دخولك هناك. الزرار ده هو اللي بيحط علامة الصلاحية،
// وبعدها بس المتصفح/الجهاز ده يقدر يفتح /tv أو /tv-config.
//
// لو حد فتح الرابط مباشرة من غير ما يعدي من لوحة الأدمن، هيشوف رسالة "غير
// مسموح" بس، من غير أي طريقة يفتح بيها الشاشة من هنا.
// ============================================================================

import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export const TV_ACCESS_KEY = "hakim_tv_admin_ok";

export function grantTVAccess() {
  localStorage.setItem(TV_ACCESS_KEY, "1");
}

function hasTVAccess() {
  return localStorage.getItem(TV_ACCESS_KEY) === "1";
}

export default function TVGate({ children }) {
  if (!hasTVAccess()) {
    return (
      <div className="fixed inset-0 bg-[#0b1220] flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={22} className="text-white/70" />
          </div>
          <h1 className="text-white font-black text-lg mb-1">غير مسموح</h1>
          <p className="text-white/40 text-sm mb-6">
            الصفحة دي متاحة بس من خلال زرار "فتح شاشة العرض" جوه لوحة تحكم الأدمن.
          </p>
          <Link
            to="/admin"
            className="block w-full py-3 rounded-2xl bg-white text-[#0b1220] font-bold hover:opacity-90 transition"
          >
            الذهاب للوحة الأدمن
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
