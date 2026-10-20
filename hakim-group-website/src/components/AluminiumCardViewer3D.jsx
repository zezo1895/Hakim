// src/components/AluminiumCardViewer3D.jsx
// عارض 3D خفيف وسريع ومخصص لبطاقات المنتجات في كتالوج الألومنيوم
// يدعم التدوير التلقائي 360°، التحكم بالماوس/اللمس، إيقاف الرندر التلقائي عند الخروج من الشاشة (IntersectionObserver)
// وخامة ألومنيوم معمارية دقيقة متطابقة مع العارض الرئيسي

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Box, RotateCcw, Sparkles } from "lucide-react";
import { ensureUVs } from "../utils/cadUvGenerator";
import { createAluminiumMaterial } from "../utils/aluminiumMaterials";

export default function AluminiumCardViewer3D({
  modelUrl,
  thumbnail,
  productName = "قطاع ألومنيوم",
  productCode,
  finishId = "ral-9006",
  onCardClick,
}) {
  const mountRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // References for Three.js instances to allow clean disposal
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isVisibleRef = useRef(true);

  // Track pointer movement to differentiate between dragging in 3D and clicking the card
  const pointerStartRef = useRef({ x: 0, y: 0, time: 0 });

  const handlePointerDown = (e) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e) => {
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const dt = Date.now() - pointerStartRef.current.time;
    const dist = Math.hypot(dx, dy);

    // If mouse barely moved (click/tap), navigate to details
    if (dist < 6 && dt < 400) {
      if (typeof onCardClick === "function") {
        onCardClick();
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !modelUrl) {
      setHasError(!modelUrl);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 225;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.01, 100);
    camera.position.set(0.2, 0.15, 0.35);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Balanced Studio Environment & Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(envScene).texture;
    scene.environmentIntensity = 0.8;

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xedf2f7, 0.3);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambLight);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.enableZoom = false; // Prevent blocking page vertical scroll
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 1.8;
    controlsRef.current = controls;

    // 6. Draco Loader & GLTF Loader
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/gltf/");
    loader.setDRACOLoader(dracoLoader);

    // Initial architectural aluminium material (RAL 9006 / White Aluminium)
    const baseMaterial = createAluminiumMaterial(
      { id: finishId, hex: "#A1A1A0", metalness: 0.9, roughness: 0.32 },
      scene.environment
    );

    let activeMesh = null;

    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;

        root.traverse((child) => {
          if (child.isMesh) {
            ensureUVs(child);
            child.material = baseMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Center model geometry & fit to camera
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        root.position.sub(center); // Move to 0,0,0

        scene.add(root);
        activeMesh = root;

        // تقريب الكاميرا وضبط المنظور لملء البطاقة بوضوح هندسي فائق وتفادي البعد المبالغ فيه
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const fov = camera.fov * (Math.PI / 180);
          const fitDistance = (maxDim / 2) / Math.tan(fov / 2);
          // مضاعف 0.92 لتقريب الموديل بشكل كبير وممتلئ في منتصف الكارت
          const targetDistance = fitDistance * 0.92;
          const dir = new THREE.Vector3(0.55, 0.32, 0.75).normalize();
          camera.position.copy(dir.multiplyScalar(targetDistance));
          camera.lookAt(0, 0, 0);
          controls.target.set(0, 0, 0);
          controls.update();
        }

        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.warn(`Card 3D load error for ${productName}:`, error);
        setHasError(true);
        setIsLoading(false);
      }
    );

    // 7. Smart Render Loop with Visibility Observer
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Only render if card is currently visible in viewport
      if (isVisibleRef.current) {
        controls.update();
        renderer.render(scene, camera);
      }
    };
    animate();

    // 8. Intersection Observer (pause rendering when scrolled offscreen)
    let observer = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisibleRef.current = entry.isIntersecting;
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(container);
    }

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth || 300;
      const nh = container.clientHeight || 225;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (observer) observer.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      dracoLoader.dispose();
      pmremGenerator.dispose();

      if (activeMesh) {
        activeMesh.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
        scene.remove(activeMesh);
      }

      renderer.dispose();
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [modelUrl, finishId, productName]);

  // If error loading 3D or no modelUrl, render fallback 2D image
  if (hasError || !modelUrl) {
    return (
      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 cursor-pointer group"
        onClick={onCardClick}
      >
        <img
          src={thumbnail || "/placeholder-image.jpg"}
          alt={productName}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder-image.jpg";
          }}
        />
        {productCode && (
          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-sm text-white text-[11px] font-mono tracking-wider font-semibold shadow-sm">
            {productCode}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden bg-[#0c121e] select-none group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      title="اسحب القطاع للتدوير 360° | انقر لفتح صفحة التفاصيل والألوان"
    >
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0c121e] text-white">
          <div className="w-8 h-8 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin mb-2" />
          <span className="text-[10px] font-bold text-slate-400">جاري تحميل الـ 3D...</span>
        </div>
      )}

      {/* 3D Interactive Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-sky-400 text-[10px] font-black border border-sky-500/30 shadow-md">
        <Box size={12} className="animate-pulse" />
        <span>3D تفاعلي</span>
      </div>

      {/* Product Code Badge (Bottom Right) */}
      {productCode && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-sm text-white text-[11px] font-mono font-bold tracking-wider border border-white/10 shadow-sm">
          {productCode}
        </div>
      )}

      {/* Interactive Helper Hint (Fades in on hover) */}
      <div
        className={`absolute bottom-3 left-3 z-10 pointer-events-none px-2 py-0.5 rounded-md bg-sky-500/90 text-white text-[9px] font-bold tracking-wide transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        اسحب للتدوير 360°
      </div>
    </div>
  );
}
