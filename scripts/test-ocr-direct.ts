#!/usr/bin/env tsx

/**
 * Direct OCR and Parsing Pipeline Test
 * Tests the exact flow that the API uses
 */

import fs from 'fs';
import path from 'path';
import { getOcrService } from '../home-inventory/src/features/receipt-processing/services/ocr.service';
import { createParserService } from '../home-inventory/src/features/receipt-processing/services/parser.service';

async function testOcrPipeline() {
  console.log('=== OCR and Parsing Pipeline Direct Test ===\n');

  // Step 1: Read the image
  const imagePath = path.join(__dirname, '../out.png');
  console.log(`Reading image from: ${imagePath}`);

  if (!fs.existsSync(imagePath)) {
    console.error('❌ Image file not found!');
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  console.log(`✓ Image loaded (${imageBuffer.length} bytes)\n`);

  // Step 2: Initialize OCR service (exactly like the API does)
  console.log('Initializing OCR service...');
  const ocrService = getOcrService();
  await ocrService.initialize();
  console.log('✓ OCR service initialized\n');

  // Step 3: Process image with OCR
  console.log('Processing image with OCR...');
  const startOcr = Date.now();
  const ocrResult = await ocrService.processImage(imageBuffer);
  const ocrDuration = Date.now() - startOcr;

  console.log(`✓ OCR completed in ${ocrDuration}ms\n`);

  // Step 4: Analyze OCR results
  console.log('=== OCR Results ===');
  console.log(`Total lines extracted: ${ocrResult.lines.length}`);

  if (ocrResult.lines.length === 0) {
    console.log('❌ NO LINES EXTRACTED FROM OCR!');
    console.log('Raw OCR result:', JSON.stringify(ocrResult, null, 2));
    process.exit(1);
  }

  const confidences = ocrResult.lines.map(line => line.confidence);
  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const minConfidence = Math.min(...confidences);
  const maxConfidence = Math.max(...confidences);

  console.log(`Average confidence: ${(avgConfidence * 100).toFixed(2)}%`);
  console.log(`Min confidence: ${(minConfidence * 100).toFixed(2)}%`);
  console.log(`Max confidence: ${(maxConfidence * 100).toFixed(2)}%`);

  // Calculate overall confidence like the API does
  const overallConfidence = ocrService.calculateOverallConfidence(ocrResult.lines);
  console.log(`Overall confidence (API calculation): ${(overallConfidence * 100).toFixed(2)}%`);

  console.log('\nFirst 10 OCR lines:');
  ocrResult.lines.slice(0, 10).forEach((line, idx) => {
    console.log(`  ${idx + 1}. "${line.text}" (confidence: ${(line.confidence * 100).toFixed(1)}%)`);
  });

  // Step 5: Create parser service (exactly like API)
  console.log('\n=== Creating Parser Service ===');
  const parserService = createParserService();
  console.log('✓ Parser service created\n');

  // Step 6: Parse the receipt
  console.log('Parsing receipt...');
  const startParse = Date.now();
  const parseResult = parserService.parseReceipt(ocrResult.lines);
  const parseDuration = Date.now() - startParse;

  console.log(`✓ Parsing completed in ${parseDuration}ms\n`);

  // Step 7: Analyze parse results
  console.log('=== Parse Results ===');
  console.log(`Items parsed: ${parseResult.items.length}`);
  console.log(`Store detected: ${parseResult.store || 'none'}`);
  console.log(`Date detected: ${parseResult.date || 'none'}`);
  console.log(`Total detected: ${parseResult.total || 'none'}`);

  if (parseResult.items.length === 0) {
    console.log('\n❌ NO ITEMS PARSED!');
    console.log('Full parse result:', JSON.stringify(parseResult, null, 2));
  } else {
    console.log('\nParsed Items:');
    parseResult.items.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.description}`);
      console.log(`     Price: $${item.unitPrice.toFixed(2)}`);
      console.log(`     Quantity: ${item.quantity}`);
      console.log(`     Subtotal: $${item.subtotal.toFixed(2)}`);
      if (item.category) {
        console.log(`     Category: ${item.category}`);
      }
    });
  }

  // Step 8: Check for filtered items
  console.log('\n=== Filtering Analysis ===');
  const allLines = ocrResult.lines.map(l => l.text);
  const itemDescriptions = parseResult.items.map(i => i.description);

  console.log('Lines that look like items but weren\'t parsed:');
  let filteredCount = 0;
  const filteredLines: string[] = [];

  allLines.forEach(line => {
    // Check if line looks like it could be an item (has price pattern)
    if (/\$?\d+\.\d{2}/.test(line) && !itemDescriptions.some(desc => line.includes(desc))) {
      console.log(`  - "${line}"`);
      filteredLines.push(line);
      filteredCount++;
    }
  });

  if (filteredCount === 0) {
    console.log('  None found');
  } else {
    console.log(`\nTotal filtered: ${filteredCount}`);
  }

  // Step 9: Generate summary
  const summary = {
    ocr: {
      linesExtracted: ocrResult.lines.length,
      avgConfidence: avgConfidence,
      minConfidence: minConfidence,
      maxConfidence: maxConfidence,
      processingTime: ocrDuration
    },
    parsing: {
      itemsParsed: parseResult.items.length,
      storeDetected: !!parseResult.store,
      dateDetected: !!parseResult.date,
      totalDetected: !!parseResult.total,
      processingTime: parseDuration
    },
    filtering: {
      potentialItemsFiltered: filteredCount,
      filteredLines: filteredLines
    }
  };

  console.log('\n=== Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  // Step 10: Store results in memory
  console.log('\n=== Storing Results ===');
  const memoryData = {
    timestamp: new Date().toISOString(),
    summary,
    ocrResult: {
      lineCount: ocrResult.lines.length,
      lines: ocrResult.lines.slice(0, 50) // First 50 lines
    },
    parseResult: {
      itemCount: parseResult.items.length,
      items: parseResult.items,
      metadata: {
        store: parseResult.store,
        date: parseResult.date,
        total: parseResult.total
      }
    }
  };

  // Save to file for inspection
  const outputPath = path.join(__dirname, '../test-ocr-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(memoryData, null, 2));
  console.log(`✓ Results saved to: ${outputPath}`);

  console.log('\n=== Test Complete ===');

  // Exit with appropriate code
  if (parseResult.items.length === 0) {
    console.log('❌ TEST FAILED: No items were parsed');
    process.exit(1);
  } else {
    console.log(`✓ TEST PASSED: ${parseResult.items.length} items successfully parsed`);
    process.exit(0);
  }
}

// Run the test
testOcrPipeline().catch(error => {
  console.error('\n❌ TEST ERROR:', error);
  console.error(error.stack);
  process.exit(1);
});
