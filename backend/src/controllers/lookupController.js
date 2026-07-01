const m = require("../models/lookupModel");

// Generic CRUD factory — يوفّر كتابة كل controller من أوله
const makeCrud = (getAll, create, update, remove) => ({

  getAll: async (req, res) => {
    try {
      const [rows] = await getAll(req.query.category_id);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  create: async (req, res) => {
    try {
      const { name, category_id } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "name required" });
      const [r] = await create(category_id, name.trim());
      res.status(201).json({ id: r.insertId, name: name.trim(), category_id });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "موجود بالفعل" });
      res.status(500).json({ error: e.message });
    }
  },

  update: async (req, res) => {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "name required" });
      await update(req.params.id, name.trim());
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },

  remove: async (req, res) => {
    try {
      await remove(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },
});

exports.types      = makeCrud(m.getTypes,      (_, n) => m.createType(n),      m.updateType,     m.deleteType);
exports.categories = makeCrud(m.getCategories, (_, n) => m.createCategory(n),  m.updateCategory, m.deleteCategory);
exports.materials  = makeCrud(m.getMaterials,  m.createMaterial,               m.updateMaterial, m.deleteMaterial);
exports.groups     = makeCrud(m.getGroups,     (_, n) => m.createGroup(n),     m.updateGroup,    m.deleteGroup);

// مجمّع: الخامات مجمّعة تحت فئاتها
exports.getMaterialsGrouped = async (req, res) => {
  try {
    const [rows] = await m.getAllMaterialsGrouped();
    // تحويل الصفوف لـ { cat_id, cat_name, materials: [...] }
    const map = {};
    rows.forEach((r) => {
      if (!map[r.cat_id]) map[r.cat_id] = { id: r.cat_id, name: r.cat_name, materials: [] };
      if (r.id) map[r.cat_id].materials.push({ id: r.id, name: r.name });
    });
    res.json(Object.values(map));
  } catch (e) { res.status(500).json({ error: e.message }); }
};