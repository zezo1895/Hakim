const model          = require("../models/productModel");
const { cloudinary } = require("../config/cloudinary");

exports.search    = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 1) return res.json([]);
    res.json(await model.search(q));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.searchLids = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const results = await model.searchLids(q);
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getAll = async (req, res) => {
  try { res.json(await model.getAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
};

// إعادة ترتيب المنتجات — بياخد { order: [id1, id2, id3, ...] } بالترتيب الجديد
exports.reorder = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || !order.length) {
      return res.status(400).json({ error: "order (array of ids) required" });
    }
    await model.reorder(order.map(Number));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const product = await model.getById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    const siblings = product.group_id
      ? (await model.getSiblings(product.group_id, req.params.id))[0]
      : [];
    res.json({ ...product, siblings });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, code, type_id, material_id, temp, group_id, size, notes, lid_ids } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });

    let parsedLids = [];
    if (lid_ids) {
      try {
        parsedLids = JSON.parse(lid_ids);
      } catch (e) {
        parsedLids = [];
      }
    }

    const [r] = await model.create({ name, code, type_id, material_id, temp, group_id, size, notes });
    const pid  = r.insertId;

    if (req.files?.length)
      for (let i = 0; i < req.files.length; i++)
        await model.addImage(pid, req.files[i].path, req.files[i].filename, i);

    await model.setLids(pid, parsedLids);
    res.status(201).json({ id: pid });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// تحديث المجموعة بس — للاستخدام فى التعديل الجماعي (اختيار منتجات متعددة وتغيير مجموعتهم دفعة واحدة)
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { group_id } = req.body;
    if (!group_id) return res.status(400).json({ error: "group_id required" });
    await model.updateGroup(id, group_id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, type_id, material_id, temp, group_id, size, notes,
            lid_ids, remove_image_ids } = req.body;

    let parsedLids = [];
    if (lid_ids) {
      try {
        parsedLids = JSON.parse(lid_ids);
      } catch (e) {
        parsedLids = [];
      }
    }

    await model.update(id, { name, code, type_id, material_id, temp, group_id, size, notes });

    if (remove_image_ids) {
      const toRemove = JSON.parse(remove_image_ids);
      const [imgs]   = await model.getImages(id);
      await Promise.all(
        imgs
          .filter((img) => toRemove.includes(img.id))
          .map(async (img) => {
            await cloudinary.uploader.destroy(img.public_id).catch(() => {});
            await model.deleteImage(img.id);
          })
      );
    }

    if (req.files?.length) {
      const [existing] = await model.getImages(id);
      for (let i = 0; i < req.files.length; i++)
        await model.addImage(id, req.files[i].path, req.files[i].filename, existing.length + i);
    }

    await model.setLids(id, parsedLids);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await model.getById(productId);
    if (!product) {
      return res.status(404).json({ error: "المنتج غير موجود بالفعل" });
    }

    const [rows] = await model.getImages(productId);

    if (rows && rows.length > 0) {
      const deletePromises = rows.map(async (img) => {
        if (img.public_id) {
          console.log(`🗑️ Deleting image: ${img.public_id}`);
          return cloudinary.uploader.destroy(img.public_id);
        }
      });
      await Promise.all(deletePromises);
    }

    if (product.code) {
      const folderPath = `hakim-group/products/${product.code.trim()}`;
      console.log(`📂 Deleting empty folder: ${folderPath}`);
      await cloudinary.api.delete_folder(folderPath).catch((err) => {
        console.log("ℹ️ Note: Folder deletion skipped or folder wasn't empty:", err.message);
      });
    }

    await model.remove(productId);

    res.json({ success: true, message: "تم حذف المنتج، صوره، ومجلده الخاص من السحاب والداتابيز بنجاح! 🚀" });
  } catch (e) {
    console.error("❌ Error in remove controller:", e.message);
    res.status(500).json({ error: e.message });
  }
};