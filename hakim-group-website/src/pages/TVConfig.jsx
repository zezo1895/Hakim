// src/pages/TVConfig.jsx
// ============================================================================
// إعدادات شاشة العرض (/tv-config)
// صفحة تحكم مستقلة تمامًا — لا تُعدّل أي جزء من الموقع الأساسي.
// من هنا تقدر تختار المجموعات، تستبعد منتجات، ترتب المجموعات والمنتجات،
// تحدد توقيت كل صورة وتوقيت شاشة التفاصيل، ثم تشغّل شاشة العرض مباشرة.
// ============================================================================

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  Play,
  Copy,
  Check,
  Tv,
  Layers,
  RotateCcw,
  ListOrdered,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "hakim_tv_config_v1";

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function TVConfig() {
  const [allProducts, setAllProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // mode: 'all' → كل المنتجات، 'groups' → مجموعات محددة فقط
  const [mode, setMode] = useState("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]); // ordered
  const [productOrder, setProductOrder] = useState([]); // ordered ids (full scope)
  const [excludedIds, setExcludedIds] = useState([]); // ids to skip on the TV
  const [imgDur, setImgDur] = useState(2);
  const [detailDur, setDetailDur] = useState(6);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [restored, setRestored] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // ── تحميل المنتجات والمجموعات ──
  useEffect(() => {
    async function load() {
      try {
        const [pRes, gRes] = await Promise.all([
          fetch(`${API}/products`),
          fetch(`${API}/products/groups`),
        ]);
        if (!pRes.ok) throw new Error(`فشل تحميل المنتجات (HTTP ${pRes.status})`);
        if (!gRes.ok) throw new Error(`فشل تحميل المجموعات (HTTP ${gRes.status})`);
        const [products, grps] = await Promise.all([pRes.json(), gRes.json()]);
        setAllProducts(Array.isArray(products) ? products : []);
        setGroups(Array.isArray(grps) ? grps : []);
        setLoadError(null);
      } catch (e) {
        console.error("TVConfig load error:", e);
        setLoadError(
          e.message?.includes("fetch") || e instanceof TypeError
            ? `تعذر الاتصال بالباك إند على: ${API} — تأكد إن السيرفر شغال وإن VITE_API_URL صحيح.`
            : e.message
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── استرجاع آخر إعداد محفوظ محليًا (مرة واحدة بعد تحميل المنتجات) ──
  useEffect(() => {
    if (loading || restored) return;
    const stored = loadStored();
    if (stored) {
      setMode(stored.mode ?? "all");
      setSelectedGroupIds(stored.selectedGroupIds ?? []);
      setProductOrder(stored.productOrder ?? []);
      setExcludedIds(stored.excludedIds ?? []);
      setImgDur(stored.imgDur ?? 2);
      setDetailDur(stored.detailDur ?? 6);
    }
    setRestored(true);
  }, [loading, restored]);

  // ── نطاق المنتجات الحالي حسب الوضع (all / groups) ──
  const scopeIds = useMemo(() => {
    if (mode === "all") return allProducts.map((p) => p.id);
    if (!selectedGroupIds.length) return [];
    const groupRank = new Map(selectedGroupIds.map((id, i) => [id, i]));
    return allProducts
      .filter((p) => groupRank.has(p.group_id))
      .sort((a, b) => groupRank.get(a.group_id) - groupRank.get(b.group_id))
      .map((p) => p.id);
  }, [mode, selectedGroupIds, allProducts]);

  // ── توفيق productOrder مع النطاق الحالي: الحفاظ على ترتيب المستخدم،
  //    إضافة أي منتجات جديدة دخلت النطاق، وحذف اللي خرجت منه ──
  useEffect(() => {
    if (!restored) return;
    setProductOrder((prev) => {
      const scopeSet = new Set(scopeIds);
      const kept = prev.filter((id) => scopeSet.has(id));
      const keptSet = new Set(kept);
      const added = scopeIds.filter((id) => !keptSet.has(id));
      return [...kept, ...added];
    });
  }, [scopeIds, restored]);

  // ── حفظ الإعدادات محليًا مع كل تغيير ──
  useEffect(() => {
    if (!restored) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode, selectedGroupIds, productOrder, excludedIds, imgDur, detailDur })
    );
  }, [mode, selectedGroupIds, productOrder, excludedIds, imgDur, detailDur, restored]);

  const productsById = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);
  const groupsById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  // عدد المنتجات لكل مجموعة (لعرضها بجانب اسمها)
  const groupCounts = useMemo(() => {
    const m = new Map();
    allProducts.forEach((p) => {
      if (p.group_id) m.set(p.group_id, (m.get(p.group_id) || 0) + 1);
    });
    return m;
  }, [allProducts]);

  const toggleGroup = (id) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const moveGroup = (id, dir) => {
    setSelectedGroupIds((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const moveProduct = (id, dir) => {
    setProductOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const toggleExclude = (id) => {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const resetAll = () => {
    setMode("all");
    setSelectedGroupIds([]);
    setExcludedIds([]);
    setImgDur(2);
    setDetailDur(6);
    setProductOrder(allProducts.map((p) => p.id));
  };

  // ── القائمة المرئية (مفلترة بالبحث فقط للعرض، مش بتأثر على الترتيب الفعلي) ──
  const visibleProductOrder = useMemo(() => {
    if (!search.trim()) return productOrder;
    const q = search.trim().toLowerCase();
    return productOrder.filter((id) => {
      const p = productsById.get(id);
      if (!p) return false;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.size?.toLowerCase().includes(q)
      );
    });
  }, [productOrder, search, productsById]);

  const finalOrder = useMemo(
    () => productOrder.filter((id) => !excludedIds.includes(id)),
    [productOrder, excludedIds]
  );

  const tvUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (finalOrder.length) params.set("order", finalOrder.join(","));
    params.set("imgDur", String(imgDur));
    params.set("detailDur", String(detailDur));
    return `${window.location.origin}/tv?${params.toString()}`;
  }, [finalOrder, imgDur, detailDur]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tvUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* تجاهل */
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 font-arabic">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-arabic pb-24">
      {loadError && (
        <div className="bg-red-50 border-b border-red-100 text-red-600 text-sm font-bold px-6 py-3 text-center">
          ⚠️ {loadError}
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
              <Tv size={22} className="text-brand-blue" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">إعدادات شاشة العرض</h1>
              <p className="text-sm text-gray-400">تحكم كامل فيما يظهر على شاشات المعرض</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <RotateCcw size={16} />
              إعادة تعيين
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {copied ? <Check size={16} className="text-brand-green" /> : <Copy size={16} />}
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </button>
            <a
              href={tvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-green hover:opacity-90 transition-opacity shadow-[0_10px_25px_rgba(45,122,58,0.3)]"
            >
              <Play size={16} />
              تشغيل شاشة العرض
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8 grid lg:grid-cols-[1fr_1.3fr] gap-6">
        {/* ===== العمود الأيمن: الوضع + المجموعات + التوقيت ===== */}
        <div className="space-y-6">
          {/* وضع العرض */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4">
              المنتجات المعروضة
            </h3>
            <div className="flex gap-2 mb-1">
              <button
                onClick={() => setMode("all")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  mode === "all"
                    ? "bg-brand-blue text-white shadow-md"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                كل المنتجات
              </button>
              <button
                onClick={() => setMode("groups")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  mode === "groups"
                    ? "bg-brand-blue text-white shadow-md"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                مجموعات محددة
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              {mode === "all"
                ? "هيظهر كل منتجات الكتالوج على الشاشة."
                : "هيظهر فقط منتجات المجموعات (المقاسات المترابطة) اللي هتختارها تحت، بنفس ترتيب اختيارك."}
            </p>
          </div>

          {/* اختيار وترتيب المجموعات */}
          {mode === "groups" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers size={15} /> المجموعات ({selectedGroupIds.length} مختارة)
              </h3>

              {/* المجموعات المختارة - مرتبة */}
              {selectedGroupIds.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {selectedGroupIds.map((gid, idx) => (
                    <div
                      key={gid}
                      className="flex items-center gap-2 bg-brand-blueLight/60 border border-brand-blue/10 rounded-xl px-3 py-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm font-bold text-gray-700 truncate">
                        {groupsById.get(gid)?.name || `مجموعة #${gid}`}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {groupCounts.get(gid) || 0} منتج
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => moveGroup(gid, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded-lg hover:bg-white disabled:opacity-25 transition-colors"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          onClick={() => moveGroup(gid, 1)}
                          disabled={idx === selectedGroupIds.length - 1}
                          className="p-1 rounded-lg hover:bg-white disabled:opacity-25 transition-colors"
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          onClick={() => toggleGroup(gid)}
                          className="p-1 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        >
                          <EyeOff size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* المجموعات المتاحة لإضافتها */}
              <div className="flex flex-wrap gap-2">
                {groups
                  .filter((g) => !selectedGroupIds.includes(g.id))
                  .map((g) => (
                    <button
                      key={g.id}
                      onClick={() => toggleGroup(g.id)}
                      className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-gray-50 text-gray-500 border border-gray-100 hover:border-brand-blue/30 hover:text-brand-blue transition-colors"
                    >
                      + {g.name}{" "}
                      <span className="text-gray-300">({groupCounts.get(g.id) || 0})</span>
                    </button>
                  ))}
                {groups.length === 0 && (
                  <p className="text-sm text-gray-400">لا توجد مجموعات في قاعدة البيانات.</p>
                )}
              </div>
            </div>
          )}

          {/* التوقيت */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4">
              التوقيت
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-600">مدة كل صورة</label>
                  <span className="text-sm font-black text-brand-blue">{imgDur} ثانية</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={imgDur}
                  onChange={(e) => setImgDur(Number(e.target.value))}
                  className="w-full accent-brand-blue"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-600">مدة شاشة بيانات المنتج</label>
                  <span className="text-sm font-black text-brand-green">{detailDur} ثانية</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="0.5"
                  value={detailDur}
                  onChange={(e) => setDetailDur(Number(e.target.value))}
                  className="w-full accent-brand-green"
                />
              </div>
            </div>
          </div>

          {/* ملخص */}
          <div className="bg-brand-blue rounded-2xl p-5 text-white">
            <p className="text-sm font-bold opacity-80 mb-1">إجمالي المنتجات على الشاشة</p>
            <p className="text-3xl font-black">{finalOrder.length}</p>
            {excludedIds.length > 0 && (
              <p className="text-xs opacity-70 mt-1">{excludedIds.length} منتج مستبعد يدويًا</p>
            )}
          </div>
        </div>

        {/* ===== العمود الأيسر: قائمة المنتجات + الترتيب + الاستبعاد ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <ListOrdered size={15} /> ترتيب المنتجات واستبعادها
            </h3>
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الكود..."
                className="pr-9 pl-3 py-2 rounded-xl border border-gray-100 bg-gray-50 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>

          {visibleProductOrder.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {productOrder.length === 0
                ? "اختر مجموعة واحدة على الأقل من العمود المجاور."
                : "لا توجد نتائج مطابقة للبحث."}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pl-1">
              {visibleProductOrder.map((id) => {
                const p = productsById.get(id);
                if (!p) return null;
                const excluded = excludedIds.includes(id);
                const globalIdx = productOrder.indexOf(id);
                const thumb = p.images?.[0]?.url || p.images?.[0];
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
                      excluded
                        ? "bg-gray-50 border-gray-100 opacity-50"
                        : "bg-white border-gray-100 hover:border-brand-blue/20"
                    }`}
                  >
                    <span className="w-6 text-xs font-black text-gray-300 shrink-0 text-center">
                      {globalIdx + 1}
                    </span>
                    <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-[9px] text-gray-300">لا صورة</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${excluded ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {[p.code, p.size, p.group_id ? groupsById.get(p.group_id)?.name : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => moveProduct(id, -1)}
                        disabled={globalIdx === 0}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition-colors"
                        title="لأعلى"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveProduct(id, 1)}
                        disabled={globalIdx === productOrder.length - 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition-colors"
                        title="لأسفل"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => toggleExclude(id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          excluded
                            ? "text-brand-green hover:bg-brand-greenLight"
                            : "text-gray-400 hover:bg-red-50 hover:text-red-400"
                        }`}
                        title={excluded ? "إظهار المنتج" : "استبعاد المنتج"}
                      >
                        {excluded ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-6">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← الرجوع للموقع الأساسي
        </Link>
      </div>
    </div>
  );
}