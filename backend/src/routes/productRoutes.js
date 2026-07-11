const router     = require("express").Router();
const ctrl       = require("../controllers/productController");
const lookupCtrl = require("../controllers/lookupController");
const adminAuth  = require("../middlewares/adminAuth");
const { upload } = require("../config/cloudinary");

// ── Lookups (public read + admin write) ──────────────────
router.get ("/types",              lookupCtrl.types.getAll);
router.post("/types",              adminAuth, lookupCtrl.types.create);
router.put ("/types/:id",          adminAuth, lookupCtrl.types.update);
router.delete("/types/:id",        adminAuth, lookupCtrl.types.remove);

router.get ("/material-categories",        lookupCtrl.categories.getAll);
router.post("/material-categories",        adminAuth, lookupCtrl.categories.create);
router.put ("/material-categories/:id",    adminAuth, lookupCtrl.categories.update);
router.delete("/material-categories/:id",  adminAuth, lookupCtrl.categories.remove);

router.get ("/materials",          lookupCtrl.getMaterialsGrouped);
router.post("/materials",          adminAuth, lookupCtrl.materials.create);
router.put ("/materials/:id",      adminAuth, lookupCtrl.materials.update);
router.delete("/materials/:id",    adminAuth, lookupCtrl.materials.remove);

router.get ("/groups",             lookupCtrl.groups.getAll);
router.post("/groups",             adminAuth, lookupCtrl.groups.create);
router.put ("/groups/:id",         adminAuth, lookupCtrl.groups.update);
router.delete("/groups/:id",       adminAuth, lookupCtrl.groups.remove);

// ── Products ─────────────────────────────────────────────
router.get("/search",              ctrl.search);
router.get("/search/lids",         ctrl.searchLids);
router.put("/reorder",             adminAuth, ctrl.reorder);
router.get("/",                    ctrl.getAll);
router.get("/:id",                 ctrl.getOne);
router.post("/",                   adminAuth, upload.array("images", 10), ctrl.create);
router.put("/:id/group",           adminAuth, ctrl.updateGroup);
router.put("/:id",                 adminAuth, upload.array("images", 10), ctrl.update);
router.delete("/:id",              adminAuth, ctrl.remove);

// ── Manual Lids Routes ──────────────────────────────────
router.get("/manual-lids",         adminAuth, async (req, res) => {
  try {
    const model = require("../models/productModel");
    const lids = await model.getAllManualLids();
    res.json(lids);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/manual-lids/:id",  adminAuth, async (req, res) => {
  try {
    const model = require("../models/productModel");
    await model.deleteManualLid(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;