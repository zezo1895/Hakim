// src/components/ProductViewer3D.jsx
// مشغل الموديلات الهندسية ثلاثية الأبعاد الاحترافي المعتمد على Three.js
// يدعم: خامات الخشب PBR (Oak, Walnut, Pine) وتعديل الخشونة والمظهر، الأنودة، السابليه الخشن، وألوان RAL
// خطوط أبعاد 3D CAD هندسية مدمجة مع نصوص القياس وثبات تام 60 FPS بدون أي اهتزاز أثناء الدوران

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Sun,
  Palette,
  Ruler,
  Play,
  Pause,
  AlertCircle,
  Search,
  Check,
} from "lucide-react";
import {
  POWDER_COATING_FINISHES,
  FINISH_CATEGORIES,
  RAL_SERIES_FILTER,
  filterFinishes,
  getFinishCategories,
  getAllFinishes,
} from "../data/powderCoatingColors";
import { ensureUVs } from "../utils/cadUvGenerator";
import { createAluminiumMaterial } from "../utils/aluminiumMaterials";

export const GLB_UNIT_TO_MM = 1000;
export const ALUMINIUM_FINISHES = POWDER_COATING_FINISHES;

// أوضاع الإضاءة الاستوديو
export const LIGHTING_PRESETS = [
  { id: "studio", nameAr: "استوديو متوازن", exposure: 1.0, lightIntensity: 1.2 },
  { id: "bright", nameAr: "إضاءة نهارية ساطعة", exposure: 1.25, lightIntensity: 1.6 },
  { id: "soft", nameAr: "إضاءة ناعمة معمارية", exposure: 0.85, lightIntensity: 0.9 },
];

/**
 * توليد شارة نصية ثلاثية الأبعاد (3D Canvas Sprite) لعرض أبعاد CAD بدقة هندسية ووضوح فائق
 */
function createDimensionLabelSprite(text, bgColor = "#0369a1", strokeColor = "#38bdf8", unitScale = 1.0) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");

  // رسم خلفية كبسولة الشارة
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 5;

  const rx = 20;
  const x = 6, y = 6, w = 308, h = 84;
  ctx.beginPath();
  ctx.moveTo(x + rx, y);
  ctx.lineTo(x + w - rx, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rx);
  ctx.lineTo(x + w, y + h - rx);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
  ctx.lineTo(x + rx, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rx);
  ctx.lineTo(x, y + rx);
  ctx.quadraticCurveTo(x, y, x + rx, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // رسم نص البعد بالملليمتر
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px 'Segoe UI', system-ui, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 160, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(unitScale * 0.75, unitScale * 0.24, 1);
  return sprite;
}

/**
 * بناء خطوط وأسهم وشارات أبعاد CAD مباشرة داخل مشهد Three.js
 * تضمن ثبات 100% بدون أي اهتزاز أو تأخير زمني ومطابقة تامة للمسقط الهندسي
 */
function build3dCadDimensions(box, dims) {
  const group = new THREE.Group();
  group.name = "cad3dDimensionsGroup";

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const unitScale = maxDim * 0.35;
  const coneRadius = unitScale * 0.045;
  const coneHeight = unitScale * 0.16;

  const min = box.min;
  const max = box.max;

  // دالة مساعدة لرسم خطوط البعد والامتداد
  const addLine = (p1, p2, color = 0x38bdf8) => {
    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const mat = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geom, mat);
    line.renderOrder = 999;
    group.add(line);
    return line;
  };

  // دالة مساعدة لرسم رؤوس الأسهم (Cones)
  const addCone = (pos, rot, color = 0x38bdf8) => {
    const geom = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    geom.translate(0, coneHeight / 2, 0); // نقطة الارتكاز عند القاعدة
    const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    mesh.rotation.copy(rot);
    mesh.renderOrder = 999;
    group.add(mesh);
  };

  // -------------------------------------------------------------
  // 1. بعد العرض (Width - محور X - باللون الأزرق السماوي #38bdf8)
  // -------------------------------------------------------------
  const dimYOffset = (max.y - min.y) * 0.3 + unitScale * 0.35;
  const wY = min.y - dimYOffset;
  const wZ = max.z + unitScale * 0.05;

  // خطوط الامتداد (Witness Lines)
  addLine(new THREE.Vector3(min.x, min.y, wZ), new THREE.Vector3(min.x, wY - unitScale * 0.15, wZ), 0x64748b);
  addLine(new THREE.Vector3(max.x, min.y, wZ), new THREE.Vector3(max.x, wY - unitScale * 0.15, wZ), 0x64748b);
  // خط البعد الرئيسي مع رؤوس الأسهم
  addLine(new THREE.Vector3(min.x, wY, wZ), new THREE.Vector3(max.x, wY, wZ), 0x38bdf8);
  addCone(new THREE.Vector3(min.x, wY, wZ), new THREE.Euler(0, 0, Math.PI / 2), 0x38bdf8);
  addCone(new THREE.Vector3(max.x, wY, wZ), new THREE.Euler(0, 0, -Math.PI / 2), 0x38bdf8);
  // شارة نص العرض (عرض القطاع)
  const wSprite = createDimensionLabelSprite(`${dims.widthMm} mm`, "#0369a1", "#38bdf8", unitScale);
  wSprite.position.set((min.x + max.x) / 2, wY - unitScale * 0.22, wZ);
  wSprite.renderOrder = 1000;
  group.add(wSprite);

  // -------------------------------------------------------------
  // 2. بعد الارتفاع (Height - محور Y - باللون التركوازي #2dd4bf)
  // -------------------------------------------------------------
  const dimXOffset = (max.x - min.x) * 0.3 + unitScale * 0.35;
  const hX = max.x + dimXOffset;
  const hZ = max.z + unitScale * 0.05;

  // خطوط الامتداد
  addLine(new THREE.Vector3(max.x, min.y, hZ), new THREE.Vector3(hX + unitScale * 0.15, min.y, hZ), 0x64748b);
  addLine(new THREE.Vector3(max.x, max.y, hZ), new THREE.Vector3(hX + unitScale * 0.15, max.y, hZ), 0x64748b);
  // خط البعد الرئيسي مع رؤوس الأسهم
  addLine(new THREE.Vector3(hX, min.y, hZ), new THREE.Vector3(hX, max.y, hZ), 0x2dd4bf);
  addCone(new THREE.Vector3(hX, min.y, hZ), new THREE.Euler(0, 0, Math.PI), 0x2dd4bf);
  addCone(new THREE.Vector3(hX, max.y, hZ), new THREE.Euler(0, 0, 0), 0x2dd4bf);
  // شارة نص الارتفاع
  const hSprite = createDimensionLabelSprite(`${dims.heightMm} mm`, "#0f766e", "#2dd4bf", unitScale);
  hSprite.position.set(hX + unitScale * 0.42, (min.y + max.y) / 2, hZ);
  hSprite.renderOrder = 1000;
  group.add(hSprite);

  // -------------------------------------------------------------
  // 3. بعد الطول (Length - محور Z - باللون العنبري #fbbf24)
  // -------------------------------------------------------------
  const dimZOffset = (max.x - min.x) * 0.3 + unitScale * 0.35;
  const lX = min.x - dimZOffset;
  const lY = min.y;

  // خطوط الامتداد
  addLine(new THREE.Vector3(min.x, lY, min.z), new THREE.Vector3(lX - unitScale * 0.15, lY, min.z), 0x64748b);
  addLine(new THREE.Vector3(min.x, lY, max.z), new THREE.Vector3(lX - unitScale * 0.15, lY, max.z), 0x64748b);
  // خط البعد الرئيسي مع رؤوس الأسهم
  addLine(new THREE.Vector3(lX, lY, min.z), new THREE.Vector3(lX, lY, max.z), 0xfbbf24);
  addCone(new THREE.Vector3(lX, lY, min.z), new THREE.Euler(-Math.PI / 2, 0, 0), 0xfbbf24);
  addCone(new THREE.Vector3(lX, lY, max.z), new THREE.Euler(Math.PI / 2, 0, 0), 0xfbbf24);
  // شارة نص الطول
  const lSprite = createDimensionLabelSprite(`${dims.lengthMm} mm`, "#b45309", "#fbbf24", unitScale);
  lSprite.position.set(lX - unitScale * 0.42, lY, (min.z + max.z) / 2);
  lSprite.renderOrder = 1000;
  group.add(lSprite);

  return group;
}

export default function ProductViewer3D({
  modelUrl,
  productName = "قطاع ألومنيوم",
  profileDimensions,
  initialFinishId,
  onDimensionsCalculated,
}) {
  const mountRef = useRef(null);
  const containerRef = useRef(null);

  // Three.js Core Refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelGroupRef = useRef(null);
  const dimensionsGroupRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const bboxRef = useRef(null);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // الاستماع لتحديثات الخامات المضافة محلياً لحظياً
  const [finishesVersion, setFinishesVersion] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setFinishesVersion((v) => v + 1);
    window.addEventListener("hakim_finishes_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("hakim_finishes_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Lighting & Finish States
  const [activeLighting, setActiveLighting] = useState("studio");
  const [selectedFinish, setSelectedFinish] = useState(() => {
    const all = getAllFinishes();
    if (initialFinishId) {
      const match = all.find((f) => f.id === initialFinishId || f.code === initialFinishId);
      if (match) return match;
    }
    return all.find((f) => f.id === "ral-9006") || all[0];
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLightPicker, setShowLightPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSeries, setActiveSeries] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dimensions HUD State
  const [showDimensions, setShowDimensions] = useState(true);
  const [dimensions, setDimensions] = useState(null); // { widthMm, heightMm, lengthMm }

  // فئات التشطيبات مع العدادات الحية
  const dynamicCategories = useMemo(() => {
    return getFinishCategories();
  }, [finishesVersion]);

  // الترشيح والبحث الفوري في قائمة التشطيبات (يشمل أي خامة خشب مضافة حديثاً)
  const filteredFinishes = useMemo(() => {
    return filterFinishes({
      category: activeCategory,
      series: activeSeries,
      query: searchQuery,
    });
  }, [activeCategory, activeSeries, searchQuery, finishesVersion]);

  // تطبيق المادة على جميع عناصر الموديل
  const applyFinishToModel = useCallback((finish) => {
    if (!modelGroupRef.current) return;
    const newMaterial = createAluminiumMaterial(finish);
    modelGroupRef.current.traverse((child) => {
      if (child.isMesh) {
        child.material = newMaterial;
        child.material.needsUpdate = true;
      }
    });
  }, []);

  // تحديث الخامة عند تغيير التشطيب المختار أو التعديلات
  useEffect(() => {
    applyFinishToModel(selectedFinish);
  }, [selectedFinish, applyFinishToModel]);

  // إظهار أو إخفاء مجسم خطوط الأبعاد 3D بنقرة واحدة بدون أي إعادة تحميل
  useEffect(() => {
    if (dimensionsGroupRef.current) {
      dimensionsGroupRef.current.visible = showDimensions;
    }
  }, [showDimensions]);

  // تحديث الإضاءة
  useEffect(() => {
    if (!rendererRef.current) return;
    const cfg = LIGHTING_PRESETS.find((p) => p.id === activeLighting) || LIGHTING_PRESETS[0];
    rendererRef.current.toneMappingExposure = cfg.exposure;
  }, [activeLighting]);

  // تحديث سرعة / تفعيل التدوير التلقائي
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // إعداد مسرح Three.js وتحميل الموديل
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setIsLoading(true);
    setHasError(false);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene & Environment
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 1000);
    camera.position.set(15, 12, 18);
    cameraRef.current = camera;

    // 3. Renderer with ACES ToneMapping & PBR Lighting
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Studio HDRI Environment via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(envScene).texture;

    // Additional Balanced Key/Fill Directional Lights (خفيفة لضمان تطابق الألوان وعدم البهتان)
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xedf2f7, 0.25);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambLight);

    // 4. OrbitControls مع التخميد الانسيابي الحريري
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.maxPolarAngle = Math.PI / 1.8;
    controlsRef.current = controls;

    // 5. Load GLB Model with Draco compression support
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/gltf/");
    loader.setDRACOLoader(dracoLoader);

    const modelToLoad =
      modelUrl ||
      "https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/666-3c37052b-b6c1-4b6e-b5bd-b3468f282811.glb";

    loader.load(
      modelToLoad,
      (gltf) => {
        const root = gltf.scene;
        modelGroupRef.current = root;

        // Auto-generate Box UV coordinates on all CAD meshes without UVs
        root.traverse((child) => {
          if (child.isMesh) {
            ensureUVs(child);
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Center model geometry & compute Bounding Box
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        root.position.sub(center); // Move center to (0,0,0)
        scene.add(root);

        // Calculate dimensions in millimeters (smart unit detection)
        const maxDim = Math.max(size.x, size.y, size.z);
        let scaleToMm = 1000;
        if (maxDim >= 50.0) {
          scaleToMm = 1; // already in mm
        } else if (maxDim >= 1.0) {
          scaleToMm = 10; // in cm
        } else {
          scaleToMm = 1000; // in meters
        }

        const calculatedDims = {
          widthMm: (size.x * scaleToMm).toFixed(1),
          heightMm: (size.y * scaleToMm).toFixed(1),
          lengthMm: (size.z * scaleToMm).toFixed(1),
        };
        setDimensions(calculatedDims);
        if (typeof onDimensionsCalculated === "function") {
          onDimensionsCalculated(calculatedDims);
        }

        // Bounding box for dimension overlays
        const centeredBox = new THREE.Box3().setFromObject(root);
        bboxRef.current = centeredBox;

        // بناء خطوط وشارات أبعاد CAD مباشرة كعناصر 3D في المشهد (ثبات تام 0% اهتزاز)
        const dimGroup = build3dCadDimensions(centeredBox, calculatedDims);
        dimensionsGroupRef.current = dimGroup;
        dimGroup.visible = showDimensions;
        scene.add(dimGroup);

        // Frame camera based on model size
        const radius = Math.max(size.x, size.y, size.z) * 1.6;
        camera.position.set(radius * 0.9, radius * 0.8, radius * 1.3);
        controls.target.set(0, 0, 0);
        controls.update();

        // Apply selected architectural finish
        applyFinishToModel(selectedFinish);

        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.error("Three.js GLTF load error:", err);
        setIsLoading(false);
        setHasError(true);
      }
    );

    // 6. Animation Loop (نظيف 100% بدون أي React setState أثناء الدوران)
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 7. Dynamic Resize Observer لملء الحاوية بالكامل وضمان عدم وجود أي فراغ
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (dracoLoader) dracoLoader.dispose();
      if (renderer) renderer.dispose();
      pmremGenerator.dispose();
      if (container) container.innerHTML = "";
    };
  }, [modelUrl]);

  // Reset Camera Helper
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current || !bboxRef.current) return;
    const size = bboxRef.current.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 1.6;
    cameraRef.current.position.set(radius * 0.9, radius * 0.8, radius * 1.3);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // تبديل وضع ملء الشاشة مع المحافظة على نفس الخلفية الداكنة المتناسقة
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex-1 flex flex-col overflow-hidden select-none transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-3xl"
      }`}
      style={{
        background: "radial-gradient(circle at 50% 35%, #182337 0%, #0d1422 65%, #060910 100%)",
      }}
      dir="ltr"
    >
      {/* Three.js Canvas Container (يملأ الصندوق بالكامل) */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* بطاقة معلومات المقاسات الهندسية العلوية (HUD Card) */}
      {showDimensions && dimensions && (
        <div
          dir="rtl"
          className="absolute top-4 right-4 z-20 p-3 bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/80 text-right min-w-[170px] animate-in fade-in duration-200 pointer-events-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="text-xs font-black text-slate-200">📐 أبعاد القطاع (mm)</span>
            <span className="text-[9px] font-bold text-sky-400 bg-sky-950/70 px-2 py-0.5 rounded border border-sky-800/50">Three.js CAD</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono font-bold">
            <div className="flex justify-between items-center text-sky-400">
              <span className="text-[11px] font-bold text-slate-400">العرض (W):</span>
              <span className="tracking-wide">{dimensions.widthMm} mm</span>
            </div>
            <div className="flex justify-between items-center text-teal-400">
              <span className="text-[11px] font-bold text-slate-400">الارتفاع (H):</span>
              <span className="tracking-wide">{dimensions.heightMm} mm</span>
            </div>
            <div className="flex justify-between items-center text-amber-400">
              <span className="text-[11px] font-bold text-slate-400">الطول (L):</span>
              <span className="tracking-wide">{dimensions.lengthMm} mm</span>
            </div>
          </div>
        </div>
      )}

      {/* شارة التشطيب المحدد الحالي (أسفل اليمين) */}
      {selectedFinish && (
        <div
          dir="rtl"
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-full shadow-lg border border-slate-700/80 text-xs pointer-events-auto text-slate-200"
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner"
            style={{ backgroundColor: selectedFinish.hex }}
          />
          <span className="font-black text-white text-[11px]">{selectedFinish.code}</span>
          <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{selectedFinish.nameAr}</span>
        </div>
      )}

      {/* شريط الأدوات العائم السفلي (Bottom Floating Toolbar) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 bg-slate-900/85 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/80 pointer-events-auto">
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="إعادة ضبط زاوية الرؤية"
        >
          <RotateCcw size={15} />
        </button>

        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            autoRotate ? "text-sky-400 bg-sky-950/80 font-bold" : "text-slate-300 hover:bg-slate-800"
          }`}
          title={autoRotate ? "إيقاف التدوير التلقائي" : "تشغيل التدوير التلقائي"}
        >
          {autoRotate ? <Pause size={15} /> : <Play size={15} />}
        </button>

        <button
          type="button"
          onClick={() => setShowDimensions(!showDimensions)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            showDimensions ? "text-sky-400 bg-sky-950/80 font-bold" : "text-slate-300 hover:bg-slate-800"
          }`}
          title="إظهار / إخفاء خطوط الأبعاد الهندسية"
        >
          <Ruler size={15} />
        </button>

        {/* زر كتالوج الألوان والتشطيبات */}
        <button
          type="button"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowLightPicker(false);
          }}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            showColorPicker ? "text-sky-400 bg-sky-950/80" : "text-slate-300 hover:bg-slate-800"
          }`}
          title="كتالوج دهانات وتشطيبات الألومنيوم"
        >
          <Palette size={15} />
          <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: selectedFinish.hex }} />
        </button>

        {/* زر إضاءة الاستوديو */}
        <button
          type="button"
          onClick={() => {
            setShowLightPicker(!showLightPicker);
            setShowColorPicker(false);
          }}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            showLightPicker ? "text-sky-400 bg-sky-950/80" : "text-slate-300 hover:bg-slate-800"
          }`}
          title="إضاءة الاستوديو"
        >
          <Sun size={15} />
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

        {/* زر التكبير ملء الشاشة */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title={isFullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة"}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* درج كتالوج ألوان ودهانات وتشطيبات الألومنيوم الشامل (265 تشطيباً) */}
      {showColorPicker && (
        <div
          dir="rtl"
          className="absolute top-4 left-4 z-30 p-3.5 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/90 animate-in fade-in slide-in-from-top-2 duration-200 w-96 max-w-[92vw] max-h-[82vh] flex flex-col pointer-events-auto text-slate-200"
        >
          {/* رأس النافذة */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">🎨 كتالوج تشطيبات الألومنيوم (Three.js)</span>
              <span className="text-[10px] font-bold bg-slate-800 text-sky-400 px-1.5 py-0.5 rounded-full border border-slate-700">
                {filteredFinishes.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const defaultF =
                    POWDER_COATING_FINISHES.find((f) => f.id === "ral-9006") || POWDER_COATING_FINISHES[0];
                  setSelectedFinish(defaultF);
                  applyFinishToModel(defaultF);
                }}
                className="text-[10px] font-bold text-sky-400 hover:underline cursor-pointer"
                title="استعادة لون الألومنيوم الفضي القياسي"
              >
                RAL 9006 (الافتراضي)
              </button>
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer text-xs font-bold"
                title="إغلاق"
              >
                ✕
              </button>
            </div>
          </div>

          {/* تبويبات الفئات الهندسية (Categories) */}
          <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-b border-slate-800">
            {dynamicCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setActiveSeries("all");
                }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  activeCategory === cat.id
                    ? "bg-sky-500 text-white shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.nameAr}</span>
              </button>
            ))}
          </div>

          {/* شريط البحث المباشر */}
          <div className="pt-2 pb-1.5">
            <div className="relative">
              <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث برقم RAL أو الاسم (مثال: 9005 أو Oak أو سابليه)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 pl-6 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-right"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* فلتر سلاسل RAL (يظهر عند اختيار RAL أو الكل) */}
          {(activeCategory === "all" || activeCategory === "ral") && (
            <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar border-b border-slate-800 mb-1">
              {RAL_SERIES_FILTER.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSeries(s.id)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 transition-all cursor-pointer ${
                    activeSeries === s.id
                      ? "bg-slate-700 text-white border border-slate-600"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* شبكة عينات الألوان والتشطيبات */}
          <div className="flex-1 overflow-y-auto max-h-56 pr-0.5 my-1">
            {filteredFinishes.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">لا توجد ألوان مطابقة لبحثك</div>
            ) : (
              <div className="grid grid-cols-5 gap-1.5">
                {filteredFinishes.map((f) => {
                  const isSelected = selectedFinish?.id === f.id;
                  const isWoodFinish = f.category === "wood" || f.isWood;
                  const woodImgUrl = f.texture || `/textures/wood/${f.id}.jpg`;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFinish(f);
                        applyFinishToModel(f);
                      }}
                      className={`flex flex-col items-center p-1 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? "border-sky-400 ring-2 ring-sky-400/40 bg-sky-950/60 shadow-sm"
                          : "border-slate-800 hover:border-slate-700 bg-slate-800/80 hover:bg-slate-800"
                      }`}
                      title={`${f.code} - ${f.nameAr} (${f.nameEn})`}
                    >
                      <span
                        className="w-full h-6 rounded-lg shadow-inner border border-black/30 relative overflow-hidden bg-cover bg-center"
                        style={{
                          backgroundColor: f.hex,
                          backgroundImage: isWoodFinish ? `url(${woodImgUrl})` : "none",
                        }}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                        {f.isWood && f.id.startsWith("wood-w-") && (
                          <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-emerald-600 text-[7px] text-white font-bold rounded-tl">
                            جديد
                          </span>
                        )}
                      </span>
                      <span className="text-[8px] font-extrabold text-slate-300 mt-1 leading-tight text-center truncate w-full">
                        {f.shortName || f.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* شريط التشطيب المحدد الحالي (Active Finish Info) */}
          {selectedFinish && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0"
                  style={{ backgroundColor: selectedFinish.hex }}
                />
                <span className="font-black text-white text-[11px] truncate">{selectedFinish.code}</span>
                <span className="text-[10px] text-slate-400 truncate hidden sm:inline">{selectedFinish.nameAr}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded shrink-0 uppercase font-mono">
                {selectedFinish.hex}
              </span>
            </div>
          )}
        </div>
      )}

      {/* درج اختيار إضاءة الاستوديو */}
      {showLightPicker && (
        <div
          dir="rtl"
          className="absolute bottom-16 left-4 z-30 p-3 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2 duration-200 min-w-[200px] pointer-events-auto text-slate-200"
        >
          <span className="text-xs font-black text-white block mb-2">إضاءة الاستوديو المعمارية</span>
          <div className="space-y-1.5">
            {LIGHTING_PRESETS.map((lp) => (
              <button
                key={lp.id}
                type="button"
                onClick={() => {
                  setActiveLighting(lp.id);
                  setShowLightPicker(false);
                }}
                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  activeLighting === lp.id ? "bg-sky-500 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{lp.nameAr}</span>
                {activeLighting === lp.id && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* شاشة التحميل (Loading Overlay) */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white">
          <div className="w-10 h-10 border-3 border-sky-400/30 border-t-sky-400 rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-300">جاري بناء المجسم وإعداد الخامات الفيزيائية (Three.js)...</p>
        </div>
      )}

      {/* شاشة الخطأ (Error Overlay) */}
      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <h4 className="text-sm font-black text-white mb-1">تعذر تحميل الموديل ثلاثي الأبعاد</h4>
          <p className="text-xs text-slate-400 mb-4">يرجى التأكد من اتصال الإنترنت وصلاحية ملف الـ GLB</p>
        </div>
      )}
    </div>
  );
}
