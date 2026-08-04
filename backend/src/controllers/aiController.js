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

    // 1. Fetch products context from database
    let products = [];
    try {
      const result = await db.query('SELECT name, item_code, type, material, size, temperature FROM products');
      products = result.rows || [];
    } catch (dbErr) {
      console.error("Database error while fetching for AI context:", dbErr);
    }

    // Formatting products for context
    const productsContext = products.map(p => 
      `- المنتج: ${p.name}, الكود: ${p.item_code}, النوع: ${p.type}, الخامة: ${p.material}, المقاس: ${p.size}, الحرارة: ${p.temperature}`
    ).join('\n');

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
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt 
    });

    // Generate response using single turn (or pass history if provided)
    // Formatting history for Gemini if we want multi-turn
    let formattedHistory = [];
    if (history && Array.isArray(history)) {
      formattedHistory = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.5,
      },
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ text: responseText });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: 'Failed to process AI request', details: error.message });
  }
};

module.exports = {
  chatWithAI
};
