const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { chatWithAI, getAISettings, getAIWelcomeMessage, updateAISettings } = require('../controllers/aiController');
const adminAuth = require('../middlewares/adminAuth');

// Dedicated rate limiter for public AI chat to prevent abuse and token exhaustion
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 chat messages per minute per IP
  message: { error: 'تم تجاوز الحد المسموح من الرسائل، يرجى الانتظار دقيقة واحدة.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/ai/chat (public with rate limit and payload validation)
router.post('/chat', aiChatLimiter, chatWithAI);

// GET /api/ai/welcome (public - welcome message only)
router.get('/welcome', getAIWelcomeMessage);

// GET /api/ai/settings (safe: returns full settings for admin, welcome_message only for public)
router.get('/settings', getAISettings);

// PUT /api/ai/settings (admin only)
router.put('/settings', adminAuth, updateAISettings);

module.exports = router;
