const express = require('express');
const router = express.Router();
const { chatWithAI, getAISettings, updateAISettings } = require('../controllers/aiController');
const adminAuth = require('../middlewares/adminAuth');

// POST /api/ai/chat (public - for customers)
router.post('/chat', chatWithAI);

// GET /api/ai/settings (public - for welcome message)
router.get('/settings', getAISettings);

// PUT /api/ai/settings (admin only)
router.put('/settings', adminAuth, updateAISettings);

module.exports = router;
