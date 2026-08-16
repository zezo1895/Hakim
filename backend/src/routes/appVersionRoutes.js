const express = require('express');
const router = express.Router();
const appVersionController = require('../controllers/appVersionController');

// GET /api/app-version
router.get('/', appVersionController.getAppVersion);

// POST /api/app-version/request-update
router.post('/request-update', appVersionController.requestUpdate);

// POST /api/app-version/confirm-update
router.post('/confirm-update', appVersionController.confirmUpdate);

module.exports = router;
