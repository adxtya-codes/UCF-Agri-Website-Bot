const jsQR = require('jsqr');
const sharp = require('sharp');
const axios = require('axios');
const { loadData } = require('./utils');

/**
 * Detect and decode QR code from receipt image
 * @param {string} imagePath - Path to the receipt image
 * @returns {Promise<string|null>} - QR code URL or null if not found
 */
async function detectQRCode(imagePath) {
    try {
        console.log('🔍 Detecting QR code in receipt image...');

        // Convert image to raw pixel data using sharp
        const image = sharp(imagePath);
        const { data, info } = await image
            .raw()
            .ensureAlpha()
            .toBuffer({ resolveWithObject: true });

        // Detect QR code
        const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);

        if (code && code.data) {
            console.log('✅ QR code detected:', code.data);
            return code.data;
        }

        console.log('ℹ️ No QR code found in image');
        return null;

    } catch (error) {
        console.error('❌ QR detection error:', error.message);
        return null;
    }
}

/**
 * Extract value from ZIMRA HTML structure: <div class="result-text">VALUE</div>
 * @param {string} html - HTML content
 * @param {string} labelText - Label text to search for
 * @returns {string|null} - Extracted value
 */
function extractFromResultDiv(html, labelText) {
    // Pattern: <label class="label">LABEL_TEXT</label>...<div class="result-text">VALUE</div>
    const pattern = new RegExp(
        `<label[^>]*>${labelText}</label>[\\s\\S]*?<div class="result-text">([^<]+)</div>`,
        'i'
    );
    const match = html.match(pattern);
    return match ? match[1].trim() : null;
}

/**
 * Fetch and parse invoice data from ZIMRA URL
 * @param {string} qrUrl - URL from QR code
 * @returns {Promise<Object>} - Parsed invoice data
 */
async function fetchInvoiceData(qrUrl) {
    try {
        console.log('📥 Fetching invoice from:', qrUrl);

        const response = await axios.get(qrUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = response.data;

        // Parse invoice fields from HTML - matches ZIMRA page structure
        // ZIMRA uses: <label class="label">FIELD</label>...<div class="result-text">VALUE</div>
        const invoiceData = {
            is_valid: html.includes('Invoice is valid') || html.includes('invoice is valid'),
            taxpayer_name: extractFromResultDiv(html, 'TAXPAYER NAME'),
            trade_name: extractFromResultDiv(html, 'TRADE NAME'),
            address: extractFromResultDiv(html, 'ADDRESS'),
            invoice_number: extractFromResultDiv(html, 'INVOICE NUMBER'),
            invoice_date: extractFromResultDiv(html, 'INVOICE DATE AND TIME'),
            invoice_total: extractFromResultDiv(html, 'INVOICE TOTAL AMOUNT'),
            currency: extractFromResultDiv(html, 'CURRENCY') || 'USD',
            retailer_name: extractFromResultDiv(html, 'TRADE NAME') ||
                extractFromResultDiv(html, 'TAXPAYER NAME'),
            raw_html: html
        };

        console.log('✅ Invoice data parsed:', invoiceData);
        return invoiceData;

    } catch (error) {
        console.error('❌ Invoice fetch error:', error.message);
        throw new Error('Failed to fetch invoice data from QR code URL');
    }
}

/**
 * Extract field value from HTML using regex (fallback)
 * @param {string} html - HTML content
 * @param {RegExp} pattern - Regex pattern
 * @returns {string|null} - Extracted value
 */
function extractField(html, pattern) {
    const match = html.match(pattern);
    return match ? match[1].trim() : null;
}

/**
 * Validate invoice data
 * @param {Object} invoiceData - Invoice data from ZIMRA
 * @returns {Object} - Validation result
 */
function validateInvoice(invoiceData) {
    const errors = [];

    // Check if invoice is valid
    if (!invoiceData.is_valid) {
        errors.push('Invoice is not valid according to ZIMRA');
    }

    // Check if invoice date is within 3 months
    if (invoiceData.invoice_date) {
        const invoiceDate = parseDate(invoiceData.invoice_date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        if (invoiceDate < threeMonthsAgo) {
            errors.push('Invoice is older than 3 months');
        }
    }

    // Check required fields
    if (!invoiceData.invoice_number) {
        errors.push('Invoice number not found');
    }

    if (!invoiceData.retailer_name) {
        errors.push('Retailer name not found');
    }

    // Validate retailer against retailers.json
    if (invoiceData.retailer_name || invoiceData.taxpayer_name || invoiceData.trade_name) {
        const retailers = loadData('retailers.json');
        const retailerNames = retailers.map(r => r.name.toLowerCase());
        const retailerFullNames = retailers.map(r => (r.full_name || '').toLowerCase());

        console.log('🔍 Checking retailer authorization...');
        console.log('   TAXPAYER NAME:', invoiceData.taxpayer_name);
        console.log('   TRADE NAME:', invoiceData.trade_name);
        console.log('   Authorized retailers:', retailerNames);

        // Check if taxpayer_name or trade_name matches any retailer
        const taxpayerLower = (invoiceData.taxpayer_name || '').toLowerCase();
        const tradeLower = (invoiceData.trade_name || '').toLowerCase();

        const taxpayerMatch = taxpayerLower && (
            retailerNames.some(name => taxpayerLower.includes(name) || name.includes(taxpayerLower)) ||
            retailerFullNames.some(fullName => fullName && (taxpayerLower.includes(fullName) || fullName.includes(taxpayerLower)))
        );

        const tradeMatch = tradeLower && (
            retailerNames.some(name => tradeLower.includes(name) || name.includes(tradeLower)) ||
            retailerFullNames.some(fullName => fullName && (tradeLower.includes(fullName) || fullName.includes(tradeLower)))
        );

        console.log('   Taxpayer match:', taxpayerMatch);
        console.log('   Trade name match:', tradeMatch);

        if (!taxpayerMatch && !tradeMatch) {
            console.log('   ❌ Retailer not authorized');
            errors.push('Retailer not in authorized list');
        } else {
            console.log('   ✅ Retailer authorized');
        }
    }

    return {
        is_valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Parse date from various formats
 * @param {string} dateStr - Date string
 * @returns {Date} - Parsed date
 */
function parseDate(dateStr) {
    // Try DD/MM/YYYY format
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
        // Assume DD/MM/YYYY
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
}

/**
 * Match products against UCF product list
 * @param {string[]} extractedProducts - Products from receipt
 * @returns {Object} - Matching result
 */
function matchUCFProducts(extractedProducts) {
    const ucfProducts = loadData('products.json');
    const ucfProductNames = ucfProducts.map(p => p.name.toLowerCase());

    const matchedProducts = extractedProducts.filter(product => {
        const productLower = product.toLowerCase();
        return ucfProductNames.some(ucfName =>
            productLower.includes(ucfName) || ucfName.includes(productLower)
        );
    });

    return {
        has_ucf_product: matchedProducts.length > 0,
        matched_products: matchedProducts,
        total_products: extractedProducts.length
    };
}

module.exports = {
    detectQRCode,
    fetchInvoiceData,
    validateInvoice,
    matchUCFProducts
};
