const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Load UCF products for recommendations
 */
function loadProducts() {
  try {
    const productsPath = require('path').join(__dirname, '../data/products.json');
    const productsData = fs.readFileSync(productsPath, 'utf8');
    return JSON.parse(productsData);
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

/**
 * Analyze agricultural image (crop, soil, leaves, plants, trees) using GPT-4 Vision
 * @param {string} imagePath - Path to the agricultural image
 * @returns {Promise<Object>} - Comprehensive analysis with recommendations
 */
async function detectPlantDisease(imagePath) {
  try {
    console.log('🌿 Analyzing agricultural image using GPT-4 Vision...');

    // Load UCF products for recommendations
    const products = loadProducts();
    const productsList = products.map(p => {
      const composition = p.composition ? `N:${p.composition.N} P:${p.composition.P} K:${p.composition.K}` : (p.npk || '');
      const crops = p.crop_usage ? ` | Crops: ${p.crop_usage.join(', ')}` : '';
      const timing = p.application_timing ? ` | When: ${p.application_timing}` : (p.usage || '');
      return `- ${p.name} (${composition})${crops}\n  ${p.description}\n  ${timing}`;
    }).join('\n\n');

    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const imageExtension = imagePath.split('.').pop().toLowerCase();
    const mimeType = imageExtension === 'png' ? 'image/png' : 'image/jpeg';

    // Call GPT-4 Vision API with comprehensive agricultural analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert agricultural consultant for UCF Fertilizers. Analyze ANY agricultural image including crops, soil, leaves, plants, trees, fruits, vegetables, or farming conditions. Always provide detailed, actionable advice in clear farmer-friendly language.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this agricultural image in detail and respond EXACTLY in the following WhatsApp message format (do not add or remove sections, and keep the headings as they are):

🌾 UCF Crop Diagnosis

IDENTIFICATION:
Crop: [Crop or plant name if you can infer it, otherwise use a general type like "Leafy vegetable" or "Unknown crop"]
Issue Detected: [Specific disease/pest/issue or "Healthy" if no issue]
AI Confidence: [Number between 70% and 99% based on how clear the diagnosis is]

DETAILED ANALYSIS:
[2–4 sentences explaining what you see in the image – symptoms, lesion patterns, colours, affected leaves/plant parts, and likely disease behaviour]

PROBABLE CAUSES:
• [Cause 1]
• [Cause 2]
• [Cause 3]

IMMEDIATE CONTROL ACTIONS:
• [Short, practical action 1 the farmer can do today]
• [Short, practical action 2]
• [Short, practical action 3]

TREATMENT PLAN:
[2–4 sentences describing a clear treatment plan, including spray frequency, good practices, and how long to continue]

UCF FERTILIZER RECOMMENDATION:
[Recommend 1–2 relevant UCF products from the list below, with simple rate per hectare or per plant and timing. Explain briefly how they help recovery or plant strength.]

PREVENTION MEASURES:
• [Long-term prevention tip 1]
• [Long-term prevention tip 2]
• [Long-term prevention tip 3]

To connect to an agronomist, reply "Expert" or "Menu" to go to main menu.

IMPORTANT RULES:
- Base your diagnosis strictly on visible symptoms in the image.
- If the crop looks healthy, clearly say so in "Issue Detected" and still give preventive tips.
- Use short, clear sentences and keep everything very practical for smallholder farmers.
- When recommending products, choose only from this UCF list and match crop + problem as best as you can.

Available UCF Products:
${productsList}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500
    });

    const analysisText = response.choices[0].message.content;
    console.log('✅ GPT-4 Vision analysis completed');
    console.log('🔍 Full Analysis:', analysisText.substring(0, 300) + '...');

    // Extract issue/disease name from the analysis
    const issueMatch = analysisText.match(/Issue:\s*(.+)/i);
    const severityMatch = analysisText.match(/Severity:\s*(.+)/i);

    const issue = issueMatch ? issueMatch[1].trim() : 'Agricultural Analysis';
    const severity = severityMatch ? severityMatch[1].trim().toLowerCase() : 'medium';

    // Convert severity to confidence score
    let confidenceScore = 0.8;
    if (severity.includes('severe')) confidenceScore = 0.95;
    else if (severity.includes('moderate')) confidenceScore = 0.85;
    else if (severity.includes('mild')) confidenceScore = 0.75;
    else if (severity.includes('none') || severity.includes('healthy')) confidenceScore = 0.9;

    return {
      disease: issue,
      confidence: confidenceScore,
      fullAnalysis: analysisText,
      allResults: [{ label: issue, score: confidenceScore }]
    };

  } catch (error) {
    console.error('❌ GPT-4 Vision Agricultural Analysis Error:', error.message);
    throw error;
  }
}

/**
 * Analyze soil image using GPT-4 Vision
 * @param {string} imagePath - Path to the soil image
 * @returns {Promise<Object>} - Soil analysis result
 */
async function analyzeSoilImage(imagePath) {
  try {
    console.log('🌱 Analyzing soil sample/report using GPT-4 Vision...');

    // Load UCF products for recommendations
    const products = loadProducts();
    const productsList = products.map(p => {
      const composition = p.composition ? `N:${p.composition.N} P:${p.composition.P} K:${p.composition.K}` : (p.npk || '');
      const crops = p.crop_usage ? ` | Crops: ${p.crop_usage.join(', ')}` : '';
      const timing = p.application_timing ? ` | When: ${p.application_timing}` : (p.usage || '');
      return `- ${p.name} (${composition})${crops}\n  ${p.description}\n  ${timing}`;
    }).join('\n\n');

    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const imageExtension = imagePath.split('.').pop().toLowerCase();
    const mimeType = imageExtension === 'png' ? 'image/png' : 'image/jpeg';

    // Call GPT-4 Vision API with soil analysis prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert soil scientist and agricultural consultant for UCF Fertilizers. Analyze soil test reports, soil samples, or soil-related images and provide detailed, actionable recommendations in farmer-friendly language.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this soil image (could be a soil test report, soil sample photo, or soil condition image) and respond EXACTLY in the following WhatsApp message format:

🌱 UCF Soil Analysis Report

SOIL ASSESSMENT:
Soil Type: [Sandy/Loamy/Clay/Mixed - based on visual appearance or report]
Overall Health: [Excellent/Good/Fair/Poor]
AI Confidence: [Number between 70% and 99%]

NUTRIENT ANALYSIS:
[If this is a test report, extract the values. If it's a soil sample photo, provide general assessment based on color, texture, and appearance]
• Nitrogen (N): [Value and unit OR Low/Medium/High]
• Phosphorus (P): [Value and unit OR Low/Medium/High]
• Potassium (K): [Value and unit OR Low/Medium/High]
• pH Level: [Value OR Acidic/Neutral/Alkaline]
• Organic Matter: [Percentage OR Low/Medium/High]

DETAILED OBSERVATIONS:
[2-4 sentences describing what you observe - soil color, texture, moisture, compaction, visible issues, or test report findings]

KEY FINDINGS:
• [Finding 1 - nutrient deficiency, pH issue, or soil health concern]
• [Finding 2]
• [Finding 3]

IMMEDIATE RECOMMENDATIONS:
• [Practical action 1 the farmer can take now]
• [Practical action 2]
• [Practical action 3]

UCF FERTILIZER RECOMMENDATIONS:
[Recommend 1-3 relevant UCF products based on the soil analysis. Include application rates per hectare and explain how each product addresses specific soil needs]

SOIL IMPROVEMENT PLAN:
[2-4 sentences with a clear plan for improving soil health - amendments needed, timing, frequency, and expected results]

CROP SUITABILITY:
[Suggest 2-3 crops that would grow well in this soil type and condition, or crops to avoid]

To connect to an agronomist, reply "Expert" or "Menu" to go to main menu.

IMPORTANT RULES:
- If this is a test report, extract all visible values accurately
- If this is a soil sample photo, provide assessment based on visual characteristics
- Be specific with fertilizer recommendations and application rates
- Keep language simple and practical for smallholder farmers
- Match UCF products to the specific soil needs identified

Available UCF Products:
${productsList}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500
    });

    const analysisText = response.choices[0].message.content;
    console.log('✅ GPT-4 Vision soil analysis completed');
    console.log('🔍 Full Analysis:', analysisText.substring(0, 300) + '...');

    // Extract soil health from the analysis
    const healthMatch = analysisText.match(/Overall Health:\s*(.+)/i);
    const soilHealth = healthMatch ? healthMatch[1].trim() : 'Soil Analysis Complete';

    // Determine confidence score based on health assessment
    let confidenceScore = 0.85;
    if (analysisText.toLowerCase().includes('excellent')) confidenceScore = 0.95;
    else if (analysisText.toLowerCase().includes('good')) confidenceScore = 0.90;
    else if (analysisText.toLowerCase().includes('fair')) confidenceScore = 0.80;
    else if (analysisText.toLowerCase().includes('poor')) confidenceScore = 0.75;

    return {
      disease: soilHealth,
      confidence: confidenceScore,
      fullAnalysis: analysisText,
      allResults: [{ label: soilHealth, score: confidenceScore }]
    };

  } catch (error) {
    console.error('❌ GPT-4 Vision Soil Analysis Error:', error.message);
    throw error;
  }
}

/**
 * Process crop/plant image
 * @param {string} imagePath - Path to the image
 * @param {string} imageType - Type of image ('crop' or 'soil')
 * @returns {Promise<Object>} - Analysis result
 */
async function processPlantImage(imagePath, imageType = 'crop') {
  try {
    if (imageType === 'soil') {
      return await analyzeSoilImage(imagePath);
    }

    const result = await detectPlantDisease(imagePath);
    return result;

  } catch (error) {
    console.error('❌ Plant Image Processing Error:', error.message);
    throw new Error('Unable to analyze the image. Please ensure it is a clear photo of the plant/crop.');
  }
}

/**
 * Format disease name for better readability
 * @param {string} diseaseLabel - Raw disease label from model
 * @returns {string} - Formatted disease name
 */
function formatDiseaseName(diseaseLabel) {
  // Remove underscores and capitalize words
  return diseaseLabel
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

module.exports = {
  detectPlantDisease,
  analyzeSoilImage,
  processPlantImage,
  formatDiseaseName
};
