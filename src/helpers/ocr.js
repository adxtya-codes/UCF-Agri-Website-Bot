const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();
const { detectQRCode, fetchInvoiceData, validateInvoice, matchUCFProducts } = require('./qrInvoice');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract text from receipt image using GPT-4 Vision
 * @param {string} imagePath - Path to the receipt image file
 * @returns {Promise<string>} - Extracted text from receipt
 */
async function extractReceiptText(imagePath) {
  try {
    console.log('📄 Starting GPT-4 Vision OCR on receipt image...');

    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const imageExtension = imagePath.split('.').pop().toLowerCase();
    const mimeType = imageExtension === 'png' ? 'image/png' : 'image/jpeg';

    // Call GPT-4 Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL text from this receipt image. Include:
- Store/Retailer name
- Date of purchase
- All product names and prices
- Total amount
- Any other visible text

Format the output as plain text, preserving the structure.`
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
      max_tokens: 1000
    });

    const extractedText = response.choices[0].message.content;
    console.log('✅ GPT-4 Vision OCR completed');
    console.log('📝 Extracted text:', extractedText.substring(0, 200) + '...');

    return extractedText;

  } catch (error) {
    console.error('❌ GPT-4 Vision OCR Error:', error.message);
    throw new Error('Failed to extract text from receipt image');
  }
}

/**
 * Process receipt image with QR detection and OCR fallback
 * @param {string} imagePath - Path to the receipt image
 * @returns {Promise<Object>} - Structured receipt data
 */
async function processReceipt(imagePath) {
  try {
    let receiptData = {
      source: null,
      invoice_number: null,
      retailer_name: null,
      purchase_date: null,
      total_amount: null,
      currency: 'USD',
      ucf_products: [],
      has_ucf_product: false,
      is_valid: false,
      qr_url: null,
      validation_errors: [],
      raw_text: null
    };

    // Step 1: Try QR code detection
    console.log('🔍 Step 1: Attempting QR code detection...');
    const qrUrl = await detectQRCode(imagePath);

    if (qrUrl && qrUrl.includes('zimra.co.zw')) {
      try {
        console.log('✅ QR code found, fetching invoice data...');
        receiptData.qr_url = qrUrl;
        receiptData.source = 'qr';

        // Fetch invoice data from ZIMRA
        const invoiceData = await fetchInvoiceData(qrUrl);

        // Validate invoice
        const validation = validateInvoice(invoiceData);

        receiptData.invoice_number = invoiceData.invoice_number;
        receiptData.retailer_name = invoiceData.retailer_name;
        receiptData.purchase_date = invoiceData.invoice_date;
        receiptData.total_amount = invoiceData.invoice_total;
        receiptData.currency = invoiceData.currency;
        receiptData.is_valid = validation.is_valid;
        receiptData.validation_errors = validation.errors;

        // Still need OCR to extract product names
        console.log('📄 Extracting product details via OCR...');
        const ocrText = await extractReceiptText(imagePath);
        receiptData.raw_text = ocrText;

        // Extract products from OCR text
        const productMatch = ocrText.match(/(?:product|item)[:\s]*([^\n]+)/gi);
        if (productMatch) {
          const products = productMatch.map(m => m.split(':')[1]?.trim()).filter(Boolean);
          const ucfMatch = matchUCFProducts(products);
          receiptData.ucf_products = ucfMatch.matched_products;
          receiptData.has_ucf_product = ucfMatch.has_ucf_product;
        }

        // Check for "UCF" keyword in text
        if (ocrText.toUpperCase().includes('UCF')) {
          receiptData.has_ucf_product = true;
        }

        console.log('✅ QR-based receipt processing completed');
        return receiptData;

      } catch (qrError) {
        console.log('⚠️ QR processing failed, falling back to OCR:', qrError.message);
        receiptData.validation_errors.push(`QR processing failed: ${qrError.message}`);
      }
    }

    // Step 2: Fallback to OCR-only processing
    console.log('📄 Step 2: Processing via OCR...');
    receiptData.source = 'ocr';
    const text = await extractReceiptText(imagePath);
    receiptData.raw_text = text;

    if (!text || text.length < 10) {
      throw new Error('Could not extract sufficient text from receipt');
    }

    // Check for UCF keyword
    if (text.toUpperCase().includes('UCF')) {
      receiptData.has_ucf_product = true;
    }

    console.log('✅ OCR-based receipt processing completed');
    return receiptData;

  } catch (error) {
    console.error('❌ Receipt Processing Error:', error.message);
    throw new Error('Unable to read receipt. Please ensure the image is clear and try again.');
  }
}

module.exports = {
  extractReceiptText,
  processReceipt
};
