import React, { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  X,
  Upload,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Box,
  Image as ImageIcon,
} from "lucide-react";
import {
  POWDER_COATING_FINISHES,
  getCustomWoodFinishes,
  saveCustomWoodFinish,
  deleteCustomWoodFinish,
} from "../../data/powderCoatingColors";
import { createAluminiumMaterial, clearMaterialCache } from "../../utils/aluminiumMaterials";

// مساعدة: استخراج متوسط اللون الدقيق من صورة الكانفس
function extractAverageHex(canvas) {
  try {
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let r = 0, g = 0, b = 0, count = 0;
    // عينة كل 8 بكسل للسرعة
    for (let i = 0; i < data.length; i += 32) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (count === 0) return "#8B5A2B";
    const toHex = (n) => Math.round(n / count).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  } catch {
    return "#8B5A2B";
  }
}

export default function WoodFinishesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("add"); // "add" | "browse"
  const [copiedId, setCopiedId] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // الحقول الأساسية البسيطة جداً المطلوبة من المستخدم
  const [woodName, setWoodName] = useState("");
  const [compressedDataUrl, setCompressedDataUrl] = useState(null);
  const [fileName, setFileName] = useState("");

  // حقول متقدمة تُحسب تلقائياً
  const [extractedHex, setExtractedHex] = useState("#8B5A2B");
  const [woodCode, setWoodCode] = useState("");
  const [textureRotate, setTextureRotate] = useState(0);
  const [roughness, setRoughness] = useState(0.55);

  // قائمة العينات المخصصة المحفوظة
  const [customFinishes, setCustomFinishes] = useState([]);

  const refreshCustom = () => {
    setCustomFinishes(getCustomWoodFinishes());
  };

  useEffect(() => {
    if (isOpen) {
      refreshCustom();
      setSaveSuccess(false);
      // كود افتراضي تسلسلي
      const current = getCustomWoodFinishes();
      setWoodCode(`W-${117 + current.length}`);
    }
  }, [isOpen]);

  const standardWoodFinishes = useMemo(() => {
    return POWDER_COATING_FINISHES.filter((f) => f.category === "wood" || f.isWood);
  }, []);

  // معالجة وضغط الصورة فور سحبها أو اختيارها
  const fileInputRef = useRef(null);

  const processAndCompressImage = (file) => {
    if (!file) return;
    setFileName(file.name);

    // استخدام الاسم التلقائي إذا لم يكتب المستخدم اسماً بعد
    if (!woodName) {
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setWoodName(baseName.length > 20 ? "خامة خشب جديدة" : baseName);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // ضغط الصورة إلى أبعاد 512×512 مثالية لـ Three.js وتخزين خفيف جداً (~35 KB)
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 512, 512);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCompressedDataUrl(dataUrl);

        // استخراج اللون الأساسي تلقائياً
        const avgHex = extractAverageHex(canvas);
        setExtractedHex(avgHex);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processAndCompressImage(file);
    }
  };

  // كائن التشطيب الجاهز
  const finishId = useMemo(() => {
    const clean = (woodCode || "w-custom").toLowerCase().replace(/[^a-z0-9]/g, "-");
    return `wood-${clean}`;
  }, [woodCode]);

  const currentFinishObject = useMemo(() => {
    return {
      id: finishId,
      category: "wood",
      code: woodCode.trim() || "W-117",
      nameAr: woodName.trim() || "خامة خشب مميزة",
      nameEn: woodName.trim() || "Custom Wood",
      shortName: (woodName.trim() || "خشب").split(" ")[0],
      hex: extractedHex,
      metalness: 0.05,
      roughness: parseFloat(roughness) || 0.55,
      isWood: true,
      texture: compressedDataUrl || `/textures/wood/${finishId}.jpg`,
      textureRotate: parseInt(textureRotate, 10) || 0,
    };
  }, [finishId, woodCode, woodName, extractedHex, roughness, compressedDataUrl, textureRotate]);

  // حفظ وتشغيل فوري في الموقع
  const handleSave = async () => {
    if (!compressedDataUrl) {
      alert("يرجى اختيار صورة الخشب أولاً!");
      return;
    }

    // 1. مسح كاش الخامات لضمان التحديث اللحظي
    clearMaterialCache();

    // 2. محاولة حفظ الصورة كملف حقيقي في مجلد المشروع إذا كان سيرفر التطوير يعمل
    try {
      await fetch("/api/save-wood-texture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `${finishId}.jpg`,
          dataUrl: compressedDataUrl,
        }),
      });
    } catch {
      // Fallback: يعمل أيضاً بدون سيرفر عبر التخزين المحلي
    }

    // 3. الحفظ في التخزين المحلي (حجم خفيف 35KB يضمن عدم تجاوز المساحة)
    saveCustomWoodFinish(currentFinishObject);
    refreshCustom();

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const copyToClipboard = (text, id = "btn") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  // -------------------------------------------------------------
  // Live 3D Mini Preview Scene
  // -------------------------------------------------------------
  const previewCanvasRef = useRef(null);
  const threeRef = useRef({ scene: null, camera: null, renderer: null, controls: null, mesh: null, animId: null });

  useEffect(() => {
    if (!isOpen || activeTab !== "add") return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 300;
    const height = canvas.clientHeight || 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0c121e");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(2.0, 1.6, 2.3);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.8;

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight1.position.set(4, 6, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xdbeafe, 0.6);
    dirLight2.position.set(-4, -2, -3);
    scene.add(dirLight2);

    // قطاع ألومنيوم ثلاثي الأبعاد
    const shape = new THREE.Shape();
    shape.moveTo(-0.6, -0.3);
    shape.lineTo(0.6, -0.3);
    shape.lineTo(0.6, 0.3);
    shape.lineTo(0.48, 0.3);
    shape.lineTo(0.48, -0.18);
    shape.lineTo(-0.48, -0.18);
    shape.lineTo(-0.48, 0.3);
    shape.lineTo(-0.6, 0.3);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
    });
    geom.center();

    // Box UV
    const pos = geom.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uvs[i * 2] = (pos.getZ(i) + 1.1) * 1.5;
      uvs[i * 2 + 1] = (pos.getX(i) + pos.getY(i) + 1.0) * 1.0;
    }
    geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    const initialMat = createAluminiumMaterial(currentFinishObject);
    const mesh = new THREE.Mesh(geom, initialMat);
    scene.add(mesh);

    threeRef.current = { scene, camera, renderer, controls, mesh, geom };

    const animate = () => {
      threeRef.current.animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvas || !renderer || !camera) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (threeRef.current.animId) cancelAnimationFrame(threeRef.current.animId);
      controls.dispose();
      renderer.dispose();
      geom.dispose();
    };
  }, [isOpen, activeTab]);

  // تحديث الخامة فوراً على المجسم عند تغيير الصورة
  useEffect(() => {
    if (!threeRef.current?.mesh) return;
    const mesh = threeRef.current.mesh;

    if (compressedDataUrl) {
      new THREE.TextureLoader().load(compressedDataUrl, (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        if (textureRotate) {
          tex.center.set(0.5, 0.5);
          tex.rotation = THREE.MathUtils.degToRad(textureRotate);
        }
        tex.needsUpdate = true;

        mesh.material = new THREE.MeshPhysicalMaterial({
          map: tex,
          color: 0xffffff,
          metalness: 0.05,
          roughness: parseFloat(roughness) || 0.55,
          clearcoat: 0.12,
        });
        mesh.material.needsUpdate = true;
      });
    } else {
      mesh.material = createAluminiumMaterial(currentFinishObject);
      mesh.material.needsUpdate = true;
    }
  }, [currentFinishObject, compressedDataUrl, textureRotate, roughness]);

  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* رأس النافذة */}
        <div className="bg-gradient-to-r from-amber-900 to-amber-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0">
              🌲
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">إضافة خامة خشب للألومنيوم</h2>
              <p className="text-xs text-amber-200/90">ارمي الصورة واكتب الاسم فقط — ويتم التفعيل فوراً في الموقع</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* التبويبات */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("add")}
            className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
              activeTab === "add"
                ? "border-amber-700 text-amber-800 bg-white rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ➕ إضافة سريعة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("browse")}
            className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
              activeTab === "browse"
                ? "border-amber-700 text-amber-800 bg-white rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📁 خامات الخشب في الموقع ({standardWoodFinishes.length + customFinishes.length})
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "add" ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* قسم رفع الصورة والمعاينة (12 عمود على الموبايل، 7 على الشاشات الكبيرة) */}
              <div className="md:col-span-7 space-y-4">
                {/* 1. منطقة رمي الصورة (Drag & Drop) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>1. ارمي صورة عينة الخشب هنا *</span>
                    {fileName && <span className="font-normal text-emerald-600 text-[11px] truncate max-w-[180px]">{fileName}</span>}
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                      compressedDataUrl
                        ? "border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/50"
                        : "border-amber-300 hover:border-amber-600 bg-amber-50/30 hover:bg-amber-50/60"
                    }`}
                  >
                    {compressedDataUrl ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={compressedDataUrl}
                          alt="عينة الخشب"
                          className="w-16 h-16 rounded-xl object-cover border border-emerald-300 shadow-sm"
                        />
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            <Check size={14} className="text-emerald-600" />
                            <span>تم تجهيز الصورة وضغطها بنجاح</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">اضغط لاختيار صورة أخرى إذا أردت</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                          <Upload size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-800">اسحب وأفلت صورة الخشب هنا</p>
                        <p className="text-xs text-slate-400 mt-1">أو اضغط لاختيار صورة من جهازك (JPG / PNG)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => processAndCompressImage(e.target.files?.[0])}
                    className="hidden"
                  />
                </div>

                {/* 2. اسم الخشب فقط */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    2. اسم خامة الخشب *
                  </label>
                  <input
                    type="text"
                    value={woodName}
                    onChange={(e) => setWoodName(e.target.value)}
                    placeholder="اكتب اسم الخشب (مثال: أرو أمريكي فاخر أو زان داكن)..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                {/* أزرار الإجراءات الرئيسية */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!compressedDataUrl}
                    className="flex-1 py-3 px-6 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-amber-700/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {saveSuccess ? (
                      <>
                        <Check size={18} />
                        <span>تم الحفظ والتفعيل في الموقع ✓</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>حفظ وتفعيل في الموقع فوراً</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(currentFinishObject, null, 2), "code")}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="نسخ كود التشطيب الجاهز"
                  >
                    {copiedId === "code" ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedId === "code" ? "تم نسخ الكود ✓" : "نسخ الكود"}</span>
                  </button>
                </div>

                {/* إشعار التأكيد عند الحفظ */}
                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      ✓ تم التفعيل! الخامة تظهر الآن في صفحة تفاصيل المنتج وفي كتالوج الخامات عند اختيار أي قطاع.
                    </span>
                  </div>
                )}

                {/* خيارات متقدمة قابلة للطي (مخفية لعدم تشتيت المستخدم) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>خيارات متقدمة (الكود، اتجاه العروق، درجة اللمعان)</span>
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">كود التشطيب</label>
                          <input
                            type="text"
                            value={woodCode}
                            onChange={(e) => setWoodCode(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">اللون الأساسي المستخرج</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={extractedHex}
                              onChange={(e) => setExtractedHex(e.target.value)}
                              className="w-8 h-8 rounded-md border p-0.5 cursor-pointer"
                            />
                            <span className="font-mono text-xs font-bold">{extractedHex}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-600">اتجاه العروق:</span>
                        <button
                          type="button"
                          onClick={() => setTextureRotate(0)}
                          className={`px-3 py-1 rounded-md text-xs font-bold border ${
                            textureRotate === 0 ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-700"
                          }`}
                        >
                          0° طولي (مع السحب)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextureRotate(90)}
                          className={`px-3 py-1 rounded-md text-xs font-bold border ${
                            textureRotate === 90 ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-700"
                          }`}
                        >
                          90° متعامد
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* قسم المعاينة 3D الحية (5 أعمدة) */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-800">معاينة القطاع 3D الحية:</span>
                <div className="h-[280px] rounded-2xl border border-slate-800 bg-[#0c121e] overflow-hidden relative shadow-md">
                  <canvas ref={previewCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                  <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg backdrop-blur-xs">
                    اسحب القطاع للتدوير 360° ومعاينة تجزيعة الخشب
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* استعراض الخامات الحالية */
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                كافة خامات الخشب المتاحة في الكتالوج وعارض الـ 3D لصفحة التفاصيل:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* الخامات المخصصة أولاً */}
                {customFinishes.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-2xl border-2 border-amber-400 bg-amber-50/50 flex flex-col justify-between gap-2.5 relative group"
                  >
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-600 text-white text-[9px] font-bold">
                      مضاف حديثاً
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl border border-amber-300 shadow-inner bg-cover bg-center shrink-0"
                        style={{
                          backgroundColor: f.hex,
                          backgroundImage: f.texture ? `url(${f.texture})` : "none",
                        }}
                      />
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-amber-900 block">{f.code}</span>
                        <span className="text-xs font-bold text-slate-800 truncate block">{f.nameAr}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(JSON.stringify(f, null, 2), f.id)}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === f.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === f.id ? "تم النسخ" : "نسخ الكود"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteCustomWoodFinish(f.id);
                          refreshCustom();
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="حذف"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* الخامات القياسية الـ 16 */}
                {standardWoodFinishes.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl border border-black/10 shadow-inner bg-cover bg-center shrink-0"
                        style={{
                          backgroundColor: f.hex,
                          backgroundImage: `url(/textures/wood/${f.id}.jpg)`,
                        }}
                      />
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-900 block">{f.code}</span>
                        <span className="text-xs font-bold text-slate-800 truncate block">{f.nameAr}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-mono text-slate-400">{f.hex}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(JSON.stringify(f, null, 2), f.id)}
                        className="text-[11px] font-bold text-slate-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === f.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>{copiedId === f.id ? "تم" : "نسخ الكود"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
