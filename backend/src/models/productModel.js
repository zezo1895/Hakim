const db = require("../config/db");

const IMG_CONCAT = `
  GROUP_CONCAT(
    DISTINCT CONCAT(pi.id,'::',pi.url,'::',pi.public_id)
    ORDER BY pi.sort_order SEPARATOR '||'
  ) AS raw_images`;

const parseImages = (raw) => {
  if (!raw) return [];
  return raw.split("||").map((chunk) => {
    const [id, url, public_id] = chunk.split("::");
    return { id: Number(id), url, public_id };
  });
};

const BASE_SELECT = `
  SELECT
    p.*,
    pt.name  AS type_name,
    m.name   AS material_name,
    mc.name  AS material_category,
    pg.name  AS group_name,
    ${IMG_CONCAT}
  FROM products p
  LEFT JOIN product_types       pt ON pt.id = p.type_id
  LEFT JOIN materials           m  ON m.id  = p.material_id
  LEFT JOIN material_categories mc ON mc.id = m.category_id
  LEFT JOIN product_groups      pg ON pg.id = p.group_id
  LEFT JOIN product_images      pi ON pi.product_id = p.id
`;

const parse = (r) => r ? { ...r, images: parseImages(r.raw_images) } : null;

// ── Reads ──────────────────────────────────────────────────
exports.getAll = async () => {
  const [rows] = await db.query(
    `${BASE_SELECT} GROUP BY p.id ORDER BY p.sort_order ASC, p.created_at DESC`
  );
  return rows.map(parse);
};

exports.getById = async (id) => {
  const [rows] = await db.query(`${BASE_SELECT} WHERE p.id = ? GROUP BY p.id`, [id]);
  const product = parse(rows[0]);
  if (product) {
    // جلب الأغطية العادية (منتجات من نوع غطاء)
    const [lids] = await db.query(`
      SELECT p.id, p.name, p.code, p.size,
             m.name AS material_name, mc.name AS material_category,
             MIN(pi.url) AS thumbnail
      FROM product_lids pl
      JOIN products p ON pl.lid_id = p.id
      LEFT JOIN materials m ON m.id = p.material_id
      LEFT JOIN material_categories mc ON mc.id = m.category_id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE pl.product_id = ?
      GROUP BY p.id
    `, [id]);
    
    // جلب الأغطية اليدوية
    const [manualLids] = await db.query(`
      SELECT ml.id, ml.name
      FROM product_manual_lids pml
      JOIN manual_lids ml ON pml.manual_lid_id = ml.id
      WHERE pml.product_id = ?
    `, [id]);
    
    // دمج الأغطية
    product.lids = [
      ...lids.map(l => ({ ...l, isManual: false })),
      ...manualLids.map(l => ({ ...l, id: `manual_${l.id}`, isManual: true, manual: true }))
    ];
  }
  return product;
};

exports.getLids = (id) => db.query(`
  SELECT p.id, p.name, p.code, p.size,
         m.name AS material_name, mc.name AS material_category,
         MIN(pi.url) AS thumbnail
  FROM product_lids pl
  JOIN products p ON pl.lid_id = p.id
  LEFT JOIN materials m ON m.id = p.material_id
  LEFT JOIN material_categories mc ON mc.id = m.category_id
  LEFT JOIN product_images pi ON pi.product_id = p.id
  WHERE pl.product_id = ?
  GROUP BY p.id
`, [id]);

exports.getSiblings = (groupId, excludeId) => db.query(`
  SELECT p.id, p.name, p.code, p.size, MIN(pi.url) AS thumbnail
  FROM products p
  LEFT JOIN product_images pi ON pi.product_id = p.id
  WHERE p.group_id = ? AND p.id != ?
  GROUP BY p.id
`, [groupId, excludeId]);

// ── Search ──────────────────────────────────────────────────
exports.search = async (q) => {
  const [rows] = await db.query(`
    SELECT p.id, p.name, p.code, p.size,
           pt.name AS type_name, m.name AS material_name,
           mc.name AS material_category, MIN(pi.url) AS thumbnail
    FROM products p
    LEFT JOIN product_types       pt ON pt.id = p.type_id
    LEFT JOIN materials           m  ON m.id  = p.material_id
    LEFT JOIN material_categories mc ON mc.id = m.category_id
    LEFT JOIN product_images      pi ON pi.product_id = p.id
    WHERE p.name LIKE ? OR p.code LIKE ?
    GROUP BY p.id
    LIMIT 12
  `, [`%${q}%`, `%${q}%`]);
  return rows;
};

// ── Lid-only search (including manual lids) ────────────────
exports.searchLids = async (q) => {
  // البحث في المنتجات من نوع غطاء
  const [productLids] = await db.query(`
    SELECT p.id, p.name, p.code, p.size,
           m.name AS material_name, mc.name AS material_category,
           MIN(pi.url) AS thumbnail,
           'product' AS source
    FROM products p
    JOIN product_types pt ON pt.id = p.type_id AND pt.name = 'غطاء'
    LEFT JOIN materials m ON m.id = p.material_id
    LEFT JOIN material_categories mc ON mc.id = m.category_id
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE p.name LIKE ? OR p.code LIKE ?
    GROUP BY p.id
    LIMIT 15
  `, [`%${q}%`, `%${q}%`]);
  
  // البحث في الأغطية اليدوية
  const [manualLids] = await db.query(`
    SELECT id, name, NULL AS code, NULL AS size,
           NULL AS material_name, NULL AS material_category,
           NULL AS thumbnail,
           'manual' AS source
    FROM manual_lids
    WHERE name LIKE ?
    LIMIT 10
  `, [`%${q}%`]);
  
  return [...productLids, ...manualLids];
};

// ── Write ──────────────────────────────────────────────────
exports.create = async (d) => {
  // منتج جديد يتحط آخر الترتيب افتراضيًا (مش هيقلب ترتيب حد)
  const [[{ maxOrder } = { maxOrder: 0 }]] = await db.query(
    "SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM products"
  );
  return db.query(
    `INSERT INTO products (name, code, type_id, material_id, temp, group_id, size, notes, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [d.name, d.code||null, d.type_id||null, d.material_id||null,
     d.temp, d.group_id||null, d.size||null, d.notes||null, maxOrder + 1]
  );
};

// إعادة ترتيب المنتجات دفعة واحدة — بياخد مصفوفة IDs بالترتيب الجديد المطلوب
exports.reorder = async (orderedIds) => {
  if (!Array.isArray(orderedIds) || !orderedIds.length) return;
  const cases = orderedIds.map((id, i) => `WHEN ${db.escape(id)} THEN ${i}`).join(" ");
  const ids = orderedIds.map((id) => db.escape(id)).join(",");
  await db.query(
    `UPDATE products SET sort_order = CASE id ${cases} END WHERE id IN (${ids})`
  );
};

exports.update = (id, d) => db.query(
  `UPDATE products SET name=?,code=?,type_id=?,material_id=?,temp=?,
   group_id=?,size=?,notes=? WHERE id=?`,
  [d.name, d.code||null, d.type_id||null, d.material_id||null,
   d.temp, d.group_id||null, d.size||null, d.notes||null, id]
);

// تحديث "المجموعة" بس — مستخدمة فى التعديل الجماعي (Bulk Edit)، عشان محدش يبعث
// من غير باقي بيانات المنتج (الاسم، الحرارة...) فيمسحها بالغلط. آمن تمامًا.
exports.updateGroup = (id, groupId) =>
  db.query("UPDATE products SET group_id=? WHERE id=?", [groupId || null, id]);

exports.remove = (id) => db.query("DELETE FROM products WHERE id = ?", [id]);

// ── Images ─────────────────────────────────────────────────
exports.addImage      = (pid, url, pub, sort) =>
  db.query("INSERT INTO product_images (product_id,url,public_id,sort_order) VALUES (?,?,?,?)",
    [pid, url, pub, sort]);
exports.getImages     = (pid) =>
  db.query("SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order", [pid]);
exports.deleteImage   = (id)  =>
  db.query("DELETE FROM product_images WHERE id=?", [id]);

// ── Lids ───────────────────────────────────────────────────

// إضافة غطاء يدوي جديد (اسم فقط)
exports.addManualLid = async (name) => {
  const [existing] = await db.query(
    "SELECT id FROM manual_lids WHERE name = ?",
    [name]
  );
  if (existing.length > 0) {
    return existing[0].id;
  }
  const [result] = await db.query(
    "INSERT INTO manual_lids (name) VALUES (?)",
    [name]
  );
  return result.insertId;
};

exports.getAllManualLids = async () => {
  const [rows] = await db.query(
    "SELECT id, name, created_at FROM manual_lids ORDER BY name"
  );
  return rows;
};

exports.deleteManualLid = async (id) => {
  await db.query("DELETE FROM manual_lids WHERE id = ?", [id]);
};

exports.setLids = async (productId, lidData = []) => {
  // حذف الروابط القديمة
  await db.query("DELETE FROM product_lids WHERE product_id=?", [productId]);
  await db.query("DELETE FROM product_manual_lids WHERE product_id=?", [productId]);
  
  if (!lidData.length) return;
  
  // فصل الأغطية
  const existingLids = lidData.filter(l => !l.manual);
  const manualLids = lidData.filter(l => l.manual);
  
  // إضافة الأغطية الموجودة في قاعدة البيانات
  if (existingLids.length) {
    await db.query(
      "INSERT INTO product_lids (product_id, lid_id) VALUES ?",
      [existingLids.map((l) => [productId, Number(l)])]
    );
  }
  
  // إضافة الأغطية اليدوية
  if (manualLids.length) {
    for (const manual of manualLids) {
      const manualId = await exports.addManualLid(manual.name);
      await db.query(
        "INSERT INTO product_manual_lids (product_id, manual_lid_id) VALUES (?, ?)",
        [productId, manualId]
      );
    }
  }
};