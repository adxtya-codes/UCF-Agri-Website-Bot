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
 * Analyze agricultural image (crop, soil, leaves, plants, trees) using GPT-4o Vision
 * @param {string} imagePath - Path to the agricultural image
 * @returns {Promise<Object>} - Comprehensive analysis with recommendations
 */
async function detectPlantDisease(imagePath) {
  try {
    console.log('🌿 Analyzing agricultural image using GPT-4o Vision...');

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

    // Call GPT-4o Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Dr. Agri — a senior plant pathologist and agronomist with 25+ years of field and laboratory experience across African and Asian cropping systems. You specialize in:
- Visual nutrient deficiency diagnosis (distinguishing N, P, K, Mg, Ca, S, Fe, Zn, Mn, B deficiencies by symptom pattern)
- Fungal, bacterial, and viral disease identification from field photographs
- Pest damage pattern recognition

YOUR ABSOLUTE RULES:
1. GROUND EVERY CLAIM IN VISUAL EVIDENCE. Quote exactly what you see (e.g. "interveinal chlorosis on leaf lamina of the 3rd and 4th oldest leaves, with primary and secondary veins remaining green"). Never write generic text.
2. USE DIFFERENTIAL DIAGNOSIS. For each symptom, explicitly rule out similar conditions. Example: "The pattern is interveinal on older leaves → consistent with Mg or Mn deficiency, NOT N deficiency (which starts on older leaves uniformly) and NOT Fe deficiency (which starts on youngest leaves)."
3. NEVER HALLUCINATE. If you cannot clearly see a symptom, write "Not clearly visible in this image."
4. CONFIDENCE CALIBRATION:
   - 90–99%: Textbook-clear, unambiguous symptoms with multiple confirming signs
   - 75–89%: Clear primary symptom but one or two alternative diagnoses cannot be fully excluded
   - 60–74%: Symptoms present but image quality, angle, or early-stage limits certainty
   - Below 60%: Ambiguous or image too blurry/distant for confident diagnosis
5. BE REPRODUCIBLE. Every time this exact image is analysed, the conclusion must be identical.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyse this crop/plant photograph using the structured chain-of-thought process below. Work through EVERY step before writing the final report.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHAIN-OF-THOUGHT (internal reasoning — do this before answering):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP A — IDENTIFY THE PLANT:
• Crop species, growth stage, and approximate age if visible.

STEP B — SCAN FOR SYMPTOMS (for each, state PRESENT / ABSENT / UNCLEAR):
1. Chlorosis (yellowing) on OLDER lower leaves
2. Chlorosis (yellowing) on YOUNGER upper leaves
3. Interveinal chlorosis (veins stay green, lamina yellows)
4. Marginal/tip chlorosis or necrosis (leaf edges/tips brown or yellow)
5. Uniform pale-green or yellow on entire plant
6. Circular or irregular brown/black spots or lesions
7. Water-soaked or greasy-looking lesions
8. White, grey, or orange powdery/fuzzy growth on surface
9. Wilting, rolling, or curling leaves
10. Stunted or distorted growth / mosaic / ring patterns
11. Stem lesions, cankers, or basal rot
12. Root issues (if visible)
13. Insect presence, feeding holes, frass, webbing, tunnelling

STEP C — DIFFERENTIAL DIAGNOSIS:
Based on Step B, list the top 1–3 candidate diagnoses and explain which symptoms SUPPORT and which symptoms RULE OUT each candidate. Be explicit, e.g.:
- "Mg deficiency: SUPPORTED by interveinal chlorosis on older leaves. RULED OUT: not Fe deficiency because symptoms are on older not younger leaves."

STEP D — FINAL DIAGNOSIS with confidence rationale.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Now write the FINAL REPORT in this exact WhatsApp format:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌾 *UCF Crop Diagnosis*

*IDENTIFICATION:*
Crop: [Species and growth stage]
Issue Detected: [Primary diagnosis — be specific, e.g. "Magnesium (Mg) deficiency" not just "nutrient deficiency"]
AI Confidence: [XX% — include one sentence explaining the confidence level]

*VISUAL EVIDENCE:*
[2–4 bullet points, each quoting EXACTLY what is visible in the image and what it indicates. Use precise anatomical language: "interveinal chlorosis on 3rd–5th oldest leaves", "circular brown lesions 5–10mm diameter with yellow halo on mid-canopy leaves", etc.]
• [Observation 1 → what it indicates]
• [Observation 2 → what it indicates]
• [Observation 3 → what it indicates]

*DIFFERENTIAL DIAGNOSIS:*
✅ Most likely: [Diagnosis 1] — [1 sentence of supporting evidence from the image]
⚠️ Ruled out: [Diagnosis 2] — [1 sentence explaining why the visible symptoms don't match]
⚠️ Ruled out: [Diagnosis 3] — [1 sentence explaining why]

*PROBABLE CAUSES:*
• [Root cause 1 — directly linked to the primary diagnosis]
• [Root cause 2 — contributing or predisposing factor]
• [Root cause 3 — environmental or management factor]

*IMMEDIATE ACTIONS (do today):*
• [Action 1 — specific and practical]
• [Action 2]
• [Action 3]

*TREATMENT PLAN:*
[3–5 sentences: exact treatment product type, application method, dosage per hectare or per litre of water, spray interval, and expected visible recovery timeline.]

*UCF PRODUCT RECOMMENDATION:*
[Select the 1–2 most relevant UCF products from the list below. For each: state the product name, application rate per hectare, why it specifically addresses the diagnosed issue, and how quickly results should be visible. If the issue is purely fungal/bacterial/viral/pest and fertiliser cannot fix it, say so clearly and recommend fungicide/pesticide instead.]

*PREVENTION:*
• [Long-term prevention measure 1 — specific to this diagnosis]
• [Prevention measure 2]
• [Prevention measure 3]

_To connect to a live agronomist, reply *Expert*. Type *Menu* to return to the main menu._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Available UCF Products (for recommendation only):
${productsList}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      seed: 42
    });

    const analysisText = response.choices[0].message.content;
    console.log('✅ GPT-4o Vision analysis completed');
    console.log('🔍 Full Analysis:', analysisText.substring(0, 300) + '...');

    // Extract issue/disease name from the analysis
    const issueMatch = analysisText.match(/Issue Detected:\s*(.+)/i);
    const confidenceMatch = analysisText.match(/AI Confidence:\s*(\d+)%/i);

    const issue = issueMatch ? issueMatch[1].trim() : 'Agricultural Analysis';
    const rawConfidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 80;
    const confidenceScore = Math.max(0.5, Math.min(0.99, rawConfidence / 100));

    return {
      disease: issue,
      confidence: confidenceScore,
      fullAnalysis: analysisText,
      allResults: [{ label: issue, score: confidenceScore }]
    };

  } catch (error) {
    console.error('❌ GPT-4o Vision Agricultural Analysis Error:', error.message);
    throw error;
  }
}

/**
 * Analyze soil image using GPT-4o Vision
 * @param {string} imagePath - Path to the soil image
 * @returns {Promise<Object>} - Soil analysis result
 */
async function analyzeSoilImage(imagePath) {
  try {
    console.log('🌱 Analyzing soil sample/report using GPT-4o Vision...');

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

    // Call GPT-4o Vision API with enhanced soil analysis prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Dr. Soil — a certified soil scientist and agricultural consultant specialising in smallholder farming systems across Africa and Asia.

YOUR RULES:
1. If the image is a LABORATORY SOIL TEST REPORT: extract every numeric value you can read (N, P, K, pH, OC%, EC, etc.) as accurately as possible. Do NOT estimate — only report values you can clearly read.
2. If the image is a RAW SOIL SAMPLE or FIELD PHOTO: assess based on colour (Munsell or descriptive), texture, structure, moisture content, compaction signs, and organic matter indicators visible.
3. NEVER fabricate values. Write "Not readable" if a value is present but illegible. Write "Not shown" if not in the image.
4. Always tie your fertiliser recommendation directly to the specific deficiency or imbalance identified.
5. Keep language practical and farmer-friendly.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Examine this image carefully — it may be a soil test report, a soil sample photo, or a field soil condition photo.

First, determine which type it is, then analyse accordingly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERNAL REASONING (do this before answering):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Is this a lab report? If yes, read every number carefully.
- Is this a soil photo? If yes, note: colour (dark/reddish/grey/pale), texture (sandy/clay/loamy), structure (crumbly/compacted/cloddy), moisture (wet/moist/dry), organic matter (dark rich layer visible?), any issues (cracks, crust, erosion).
- What are the critical deficiencies or imbalances?
- Which UCF products directly address those?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now write the FINAL REPORT in this exact WhatsApp format:

🌱 *UCF Soil Analysis Report*

*IMAGE TYPE:* [Lab Test Report / Soil Sample Photo / Field Soil Photo]

*SOIL ASSESSMENT:*
Soil Type: [Sandy / Loamy / Clay / Silty / Mixed — based on image evidence]
Overall Health: [Excellent / Good / Fair / Poor]
AI Confidence: [XX% — one sentence explaining the basis]

*NUTRIENT PROFILE:*
• Nitrogen (N): [Exact value from report OR "Low/Medium/High" from visual assessment]
• Phosphorus (P): [Exact value OR assessment]
• Potassium (K): [Exact value OR assessment]
• pH: [Exact value OR "Acidic/Neutral/Alkaline"]
• Organic Carbon (OC) / Organic Matter: [Value OR assessment]
• Other notable values: [Any EC, Ca, Mg, Zn, Fe, Mn readings visible, OR "Not shown"]

*VISUAL OBSERVATIONS:*
[3–4 bullet points describing exactly what you observe — soil colour, texture, structure, compaction, moisture, crust formation, erosion signs, or specific lab values and what they indicate]
• [Observation 1 → implication]
• [Observation 2 → implication]
• [Observation 3 → implication]

*KEY FINDINGS & CONCERNS:*
• [Critical finding 1 — e.g. "pH 5.2 indicates severe acidity — most nutrients unavailable to plants"]
• [Critical finding 2]
• [Critical finding 3]

*IMMEDIATE RECOMMENDATIONS:*
• [Action 1 — specific, actionable today]
• [Action 2]
• [Action 3]

*UCF PRODUCT RECOMMENDATIONS:*
[For each recommended product: name, application rate per hectare, why it specifically addresses the findings, and expected improvement timeline. Match products to the exact deficiencies identified.]

*SOIL IMPROVEMENT PLAN:*
[3–5 sentences: what to apply, in what order, with what timing, and what improvement to expect after each season.]

*CROP SUITABILITY:*
[Based on the soil type and condition, name 2–3 crops well-suited for this soil, and 1–2 crops to avoid, with brief reasoning.]

_To connect to a live agronomist, reply *Expert*. Type *Menu* to return to the main menu._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Available UCF Products (for recommendation):
${productsList}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      seed: 42
    });

    const analysisText = response.choices[0].message.content;
    console.log('✅ GPT-4o Vision soil analysis completed');
    console.log('🔍 Full Analysis:', analysisText.substring(0, 300) + '...');

    // Extract soil health from the analysis
    const healthMatch = analysisText.match(/Overall Health:\s*(.+)/i);
    const soilHealth = healthMatch ? healthMatch[1].trim() : 'Soil Analysis Complete';

    // Extract confidence score from the response text
    const soilConfidenceMatch = analysisText.match(/AI Confidence:\s*(\d+)%/i);
    let confidenceScore = soilConfidenceMatch ? Math.max(0.5, Math.min(0.99, parseInt(soilConfidenceMatch[1]) / 100)) : 0.85;

    return {
      disease: soilHealth,
      confidence: confidenceScore,
      fullAnalysis: analysisText,
      allResults: [{ label: soilHealth, score: confidenceScore }]
    };

  } catch (error) {
    console.error('❌ GPT-4o Vision Soil Analysis Error:', error.message);
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
