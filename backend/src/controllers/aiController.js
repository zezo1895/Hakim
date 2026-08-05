const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check API Key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // 1. Fetch products context from database
    let products = [];
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
        LIMIT 200
      `);
      products = rows || [];
    } catch (dbErr) {
      console.error("Database error while fetching for AI context:", dbErr.message);
      // Continue without products - AI will still work but without product context
    }

    // Formatting products for context
    let productsContext = "لا توجد منتجات متاحة حالياً في قاعدة البيانات.";
    if (products.length > 0) {
      productsContext = products.map(p => 
        `- المنتج: ${p.name || ''}, الكود: ${p.code || ''}, النوع: ${p.type_name || ''}, الخامة: ${p.material_name || ''} (${p.material_category || ''}), المقاس: ${p.size || ''}, الحرارة: ${p.temp || ''}`
      ).join('\n');
    }

    // 2. Define System Prompt
    const systemPrompt = `أنت مندوب مبيعات ومساعد ذكي في شركة "حكيم جروب" المتخصصة في التعبئة والتغليف البلاستيكية والورقية للمطاعم والمصانع.
    
مهمتك:
- الرد بلهجة مصرية محترفة، مهذبة ومختصرة.
- مساعدة العملاء في اختيار المنتجات المناسبة لاحتياجاتهم من كتالوج منتجاتنا فقط.
- عدم اقتراح أو اختراع أي منتجات غير موجودة في الكتالوج التالي.
- إذا لم تجد منتجاً مناسباً في الكتالوج، اعتذر بلطف وأخبرهم أن هذا المنتج غير متوفر حالياً.
- كن مفيداً، يمكنك اقتراح خامات (مثل PP للمأكولات الساخنة والمايكرويف، و PET للمأكولات الباردة والعصائر، و PS للبارد).
- لا تذكر أكواد المنتجات في سياق الحديث إلا إذا سأل العميل، بل اذكر اسم المنتج والمقاس بوضوح.

إليك كتالوج منتجاتنا الحالي (لا تخرج عنه أبداً):
${productsContext}
`;

    // 3. Prepare Chat model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: systemPrompt 
    });

    // Format history for Gemini multi-turn
    let formattedHistory = [];
    if (history && Array.isArray(history)) {
      formattedHistory = history
        .filter(h => h && h.text && h.role)
        .map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        }));
      // Gemini requires first history message to be 'user' role
      // Drop any leading 'model' messages (like the welcome message)
      while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
      }
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.5,
      },
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ text: responseText });

  } catch (error) {
    console.error("AI Error:", error.message || error);
    res.status(500).json({ error: 'Failed to process AI request', details: error.message });
  }
};

module.exports = {
  chatWithAI
};
