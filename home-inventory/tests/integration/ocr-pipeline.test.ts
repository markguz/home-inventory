/**
 * OCR Pipeline Integration Test
 * Tests the complete OCR pipeline with real receipt image
 * Compares results against LIOS OCR baseline (19 items extracted)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { OcrService } from '@/features/receipt-processing/services/ocr.service';
import { createParserService } from '@/features/receipt-processing/services/parser.service';
import fs from 'fs';
import path from 'path';

describe('OCR Pipeline Integration', () => {
  let ocrService: OcrService;
  let receiptImageBuffer: Buffer;

  // LIOS OCR baseline results (100% accuracy)
  const LIOS_BASELINE = {
    totalItems: 19,
    expectedItems: [
      { name: 'GV 100 BRD', barcode: '078742366900', price: 1.33 },
      { name: 'GV 100 BRD', barcode: '078742366900', price: 1.83 },
      { name: 'GV 100 BRD', barcode: '078742366900', price: 1.33 },
      { name: 'DELI POP CKN', barcode: '078742223620', price: 2.98 },
      { name: 'PIROULINE', barcode: '042456050410', price: 3.95 },
      { name: 'CRM OF MSHRM', barcode: '051000012610', price: 1.00 },
      { name: 'CRM OF MSHRM', barcode: '051000012610', price: 1.00 },
      { name: 'CN SF T BEEF', barcode: '070662404010', price: 1.08 },
      { name: 'STIR FRY CKN', barcode: '070662404070', price: 1.08 },
      { name: 'CN SF BBQ', barcode: '070662404030', price: 1.08 },
      { name: 'CN SF CHILE', barcode: '070662404020', price: 1.08 },
      { name: 'EQ TERBIN 1Z', barcode: '681131032570', price: 6.83 },
      { name: 'EQ TERBIN 12', barcode: '681131082570', price: 8.83 },
      { name: 'EQ OINTMENT', barcode: '078742146230', price: 10.52 },
      { name: 'SLTD BUTTER', barcode: '078742025920', price: 6.97 },
      { name: 'TYS POPCORN', barcode: '023700060120', price: 6.46 },
      { name: 'TYS POPCORN', barcode: '023700060120', price: 6.45 },
      { name: 'TYS POPCORN', barcode: '023700060120', price: 6.46 },
      { name: 'MXD VRTY 31', barcode: '040000598750', price: 14.96 },
      { name: 'MXD SGR FS', barcode: '022000297080', price: 14.96 },
      { name: 'JOL SERV BWL', barcode: '843623117330', price: 2.97 },
    ],
    subtotal: 119.20,
    tax: 2.96,
    total: 113.16,
  };

  beforeAll(async () => {
    // Initialize OCR service
    ocrService = new OcrService();
    await ocrService.initialize();

    // Load receipt image from root folder
    const receiptPath = path.join(process.cwd(), '..', 'out.png');
    expect(fs.existsSync(receiptPath), 'Receipt image should exist at root/out.png').toBe(true);

    receiptImageBuffer = fs.readFileSync(receiptPath);
    console.log(`Loaded receipt image: ${receiptImageBuffer.length} bytes`);
  });

  it('should process receipt with native Tesseract', async () => {
    const result = await ocrService.processImage(receiptImageBuffer);

    expect(result).toBeDefined();
    expect(result.lines).toBeDefined();
    expect(result.lines.length).toBeGreaterThan(0);

    console.log(`\nOCR Results:`);
    console.log(`- Total lines extracted: ${result.lines.length}`);
    console.log(`- Processing applied: ${result.processingApplied.join(', ')}`);
    console.log(`- Image dimensions: ${result.metadata.originalSize.width}x${result.metadata.originalSize.height}`);
  }, 60000); // 60s timeout for OCR

  it('should extract at least 15+ items (LIOS baseline: 19)', async () => {
    const ocrResult = await ocrService.processImage(receiptImageBuffer);
    const parserService = createParserService();
    const parsedReceipt = parserService.parseReceipt(ocrResult.lines);

    console.log(`\nParsing Results:`);
    console.log(`- Items extracted: ${parsedReceipt.items.length}`);
    console.log(`- LIOS baseline: ${LIOS_BASELINE.totalItems} items`);
    console.log(`- Success rate: ${((parsedReceipt.items.length / LIOS_BASELINE.totalItems) * 100).toFixed(1)}%`);

    // Should extract at least 15 items (79% of LIOS baseline)
    expect(parsedReceipt.items.length).toBeGreaterThanOrEqual(15);

    // Log first few items for debugging
    console.log(`\nFirst 5 extracted items:`);
    parsedReceipt.items.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.name} - $${item.price.toFixed(2)}`);
    });
  }, 60000);

  it('should have high OCR confidence (>85%)', async () => {
    const ocrResult = await ocrService.processImage(receiptImageBuffer);
    const confidence = ocrService.calculateOverallConfidence(ocrResult.lines);

    console.log(`\nConfidence Metrics:`);
    console.log(`- Overall confidence: ${confidence.toFixed(1)}%`);
    console.log(`- Average line confidence: ${(ocrResult.lines.reduce((sum, line) => sum + line.confidence, 0) / ocrResult.lines.length * 100).toFixed(1)}%`);

    expect(confidence).toBeGreaterThanOrEqual(85);
  }, 60000);

  it('should extract key receipt metadata', async () => {
    const ocrResult = await ocrService.processImage(receiptImageBuffer);
    const parserService = createParserService();
    const parsedReceipt = parserService.parseReceipt(ocrResult.lines);

    console.log(`\nReceipt Metadata:`);
    console.log(`- Store: ${parsedReceipt.metadata.store || 'N/A'}`);
    console.log(`- Date: ${parsedReceipt.metadata.date || 'N/A'}`);
    console.log(`- Subtotal: $${parsedReceipt.subtotal?.toFixed(2) || 'N/A'}`);
    console.log(`- Tax: $${parsedReceipt.tax?.toFixed(2) || 'N/A'}`);
    console.log(`- Total: $${parsedReceipt.total?.toFixed(2) || 'N/A'}`);

    // Should extract at least some metadata
    expect(
      parsedReceipt.metadata.store ||
      parsedReceipt.metadata.date ||
      parsedReceipt.subtotal ||
      parsedReceipt.tax ||
      parsedReceipt.total
    ).toBeTruthy();
  }, 60000);

  it('should match LIOS baseline for key items', async () => {
    const ocrResult = await ocrService.processImage(receiptImageBuffer);
    const parserService = createParserService();
    const parsedReceipt = parserService.parseReceipt(ocrResult.lines);

    // Check for presence of key items from LIOS baseline
    const keyItemsToFind = [
      'GV 100 BRD',
      'STIR FRY CKN',
      'TYS POPCORN',
      'PIROULINE',
      'SLTD BUTTER',
    ];

    console.log(`\nKey Items Comparison:`);
    const foundItems = keyItemsToFind.filter(keyItem => {
      const found = parsedReceipt.items.some(item =>
        item.name.includes(keyItem) || keyItem.includes(item.name)
      );
      console.log(`  ${keyItem}: ${found ? '✓ Found' : '✗ Missing'}`);
      return found;
    });

    // Should find at least 3 out of 5 key items (60%)
    expect(foundItems.length).toBeGreaterThanOrEqual(3);
  }, 60000);

  it('should parse prices correctly', async () => {
    const ocrResult = await ocrService.processImage(receiptImageBuffer);
    const parserService = createParserService();
    const parsedReceipt = parserService.parseReceipt(ocrResult.lines);

    console.log(`\nPrice Validation:`);
    const validPrices = parsedReceipt.items.filter(item =>
      item.price > 0 && item.price < 100 && !isNaN(item.price)
    );

    console.log(`- Items with valid prices: ${validPrices.length}/${parsedReceipt.items.length}`);
    console.log(`- Price range: $${Math.min(...validPrices.map(i => i.price)).toFixed(2)} - $${Math.max(...validPrices.map(i => i.price)).toFixed(2)}`);

    // All items should have valid prices
    expect(validPrices.length).toBe(parsedReceipt.items.length);
  }, 60000);

  it('should complete full pipeline within reasonable time', async () => {
    const startTime = Date.now();

    const ocrResult = await ocrService.processImage(receiptImageBuffer);
    const parserService = createParserService();
    const parsedReceipt = parserService.parseReceipt(ocrResult.lines);

    const duration = Date.now() - startTime;

    console.log(`\nPerformance Metrics:`);
    console.log(`- Total processing time: ${duration}ms`);
    console.log(`- OCR time: ~${duration * 0.8}ms (estimated)`);
    console.log(`- Parsing time: ~${duration * 0.2}ms (estimated)`);

    // Should complete within 30 seconds
    expect(duration).toBeLessThan(30000);
  }, 60000);
});
