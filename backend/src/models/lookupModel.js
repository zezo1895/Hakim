// نموذج موحد لإدارة: أنواع المنتجات، الخامات الرئيسية، الخامات الفرعية، المجموعات
const db = require("../config/db");

// ── Product Types ──────────────────────────────────────────
const getTypes    = ()     => db.query("SELECT * FROM product_types ORDER BY name");
const createType  = (name) => db.query("INSERT INTO product_types (name) VALUES (?)", [name]);
const deleteType  = (id)   => db.query("DELETE FROM product_types WHERE id = ?", [id]);
const updateType  = (id, name) =>
  db.query("UPDATE product_types SET name = ? WHERE id = ?", [name, id]);

// ── Material Categories ────────────────────────────────────
const getCategories   = ()     => db.query("SELECT * FROM material_categories ORDER BY name");
const createCategory  = (name) =>
  db.query("INSERT INTO material_categories (name) VALUES (?)", [name]);
const deleteCategory  = (id)   =>
  db.query("DELETE FROM material_categories WHERE id = ?", [id]);
const updateCategory  = (id, name) =>
  db.query("UPDATE material_categories SET name = ? WHERE id = ?", [name, id]);

// ── Materials (sub) ────────────────────────────────────────
const getMaterials = (categoryId) =>
  db.query(
    `SELECT m.*, mc.name AS category_name
     FROM materials m
     JOIN material_categories mc ON m.category_id = mc.id
     ${categoryId ? "WHERE m.category_id = ?" : "ORDER BY mc.name, m.name"}`,
    categoryId ? [categoryId] : []
  );

const getAllMaterialsGrouped = () =>
  db.query(`
    SELECT mc.id AS cat_id, mc.name AS cat_name,
           m.id, m.name
    FROM material_categories mc
    LEFT JOIN materials m ON m.category_id = mc.id
    ORDER BY mc.name, m.name
  `);

const createMaterial = (categoryId, name) =>
  db.query(
    "INSERT INTO materials (category_id, name) VALUES (?, ?)",
    [categoryId, name]
  );
const deleteMaterial = (id)   => db.query("DELETE FROM materials WHERE id = ?", [id]);
const updateMaterial = (id, name) =>
  db.query("UPDATE materials SET name = ? WHERE id = ?", [name, id]);

// ── Groups ─────────────────────────────────────────────────
const getGroups   = ()     => db.query("SELECT * FROM product_groups ORDER BY name");
const createGroup = (name) => db.query("INSERT INTO product_groups (name) VALUES (?)", [name]);
const deleteGroup = (id)   => db.query("DELETE FROM product_groups WHERE id = ?", [id]);
const updateGroup = (id, name) =>
  db.query("UPDATE product_groups SET name = ? WHERE id = ?", [name, id]);

module.exports = {
  getTypes, createType, deleteType, updateType,
  getCategories, createCategory, deleteCategory, updateCategory,
  getMaterials, getAllMaterialsGrouped, createMaterial, deleteMaterial, updateMaterial,
  getGroups, createGroup, deleteGroup, updateGroup,
};