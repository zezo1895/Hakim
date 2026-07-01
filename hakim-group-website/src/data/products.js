// src/data/products.js
// مصدر واحد للمنتجات تستخدمه صفحة الكتالوج (Products) وصفحة تفاصيل المنتج (ProductDetail)
// أي حقل اختياري (code / lids / notes) لو مش موجود أو فاضي... هيختفي تلقائياً من الواجهة.

// فلتر الخامة
import kfc1 from "../assets/test/kfc1.jpg";
import kfc2 from "../assets/test/kfc2.jpg";
import kfc3 from "../assets/test/kfc3.jpg";
import kfc4 from "../assets/test/kfc4.jpeg";
import plate1 from "../assets/test/طبق140-115 1.jpg";
import plate2 from "../assets/test/طبق140-115 2.jpg";
import plate3 from "../assets/test/طبق140-115 3.png";
import plate4 from "../assets/test/140-115.jpeg";
export const materials = ["الكل", "بلاستيك", "كرتون", "فوم"];

// فلتر النوع
export const types = ["الكل", "كوب", "طبق", "علبة", "غطاء", "سلطانية"];

// كل منتج بياخد قيمة "temp" واحدة من التلاتة دول:
// "hot"  -> ساخن بس
// "cold" -> بارد بس
// "both" -> بيتحمل الساخن والبارد مع بعض

// كل منتج له "size" (المقاس) و "group" (مفتاح مشترك بين المقاسات المختلفة لنفس الصنف).
// أي منتجات نفس الـ group بتظهر مستقلة في الكتالوج، لكن في صفحة تفاصيل أي واحد منهم
// هتلاقي باقي المقاسات ظاهرة تحت في قسم "مقاسات أخرى لهذا الصنف".

const products = [
  // ===== كوب بلاستيك ساخن (3 مقاسات) =====
  {
    id: 3,
    name: "كوب بلاستيك للمشروبات الساخنة",
    material: "بلاستيك",
    type: "كوب",
    group: "cup-hot-plastic",
    size: "8 أونصة",
    temp: "hot",
    code: "10.301",
    lids: [],
    images: ["https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&q=80"],
  },
  {
    id: 12,
    name: "كوب بلاستيك للمشروبات الساخنة",
    material: "بلاستيك",
    type: "كوب",
    group: "cup-hot-plastic",
    size: "12 أونصة",
    temp: "hot",
    code: "10.302",
    lids: [],
    images: ["https://images.unsplash.com/photo-1577968897966-3d4cb6c5c6b8?w=800&q=80"],
  },
  {
    id: 13,
    name: "كوب بلاستيك للمشروبات الساخنة",
    material: "بلاستيك",
    type: "كوب",
    group: "cup-hot-plastic",
    size: "16 أونصة",
    temp: "hot",
    code: "10.303",
    lids: [],
    images: ["https://images.unsplash.com/photo-1577968897830-1e1f1c1b6a9d?w=800&q=80"],
  },

  // ===== علبة بلاستيك (3 مقاسات) =====
  {
    id: 1,
    name: "كوب 500 كنتاكي",
    material: "بلاستيك",
    type: "كوب",
    group: "none",
    size: "500 مل",
    temp: "both",
    code: "10.1615",
    lids: ["غطاء PS 400 ابيض كود:10.109 ", "غطاء PT 400 شفاف كود:10.709 "],
    notes: "none",
    images: [
      kfc1,
      kfc2,
      kfc3,
      kfc4,
      
    ],
  },
  {
    id: 14,
    name: "طبق 140-115 بدون كعب ",
    material: "بلاستيك",
    type: "طبق",
    group: "box-plastic",
    size: "750 مل",
    temp: "both",
    code: "10.1986",
    lids: ["غطاء PS 400 ابيض كود:10.109 ", "غطاء PT 400 شفاف كود:10.709 "],
    images: [plate1,plate2,plate3,plate4],
  },
  {
    id: 15,
    name: "علبة بلاستيك",
    material: "بلاستيك",
    type: "علبة",
    group: "box-plastic",
    size: "1000 مل",
    temp: "both",
    code: "10.8042",
    lids: ["غطاء عادي ∅150 مم", "غطاء أمان مانع للتسريب"],
    images: ["https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80"],
  },

  {
    id: 2,
    name: "علبة بلاستيك صغيرة بغطاء شفاف",
    material: "بلاستيك",
    type: "علبة",
    size: "250 مل",
    temp: "cold",
    code: "10.220",
    lids: ["غطاء شفاف ∅90 مم"],
    images: ["https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80"],
  },

  // ===== غطاء بلاستيك (3 مقاسات) =====
  {
    id: 10,
    name: "غطاء بلاستيك شفاف",
    material: "بلاستيك",
    type: "غطاء",
    group: "lid-plastic",
    size: "∅90 مم",
    temp: "both",
    code: "10.090",
    lids: [], // المنتج نفسه غطاء
    notes: "يلائم العلب صغيرة المقاس.",
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80"],
  },
  {
    id: 16,
    name: "غطاء بلاستيك شفاف",
    material: "بلاستيك",
    type: "غطاء",
    group: "lid-plastic",
    size: "∅120 مم",
    temp: "both",
    code: "10.091",
    lids: [],
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80"],
  },
  {
    id: 17,
    name: "غطاء بلاستيك شفاف",
    material: "بلاستيك",
    type: "غطاء",
    group: "lid-plastic",
    size: "∅150 مم",
    temp: "both",
    code: "10.092",
    lids: [],
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80"],
  },

  // ===== كرتون =====
  {
    id: 4,
    name: "علبة كرتون مضلع للتغليف",
    material: "كرتون",
    type: "علبة",
    size: "حجم قياسي",
    temp: "both", // تغليف عام يصلح للحالتين
    code: "30.140",
    lids: ["غطاء كرتوني مطابق"],
    notes: "مناسبة للشحن والتخزين، مقاومة للرطوبة الخفيفة.",
    images: ["https://images.unsplash.com/photo-1607166452427-7e4477079cf1?w=800&q=80"],
  },

  // ===== طبق كرتون (مقاسين) =====
  {
    id: 5,
    name: "طبق كرتون للوجبات الساخنة",
    material: "كرتون",
    type: "طبق",
    group: "plate-cardboard",
    size: "7 بوصة",
    temp: "hot",
    code: "30.205",
    lids: [],
    images: ["https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=800&q=80"],
  },
  {
    id: 20,
    name: "طبق كرتون للوجبات الساخنة",
    material: "كرتون",
    type: "طبق",
    group: "plate-cardboard",
    size: "9 بوصة",
    temp: "hot",
    code: "30.206",
    lids: [],
    images: ["https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=800&q=80"],
  },

  {
    id: 6,
    name: "كوب كرتون مزدوج الجدار",
    material: "كرتون",
    type: "كوب",
    size: "10 أونصة",
    temp: "hot",
    lids: ["غطاء بلاستيك شفاف", "غطاء بلاستيك بفتحة شرب"],
    images: ["https://images.unsplash.com/photo-1577926304866-b3f2a6e0c1e5?w=800&q=80"],
  },

  // ===== فوم =====
  {
    id: 7,
    name: "طبق فوم للوجبات",
    material: "فوم",
    type: "طبق",
    size: "حجم قياسي",
    temp: "both", // يستحمل الوجبات الساخنة والباردة
    code: "40.310",
    lids: ["غطاء فوم مطابق"],
    images: ["https://images.unsplash.com/photo-1606937295636-9b1aa6a4e8d1?w=800&q=80"],
  },
  {
    id: 8,
    name: "علبة فوم حافظة للحرارة",
    material: "فوم",
    type: "علبة",
    size: "حجم قياسي",
    temp: "hot",
    code: "40.355",
    lids: ["غطاء فوم مفصلي"],
    notes: "تحافظ على حرارة الطعام لفترة أطول أثناء التوصيل.",
    images: ["https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80"],
  },
  {
    id: 9,
    name: "كوب فوم للمشروبات الباردة",
    material: "فوم",
    type: "كوب",
    size: "12 أونصة",
    temp: "cold",
    lids: ["غطاء بلاستيك بفتحة شفاطة"],
    images: ["https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80"],
  },

  // ===== سلطانية فوم (3 مقاسات) =====
  {
    id: 11,
    name: "سلطانية فوم للشوربة",
    material: "فوم",
    type: "سلطانية",
    group: "bowl-foam",
    size: "8 أونصة",
    temp: "hot",
    code: "40.420",
    lids: ["غطاء فوم مطابق"],
    notes: "مناسبة للشوربة والمأكولات السائلة الساخنة.",
    images: ["https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80"],
  },
  {
    id: 18,
    name: "سلطانية فوم للشوربة",
    material: "فوم",
    type: "سلطانية",
    group: "bowl-foam",
    size: "12 أونصة",
    temp: "hot",
    code: "40.421",
    lids: ["غطاء فوم مطابق"],
    images: ["https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80"],
  },
  {
    id: 19,
    name: "سلطانية فوم للشوربة",
    material: "فوم",
    type: "سلطانية",
    group: "bowl-foam",
    size: "16 أونصة",
    temp: "hot",
    code: "40.422",
    lids: ["غطاء فوم مطابق"],
    images: ["https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80"],
  },
];

export default products;