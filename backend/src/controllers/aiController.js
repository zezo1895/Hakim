const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper for timing-safe string comparison
const safeCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// Check if incoming request has valid admin credentials
const checkIsAdmin = (req) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;

    if (token && jwtSecret) {
      try {
        jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
        return true;
      } catch {
        // invalid token, fall through to header secret
      }
    }

    const secret = req.headers['x-admin-secret'];
    if (secret && process.env.ADMIN_SECRET && safeCompare(secret, process.env.ADMIN_SECRET)) {
      return true;
    }
  } catch (err) {
    console.error("Error checking admin auth in AI controller:", err.message);
  }
  return false;
};

// ── In-Memory Caches for AI context ───────────────────────
let cachedProductsContext = null;
let lastProductsCacheTime = 0;
let cachedInstructions = null;
let lastInstructionsCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedProductsContext() {
  const now = Date.now();
  if (cachedProductsContext && (now - lastProductsCacheTime) < CACHE_TTL_MS) {
    return cachedProductsContext;
  }

  try {
    const [rows] = await db.query(`
      SELECT p.name, p.code, p.size, p.temp,
             pt.name AS type_name,
             m.name  AS material_name,
             mc.name AS material_category
      FROM products p
      LEFT JOIN product_types       pt ON pt.id = p.type_id
      LEFT JOIN materials           m  ON m.id  = p.material_id
      LEFT JOIN material_categories mc ON mc.id = m.category_id
      ORDER BY p.sort_order ASC
      LIMIT 500
    `);

    if (rows && rows.length > 0) {
      cachedProductsContext = rows.map(p => 
        `- ${p.name || ''} | كود: ${p.code || '—'} | نوع: ${p.type_name || '—'} | خامة: ${p.material_name || '—'} (${p.material_category || '—'}) | مقاس: ${p.size || '—'} | حرارة: ${p.temp || '—'}`
      ).join('\n');
    } else {
      cachedProductsContext = "لا توجد منتجات متاحة حالياً في قاعدة البيانات.";
    }
    lastProductsCacheTime = now;
  } catch (err) {
    console.error("Database error fetching products for AI:", err.message);
    if (!cachedProductsContext) {
      cachedProductsContext = "لا توجد منتجات متاحة حالياً.";
    }
  }

  return cachedProductsContext;
}

async function getCachedCustomInstructions() {
  const now = Date.now();
  if (cachedInstructions !== null && (now - lastInstructionsCacheTime) < CACHE_TTL_MS) {
    return cachedInstructions;
  }
  try {
    const [settings] = await db.query('SELECT custom_instructions FROM ai_settings WHERE id = 1');
    cachedInstructions = (settings && settings[0] && settings[0].custom_instructions) || '';
    lastInstructionsCacheTime = now;
  } catch (e) {
    console.error("Error fetching AI instructions:", e.message);
    cachedInstructions = cachedInstructions || '';
  }
  return cachedInstructions;
}

// ── Ensure ai_settings table exists ──────────────────────
const ensureTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_settings (
        id INT PRIMARY KEY DEFAULT 1,
        custom_instructions TEXT,
        welcome_message VARCHAR(500) DEFAULT 'أهلاً بيك في حكيم جروب! 🌟 أنا المساعد الذكي، أقدر أساعدك إزاي في اختيار أنسب خامات التغليف؟',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    // Insert default row if not exists
    await db.query(`
      INSERT IGNORE INTO ai_settings (id, custom_instructions) VALUES (1, '')
    `);
  } catch (e) {
    console.error("AI Settings table error:", e.message);
  }
};
ensureTable();

// ── GET AI Welcome Message (Public) ──────────────────────
const getAIWelcomeMessage = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT welcome_message FROM ai_settings WHERE id = 1');
    const welcome = (rows && rows[0] && rows[0].welcome_message) || 'أهلاً بيك في حكيم جروب! 🌟 أنا المساعد الذكي، أقدر أساعدك إزاي في اختيار أنسب خامات التغليف؟';
    res.json({ welcome_message: welcome });
  } catch (error) {
    console.error("Get AI Welcome Error:", error.message);
    res.status(500).json({ error: 'Failed to fetch welcome message' });
  }
};

// ── GET AI Settings (Safe: Admin gets all, Public gets only welcome_message) ─
const getAISettings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ai_settings WHERE id = 1');
    const settings = rows[0] || { custom_instructions: '', welcome_message: '' };

    if (checkIsAdmin(req)) {
      return res.json({
        custom_instructions: settings.custom_instructions || '',
        welcome_message: settings.welcome_message || ''
      });
    }

    // Public callers only receive the public welcome message (protecting custom_instructions)
    return res.json({
      welcome_message: settings.welcome_message || ''
    });
  } catch (error) {
    console.error("Get AI Settings Error:", error.message);
    res.status(500).json({ error: 'Failed to fetch AI settings' });
  }
};

// ── UPDATE AI Settings (Admin) ───────────────────────────
const updateAISettings = async (req, res) => {
  try {
    const { custom_instructions, welcome_message } = req.body;
    await db.query(
      'UPDATE ai_settings SET custom_instructions = ?, welcome_message = ? WHERE id = 1',
      [custom_instructions || '', welcome_message || '']
    );
    cachedInstructions = custom_instructions || '';
    lastInstructionsCacheTime = Date.now();
    res.json({ success: true });
  } catch (error) {
    console.error("Update AI Settings Error:", error.message);
    res.status(500).json({ error: 'Failed to update AI settings' });
  }
};

// ── Chat with AI (Public with rate limit & validation) ───
const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be text' });
    }

    const cleanMessage = message.trim();
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (cleanMessage.length > 500) {
      return res.status(400).json({ error: 'Message is too long (maximum 500 characters)' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // 1. Fetch cached products context and custom instructions (eliminates DB overhead per message)
    const [productsContext, customInstructions] = await Promise.all([
      getCachedProductsContext(),
      getCachedCustomInstructions()
    ]);

    // 2. Define System Prompt
    const systemPrompt = `أنت مندوب مبيعات ومساعد ذكي في شركة "حكيم جروب" المتخصصة في التعبئة والتغليف البلاستيكية والورقية للمطاعم والمصانع.
    
مهمتك:
- الرد بلهجة مصرية محترفة، مهذبة ومختصرة.
- مساعدة العملاء في اختيار المنتجات المناسبة لاحتياجاتهم من كتالوج منتجاتنا فقط.
- عدم اقتراح أو اختراع أي منتجات غير موجودة في الكتالوج التالي.
- إذا لم تجد منتجاً مناسباً في الكتالوج، اعتذر بلطف وأخبرهم أن هذا المنتج غير متوفر حالياً.
- كن مفيداً، يمكنك اقتراح خامات (مثل PP للمأكولات الساخنة والمايكرويف، و PET للمأكولات الباردة والعصائر، و PS للبارد).
- لا تذكر أكواد المنتجات في سياق الحديث إلا إذا سأل العميل، بل اذكر اسم المنتج والمقاس بوضوح.
- لما العميل يسأل عن تسعير أو سعر، قوله إن الأسعار بتتحدد حسب الكمية المطلوبة ووجهه إنه يضغط زرار "طلب تسعير" في صفحة المنتج أو يتواصل معانا على الواتساب.

${customInstructions ? `## تعليمات إضافية من الإدارة:\n${customInstructions}\n` : ''}

إليك كتالوج منتجاتنا الحالي (لا تخرج عنه أبداً):
${productsContext}
`;

    // 3. Prepare Chat model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: systemPrompt 
    });

    // Format and sanitize history for Gemini multi-turn (max 6 messages, max 500 chars each)
    let formattedHistory = [];
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      formattedHistory = recentHistory
        .filter(h => h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'model'))
        .map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text.trim().slice(0, 500) }]
        }));

      while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
      }
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.5,
      },
    });

    const result = await chat.sendMessage(cleanMessage);
    const responseText = result.response.text();

    res.json({ text: responseText });

  } catch (error) {
    console.error("AI Error:", error.message || error);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
};

module.exports = {
  chatWithAI,
  getAISettings,
  getAIWelcomeMessage,
  updateAISettings
};
