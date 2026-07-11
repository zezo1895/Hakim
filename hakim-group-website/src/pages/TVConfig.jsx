// src/pages/TVConfig.jsx
// ============================================================================
// إعدادات شاشة العرض (/tv-config)
// نظام ترقيم يدوي للتحكم في ترتيب المنتجات والمجموعات - كتابة الرقم مباشرة
// ============================================================================

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
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
  Hash,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "hakim_tv_config_v1";
// ⚠️ لازم تطابق TRANSITION_DUR في backend/src/services/ffmpegVideoBuilder.js
// عشان تقدير المدة يبقى دقيق مع الفيديو الفعلي اللي هيتولد
const TRANSITION_DUR = 1.2;
// الباك إند شغال على /api عادةً، والفيديوهات بترجع كرابط نسبي زي /videos/xxx.mp4
// لازم نبنيه فوق دومين الباك إند نفسه (مش دومين الفرونت إند) عشان يفتح صح
const BACKEND_ORIGIN = API.replace(/\/api\/?$/, "");
// توليد الفيديو متاح بس وانت شغّال الموقع من جهازك (localhost) — مش على
// السيرفر الحقيقي، عشان توليد الفيديو تقيل على المعالج ومخصص للتطوير المحلي
const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

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

  // ── States for video generation progress ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // ── توفيق productOrder مع النطاق الحالي ──
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

  // عدد المنتجات لكل مجموعة
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

  // ── دالة توليد الفيديو مع مؤشر التقدم الحقيقي (مش مزيف) ──
  const handleGenerateVideo = async () => {
    if (!isLocalHost) {
      alert("توليد الفيديو متاح بس وانت شغّال الموقع من جهازك (localhost).");
      return;
    }
    if (finalOrder.length === 0) {
      alert("لا يوجد منتجات لتوليد الفيديو");
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const payload = {
      order: finalOrder,
      imgDur: imgDur,
      detailDur: detailDur,
      // musicUrl: "https://example.com/music.mp3"  // اختياري
    };

    try {
      // 1) نبدأ عملية التوليد — الباك إند بيرجع jobId فورًا من غير ما يستنى الرندر يخلص
      const startRes = await fetch(`${API}/video/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const startData = await startRes.json();

      if (!startData.success || !startData.jobId) {
        throw new Error(startData.error || "تعذر بدء عملية التوليد");
      }

      // 2) نسأل الباك إند كل نص ثانية عن نسبة التقدم الحقيقية لنفس الـ job
      const jobId = startData.jobId;
      const poll = () => {
        setTimeout(async () => {
          try {
            const res = await fetch(`${API}/video/progress/${jobId}`);
            if (!res.ok) throw new Error("تعذر متابعة تقدم التوليد");
            const job = await res.json();

            setProgress(job.progress ?? 0);

            if (job.status === "done") {
              setTimeout(() => {
                alert(`✅ تم توليد الفيديو بنجاح!`);
                const fullVideoUrl = job.videoUrl?.startsWith("http")
                  ? job.videoUrl
                  : `${BACKEND_ORIGIN}${job.videoUrl}`;
                window.open(fullVideoUrl, "_blank");
                setIsGenerating(false);
                setProgress(0);
              }, 400);
            } else if (job.status === "error") {
              setIsGenerating(false);
              setProgress(0);
              alert("❌ فشل في توليد الفيديو: " + job.error);
            } else {
              poll(); // لسه شغال، نسأل تاني بعد شوية
            }
          } catch (err) {
            console.error(err);
            setIsGenerating(false);
            setProgress(0);
            alert("حدث خطأ أثناء متابعة تقدم التوليد");
          }
        }, 500);
      };
      poll();
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      setProgress(0);
      alert("حدث خطأ أثناء الاتصال بالسيرفر");
    }
  };


  // ============================================================
  // 🆕 دالة ترتيب المجموعات بالأرقام - كتابة مباشرة
  // ============================================================
  const updateGroupOrder = (id, newPosition) => {
    setSelectedGroupIds((prev) => {
      const currentIndex = prev.indexOf(id);
      if (currentIndex === -1) return prev;
      
      // نضمن أن الرقم بين 1 وعدد المجموعات
      const newIndex = Math.max(0, Math.min(newPosition - 1, prev.length - 1));
      
      // إزالة العنصر وإدراجه في الموقع الجديد
      const copy = [...prev];
      const [item] = copy.splice(currentIndex, 1);
      copy.splice(newIndex, 0, item);
      return copy;
    });
  };

  // ============================================================
  // 🆕 دالة ترتيب المنتجات بالأرقام - كتابة مباشرة
  // ============================================================
  const updateProductOrder = (id, newPosition) => {
    setProductOrder((prev) => {
      const currentIndex = prev.indexOf(id);
      if (currentIndex === -1) return prev;
      
      // نضمن أن الرقم بين 1 وعدد المنتجات
      const newIndex = Math.max(0, Math.min(newPosition - 1, prev.length - 1));
      
      // إزالة العنصر وإدراجه في الموقع الجديد
      const copy = [...prev];
      const [item] = copy.splice(currentIndex, 1);
      copy.splice(newIndex, 0, item);
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

  // ── القائمة المرئية (مفلترة بالبحث) ──
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

  // ── تقدير دقيق لمدة الفيديو الفعلية (نفس منطق ffmpegVideoBuilder.js) ──
  const estimatedDurationSec = useMemo(() => {
    if (!finalOrder.length) return 0;
    let rawTotal = 0;
    let clipsCount = 0;
    for (const id of finalOrder) {
      const p = productsById.get(id);
      const imagesCount = p?.images?.length ? p.images.length : 1;
      rawTotal += imagesCount * imgDur + detailDur;
      clipsCount += imagesCount + 1; // +1 لكارت التفاصيل
    }
    const transitions = Math.max(0, clipsCount - 1);
    return Math.max(0, rawTotal - transitions * TRANSITION_DUR);
  }, [finalOrder, productsById, imgDur, detailDur]);

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

      {/* ============================================================
          PROGRESS OVERLAY - Full screen fixed overlay
          ============================================================ */}
      {isGenerating && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="relative flex flex-col items-center justify-center p-8">
            {/* Close button (optional, but we keep it for UX) */}
            <button
              onClick={() => {
                if (window.confirm("هل تريد إلغاء عملية توليد الفيديو؟")) {
                  setIsGenerating(false);
                  setProgress(0);
                }
              }}
              className="absolute top-4 right-4 text-white/60 hover:text-white/90 transition-colors p-2 rounded-full hover:bg-white/10"
            >
              <X size={24} />
            </button>

            {/* Progress Circle */}
            <div className="relative w-48 h-48">
              {/* Background circle */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                {/* Progress circle with gradient */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="326.726"
                  strokeDashoffset={326.726 - (progress / 100) * 326.726}
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Percentage inside circle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">
                  {Math.round(progress)}%
                </span>
                <span className="text-xs text-white/60 mt-1 font-medium">جاري التوليد</span>
              </div>
            </div>

            {/* Status message */}
            <div className="mt-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">
                جاري توليد الفيديو...
              </h3>
              <p className="text-sm text-white/60">
                عدد المنتجات: <span className="font-bold text-white/80">{finalOrder.length}</span>
                {" · "}
                المدة التقريبية: <span className="font-bold text-white/80">
                  {formatDuration(estimatedDurationSec)}
                </span>
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse delay-150" />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse delay-300" />
              </div>
            </div>
          </div>
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
            {isLocalHost && (
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                  isGenerating
                    ? "bg-gray-400 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 hover:shadow-violet-500/30"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    🎬 توليد فيديو MP4
                  </>
                )}
              </button>
            )}
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

          {/* اختيار وترتيب المجموعات - بالأرقام 🆕 كتابة مباشرة */}
          {mode === "groups" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers size={15} /> المجموعات ({selectedGroupIds.length} مختارة)
              </h3>

              {/* المجموعات المختارة - مرتبة بالأرقام */}
              {selectedGroupIds.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {selectedGroupIds.map((gid, idx) => (
                    <div
                      key={gid}
                      className="flex items-center gap-2 bg-brand-blueLight/60 border border-brand-blue/10 rounded-xl px-3 py-2"
                    >
                      {/* 🆕 رقم الترتيب - كتابة مباشرة فقط */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Hash size={14} className="text-gray-400" />
                        <input
                          type="number"
                          min="1"
                          max={selectedGroupIds.length}
                          value={idx + 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= selectedGroupIds.length) {
                              updateGroupOrder(gid, val);
                            }
                          }}
                          className="w-12 h-8 text-center text-sm font-bold text-brand-blue bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <span className="flex-1 text-sm font-bold text-gray-700 truncate">
                        {groupsById.get(gid)?.name || `مجموعة #${gid}`}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {groupCounts.get(gid) || 0} منتج
                      </span>
                      <button
                        onClick={() => toggleGroup(gid)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors shrink-0"
                      >
                        <EyeOff size={15} />
                      </button>
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
            <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between">
              <span className="text-sm font-bold opacity-80">مدة الفيديو المتوقعة</span>
              <span className="text-xl font-black">{formatDuration(estimatedDurationSec)}</span>
            </div>
          </div>
        </div>

        {/* ===== العمود الأيسر: قائمة المنتجات + الترتيب بالأرقام + الاستبعاد 🆕 ===== */}
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
                    {/* 🆕 رقم الترتيب - كتابة مباشرة فقط */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Hash size={13} className="text-gray-300" />
                      <input
                        type="number"
                        min="1"
                        max={productOrder.length}
                        value={globalIdx + 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= productOrder.length) {
                            updateProductOrder(id, val);
                          }
                        }}
                        className={`w-11 h-7 text-center text-xs font-bold rounded-lg border ${
                          excluded 
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                            : "bg-white border-gray-200 text-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                        } focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        disabled={excluded}
                      />
                    </div>

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
          
          {/* 🆕 إرشادات استخدام نظام الترقيم */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <Hash size={12} />
              اكتب الرقم المطلوب مباشرة لتحديد ترتيب الظهور — الرقم 1 يظهر أولاً
            </p>
          </div>
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