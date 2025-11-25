const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Get AI response from OpenAI GPT
 * @param {string} userMessage - User's message
 * @param {string} context - Additional context for the AI
 * @returns {Promise<string>} - AI response
 */
async function getGPTResponse(userMessage, context = '') {
  try {
    const systemPrompt = `You are Sam, a friendly and knowledgeable agricultural assistant for UCF Fertilizers. 
You help farmers with:
- Product information about UCF fertilizers
- Farming tips and best practices
- Crop disease diagnosis and treatment recommendations
- Soil health advice

Always respond in simple, farmer-friendly language. Use emojis occasionally to make responses engaging.
Keep responses concise (2-3 sentences max unless detailed explanation is needed).
When recommending products, always suggest UCF products when relevant.
${context ? '\n\nAdditional Context: ' + context : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ GPT Error:', error.message);
    return 'Sorry, I am having trouble connecting to my AI brain right now. Please try again in a moment. 🙏';
  }
}

/**
 * Analyze and enhance receipt data using GPT
 * @param {Object} receiptData - Structured receipt data from OCR/QR
 * @returns {Promise<Object>} - Enhanced receipt data
 */
async function analyzeReceipt(receiptData) {
  try {
    // If we already have data from QR code, we may just need to enhance product matching
    if (receiptData.source === 'qr' && receiptData.is_valid) {
      console.log('✅ Receipt verified via QR code, enhancing with GPT...');

      // Use GPT to better extract UCF products from the raw text
      if (receiptData.raw_text) {
        const prompt = `Analyze this receipt text and identify all UCF branded products.
Look for the keyword "UCF" and extract product names that contain or are near "UCF".

Receipt Text:
${receiptData.raw_text}

Return a JSON object with:
{
  "ucf_products": ["list of UCF product names found"],
  "has_ucf_product": true/false
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a receipt analyzer. Extract UCF product information accurately and return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 200
        });

        const response = completion.choices[0].message.content.trim();
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const gptResult = JSON.parse(jsonMatch[0]);
          if (gptResult.ucf_products && gptResult.ucf_products.length > 0) {
            receiptData.ucf_products = gptResult.ucf_products;
            receiptData.has_ucf_product = true;
          }
        }
      }

      return receiptData;
    }

    // For OCR-only receipts, use GPT to extract all information
    console.log('📄 Analyzing OCR receipt with GPT...');
    const prompt = `Analyze this receipt text and extract the following information in JSON format:
{
  "retailer_name": "name of the shop/retailer",
  "purchase_date": "date in YYYY-MM-DD format",
  "ucf_products": ["list of UCF branded products found - look for 'UCF' keyword"],
  "total_amount": "total amount if found",
  "has_ucf_product": true/false,
  "currency": "currency code (USD, ZWL, etc)"
}

Receipt Text:
${receiptData.raw_text}

IMPORTANT: Look specifically for the "UCF" keyword to identify UCF products. Be strict about this.
If you cannot find clear information, use null for that field.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a receipt analyzer. Extract information accurately and return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const response = completion.choices[0].message.content.trim();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const gptResult = JSON.parse(jsonMatch[0]);

      // Merge GPT results with existing receipt data
      receiptData.retailer_name = gptResult.retailer_name || receiptData.retailer_name;
      receiptData.purchase_date = gptResult.purchase_date || receiptData.purchase_date;
      receiptData.total_amount = gptResult.total_amount || receiptData.total_amount;
      receiptData.currency = gptResult.currency || receiptData.currency;
      receiptData.ucf_products = gptResult.ucf_products || receiptData.ucf_products;
      receiptData.has_ucf_product = gptResult.has_ucf_product || receiptData.has_ucf_product;
    }

    return receiptData;

  } catch (error) {
    console.error('❌ Receipt Analysis Error:', error.message);
    // Return the original receipt data if GPT analysis fails
    return receiptData;
  }
}

/**
 * Get crop disease diagnosis and treatment recommendation
 * @param {string} diseaseName - Name of the detected disease
 * @param {string} userMessage - User's additional message/context
 * @returns {Promise<string>} - Treatment recommendation
 */
async function getDiagnosisAdvice(diseaseName, userMessage = '') {
  try {
    const prompt = `A farmer has detected "${diseaseName}" in their crop. ${userMessage ? 'They say: ' + userMessage : ''}

Provide:
1. Brief explanation of the disease (1-2 sentences)
2. Immediate action steps
3. Recommended UCF product for treatment
4. Prevention tips

Keep it simple and actionable for farmers.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an agricultural expert helping farmers treat crop diseases. Recommend UCF products when appropriate.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Diagnosis Advice Error:', error.message);
    return 'I detected the issue but having trouble generating advice. Please consult with our expert team. 🌾';
  }
}

/**
 * Answer product-related questions using GPT as fallback
 * @param {string} question - User's product question
 * @param {Array} products - Available products from products.json
 * @returns {Promise<string>} - Answer
 */
async function answerProductQuestion(question, products) {
  try {
    // Format products with full details
    const productsContext = products.map(p => {
      const composition = p.composition ? `N:${p.composition.N} P:${p.composition.P} K:${p.composition.K}` : (p.npk || '');
      const crops = p.crop_usage ? `\n  Suitable for: ${p.crop_usage.join(', ')}` : '';
      const timing = p.application_timing ? `\n  Application: ${p.application_timing}` : '';
      const functions = p.function ? `\n  Functions: ${p.function.join('; ')}` : '';
      return `${p.name} (${composition})\n  ${p.description}${crops}${timing}${functions}`;
    }).join('\n\n');

    const prompt = `User Question: ${question}

Available UCF Products:
${productsContext}

Analyze the user's question and provide a detailed, helpful answer about UCF products. 
- If asking about a specific product, provide full details including composition, usage, and benefits.
- If asking which product to use, recommend the most suitable one based on their needs.
- If asking about crop-specific fertilizers, match products to their crops.
- Always mention product names and explain why they're suitable.

Keep the answer conversational and farmer-friendly.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a product expert for UCF Fertilizers. Analyze questions carefully and recommend the most suitable products from the available list. Be specific and helpful.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Product Question Error:', error.message);
    return 'I can help with product information, but I am having technical difficulties right now. Please try again. 🙏';
  }
}

module.exports = {
  getGPTResponse,
  analyzeReceipt,
  getDiagnosisAdvice,
  answerProductQuestion
};
