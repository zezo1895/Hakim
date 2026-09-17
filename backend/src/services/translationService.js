const { GoogleGenerativeAI } = require('@google/generative-ai');

// ===== القاموس الشامل للترجمة المحلية =====
const DICTIONARY = {
  // === أنواع المنتجات (من الأطول للأقصر) ===
  'طبق فوم لانش بوكس': 'Foam Lunch Box Plate',
  'طبق فوم ساندوتش': 'Foam Sandwich Plate',
  'طبق فوم جاتوه': 'Foam Gateau Plate',
  'طبق فوم فراخ': 'Foam Chicken Plate',
  'طبق فوم تقسيمات سرفيس': 'Foam Serving Compartment Plate',
  'طبق فوم': 'Foam Plate',
  'طبق ريزو': 'Rizo Plate',
  'طبق لانش': 'Lunch Plate',
  'طبق حلة': 'Pot Plate',
  'طبق': 'Plate',
  'علبة مستطيل': 'Rectangular Container',
  'علبة مستديره': 'Round Container',
  'علبة مستديرة': 'Round Container',
  'علبة لانش بوكس': 'Lunch Box Container',
  'علبة لانش': 'Lunch Box',
  'علبة مسدسة': 'Hexagonal Container',
  'علبة مسدسه': 'Hexagonal Container',
  'علبة تشيز كيك': 'Cheesecake Container',
  'علبة قشطة': 'Cream Container',
  'علبة اللؤلؤة': 'Al-Louloua Container',
  'علبة اللؤلوة': 'Al-Louloua Container',
  'علبة زبدية': 'Zabdia Bowl Container',
  'علبه سكيور': 'Secure Container',
  'علبه جيلي': 'Jelly Container',
  'علبه': 'Container',
  'علبة': 'Container',
  'كوب ورق ايس كريم': 'Ice Cream Paper Cup',
  'كوب ورق': 'Paper Cup',
  'كوب كرافت': 'Kraft Cup',
  'كوب ربل': 'Ripple Cup',
  'كوب ريبل': 'Ripple Cup',
  'كوب اونز': 'Oz Cup',
  'كوب بوبا': 'Boba Cup',
  'كوب زبادى': 'Yogurt Cup',
  'كوب زبادي': 'Yogurt Cup',
  'كوب شطة': 'Sauce Cup',
  'كوب كولسلو': 'Coleslaw Cup',
  'كوب مسدس': 'Hexagonal Cup',
  'كوب همتو': 'Hamto Cup',
  'كوب صن داي': 'Sundae Cup',
  'كوب كنزى': 'Kunzi Cup',
  'كوب كنزي': 'Kunzi Cup',
  'كوب': 'Cup',
  'غطاء اونز تايت': 'Tight Oz Lid',
  'غطاء اونز': 'Oz Lid',
  'غطاء أونز': 'Oz Lid',
  'غطاء لانش': 'Lunch Lid',
  'غطاء كوب ورق': 'Paper Cup Lid',
  'غطاء كوب بوردة': 'Rose Pattern Cup Lid',
  'غطاء كوب فتحة شاليمو': 'Straw Hole Cup Lid',
  'غطاء كوب': 'Cup Lid',
  'غطاء علبة قشطة زيرو': 'Zero Cream Container Lid',
  'غطاء علبة قشطة': 'Cream Container Lid',
  'غطاء علبة اللؤلوة': 'Al-Louloua Container Lid',
  'غطاء علبة اللؤلؤة': 'Al-Louloua Container Lid',
  'غطاء قشطة': 'Cream Lid',
  'غطاء قالب مربع': 'Square Mold Lid',
  'غطاء قالب مستطيل': 'Rectangular Mold Lid',
  'غطاء كشرى': 'Koshary Lid',
  'غطاء كشري': 'Koshary Lid',
  'غطاء طبق معرج': 'Corrugated Plate Lid',
  'غطاء مربع مصر للطيران بشفة': 'EgyptAir Square Lid with Lip',
  'غطاء مربع مصر للطيران': 'EgyptAir Square Lid',
  'غطاء مستطيل': 'Rectangular Lid',
  'غطاء همتو': 'Hamto Lid',
  'غطاء وسط مشرشر': 'Medium Serrated Lid',
  'غطاء وسط': 'Medium Lid',
  'غطاء كبير': 'Large Lid',
  'غطاء صغير': 'Small Lid',
  'غطاء سلطانية فتحة شاليمو': 'Bowl Lid with Straw Opening',
  'غطاء سلطانية ورق': 'Paper Bowl Lid',
  'غطاء سلطانية': 'Bowl Lid',
  'غطاء ريزو': 'Rizo Lid',
  'غطاء ايس كريم كونو': 'Ice Cream Cone Lid',
  'غطاء شطة': 'Sauce Lid',
  'غطاء': 'Lid',
  'سلطانيه': 'Bowl',
  'سلطانية': 'Bowl',
  'سلطانيه': 'Bowl',
  'جالون': 'Tub',
  'قالب فوم مربع صغير بالغطاء': 'Small Square Foam Mold with Lid',
  'قالب فوم مربع': 'Square Foam Mold',
  'قالب فوم مستطيل': 'Rectangular Foam Mold',
  'قالب فوم': 'Foam Mold',
  'قالب مربع': 'Square Mold',
  'قالب مستطيل': 'Rectangular Mold',
  'قالب': 'Mold',
  'حلة': 'Pot Container',
  'لانش بوكس': 'Lunch Box',
  'لانش': 'Lunch Box',
  'مربع': 'Square Hinged Container',
  'مستديرة': 'Round Container',
  'مستطيل': 'Rectangular Container',
  'مسدس': 'Hexagonal Hinged Container',
  'سكيور': 'Secure',
  'ملعقة جاروف': 'Shovel Spoon',
  'ملعقة صغيرة': 'Small Spoon',
  'ملعقة كبيرة': 'Large Spoon',
  'ملعقة': 'Spoon',
  'شوكة': 'Fork',
  'سكينة': 'Knife',
  'شاليمو عريض': 'Wide Straw',
  'شاليمو خفيف': 'Thin Straw',
  'شاليمو رفيع خفيف': 'Thin Light Straw',
  'شاليمو': 'Straw',

  // === الأوصاف ===
  'امتصاص ثقيل': 'Heavy Absorbent',
  'امتصاص عاده': 'Regular Absorbent',
  'امتصاص': 'Absorbent',
  'ثقيل': 'Heavy',
  'عاده': 'Regular',
  'عادة': 'Regular',
  'عادى': 'Regular',
  'لامع': 'Glossy',
  'معدل': 'Modified',
  'مشرشر ثقيل': 'Heavy Serrated',
  'مشرشر': 'Serrated',
  'بكعب': 'Footed',
  'بدون كعب': 'Without Base',
  'بدون قاعدة': 'Without Base',
  'بدون': 'Without',
  'بغطاء مفصلي': 'with Hinged Lid',
  'بغطاء مفصلى': 'with Hinged Lid',
  'مفصلي': 'Hinged',
  'مفصلى': 'Hinged',
  'مفصلية': 'Hinged',
  'بالغطاء': 'with Lid',
  'بشفة': 'with Lip',
  'جديد': 'New',
  'صغيرة': 'Small',
  'صغيره': 'Small',
  'صغير': 'Small',
  'كبيرة': 'Large',
  'كبيره': 'Large',
  'كبير': 'Large',
  'وسط': 'Medium',
  'تقسيمات': 'Compartment',
  'مقسم': 'Divided',
  'سرفيس': 'Serving',
  'فراخ': 'Chicken',
  'جاتوه': 'Gateau',
  'حلويات': 'Dessert',
  'زيرو': 'Zero',
  'فلات': 'Flat',
  'مسطح': 'Flat',
  'ديب': 'Deep',
  'غويط': 'Deep',
  'غويطه': 'Deep',
  'غويطة': 'Deep',
  'سوشي': 'Sushi',
  'ساندوتش': 'Sandwich',
  'ساندويتش': 'Sandwich',
  'معرج': 'Corrugated',
  'قلاوظ': 'Threaded',
  'كريستال': 'Crystal',
  'بومبيه': 'Dome',
  'عالي': 'Tall',
  'ميني': 'Mini',
  'مدعم': 'Reinforced',
  'كونو': 'Cone',
  'رفيع': 'Thin',
  'مضلع': 'Ribbed',

  // === الألوان ===
  'أبيض/شفاف': 'White/Clear',
  'أبيض/سوقي': 'White/Commercial',
  'ابيض/شفاف': 'White/Clear',
  'أبيض': 'White',
  'ابيض': 'White',
  'أسود': 'Black',
  'اسود': 'Black',
  'شفاف': 'Clear',
  'أصفر': 'Yellow',
  'اصفر': 'Yellow',
  'أخضر': 'Green',
  'اخضر': 'Green',
  'ازرق': 'Blue',
  'أزرق': 'Blue',
  'أحمر': 'Red',
  'احمر': 'Red',

  // === الأحجام ===
  'كيلو': 'kg',
  'جم': 'g',
  'سم مربع': 'Sq Cm',
  'سم': 'cc',
  'لتر': 'L',

  // === أخرى ===
  'عميل': 'Customer',
  'لون': 'Color',
  'ألوان': 'Colors',
  'حجم عائلى': 'Family Size',
  'حجم عائلي': 'Family Size',
  'عائلى': 'Family',
  'عائلي': 'Family',
  'اونزات': 'oz',
  'اونز': 'oz',
  'أونز': 'oz',
  'كرتون': 'Cardboard',
  'فتحة': 'Opening',
  'ايس كريم': 'Ice Cream',
  'آيس كريم': 'Ice Cream',
  'صن داي': 'Sundae',
  'زبدية': 'Zabdia Bowl',
  'جيلي': 'Jelly',
  'اللؤلؤة': 'Al-Louloua',
  'اللؤلوة': 'Al-Louloua',
  'قشطة': 'Cream',
  'تشيز كيك': 'Cheesecake',
  'مصر للطيران': 'EgyptAir',
  'ريزو': 'Rizo',
  'بوردة': 'Rose Pattern',
  'شطة': 'Sauce',
};

// مفاتيح القاموس مرتبة من الأطول للأقصر (لمنع التطابق الجزئي)
const SORTED_KEYS = Object.keys(DICTIONARY).sort((a, b) => b.length - a.length);

// فحص وجود حروف عربية
const hasArabic = (text) => /[\u0600-\u06FF]/.test(text);

/**
 * ترجمة محلية بالقاموس
 */
function dictionaryTranslate(arabicText) {
  if (!arabicText || arabicText === '-') return null;
  let en = arabicText;
  for (const ar of SORTED_KEYS) {
    en = en.replace(new RegExp(ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), DICTIONARY[ar]);
  }
  // تنظيف: (N لون) → (N Colors)
  en = en.replace(/\((\d+)\s*Color\)/g, (m, n) => `(${n} ${parseInt(n) > 1 ? 'Colors' : 'Color'})`);
  en = en.replace(/\(Customer\s+(\d+)\s*Color\)/g, (m, n) => `(Customer ${n} ${parseInt(n) > 1 ? 'Colors' : 'Color'})`);
  en = en.replace(/\((\d+)Color\)/g, (m, n) => `(${n} ${parseInt(n) > 1 ? 'Colors' : 'Color'})`);
  return en.replace(/\s+/g, ' ').trim();
}

/**
 * ترجمة بـ Gemini API (للكلمات الغريبة عن القاموس)
 */
async function geminiTranslate(productData) {
  if (!process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY is not set. Skipping Gemini translation.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const systemPrompt = `You are a professional translator specialized in plastic packaging, food containers, and disposable tableware.
You will receive a JSON object with product details ('name', 'size', 'notes') that may have mixed Arabic/English.
Translate ALL remaining Arabic into professional English. Return ONLY a valid JSON: {"name_en":"...","size_en":"...","notes_en":"..."}.
Keep material abbreviations (PP, PS, PET, K-RESIN, SW-DPE, SW-SPE) and numbers as-is.
If size or notes is null, return null. Return ONLY valid JSON, no markdown.`;

    const inputData = {
      name: productData.name,
      size: productData.size || null,
      notes: productData.notes || null
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(inputData) }] }],
      systemInstruction: systemPrompt
    });

    let responseText = result.response.text().trim();
    if (responseText.startsWith('```json')) responseText = responseText.substring(7);
    else if (responseText.startsWith('```')) responseText = responseText.substring(3);
    if (responseText.endsWith('```')) responseText = responseText.substring(0, responseText.length - 3);

    return JSON.parse(responseText.trim());
  } catch (error) {
    console.error("Gemini Translation Error:", error.message);
    return null;
  }
}

/**
 * الدالة الرئيسية: قاموس أولاً → Gemini لو فيه عربي متبقي
 */
const translateProduct = async (productData) => {
  if (!productData.name) {
    return { name_en: null, size_en: null, notes_en: null };
  }

  // الخطوة 1: ترجمة بالقاموس المحلي (فوري)
  let name_en = dictionaryTranslate(productData.name);
  let size_en = dictionaryTranslate(productData.size);
  let notes_en = productData.notes ? dictionaryTranslate(productData.notes) : null;

  // الخطوة 2: لو فيه أي كلمة عربية متبقية → يروح لـ Gemini
  const needsGemini = hasArabic(name_en) || (size_en && hasArabic(size_en)) || (notes_en && hasArabic(notes_en));

  if (needsGemini) {
    console.log(`[Translation] Dictionary incomplete for "${productData.name}", falling back to Gemini...`);
    const geminiResult = await geminiTranslate({
      name: productData.name,
      size: productData.size,
      notes: productData.notes
    });

    if (geminiResult) {
      name_en = geminiResult.name_en || name_en;
      size_en = geminiResult.size_en || size_en;
      notes_en = geminiResult.notes_en || notes_en;
    }
  }

  return { name_en, size_en, notes_en };
};

module.exports = {
  translateProduct,
  dictionaryTranslate,
  hasArabic
};
