const { GoogleGenerativeAI } = require('@google/generative-ai');

const translateProduct = async (productData) => {
  if (!process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY is not set. Skipping translation.");
    return {
      name_en: null,
      size_en: null,
      notes_en: null
    };
  }

  // Only translate if there's an Arabic name
  if (!productData.name) {
    return { name_en: null, size_en: null, notes_en: null };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are a professional translator specialized in plastic packaging, food containers, and disposable tableware.
You will receive a JSON object with Arabic product details ('name', 'size', 'notes').
Your task is to translate them into professional English used in the B2B packaging industry and return ONLY a valid JSON object with the keys: 'name_en', 'size_en', 'notes_en'.

Translation rules:
- "غطاء" = Lid
- "طبق فوم" = Foam Plate
- "كوب" = Cup
- "علبة" = Container
- "مفصلي" = Hinged Container or Clamshell
- "بدون كعب" = Without Base / Bottomless
- "امتصاص" = Absorbent
- "عاده" = Regular
- "عيون" or "عين" (for lunch boxes) = Compartment (e.g. 3-Compartment)
- Keep material abbreviations exactly as they are (PP, PS, PET, K-RESIN).
- If 'size' or 'notes' is empty/null, return null for them.
- Return ONLY valid JSON. No markdown, no extra text.`;

    const inputData = {
      name: productData.name,
      size: productData.size || null,
      notes: productData.notes || null
    };

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: JSON.stringify(inputData) }] }
      ],
      systemInstruction: systemPrompt
    });

    let responseText = result.response.text().trim();
    
    // Strip markdown code blocks if any
    if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.substring(7);
      if (responseText.endsWith('\`\`\`')) {
        responseText = responseText.substring(0, responseText.length - 3);
      }
    } else if (responseText.startsWith('\`\`\`')) {
      responseText = responseText.substring(3);
      if (responseText.endsWith('\`\`\`')) {
        responseText = responseText.substring(0, responseText.length - 3);
      }
    }

    const translatedJson = JSON.parse(responseText.trim());

    return {
      name_en: translatedJson.name_en || null,
      size_en: translatedJson.size_en || null,
      notes_en: translatedJson.notes_en || null,
    };
  } catch (error) {
    console.error("Translation Service Error:", error.message);
    return { name_en: null, size_en: null, notes_en: null }; // Fallback on error
  }
};

module.exports = {
  translateProduct
};
