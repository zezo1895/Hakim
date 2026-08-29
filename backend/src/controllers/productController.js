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

exports.getAllLidsMap = async (req, res) => {
  try { res.json(await model.getAllLidsMap()); }
  catch (e) { res.status(500).json({ error: e.message }); }
};

// إعادة ترتيب المنتجات — بياخد { order: [id1, id2, id3, ...] } بالترتيب الجديد
exports.reorder = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || !order.length) {
      return res.status(400).json({ error: "order (array of ids) required" });
    }
    await model.reorder(order.map(String));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const product = await model.getById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    
    let groupIds = product.related_groups ? [...product.related_groups] : [];
    if (product.group_id) groupIds.push(product.group_id);
    
    const siblings = groupIds.length > 0
      ? (await model.getSiblings(groupIds, req.params.id))[0]
      : [];
    res.json({ ...product, siblings });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, code, type_id, material_id, temp, group_id, size, notes, lid_ids, convert_manual_lid_id } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });

    let parsedLids = [];
    if (lid_ids) {
      try {
        parsedLids = JSON.parse(lid_ids);
      } catch (e) {
        parsedLids = [];
      }
    }

    const pid = await model.create({ name, code, type_id, material_id, temp, group_id, size, notes });

    if (req.files?.length)
      for (let i = 0; i < req.files.length; i++)
        await model.addImage(pid, req.files[i].path, req.files[i].filename, i);

    await model.setLids(pid, parsedLids);

    if (convert_manual_lid_id) { 
      await model.convertManualLidToRealLid(convert_manual_lid_id, pid); 
    }

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
            lid_ids, convert_manual_lid_id, related_groups, remove_image_ids } = req.body;

    let parsedLids = [];
    if (lid_ids) {
      try {
        parsedLids = JSON.parse(lid_ids);
      } catch (e) {
        parsedLids = [];
      }
    }

    await model.update(id, { name, code, type_id, material_id, temp, group_id, size, notes, related_groups });

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

    const { existing_image_order } = req.body;
    if (existing_image_order) {
      try {
        const orderIds = JSON.parse(existing_image_order);
        const db = require("../config/db");
        for (let i = 0; i < orderIds.length; i++) {
          await db.query('UPDATE product_images SET sort_order = ? WHERE id = ?', [i, orderIds[i]]);
        }
      } catch (e) {
        console.error("Error updating image order:", e);
      }
    }

    await model.setLids(id, parsedLids);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.bulkImagesUpdate = async (req, res) => {
  try {
    const { remove_image_ids, orders } = req.body;
    const db = require("../config/db");

    // 1. Process deletions
    if (remove_image_ids) {
      const toRemove = JSON.parse(remove_image_ids);
      for (const imgId of toRemove) {
        const [imgs] = await db.query("SELECT public_id FROM product_images WHERE id=?", [imgId]);
        if (imgs.length) {
          await cloudinary.uploader.destroy(imgs[0].public_id).catch(() => {});
          await model.deleteImage(imgId);
        }
      }
    }

    // 2. Group new files by product_id
    const newFilesMap = {};
    if (req.files && req.files.length) {
      req.files.forEach(file => {
         const match = file.fieldname.match(/^new_images_(.+)$/);
         if (match) {
           const pid = match[1];
           if (!newFilesMap[pid]) newFilesMap[pid] = [];
           newFilesMap[pid].push(file);
         }
      });
    }

    // 3. Process ordering and insert new images
    if (orders) {
      const parsedOrders = JSON.parse(orders);
      
      for (const productId of Object.keys(parsedOrders)) {
        const items = parsedOrders[productId]; // array of strings (uuid or "file:X")
        let sortIndex = 0;
        let fileIndex = 0;
        
        for (const item of items) {
           if (item.startsWith("file:")) {
              const filesForProduct = newFilesMap[productId];
              if (filesForProduct && filesForProduct[fileIndex]) {
                 const file = filesForProduct[fileIndex];
                 await model.addImage(productId, file.path, file.filename, sortIndex);
                 fileIndex++;
              }
           } else {
              // Existing image UUID
              await db.query('UPDATE product_images SET sort_order = ? WHERE id = ?', [sortIndex, item]);
           }
           sortIndex++;
        }
      }
    }

    res.json({ success: true });
  } catch(e) {
    console.error("Bulk image update error:", e);
    res.status(500).json({ error: e.message });
  }
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
exports.getManualLids = async (req, res) => {
  try {
    const lids = await model.getAllManualLids();
    res.json(lids);
  } catch (e) {
    console.error('Error fetching manual lids:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteManualLid = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    await model.deleteManualLid(id);
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting manual lid:', e.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.incrementViews = async (req, res) => { try { await model.incrementViews(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.logSearch = async (req, res) => { try { if(req.body.query) await model.logSearch(req.body.query); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.getAnalytics = async (req, res) => { try { const data = await model.getAnalytics(); res.json(data); } catch (err) { res.status(500).json({ error: err.message }); } };

