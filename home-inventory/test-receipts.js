/**
 * Receipt Processing Validation Test Script
 *
 * Tests all sample receipts from /export/projects/homeinventory/sample_receipts/
 * Validates OCR accuracy, item extraction, and parser performance
 */

const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

// Configuration
const SAMPLE_RECEIPTS_DIR = '/export/projects/homeinventory/sample_receipts';
const OUTPUT_DIR = '/export/projects/homeinventory/hive/testing';
const RECEIPTS = ['heb.jpg', 'Untitled.jpeg', 'wholefoods.jpeg'];

/**
 * Receipt Parser Service (simplified version for testing)
 */
class ReceiptParser {
  constructor(config = {}) {
    this.config = {
      minItemConfidence: config.minItemConfidence || 0.6,
      minPriceConfidence: config.minPriceConfidence || 0.7,
      currencySymbol: config.currencySymbol || '$',
    };
  }

  /**
   * Parse OCR lines into structured receipt data
   */
  parseReceipt(lines) {
    const rawText = lines.map(l => l.text).join('\n');

    // Extract items with prices
    const items = this.extractItems(lines);

    // Extract totals
    const total = this.extractTotal(lines);
    const subtotal = this.extractSubtotal(lines);
    const tax = this.extractTax(lines);

    // Extract metadata
    const date = this.extractDate(lines);
    const merchantName = this.extractMerchantName(lines);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(lines, items);

    return {
      items,
      total,
      subtotal,
      tax,
      date,
      merchantName,
      confidence,
      rawText,
    };
  }

  /**
   * Extract items with prices from OCR lines
   */
  extractItems(lines) {
    const items = [];
    // More flexible price patterns - match prices anywhere in line
    const pricePatterns = [
      /\$\s*(\d+[.,]\d{2})/,           // $12.99 or $12,99
      /(\d+[.,]\d{2})\s*$/,             // 12.99 at end of line
      /[£€]\s*(\d+[.,]\d{2})/,          // £12.99 or €12.99
      /F(\d+)[.,](\d{2})/,              // F141 or F1.41 (common OCR error)
    ];
    const quantityPattern = /^(\d+)\s*x\s*/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const text = line.text.trim();

      // Skip common non-item lines
      if (this.isNonItemLine(text)) continue;

      // Try each price pattern
      let priceMatch = null;
      let price = null;

      for (const pattern of pricePatterns) {
        priceMatch = text.match(pattern);
        if (priceMatch) {
          if (priceMatch.length === 2) {
            // Single capture group
            price = parseFloat(priceMatch[1].replace(',', '.'));
          } else if (priceMatch.length === 3) {
            // Two capture groups (for F141 format)
            price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
          }
          if (!isNaN(price) && price > 0 && price < 10000) {
            break;
          }
        }
      }

      if (!priceMatch || price === null) continue;

      // Extract quantity if present
      const quantityMatch = text.match(quantityPattern);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

      // Extract item name (everything before the price)
      let itemName = text.replace(priceMatch[0], '').trim();
      if (quantityMatch) {
        itemName = itemName.replace(quantityPattern, '').trim();
      }

      // Clean up item name
      itemName = itemName.replace(/^\d+\s+/, ''); // Remove leading numbers
      itemName = itemName.replace(/[|\\\/]+$/, '').trim(); // Remove trailing separators

      // Skip if name is too short
      if (itemName.length < 2) {
        continue;
      }

      items.push({
        id: `item-${i}`,
        name: itemName,
        price,
        quantity,
        confidence: line.confidence,
        lineNumber: i,
        rawText: text,
      });
    }

    return items;
  }

  /**
   * Check if a line is likely not an item
   */
  isNonItemLine(text) {
    const nonItemPatterns = [
      /^total/i,
      /^subtotal/i,
      /^tax/i,
      /^receipt/i,
      /^thank you/i,
      /^date/i,
      /^time/i,
      /^cashier/i,
      /^payment/i,
      /^change/i,
      /^card/i,
      /^\s*$/,
    ];

    return nonItemPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract total amount from receipt
   */
  extractTotal(lines) {
    const totalPatterns = [
      /total\s*:?\s*\$?\s*(\d+[.,]\d{2})/i,
      /total\s+sales\s+(\d+[.,]\d{2})/i,
    ];

    for (const line of lines) {
      for (const pattern of totalPatterns) {
        const match = line.text.match(pattern);
        if (match) {
          return parseFloat(match[1].replace(',', '.'));
        }
      }
    }

    return null;
  }

  /**
   * Extract subtotal amount from receipt
   */
  extractSubtotal(lines) {
    const subtotalPattern = /subtotal\s*:?\s*\$?\s*(\d+[.,]\d{2})/i;

    for (const line of lines) {
      const match = line.text.match(subtotalPattern);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }

    return null;
  }

  /**
   * Extract tax amount from receipt
   */
  extractTax(lines) {
    const taxPattern = /tax\s*:?\s*\$?\s*(\d+[.,]\d{2})/i;

    for (const line of lines) {
      const match = line.text.match(taxPattern);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }

    return null;
  }

  /**
   * Extract date from receipt
   */
  extractDate(lines) {
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.text.match(pattern);
        if (match) {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract merchant name from receipt (usually in first few lines)
   */
  extractMerchantName(lines) {
    const firstLines = lines.slice(0, 5);

    for (const line of firstLines) {
      const text = line.text.trim();
      if (text.length > 3 && !text.match(/\d+[.,]\d{2}/) && line.confidence > 0.7) {
        return text;
      }
    }

    return null;
  }

  /**
   * Calculate overall confidence score for the parsed receipt
   */
  calculateConfidence(lines, items) {
    if (lines.length === 0) return 0;

    const ocrConfidence = lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length;
    const itemConfidence = items.length > 0 ? Math.min(items.length / 5, 1) : 0;
    const avgItemConfidence = items.length > 0
      ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length
      : 0;

    return (ocrConfidence * 0.4) + (itemConfidence * 0.3) + (avgItemConfidence * 0.3);
  }
}

/**
 * OCR Service wrapper
 */
class OcrService {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Initializing OCR worker...');
    this.worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\rOCR Progress: ${Math.round((m.progress || 0) * 100)}%`);
        }
      },
    });
    this.initialized = true;
    console.log('\nOCR worker initialized');
  }

  async processImage(imageBuffer) {
    if (!this.worker || !this.initialized) {
      await this.initialize();
    }

    const result = await this.worker.recognize(imageBuffer);

    // Tesseract.js returns text split by newlines, not as structured lines
    if (!result.data || !result.data.text) {
      console.warn('No text found in OCR result');
      return [];
    }

    // Split text into lines and calculate overall confidence for each
    const rawLines = result.data.text.split('\n');
    const overallConfidence = result.data.confidence / 100;

    const lines = rawLines
      .map((text, index) => ({
        text: text.trim(),
        confidence: overallConfidence, // Use overall confidence for each line
        bbox: undefined, // Tesseract doesn't provide bbox per line in this mode
      }))
      .filter((line) => line.text.length > 0);

    return lines;
  }

  calculateOverallConfidence(lines) {
    if (lines.length === 0) return 0;
    const totalConfidence = lines.reduce((sum, line) => sum + line.confidence, 0);
    return totalConfidence / lines.length;
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

/**
 * Test result tracker
 */
class TestResults {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  addResult(receiptName, result) {
    this.results.push({
      receiptName,
      timestamp: new Date().toISOString(),
      ...result,
    });
  }

  generateSummary() {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalReceipts = this.results.length;
    const successfulReceipts = this.results.filter(r => r.success).length;
    const averageOcrConfidence = this.results.reduce((sum, r) => sum + (r.ocrConfidence || 0), 0) / totalReceipts;
    const averageParserConfidence = this.results.reduce((sum, r) => sum + (r.parsedReceipt?.confidence || 0), 0) / totalReceipts;
    const totalItems = this.results.reduce((sum, r) => sum + (r.parsedReceipt?.items?.length || 0), 0);

    return {
      summary: {
        totalReceipts,
        successfulReceipts,
        failedReceipts: totalReceipts - successfulReceipts,
        averageOcrConfidence: (averageOcrConfidence * 100).toFixed(2) + '%',
        averageParserConfidence: (averageParserConfidence * 100).toFixed(2) + '%',
        totalItemsExtracted: totalItems,
        testDuration: duration.toFixed(2) + 's',
        timestamp: new Date().toISOString(),
      },
      results: this.results,
    };
  }

  saveToFile(filename) {
    const summary = this.generateSummary();
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
    console.log(`\nResults saved to: ${filepath}`);
    return filepath;
  }

  saveCSV(filename) {
    const filepath = path.join(OUTPUT_DIR, filename);
    const csvLines = ['Receipt,Success,OCR Confidence,Parser Confidence,Items Extracted,Total,Subtotal,Tax,Merchant,Date,Error'];

    for (const result of this.results) {
      const row = [
        result.receiptName,
        result.success ? 'YES' : 'NO',
        result.ocrConfidence ? (result.ocrConfidence * 100).toFixed(2) + '%' : 'N/A',
        result.parsedReceipt?.confidence ? (result.parsedReceipt.confidence * 100).toFixed(2) + '%' : 'N/A',
        result.parsedReceipt?.items?.length || 0,
        result.parsedReceipt && result.parsedReceipt.total !== null && result.parsedReceipt.total !== undefined ? '$' + result.parsedReceipt.total.toFixed(2) : 'N/A',
        result.parsedReceipt && result.parsedReceipt.subtotal !== null && result.parsedReceipt.subtotal !== undefined ? '$' + result.parsedReceipt.subtotal.toFixed(2) : 'N/A',
        result.parsedReceipt && result.parsedReceipt.tax !== null && result.parsedReceipt.tax !== undefined ? '$' + result.parsedReceipt.tax.toFixed(2) : 'N/A',
        result.parsedReceipt?.merchantName || 'N/A',
        result.parsedReceipt?.date || 'N/A',
        result.error || '',
      ];
      csvLines.push(row.join(','));
    }

    fs.writeFileSync(filepath, csvLines.join('\n'));
    console.log(`CSV report saved to: ${filepath}`);
    return filepath;
  }
}

/**
 * Main test function
 */
async function testReceiptProcessing() {
  console.log('='.repeat(80));
  console.log('Receipt Processing Validation Test');
  console.log('='.repeat(80));
  console.log(`\nSample Receipts Directory: ${SAMPLE_RECEIPTS_DIR}`);
  console.log(`Output Directory: ${OUTPUT_DIR}\n`);

  const ocrService = new OcrService();
  const parser = new ReceiptParser();
  const testResults = new TestResults();

  try {
    // Initialize OCR service
    await ocrService.initialize();

    // Test each receipt
    for (const receiptFile of RECEIPTS) {
      console.log('\n' + '-'.repeat(80));
      console.log(`Testing: ${receiptFile}`);
      console.log('-'.repeat(80));

      try {
        const receiptPath = path.join(SAMPLE_RECEIPTS_DIR, receiptFile);

        // Check if file exists
        if (!fs.existsSync(receiptPath)) {
          throw new Error(`Receipt file not found: ${receiptPath}`);
        }

        const imageBuffer = fs.readFileSync(receiptPath);
        const fileSize = (imageBuffer.length / 1024).toFixed(2);
        console.log(`File size: ${fileSize} KB`);

        // Process with OCR
        console.log('Running OCR...');
        const ocrStartTime = Date.now();
        const ocrLines = await ocrService.processImage(imageBuffer);
        const ocrDuration = ((Date.now() - ocrStartTime) / 1000).toFixed(2);

        const ocrConfidence = ocrService.calculateOverallConfidence(ocrLines);
        console.log(`OCR completed in ${ocrDuration}s`);
        console.log(`OCR lines extracted: ${ocrLines.length}`);
        console.log(`OCR confidence: ${(ocrConfidence * 100).toFixed(2)}%`);

        // Parse receipt
        console.log('Parsing receipt...');
        const parsedReceipt = parser.parseReceipt(ocrLines);

        console.log(`\nParsed Receipt Summary:`);
        console.log(`  Merchant: ${parsedReceipt.merchantName || 'Not detected'}`);
        console.log(`  Date: ${parsedReceipt.date || 'Not detected'}`);
        console.log(`  Items: ${parsedReceipt.items.length}`);
        console.log(`  Subtotal: ${parsedReceipt.subtotal !== null ? '$' + parsedReceipt.subtotal.toFixed(2) : 'Not detected'}`);
        console.log(`  Tax: ${parsedReceipt.tax !== null ? '$' + parsedReceipt.tax.toFixed(2) : 'Not detected'}`);
        console.log(`  Total: ${parsedReceipt.total !== null ? '$' + parsedReceipt.total.toFixed(2) : 'Not detected'}`);
        console.log(`  Parser confidence: ${(parsedReceipt.confidence * 100).toFixed(2)}%`);

        // Display extracted items
        if (parsedReceipt.items.length > 0) {
          console.log(`\n  Extracted Items:`);
          parsedReceipt.items.forEach((item, idx) => {
            console.log(`    ${idx + 1}. ${item.name} - $${item.price.toFixed(2)} (qty: ${item.quantity}) [confidence: ${(item.confidence * 100).toFixed(2)}%]`);
          });
        }

        // Store results
        testResults.addResult(receiptFile, {
          success: true,
          ocrConfidence,
          ocrLines: ocrLines.length,
          ocrDuration: parseFloat(ocrDuration),
          parsedReceipt,
          fileSizeKB: parseFloat(fileSize),
        });

        console.log(`\n✓ ${receiptFile} processed successfully`);

      } catch (error) {
        console.error(`\n✗ Error processing ${receiptFile}:`, error.message);
        testResults.addResult(receiptFile, {
          success: false,
          error: error.message,
        });
      }
    }

  } catch (error) {
    console.error('\n✗ Fatal error:', error);
  } finally {
    // Cleanup
    await ocrService.terminate();
  }

  // Generate reports
  console.log('\n' + '='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));

  const summary = testResults.generateSummary();
  console.log(`\nTotal Receipts: ${summary.summary.totalReceipts}`);
  console.log(`Successful: ${summary.summary.successfulReceipts}`);
  console.log(`Failed: ${summary.summary.failedReceipts}`);
  console.log(`Average OCR Confidence: ${summary.summary.averageOcrConfidence}`);
  console.log(`Average Parser Confidence: ${summary.summary.averageParserConfidence}`);
  console.log(`Total Items Extracted: ${summary.summary.totalItemsExtracted}`);
  console.log(`Test Duration: ${summary.summary.testDuration}`);

  // Save reports
  const jsonFile = testResults.saveToFile('receipt-validation-results.json');
  const csvFile = testResults.saveCSV('receipt-validation-results.csv');

  console.log('\n' + '='.repeat(80));
  console.log('Reports Generated:');
  console.log(`  - JSON: ${jsonFile}`);
  console.log(`  - CSV: ${csvFile}`);
  console.log('='.repeat(80));
}

// Run tests
testReceiptProcessing().catch(console.error);
