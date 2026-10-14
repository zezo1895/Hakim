const db = require("../config/db");
const crypto = require("crypto");

const IMG_CONCAT = `
  GROUP_CONCAT(
    DISTINCT CONCAT(pi.id,'::',pi.url,'::',pi.public_id)
    ORDER BY pi.sort_order SEPARATOR '||'
  ) AS raw_images`;

const parseImages = (raw) => {
  if (!raw) return [];
  return raw.split("||").map((chunk) => {
    const [id, url, public_id] = chunk.split("::");
    return { id, url, public_id };
  });
};
//ss

const BASE_SELECT = `
  SELECT
    p.*,
    pt.name  AS type_name,
    m.name   AS material_name,
    mc.name  AS material_category,
    pg.name  AS group_name,
    ${IMG_CONCAT},
    (
      SELECT GROUP_CONCAT(group_id)
      FROM product_related_groups prg
      WHERE prg.product_id = p.id
    ) AS related_groups_raw
  FROM products p
  LEFT JOIN product_types       pt ON pt.id = p.type_id
  LEFT JOIN materials           m  ON m.id  = p.material_id
  LEFT JOIN material_categories mc ON mc.id = m.category_id
  LEFT JOIN product_groups      pg ON pg.id = p.group_id
  LEFT JOIN product_images      pi ON pi.product_id = p.id
`;

const parse = (r) => {
  if (!r) return null;
  return {
    ...r,
    images: parseImages(r.raw_images),
    related_groups: r.related_groups_raw ? r.related_groups_raw.split(',') : []
  };
};

// ── Reads ──────────────────────────────────────────────────
exports.getAll = async (filters = {}) => {
  const whereConditions = [];
  const params = [];

  if (filters.category) {
    whereConditions.push("mc.name = ?");
    params.push(filters.category);
  }
  if (filters.type) {
    whereConditions.push("pt.name = ?");
    params.push(filters.type);
  }
  if (filters.material) {
    whereConditions.push("m.name = ?");
    params.push(filters.material);
  }

  const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(" AND ")}` : "";
  const [rows] = await db.query(
    `${BASE_SELECT} ${whereClause} GROUP BY p.id ORDER BY p.sort_order ASC, p.created_at DESC`,
    params
  );
  return rows.map(parse);
};

// ── جلب كل الأغطية لكل المنتجات مرة واحدة ──
exports.getAllLidsMap = async () => {
  // الأغطية العادية (منتجات من نوع غطاء)
  const [regularLids] = await db.query(`
    SELECT pl.product_id,
           p.id, p.name, p.name_en, p.code, p.size, p.size_en,
           m.name AS material_name, mc.name AS material_category,
           GROUP_CONCAT(DISTINCT CONCAT(pi.id,'::',pi.url,'::',pi.public_id) ORDER BY pi.sort_order SEPARATOR '||') AS raw_images,
           MIN(pi.url) AS thumbnail
    FROM product_lids pl
    JOIN products p ON pl.lid_id = p.id
    LEFT JOIN materials m ON m.id = p.material_id
    LEFT JOIN material_categories mc ON mc.id = m.category_id
    LEFT JOIN product_images pi ON pi.product_id = p.id
    GROUP BY pl.product_id, p.id
  `);

  // الأغطية اليدوية
  const [manualLids] = await db.query(`
    SELECT pml.product_id,
           ml.id, ml.name
    FROM product_manual_lids pml
    JOIN manual_lids ml ON pml.manual_lid_id = ml.id
  `);

  // تجميع الأغطية per product
  const map = {};
  for (const l of regularLids) {
    if (!map[l.product_id]) map[l.product_id] = [];
    map[l.product_id].push({
      id: l.id,
      name: l.name,
      code: l.code,
      size: l.size,
      material_name: l.material_name,
      material_category: l.material_category,
      thumbnail: l.thumbnail,
      images: l.raw_images ? l.raw_images.split('||').map(chunk => {
        const [id, url, public_id] = chunk.split('::');
        return { id, url, public_id };
      }) : [],
      isManual: false
    });
  }
  for (const l of manualLids) {
    if (!map[l.product_id]) map[l.product_id] = [];
    map[l.product_id].push({
      id: `manual_${l.id}`,
      name: l.name,
      isManual: true,
      manual: true
    });
  }
  return map;
};

exports.getById = async (idOrSlug) => {
  const decoded = decodeURIComponent(idOrSlug || "").trim();
  const withSpaces = decoded.replace(/-/g, " ");
  const withHyphens = decoded.replace(/\s+/g, "-");
  const [rows] = await db.query(
    `${BASE_SELECT} WHERE p.id = ? OR p.code = ? OR p.code = ? OR p.code = ? OR p.name = ? OR p.name = ? GROUP BY p.id`,
    [decoded, decoded, withSpaces, withHyphens, decoded, withSpaces]
  );
  const product = parse(rows[0]);
  if (product) {
    const realId = product.id;
    // جلب الأغطية العادية (منتجات من نوع غطاء)
    const [lids] = await db.query(`
      SELECT p.id, p.name, p.name_en, p.code, p.size, p.size_en,
             m.name AS material_name, mc.name AS material_category,
             MIN(pi.url) AS thumbnail
      FROM product_lids pl
      JOIN products p ON pl.lid_id = p.id
      LEFT JOIN materials m ON m.id = p.material_id
      LEFT JOIN material_categories mc ON mc.id = m.category_id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE pl.product_id = ?
      GROUP BY p.id
    `, [realId]);
    
    // جلب الأغطية اليدوية
    const [manualLids] = await db.query(`
      SELECT ml.id, ml.name
      FROM product_manual_lids pml
      JOIN manual_lids ml ON pml.manual_lid_id = ml.id
      WHERE pml.product_id = ?
    `, [realId]);
    
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

exports.getSiblings = (groupIds, excludeId) => {
  if (!groupIds || !groupIds.length) return Promise.resolve([[]]);
  const ids = groupIds.map(id => db.escape(id)).join(',');
  return db.query(`
    SELECT p.id, p.name, p.name_en, p.code, p.size, p.size_en, MIN(pi.url) AS thumbnail
    FROM products p
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE (p.group_id IN (${ids}) OR EXISTS (SELECT 1 FROM product_related_groups prg WHERE prg.product_id = p.id AND prg.group_id IN (${ids}))) 
    AND p.id != ?
    GROUP BY p.id
  `, [excludeId]);
};

exports.getRelatedByMaterial = (materialId, excludeId, excludeGroupIds = []) => {
  if (!materialId) return Promise.resolve([[]]);
  const validGroupIds = (excludeGroupIds || []).filter(Boolean);
  const groupClause = validGroupIds.length
    ? `AND (p.group_id IS NULL OR p.group_id NOT IN (${validGroupIds.map(id => db.escape(id)).join(',')}))`
    : '';
  return db.query(`
    SELECT p.id, p.name, p.name_en, p.code, p.size, p.size_en, p.temp, MIN(pi.url) AS thumbnail
    FROM products p
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE p.material_id = ? AND p.id != ? ${groupClause}
    GROUP BY p.id
    LIMIT 3
  `, [materialId, excludeId]);
};

// ── Search ──────────────────────────────────────────────────
exports.search = async (q, filters = {}) => {
  const whereConditions = ["(p.name LIKE ? OR p.code LIKE ?)"];
  const params = [`%${q}%`, `%${q}%`];

  if (filters.category) {
    whereConditions.push("mc.name = ?");
    params.push(filters.category);
  }

  const [rows] = await db.query(`
    SELECT p.id, p.name, p.code, p.size, p.model_url,
           pt.name AS type_name, m.name AS material_name,
           mc.name AS material_category, MIN(pi.url) AS thumbnail
    FROM products p
    LEFT JOIN product_types       pt ON pt.id = p.type_id
    LEFT JOIN materials           m  ON m.id  = p.material_id
    LEFT JOIN material_categories mc ON mc.id = m.category_id
    LEFT JOIN product_images      pi ON pi.product_id = p.id
    WHERE ${whereConditions.join(" AND ")}
    GROUP BY p.id
    LIMIT 24
  `, params);
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
exports.create = async (d, conn = db) => {
  let insertOrder = null;

  if (d.group_id) {
    const [[row] = []] = await conn.query(
      "SELECT MAX(sort_order) AS maxInGroup FROM products WHERE group_id = ?",
      [d.group_id]
    );
    if (row && row.maxInGroup != null) {
      insertOrder = row.maxInGroup + 1;
    }
  }

  if (insertOrder == null) {
    const [[{ maxOrder } = { maxOrder: 0 }]] = await conn.query(
      "SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM products"
    );
    insertOrder = (maxOrder || 0) + 1;
  }

  const id = crypto.randomUUID();
  await conn.query(
    `INSERT INTO products (id, name, name_en, code, type_id, material_id, temp, group_id, size, size_en, notes, notes_en, sort_order, model_url, model_file_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, d.name, d.name_en||null, d.code||null, d.type_id||null, d.material_id||null,
     d.temp || 'both', d.group_id||null, d.size||null, d.size_en||null, d.notes||null, d.notes_en||null, insertOrder,
     d.model_url||null, d.model_file_id||null]
  );

  if (d.related_groups) {
    let groups = [];
    try { groups = typeof d.related_groups === 'string' ? JSON.parse(d.related_groups) : d.related_groups; } catch(e) {}
    if (Array.isArray(groups) && groups.length > 0) {
      const values = groups.map(gid => [id, gid]);
      await conn.query(`INSERT IGNORE INTO product_related_groups (product_id, group_id) VALUES ?`, [values]);
    }
  }

  return id;
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

exports.update = async (id, d, conn = db) => {
  const updates = [
    "name=?", "name_en=?", "code=?", "type_id=?", "material_id=?", "temp=?",
    "group_id=?", "size=?", "size_en=?", "notes=?", "notes_en=?"
  ];
  const params = [
    d.name, d.name_en||null, d.code||null, d.type_id||null, d.material_id||null,
    d.temp || 'both', d.group_id||null, d.size||null, d.size_en||null, d.notes||null, d.notes_en||null
  ];

  if (d.model_url !== undefined) {
    updates.push("model_url=?");
    params.push(d.model_url);
  }
  if (d.model_file_id !== undefined) {
    updates.push("model_file_id=?");
    params.push(d.model_file_id);
  }
  params.push(id);

  await conn.query(
    `UPDATE products SET ${updates.join(", ")} WHERE id=?`,
    params
  );

  if (d.related_groups !== undefined) {
    await db.query(`DELETE FROM product_related_groups WHERE product_id=?`, [id]);
    let groups = [];
    try { groups = typeof d.related_groups === 'string' ? JSON.parse(d.related_groups) : d.related_groups; } catch(e) {}
    if (Array.isArray(groups) && groups.length > 0) {
      const values = groups.map(gid => [id, gid]);
      await db.query(`INSERT IGNORE INTO product_related_groups (product_id, group_id) VALUES ?`, [values]);
    }
  }
};

// تحديث "المجموعة" بس — مستخدمة فى التعديل الجماعي (Bulk Edit)، عشان محدش يبعث
// من غير باقي بيانات المنتج (الاسم، الحرارة...) فيمسحها بالغلط. آمن تمامًا.
exports.updateGroup = (id, groupId) =>
  db.query("UPDATE products SET group_id=? WHERE id=?", [groupId || null, id]);

exports.remove = (id) => db.query("DELETE FROM products WHERE id = ?", [id]);

// ── Images ─────────────────────────────────────────────────
exports.addImage = async (pid, url, pub, sort, conn = db) => {
  const id = crypto.randomUUID();
  await conn.query("INSERT INTO product_images (id,product_id,url,public_id,sort_order) VALUES (?,?,?,?,?)",
    [id, pid, url, pub, sort]);
  return id;
};
exports.getImages     = (pid) =>
  db.query("SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order", [pid]);
exports.deleteImage   = (id, conn = db)  =>
  conn.query("DELETE FROM product_images WHERE id=?", [id]);

// ── Lids ───────────────────────────────────────────────────

// إضافة غطاء يدوي جديد (اسم فقط)
exports.addManualLid = async (name, conn = db) => {
  const [existing] = await conn.query(
    "SELECT id FROM manual_lids WHERE name = ?",
    [name]
  );
  if (existing.length > 0) {
    return existing[0].id;
  }
  const id = crypto.randomUUID();
  await conn.query(
    "INSERT INTO manual_lids (id, name) VALUES (?, ?)",
    [id, name]
  );
  return id;
};

exports.getAllManualLids = async () => {
  const [rows] = await db.query(`
    SELECT ml.id, ml.name, ml.created_at, GROUP_CONCAT(p.name SEPARATOR ', ') AS linked_products 
    FROM manual_lids ml 
    LEFT JOIN product_manual_lids pml ON pml.manual_lid_id = ml.id 
    LEFT JOIN products p ON p.id = pml.product_id 
    GROUP BY ml.id 
    ORDER BY ml.name
  `);
  return rows;
};

exports.deleteManualLid = async (id, conn = db) => {
  await conn.query("DELETE FROM manual_lids WHERE id = ?", [id]);
};

// تحويل غطاء يدوي إلى غطاء حقيقي
exports.convertManualLidToRealLid = async (manualLidId, newRealLidId, conn = db) => {
  const [rows] = await conn.query(
    "SELECT product_id FROM product_manual_lids WHERE manual_lid_id = ?",
    [manualLidId]
  );
  
  if (rows.length > 0) {
    const values = rows.map(r => [r.product_id, newRealLidId]);
    await conn.query(
      "INSERT IGNORE INTO product_lids (product_id, lid_id) VALUES ?",
      [values]
    );
  }
  
  await conn.query("DELETE FROM product_manual_lids WHERE manual_lid_id = ?", [manualLidId]);
  await conn.query("DELETE FROM manual_lids WHERE id = ?", [manualLidId]);
};

exports.setLids = async (productId, lidData, conn = db) => {
  if (lidData === undefined) return;
  await conn.query("DELETE FROM product_lids WHERE product_id=?", [productId]);
  await conn.query("DELETE FROM product_manual_lids WHERE product_id=?", [productId]);
  
  if (!Array.isArray(lidData) || !lidData.length) return;
  
  const existingLids = lidData.filter(l => !l.manual);
  const manualLids = lidData.filter(l => l.manual);
  
  if (existingLids.length) {
    await conn.query(
      "INSERT INTO product_lids (product_id, lid_id) VALUES ?",
      [existingLids.map((l) => [productId, l.id || l])]
    );
  }
  
  if (manualLids.length) {
    for (const manual of manualLids) {
      const manualId = await exports.addManualLid(manual.name, conn);
      await conn.query(
        "INSERT INTO product_manual_lids (product_id, manual_lid_id) VALUES (?, ?) ",
        [productId, manualId]
      );
    }
  }
};

// -- Analytics ----------------------------------------------
exports.incrementViews = (id) => db.query('UPDATE products SET views_count = views_count + 1 WHERE id = ?', [id]);
exports.logSearch = (query) => db.query('INSERT INTO search_logs (query) VALUES (?)', [query]);
exports.getAnalytics = async () => {
  const [topProducts] = await db.query('SELECT id, name, views_count FROM products ORDER BY views_count DESC LIMIT 10');
  const [topSearches] = await db.query('SELECT query, COUNT(*) as count FROM search_logs GROUP BY query ORDER BY count DESC LIMIT 10');
  return { topProducts, topSearches };
};

