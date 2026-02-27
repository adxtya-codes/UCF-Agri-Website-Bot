const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Load settings from settings.json
 * @returns {Object} - Settings object
 */
function loadSettings() {
  try {
    const filePath = path.join(__dirname, '../data/settings.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading settings.json:', error.message);
    return { promo_code: '8841', promo_code_description: '1 month free premium access' };
  }
}

/**
 * Load JSON data from file
 * @param {string} filename - Name of the JSON file
 * @returns {Array|Object} - Parsed JSON data
 */
function loadData(filename) {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error loading ${filename}:`, error.message);
    return filename.endsWith('.json') ? [] : {};
  }
}

/**
 * Save JSON data to file
 * @param {string} filename - Name of the JSON file
 * @param {Array|Object} data - Data to save
 */
function saveData(filename, data) {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Saved data to ${filename}`);
  } catch (error) {
    console.error(`❌ Error saving ${filename}:`, error.message);
  }
}

/**
 * Get or create user profile
 * @param {string} phoneNumber - User's phone number
 * @returns {Object} - User profile
 */
function getUser(phoneNumber) {
  const users = loadData('users.json');
  let user = users.find(u => u.phone === phoneNumber);

  if (!user) {
    user = {
      phone: phoneNumber,
      name: null,
      email: null,
      created_at: new Date().toISOString(),
      is_premium: false,
      premium_expiry_date: null,
      conversation_state: 'main_menu',
      location: null,
      recipet: null,
      last_interaction: new Date().toISOString()
    };
    users.push(user);
    saveData('users.json', users);
    console.log(`👤 New user created: ${phoneNumber}`);
  } else {
    // Update last interaction
    user.last_interaction = new Date().toISOString();
  }

  return user;
}

/**
 * Update user profile
 * @param {string} phoneNumber - User's phone number
 * @param {Object} updates - Fields to update
 */
function updateUser(phoneNumber, updates) {
  const users = loadData('users.json');
  const userIndex = users.findIndex(u => u.phone === phoneNumber);

  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    saveData('users.json', users);
    console.log(`✅ User updated: ${phoneNumber}`);
  }
}

/**
 * Check if user has active premium access
 * @param {Object} user - User object
 * @returns {boolean} - True if premium is active
 */
function isPremiumActive(user) {
  if (!user.is_premium) return false;

  if (!user.premium_expiry_date) return false;

  const expiryDate = new Date(user.premium_expiry_date);
  const now = new Date();

  return expiryDate > now;
}

/**
 * Generate unique hash for receipt
 * @param {string} retailer - Retailer name
 * @param {string} date - Purchase date
 * @param {string} total - Total amount
 * @returns {string} - Hash string
 */
function generateReceiptHash(retailer, date, total) {
  const data = `${retailer}-${date}-${total}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Check if receipt has been used before
 * @param {string} hash - Receipt hash
 * @returns {boolean} - True if receipt already used
 */
function isReceiptUsed(hash) {
  const receipts = loadData('receipts.json');
  return receipts.some(r => r.hash === hash);
}

/**
 * Save receipt record
 * @param {string} phoneNumber - User's phone number
 * @param {string} hash - Receipt hash
 * @param {Object} receiptData - Receipt information
 * @param {string} status - Receipt status ('pending' or 'verified')
 */
function saveReceipt(phoneNumber, hash, receiptData, status = 'verified') {
  const receipts = loadData('receipts.json');

  receipts.push({
    phone: phoneNumber,
    hash: hash,
    verified_at: new Date().toISOString(),
    status: status,
    ...receiptData
  });

  saveData('receipts.json', receipts);
}

/**
 * Get random farming tip
 * @returns {string} - Random tip
 */
function getRandomTip() {
  const tips = loadData('tips.json');
  if (tips.length === 0) return '🌱 Keep learning and growing!';

  const randomIndex = Math.floor(Math.random() * tips.length);
  return tips[randomIndex];
}

/**
 * Search products by name or keyword
 * @param {string} query - Search query
 * @returns {Array} - Matching products
 */
function searchProducts(query) {
  const products = loadData('products.json');
  const lowerQuery = query.toLowerCase();

  return products.filter(product => {
    const name = (product.name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const usage = (product.usage || '').toLowerCase();
    const cropUsage = Array.isArray(product.crop_usage) ? product.crop_usage.join(' ').toLowerCase() : '';
    const fn = Array.isArray(product.function) ? product.function.join(' ').toLowerCase() : '';
    const timing = (product.application_timing || '').toLowerCase();
    const soil = (product.soil_type || '').toLowerCase();
    const benefits = Array.isArray(product.benefits) ? product.benefits.join(' ').toLowerCase() : '';
    const npkStr = (product.npk || (product.composition ? `${product.composition.N}-${product.composition.P}-${product.composition.K}` : '')).toLowerCase();

    const haystack = [name, description, category, usage, cropUsage, fn, timing, soil, benefits, npkStr].join(' ');
    return haystack.includes(lowerQuery);
  });
}

/**
 * Format product information for display
 * @param {Object} product - Product object
 * @returns {string} - Formatted message
 */
function formatProduct(product) {
  let message = `🌾 *${product.name || 'Product'}*\n\n`;
  // Build NPK string only if fully available
  let npk = '';
  if (product.npk && product.npk !== 'undefined') {
    npk = product.npk;
  } else if (product.composition &&
    typeof product.composition.N !== 'undefined' &&
    typeof product.composition.P !== 'undefined' &&
    typeof product.composition.K !== 'undefined') {
    npk = `${product.composition.N}-${product.composition.P}-${product.composition.K}`;
  }
  if (npk) {
    message += `📊 NPK: ${npk}\n`;
  }
  message += `📝 ${product.description || 'No description available'}\n\n`;
  message += `💰 Call us for pricing\n`;
  if (Array.isArray(product.crop_usage) && product.crop_usage.length) {
    message += `🌱 Crops: ${product.crop_usage.join(', ')}\n`;
  } else if (product.usage && product.usage !== 'undefined') {
    message += `📋 Usage: ${product.usage}\n`;
  }
  return message;
}

/**
 * Format multiple products for display
 * @param {Array} products - Array of products
 * @returns {string} - Formatted message
 */
function formatProductList(products) {
  if (products.length === 0) {
    return '❌ No products found.';
  }

  let message = `🌾 *UCF Products:*\n\n`;

  products.forEach((product, index) => {
    const name = product.name || 'Product';
    let npk = '';
    if (product.npk && product.npk !== 'undefined') {
      npk = product.npk;
    } else if (product.composition &&
      typeof product.composition.N !== 'undefined' &&
      typeof product.composition.P !== 'undefined' &&
      typeof product.composition.K !== 'undefined') {
      npk = `${product.composition.N}-${product.composition.P}-${product.composition.K}`;
    }
    const description = product.description || 'No description available';

    const npkText = npk ? ` (${npk})` : '';
    message += `*${index + 1}. ${name}*${npkText}\n`;
    message += `${description}\n`;
    message += `💰 Call us for pricing\n\n`;
  });

  return message;
}

/**
 * Get main menu message
 * @param {string} userName - User's name (optional)
 * @returns {string} - Menu message
 */
function getMainMenu(userName = '') {
  const greeting = userName ? `Hello ${userName}! 👋` : 'Welcome to UCF Agri-Bot! 🌾';

  return `${greeting}\n\nI'm Sam, your agricultural assistant. How can I help you today? You can ask me anything.\n\n*Please choose:* \n\n1️⃣ *Crop Diagnosis* 🔬 (Premium)\n   Analyze crop diseases from photos\n\n2️⃣ *Fertilizer Calculator* 🧮 (Premium)\n   Calculate fertilizer quantity & budget plan\n\n3️⃣ *Find Shop* 📍\n   Locate nearest UCF retailers\n\n4️⃣ *Expert Help* 👨‍🌾 (Premium)\n   Connect with our agronomist\n\n5️⃣ *Exclusive Farming Guides* 📚 (Premium)\n   Download premium farming guides\n\n6️⃣ *Product Q&A* 💬\n   Ask about UCF products\n\n7️⃣ *Premium Access* 🔒\n   Verify your purchase receipt\n\n8️⃣ *Promo Code* 🎟️\n   Have a promo code? Get free premium!\n\nJust reply with the number or describe what you need!`;
}

/**
 * Get premium prompt message
 * @returns {string} - Premium prompt
 */
function getPremiumPrompt() {
  return `🔒 *Premium Feature*

This service is exclusively for UCF customers.

To unlock premium features:
📸 Upload a clear photo of your UCF product purchase receipt

*Premium Benefits:*
✅ Crop disease diagnosis
✅ Soil results analysis
✅ Exclusive farming guides (PDFs)
✅ Priority expert support
✅ 1 month access
✅ Fertilizer Calculator

Ready to verify? Send your receipt now! 📄\n\n _Type "menu" to go back to menu_`;
}

/**
 * Calculate date 1 month from now
 * Calculate date 3 months from now
 * @returns {string} - ISO date string
 */
function getExpiryDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Get premium mini menu for premium users
 * @param {string} userName - User's name
 * @returns {string} - Premium menu message
 */
function getPremiumMenu(userName = '') {
  const greeting = userName ? `Hello ${userName}! 👋` : 'Welcome Premium User, You can ask me anything! 🌟';

  return `${greeting}

🌟 *Premium Access Active*

Choose your premium service:

1️⃣ *Crop Diagnosis* 🔬 (Premium)
   Analyze crop diseases from photos

2️⃣ *Expert Help* 👨‍🌾 (Premium)
   Connect with our agronomist

3️⃣ *Exclusive Farming Guides* 📚
   Download premium farming guides

4️⃣ *Fertilizer Calculator* 🧮
   Calculate fertilizer quantity & budget plan

5️⃣ *Find Shop* 📍
   Locate nearest UCF retailers

6️⃣ *Product Q&A* 💬
   Ask about UCF products

7️⃣ *Main Menu* 🏠
   Return to full menu

Just reply with the number or describe what you need!`;
}

/**
 * Get exclusive PDFs list
 * @returns {Array} - Array of PDF objects
 */
function getExclusivePDFs() {
  return loadData('exclusivepdf.json');
}

/**
 * Format PDF list for display
 * @param {Array} pdfs - Array of PDF objects
 * @returns {string} - Formatted PDF list
 */
function formatPDFList(pdfs) {
  return pdfs.map((pdf, index) =>
    `${index + 1}️⃣ *${pdf.title}*
   📄 ${pdf.description}
   📊 ${pdf.pages} pages • ${pdf.size}
   🗂️ Category: ${pdf.category}`
  ).join('\n\n');
}

/**
 * Get PDF by ID
 * @param {number} id - PDF ID
 * @returns {Object|null} - PDF object or null if not found
 */
function getPDFById(id) {
  const pdfs = getExclusivePDFs();
  return pdfs.find(pdf => pdf.id === id) || null;
}

/**
 * Calculate fertilizer quantity needed
 * @param {number} fieldSize - Field size in hectares
 * @param {Object} npkRequirement - NPK requirement per hectare {N, P, K}
 * @param {Object} fertilizerNPK - Fertilizer NPK content {N, P, K}
 * @returns {Object} - Calculation results
 */
function calculateFertilizerQuantity(fieldSize, npkRequirement, fertilizerNPK) {
  // Calculate based on the most limiting nutrient
  const nRequired = (fieldSize * npkRequirement.N) / (fertilizerNPK.N / 100);
  const pRequired = (fieldSize * npkRequirement.P) / (fertilizerNPK.P / 100);
  const kRequired = (fieldSize * npkRequirement.K) / (fertilizerNPK.K / 100);

  // Use the highest requirement to ensure all nutrients are met
  const kgRequired = Math.max(nRequired, pRequired, kRequired);

  // Standard bag size is typically 50kg
  const standardBagSize = 50;
  const bagsRequired = Math.ceil(kgRequired / standardBagSize);

  // Calculate actual nutrient delivery
  const actualN = (kgRequired * fertilizerNPK.N / 100) / fieldSize;
  const actualP = (kgRequired * fertilizerNPK.P / 100) / fieldSize;
  const actualK = (kgRequired * fertilizerNPK.K / 100) / fieldSize;

  // Calculate surplus/deficit
  const nBalance = actualN - npkRequirement.N;
  const pBalance = actualP - npkRequirement.P;
  const kBalance = actualK - npkRequirement.K;

  return {
    kgRequired: Math.round(kgRequired),
    bagsRequired,
    actualDelivery: {
      N: Math.round(actualN * 10) / 10,
      P: Math.round(actualP * 10) / 10,
      K: Math.round(actualK * 10) / 10
    },
    nutrientBalance: {
      N: Math.round(nBalance * 10) / 10,
      P: Math.round(pBalance * 10) / 10,
      K: Math.round(kBalance * 10) / 10
    }
  };
}

/**
 * Format fertilizer calculation results
 * @param {Object} calculation - Calculation results
 * @param {Object} inputs - Input parameters
 * @returns {string} - Formatted message
 */
function formatFertilizerCalculation(calculation, inputs) {
  const { fieldSize, npkRequirement, fertilizerName, fertilizerNPK } = inputs;

  let message = `🧮 *Fertilizer Calculation Results*\n\n`;
  message += `📏 *Field Size:* ${fieldSize} hectares\n`;
  message += `🌾 *Selected Product:* ${fertilizerName}\n`;
  message += `📊 *Product NPK:* ${fertilizerNPK.N}-${fertilizerNPK.P}-${fertilizerNPK.K}\n\n`;

  message += `📦 *QUANTITY NEEDED:*\n`;
  const bagSize = 50;
  message += `• Total: ${calculation.kgRequired} kg = ${calculation.kgRequired} ÷ ${bagSize} = ${calculation.bagsRequired} bags of ${fertilizerName}\n\n`;

  message += `🎯 *TARGET vs ACTUAL DELIVERY:*\n`;
  message += `• N: ${npkRequirement.N} → ${calculation.actualDelivery.N} kg/ha\n`;
  message += `• P: ${npkRequirement.P} → ${calculation.actualDelivery.P} kg/ha\n`;
  message += `• K: ${npkRequirement.K} → ${calculation.actualDelivery.K} kg/ha\n\n`;

  message += `⚖️ *NUTRIENT BUDGET ANALYSIS:*\n`;

  ['N', 'P', 'K'].forEach(nutrient => {
    const balance = calculation.nutrientBalance[nutrient];
    if (balance > 0) {
      message += `• ${nutrient}: +${balance} kg/ha (Surplus ✅)\n`;
    } else if (balance < 0) {
      message += `• ${nutrient}: ${balance} kg/ha (Deficit ⚠️)\n`;
    } else {
      message += `• ${nutrient}: Perfect match ✅\n`;
    }
  });

  // Add recommendations
  const hasDeficit = Object.values(calculation.nutrientBalance).some(val => val < -1);
  if (hasDeficit) {
    message += `\n💡 *RECOMMENDATION:*\n`;
    message += `Consider supplementing with additional fertilizer or organic matter to address nutrient deficits.\n`;
  }

  return message;
}

/**
 * Get fertilizer calculator prompt
 * @returns {string} - Calculator prompt message
 */
function getFertilizerCalculatorPrompt() {
  return `🧮 *Fertilizer Quantity & Budget Planner*

This tool helps you calculate how much fertilizer you need for your crop.

*Step 1: Crop Selection*
Please tell me your crop name.

Example: "Maize", "Cotton", "Cabbage"

_Type "menu" to go back to main menu_`;
}

function parseFertilizerRate(rate) {
  if (!rate || typeof rate !== 'string') {
    return { type: 'none', value: 0, unit: null, min: null, max: null };
  }
  const normalized = rate.replace(/–/g, '-').trim();
  if (!normalized || /^nil$/i.test(normalized)) {
    return { type: 'none', value: 0, unit: null, min: null, max: null };
  }
  const match = normalized.match(/^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?\s*(.+)$/i);
  if (!match) {
    return { type: 'unknown', value: 0, unit: normalized, min: null, max: null };
  }
  const first = parseFloat(match[1]);
  const second = match[2] ? parseFloat(match[2]) : null;
  const unit = match[3].trim();
  let value = first;
  let min = first;
  let max = first;
  if (!isNaN(second)) {
    min = Math.min(first, second);
    max = Math.max(first, second);
    value = (min + max) / 2;
  }
  const unitLower = unit.toLowerCase();
  if (unitLower.includes('kg/ha')) {
    return { type: 'kg_per_ha', value, unit, min, max };
  }
  if (unitLower.includes('g/ha')) {
    return { type: 'g_per_ha', value, unit, min, max };
  }
  if (unitLower.includes('g/m b2') || unitLower.includes('g/m2') || unitLower.includes('g/m^2')) {
    return { type: 'g_per_m2', value, unit, min, max };
  }
  if (unitLower.includes('g/tree')) {
    return { type: 'g_per_tree', value, unit, min, max };
  }
  return { type: 'unknown', value, unit, min, max };
}

function getCropFertilizerPlan(cropName, fieldSize) {
  const data = loadData('fertilizercalc.json');
  const name = (cropName || '').trim().toLowerCase();
  const entry = data.find(item => (item.crop || '').toLowerCase() === name);
  if (!entry) {
    return { error: 'not_found' };
  }
  const plantingRate = parseFertilizerRate(entry.rate_at_planting);
  const topRate = parseFertilizerRate(entry.rate_top_dressing);
  let plantingKg = null;
  let topKg = null;
  const notes = [];
  if (plantingRate.type === 'kg_per_ha') {
    plantingKg = plantingRate.value * fieldSize;
  } else if (plantingRate.type === 'g_per_ha') {
    plantingKg = (plantingRate.value * fieldSize) / 1000;
  } else if (plantingRate.type === 'g_per_m2') {
    const kgPerHa = plantingRate.value * 10;
    plantingKg = kgPerHa * fieldSize;
    notes.push('At-planting rate converted from g/m b2 assuming 1 ha = 10,000 m b2.');
  } else if (plantingRate.type === 'g_per_tree') {
    notes.push('At-planting rate is per tree. Total quantity depends on number of trees.');
  }
  if (topRate.type === 'kg_per_ha') {
    topKg = topRate.value * fieldSize;
  } else if (topRate.type === 'g_per_ha') {
    topKg = (topRate.value * fieldSize) / 1000;
  } else if (topRate.type === 'g_per_m2') {
    const kgPerHaTop = topRate.value * 10;
    topKg = kgPerHaTop * fieldSize;
    notes.push('Top-dressing rate converted from g/m b2 assuming 1 ha = 10,000 m b2.');
  } else if (topRate.type === 'g_per_tree') {
    notes.push('Top-dressing rate is per tree. Total quantity depends on number of trees.');
  }
  const totalKg = (typeof plantingKg === 'number' ? plantingKg : 0) + (typeof topKg === 'number' ? topKg : 0);
  return {
    error: null,
    crop: entry.crop,
    fieldSize,
    compound_at_planting: entry.compound_at_planting,
    compound_top_dressing: entry.compound_top_dressing,
    rate_at_planting: entry.rate_at_planting,
    rate_top_dressing: entry.rate_top_dressing,
    timing: entry.timing,
    remarks: entry.remarks,
    plantingKg: typeof plantingKg === 'number' ? Math.round(plantingKg * 10) / 10 : null,
    topKg: typeof topKg === 'number' ? Math.round(topKg * 10) / 10 : null,
    totalKg: totalKg > 0 ? Math.round(totalKg * 10) / 10 : null,
    notes
  };
}

function formatCropFertilizerPlan(plan) {
  const bagSize = 50; // 50kg bags
  let message = `🧮 *Fertilizer Plan for ${plan.crop}*\n\n`;
  message += `📏 Field size: ${plan.fieldSize} hectares\n\n`;
  message += `🌱 At planting: ${plan.compound_at_planting || '-'} (${plan.rate_at_planting || 'rate not specified'})`;
  if (typeof plan.plantingKg === 'number') {
    const plantingBags = Math.ceil(plan.plantingKg / bagSize);
    const plantingName = plan.compound_at_planting || 'fertilizer';
    message += `\n• Total at planting: ${plan.plantingKg} kg = ${plan.plantingKg} ÷ ${bagSize} = ${plantingBags} bags of ${plantingName}`;
  }
  message += `\n\n`;
  if (plan.rate_top_dressing && !/^nil$/i.test(plan.rate_top_dressing.trim())) {
    message += `🌿 Top dressing: ${plan.compound_top_dressing || '-'} (${plan.rate_top_dressing})`;
    if (typeof plan.topKg === 'number') {
      const topBags = Math.ceil(plan.topKg / bagSize);
      const topName = plan.compound_top_dressing || 'fertilizer';
      message += `\n• Total for top dressing: ${plan.topKg} kg = ${plan.topKg} ÷ ${bagSize} = ${topBags} bags of ${topName}`;
    }
    message += `\n\n`;
  }
  if (typeof plan.totalKg === 'number' && plan.totalKg > 0) {
    const totalBags = Math.ceil(plan.totalKg / bagSize);
    message += `📊 Total fertilizer for your field: ${plan.totalKg} kg = ${plan.totalKg} ÷ ${bagSize} = ${totalBags} bags (50kg)\n\n`;
  }
  if (plan.timing) {
    message += `⏱️ Timing: ${plan.timing}\n`;
  }
  if (plan.remarks) {
    message += `📝 Notes: ${plan.remarks}\n`;
  }
  if (plan.notes && plan.notes.length) {
    message += `\nℹ️ ${plan.notes.join(' ')}`;
  }
  message += `\n\nTo estimate budget, multiply the total kg by your price per kg.`;
  return message;
}

module.exports = {
  loadData,
  saveData,
  loadSettings,
  getUser,
  updateUser,
  isPremiumActive,
  generateReceiptHash,
  isReceiptUsed,
  saveReceipt,
  getRandomTip,
  searchProducts,
  formatProduct,
  formatProductList,
  getMainMenu,
  getPremiumPrompt,
  getPremiumMenu,
  getExpiryDate,
  formatDate,
  getExclusivePDFs,
  formatPDFList,
  getPDFById,
  calculateFertilizerQuantity,
  formatFertilizerCalculation,
  getFertilizerCalculatorPrompt,
  getCropFertilizerPlan,
  formatCropFertilizerPlan
};
