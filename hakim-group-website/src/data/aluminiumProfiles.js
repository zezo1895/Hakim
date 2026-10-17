// src/data/aluminiumProfiles.js
// بيانات قطاعات وبروفيلات الألومنيوم الهندسية الافتراضية بأبعاد CAD الدقيقة

export const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const DEFAULT_ALUMINIUM_PROFILES = [
  {
    id: "a39b4d82-9f12-4e89-8d54-1b98cf587001",
    name: "IF-587",
    code: "IF-587",
    material_category: "ألومنيوم",
    material_name: "قطاعات ألومنيوم",
    type_name: "قطاع ألومنيوم",
    model_url: "https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-587.glb",
    images: [{ id: "img-if-587", url: "https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-587.png" }],
    width_mm: 46.2,
    height_mm: 20.4,
    length_mm: 100.0,
    size: "46.2 × 20.4 mm",
    notes: "بروفيل ألومنيوم معماري عالي الدقة (IF-587).",
  },
  {
    id: "0ea1518e-7853-48ad-94a1-7d24b20f846c",
    name: "IF-588",
    code: "IF-588",
    material_category: "ألومنيوم",
    material_name: "قطاعات ألومنيوم",
    type_name: "قطاع ألومنيوم",
    model_url: "https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-588.glb",
    images: [{ id: "img-if-588", url: "https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-588.png" }],
    width_mm: 75.0,
    height_mm: 17.5,
    length_mm: 100.0,
    size: "75.0 × 17.5 mm",
    notes: "بروفيل ألومنيوم معماري عالي الدقة (IF-588).",
  },
  {
    id: "c2e13df2-b032-42f4-a4b4-619d3c0fd645",
    name: "IF-589",
    code: "IF-589",
    material_category: "ألومنيوم",
    material_name: "قطاعات ألومنيوم",
    type_name: "قطاع ألومنيوم",
    model_url: "https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-589.glb",
    images: [{ id: "img-if-589", url: "https://ik.imagekit.io/wdtbpfrpv/hakim/aluminium/models/IF-589.png" }],
    width_mm: 61.5,
    height_mm: 20.0,
    length_mm: 100.0,
    size: "61.5 × 20.0 mm",
    notes: "بروفيل ألومنيوم إنشائي للزجاج المزدوج (IF-589).",
  },
];

// دالة فحص وتصفية صارمة للتأكد من أن المنتج يتبع قطاع الألومنيوم فقط
export const isAluminiumProduct = (p) => {
  if (!p) return false;
  const cat = (p.material_category || "").trim().toLowerCase();
  const mat = (p.material_name || "").trim().toLowerCase();
  const name = (p.name || "").trim().toLowerCase();
  const code = (p.code || "").trim().toLowerCase();

  // 1. إذا كان المنتج يحتوي على ملف نموذج ثلاثي الأبعاد GLB
  if (Boolean(p.model_url)) return true;

  // 2. إذا كانت الفئة أو الخامة تنتمي صراحة للألومنيوم
  if (cat.includes("ألومنيوم") || cat.includes("الومنيوم") || cat.includes("aluminium") || cat.includes("aluminum")) {
    return true;
  }
  if (mat.includes("ألومنيوم") || mat.includes("الومنيوم") || mat.includes("aluminium") || mat.includes("aluminum")) {
    return true;
  }

  // 3. إذا كان الاسم أو الكود يمثل قطاع ألومنيوم
  if (name.includes("ألومنيوم") || name.includes("الومنيوم") || name.startsWith("if-") || name.startsWith("if ") || code.startsWith("if-") || code.startsWith("if ")) {
    return true;
  }

  return false;
};

// جلب المنتجات المخزنة محلياً للأدمن إن وجدت مع ترقية المعرفات القديمة لـ UUIDs وضمان وجود القطاعات القياسية
export const getStoredAluminiumProducts = () => {
  try {
    const raw = localStorage.getItem("hakim_aluminium_custom_products");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // تحديث أي IDs قديمة (مثل "IF-588" أو "al-if-588") إلى UUIDs قياسية
        const updatedParsed = parsed.map((item) => {
          const itemCode = String(item.code || item.name || "").toUpperCase().trim();
          if (itemCode === "IF-588" && (!item.id || item.id === "IF-588" || item.id === "al-if-588")) {
            return { ...item, id: "0ea1518e-7853-48ad-94a1-7d24b20f846c" };
          }
          if (itemCode === "IF-589" && (!item.id || item.id === "IF-589" || item.id === "al-if-589")) {
            return { ...item, id: "c2e13df2-b032-42f4-a4b4-619d3c0fd645" };
          }
          const isStandardUUID = typeof item.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id);
          if (!isStandardUUID) {
            return { ...item, id: generateUUID() };
          }
          return item;
        });

        const merged = [...updatedParsed];
        for (const def of DEFAULT_ALUMINIUM_PROFILES) {
          const exists = merged.some(
            (p) =>
              String(p.id).toLowerCase() === String(def.id).toLowerCase() ||
              String(p.code).toLowerCase() === String(def.code).toLowerCase() ||
              String(p.name).toLowerCase() === String(def.name).toLowerCase() ||
              String(p.id).toLowerCase().replace(/^(al-)/i, "") === String(def.code).toLowerCase()
          );
          if (!exists) {
            merged.push(def);
          }
        }
        saveStoredAluminiumProducts(merged);
        return merged;
      }
    }
  } catch (e) {
    console.debug("Failed to read stored aluminium products:", e);
  }
  return DEFAULT_ALUMINIUM_PROFILES;
};

export const saveStoredAluminiumProducts = (products) => {
  try {
    localStorage.setItem("hakim_aluminium_custom_products", JSON.stringify(products));
  } catch (e) {
    console.debug("Failed to save stored aluminium products:", e);
  }
};
