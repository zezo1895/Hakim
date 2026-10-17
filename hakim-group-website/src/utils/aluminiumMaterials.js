// src/utils/aluminiumMaterials.js
// مصنع خامات الألومنيوم PBR: RAL دقيق، خشب (ترخيم)، أنتيك، أنودة (معدن مفرّش)، سابليه
//
// أهم إصلاحات هذه النسخة:
//  1) كل الخرائط اللونية (Canvas / صور) تُضبط على colorSpace = SRGB. غيابها كان سبب
//     بهتان الألوان (الماهوجني الغامق كان بيطلع وردي فاتح).
//  2) خامة الخشب تُبنى من hex العينة نفسه، فلون الموديل = لون العينة في الكتالوج.
//  3) لو فيه صورة عينة حقيقية في /public/textures/wood/<finish.id>.jpg بتتحمّل تلقائياً
//     بدل الخشب المولّد بالكود. (لو مفيش صورة، يفضل المولّد شغّال كبديل.)
//  4) ألوان RAL العادية مادة غير معدنية (metalness = 0) عشان اللون يطلع زي الكود بالظبط.
//  5) الأنودة معدن حقيقي بتفريش طولي، والأنتيك معدن بتدرجات غير متجانسة.

import * as THREE from 'three';

const cache = new Map();

/* ---------------------------- أدوات مساعدة ---------------------------- */

// مولّد أرقام عشوائية ثابت (نفس الشكل كل مرة، بدون وميض عند إعادة التحميل)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function parseHex(hex) {
  const h = (hex || '#808080').replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// مزج لون hex مع لون آخر بنسبة t (حساب RGB مباشر لأن الكانفس sRGB)
function mix(hex, targetHex, t) {
  const a = parseHex(hex);
  const b = parseHex(targetHex);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function finishCanvasTexture(canvas, { colorSpace = true, repeatX = 1, repeatY = 1 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (colorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------ الخشب ------------------------------ */
// الاتجاه: عروق الخشب أفقية في الكانفس = بطول المحور u = بطول سحب القطاع

function createWoodTexture(hex, seedKey) {
  const key = `wood_${hex}_${seedKey}`;
  if (cache.has(key)) return cache.get(key);

  const S = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const rand = rng(hashStr(key));

  const dark = mix(hex, '#000000', 0.45);
  const mid = mix(hex, '#000000', 0.22);
  const light = mix(hex, '#ffffff', 0.18);

  // أرضية
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, S, S);

  // 1) تموّج لوني واسع (سُمك الألياف الفاتحة والغامقة)
  for (let y = 0; y < S; y++) {
    const w = Math.sin(y * 0.011) * 0.5 + Math.sin(y * 0.037 + 1.3) * 0.3 + Math.sin(y * 0.09) * 0.2;
    ctx.globalAlpha = Math.abs(w) * 0.35;
    ctx.fillStyle = w > 0 ? light : mid;
    ctx.fillRect(0, y, S, 1);
  }

  // 2) خطوط حلقات النمو المتعرّجة (العروق الرئيسية)
  const ringCount = 26;
  for (let i = 0; i < ringCount; i++) {
    const y0 = rand() * S;
    const amp = 3 + rand() * 14;
    const freq = 0.004 + rand() * 0.012;
    const phase = rand() * 6.28;
    ctx.beginPath();
    for (let x = 0; x <= S; x += 8) {
      const y = y0 + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1 + phase) * amp * 0.25;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = 0.18 + rand() * 0.3;
    ctx.strokeStyle = rand() > 0.3 ? dark : mid;
    ctx.lineWidth = 0.8 + rand() * 2.4;
    ctx.stroke();
  }

  // 3) ألياف رفيعة طولية
  for (let i = 0; i < 2600; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const len = 40 + rand() * 220;
    ctx.globalAlpha = 0.05 + rand() * 0.16;
    ctx.fillStyle = rand() > 0.35 ? dark : light;
    ctx.fillRect(x, y, len, 1);
  }

  // 4) مسام صغيرة
  ctx.fillStyle = dark;
  for (let i = 0; i < 700; i++) {
    ctx.globalAlpha = 0.1 + rand() * 0.2;
    ctx.fillRect(rand() * S, rand() * S, 2 + rand() * 7, 1);
  }

  ctx.globalAlpha = 1;
  const tex = finishCanvasTexture(canvas, { repeatX: 1, repeatY: 1 });
  cache.set(key, tex);
  return tex;
}

// تحميل صورة عينة حقيقية (اختياري). لو الصورة مش موجودة يفضل البديل المولّد.
function tryLoadWoodSample(finish, material) {
  const url = finish.texture || `/textures/wood/${finish.id}.jpg`;
  const key = `img_${url}`;

  const apply = (tex) => {
    material.map = tex;
    material.color.set(0xffffff);
    material.needsUpdate = true;
  };

  if (cache.has(key)) {
    const cached = cache.get(key);
    if (cached) {
      apply(cached);
      return;
    }
  }

  new THREE.TextureLoader().load(
    url,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      if (finish.textureRotate) {
        tex.center.set(0.5, 0.5);
        tex.rotation = THREE.MathUtils.degToRad(finish.textureRotate);
      }
      tex.needsUpdate = true;
      cache.set(key, tex);
      apply(tex);
    },
    undefined,
    () => {
      // إذا فشل التحميل للمسار المحدد لا نثبت null للأبد حتى نسمح بالمحاولة مع التحديث
      cache.delete(key);
    }
  );
}

export function clearMaterialCache() {
  cache.clear();
}

/* ------------------------- الأنودة (تفريش معدني) ------------------------- */

function getBrushedTexture() {
  const key = 'brushed';
  if (cache.has(key)) return cache.get(key);
  const W = 512, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const rand = rng(777);
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, W, H);
  // خطوط أفقية = بطول القطاع
  for (let y = 0; y < H; y++) {
    const v = 150 + Math.floor(rand() * 105);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(0, y, W, 1);
  }
  for (let i = 0; i < 900; i++) {
    const v = 120 + Math.floor(rand() * 135);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(rand() * W, rand() * H, 30 + rand() * 200, 1);
  }
  ctx.globalAlpha = 1;
  const tex = finishCanvasTexture(canvas, { colorSpace: false, repeatX: 1, repeatY: 2 });
  cache.set(key, tex);
  return tex;
}

/* ------------------------- الأنتيك (تدرجات معدن قديم) ------------------------- */

function createAntiqueTexture(hex) {
  const key = `antique_${hex}`;
  if (cache.has(key)) return cache.get(key);
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  const rand = rng(hashStr(key));
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, S, S);
  // بقع كبيرة ناعمة فاتحة وغامقة
  for (let i = 0; i < 90; i++) {
    const x = rand() * S, y = rand() * S, r = 20 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = rand() > 0.5 ? mix(hex, '#000000', 0.35) : mix(hex, '#ffffff', 0.22);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.18 + rand() * 0.2;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // خدوش خفيفة
  ctx.strokeStyle = mix(hex, '#ffffff', 0.3);
  for (let i = 0; i < 180; i++) {
    ctx.globalAlpha = 0.05 + rand() * 0.1;
    ctx.lineWidth = 0.6;
    const x = rand() * S, y = rand() * S;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20 + rand() * 80, y + (rand() - 0.5) * 4); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = finishCanvasTexture(canvas, { repeatX: 2, repeatY: 1 });
  cache.set(key, tex);
  return tex;
}

/* ------------------------------ السابليه ------------------------------ */

function getSableBumpTexture() {
  if (cache.has('sable')) return cache.get('sable');
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const rand = rng(4242);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(180 + rand() * 75);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = finishCanvasTexture(canvas, { colorSpace: false, repeatX: 16, repeatY: 16 });
  cache.set('sable', tex);
  return tex;
}

/* ---------------------------- المصنع الرئيسي ---------------------------- */

function buildMaterial(finish) {
  if (!finish) {
    return new THREE.MeshPhysicalMaterial({ color: 0xa1a1a0, metalness: 0.9, roughness: 0.32 });
  }

  const category = finish.category || 'ral';

  // 1) الخشب (ترخيم): لون الموديل يطابق hex العينة
  if (category === 'wood' || finish.isWood) {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: createWoodTexture(finish.hex, finish.id || finish.code),
      roughness: 0.55,
      metalness: 0.0,
      clearcoat: 0.12,
      clearcoatRoughness: 0.45,
    });
    tryLoadWoodSample(finish, material); // لو فيه صورة عينة حقيقية تُستبدل تلقائياً
    return material;
  }

  // 2) الأنودة: معدن حقيقي بتفريش طولي (مش لون دهان)
  if (category === 'anodized' || finish.isAnodized) {
    const brushed = getBrushedTexture();
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(finish.hex || '#C5C9CD'),
      metalness: 1.0,
      roughness: 0.42,
      roughnessMap: brushed,
      bumpMap: brushed,
      bumpScale: 0.35,
      clearcoat: 0.0,
    });
  }

  // 3) السابليه الخشن المطفي
  if (category === 'sable' || finish.isSable) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(finish.hex || '#1A1A1D'),
      metalness: 0.15,
      roughness: 0.88,
      bumpMap: getSableBumpTexture(),
      bumpScale: 0.004,
    });
  }

  // 4) الأنتيك: معدن عتيق بتدرجات غير متجانسة
  if (category === 'antique' || finish.isAntique) {
    const isRust = (finish.id || '').includes('rust');
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: createAntiqueTexture(finish.hex || '#4A3C30'),
      bumpMap: getSableBumpTexture(),
      bumpScale: 0.003,
      metalness: isRust ? 0.2 : (finish.metalness ?? 0.8),
      roughness: isRust ? 0.8 : (finish.roughness ?? 0.45),
    });
  }

  // 5) RAL: دهان بودرة. غير معدني = اللون يطلع زي الكود بالظبط
  //    (المعدني/اللؤلؤي فقط يأخذ لمعة معدنية)
  const isMetallicRal = !!finish.isMetallic;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(finish.hex || '#A1A1A0'),
    metalness: isMetallicRal ? 0.65 : 0.0,
    roughness: isMetallicRal ? 0.38 : 0.5,
    clearcoat: isMetallicRal ? 0.2 : 0.08,
    clearcoatRoughness: 0.35,
  });
}

/**
 * الدالة المعتمدة. تمرّر لها scene.environment كـ envMap.
 * القياس (رندر headless بنفس إعدادات المشغل) أثبت إن المعادن بتطلع أغمق من لونها الحقيقي
 * مع Neutral tone mapping، فبنرفع انعكاس البيئة للمعادن فقط:
 *   - أنودة / أنتيك (metalness >= 0.75): 1.8
 *   - RAL معدني / لؤلؤي (metalness 0.5-0.75): 1.0
 * ملحوظة: material.envMapIntensity مبيشتغلش مع scene.environment في three الحديثة،
 * لازم envMap يتعيّن صراحةً على المادة.
 */
export function createAluminiumMaterial(finish, envMap) {
  const mat = buildMaterial(finish);
  if (envMap && mat.metalness >= 0.5) {
    mat.envMap = envMap;
    mat.envMapIntensity = mat.metalness >= 0.75 ? 1.8 : 1.0;
  }
  return mat;
}
