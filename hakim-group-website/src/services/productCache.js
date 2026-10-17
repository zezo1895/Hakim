// src/services/productCache.js

const CACHE_KEY = "hakim_products_catalog_cache";
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 دقيقة مدة صلاحية الكاش في الذاكرة

// ── 1. ذاكرة الوصول السريع الحية (In-Memory Cache) ──
// تظل حية طوال بقاء المستخدم في الموقع وتنتقل بين الصفحات بسرعة 0ms
let inMemoryProducts = null;
let inMemoryTimestamp = 0;
const inMemoryDetails = new Map(); // كاش لتفاصيل كل منتج فردي

/**
 * جلب قائمة المنتجات مع نظام الكاش الذكي
 * @param {string} apiUrl - رابط الـ API
 * @param {boolean} forceRefresh - إجبار التحديث من السيرفر
 */
export async function getCachedProducts(apiUrl, forceRefresh = false) {
  const now = Date.now();

  // 1. فحص ذاكرة الرام الحية (الأسرع على الإطلاق 0ms وبدون أي شبكة)
  if (!forceRefresh && inMemoryProducts && (now - inMemoryTimestamp < CACHE_TTL_MS)) {
    return inMemoryProducts;
  }

  // 2. فحص ذاكرة الجلسة (sessionStorage) في حال قام المستخدم بعمل Refresh للصفحة
  if (!forceRefresh) {
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed?.data) && parsed.data.length > 0 && (now - parsed.timestamp < CACHE_TTL_MS)) {
          inMemoryProducts = parsed.data;
          inMemoryTimestamp = parsed.timestamp;
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn("[Cache] Failed to read from sessionStorage:", e);
    }
  }

  // 3. الطلب من الباك إند فقط عند الضرورة القصوى
  const response = await fetch(`${apiUrl}/products`);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  const data = await response.json();
  const products = Array.isArray(data) ? data : [];

  // حفظ في الذاكرة الحية
  inMemoryProducts = products;
  inMemoryTimestamp = now;

  // حفظ في ذاكرة الجلسة
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data: products, timestamp: now })
    );
  } catch (e) {
    console.warn("[Cache] sessionStorage quota exceeded, using in-memory:", e);
  }

  return products;
}

/**
 * جلب تفاصيل منتج واحد مع كاش تفاصيله لتجنب إعادة طلبه عند التردد بين الصفحات
 */
export async function getCachedProductDetail(apiUrl, id, forceRefresh = false) {
  const now = Date.now();
  const key = String(id);

  if (!forceRefresh && inMemoryDetails.has(key)) {
    const cached = inMemoryDetails.get(key);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const response = await fetch(`${apiUrl}/products/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }
  const productData = await response.json();

  if (productData) {
    inMemoryDetails.set(key, { data: productData, timestamp: now });
  }

  return productData;
}

/**
 * مسح الكاش يدوياً عند الحاجة
 */
export function clearProductsCache() {
  inMemoryProducts = null;
  inMemoryTimestamp = 0;
  inMemoryDetails.clear();
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (e) {}
}
