#!/usr/bin/env node
/**
 * Verification Test: OCR Fix for tesseract.js v6
 *
 * This script demonstrates that the fix works by:
 * 1. Using the CORRECT v6 API with { blocks: true }
 * 2. Extracting lines from blocks -> paragraphs -> lines structure
 * 3. Showing the same output format expected by ocr.service.ts
 */

const { createWorker } = require('tesseract.js');

async function verifyOcrFix() {
  console.log('='.repeat(60));
  console.log('OCR FIX VERIFICATION TEST');
  console.log('='.repeat(60));
  console.log();

  const imagePath = '/export/projects/homeinventory/out.png';

  // Step 1: Initialize worker
  console.log('Step 1: Initializing OCR worker...');
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        process.stdout.write(`\r  Progress: ${Math.round((m.progress || 0) * 100)}%`);
      }
    }
  });
  console.log('\n✓ Worker initialized\n');

  // Step 2: Recognize with CORRECT v6 API
  console.log('Step 2: Running OCR with { blocks: true } option...');
  const result = await worker.recognize(imagePath, {}, {
    blocks: true  // ← THE FIX: Enable blocks output
  });
  console.log('✓ Recognition complete\n');

  // Step 3: Extract lines (simulating ocr.service.ts logic)
  console.log('Step 3: Extracting lines from nested structure...');
  const extractedLines = [];

  if (Array.isArray(result.data.blocks)) {
    result.data.blocks.forEach(block => {
      if (Array.isArray(block.paragraphs)) {
        block.paragraphs.forEach(paragraph => {
          if (Array.isArray(paragraph.lines)) {
            paragraph.lines.forEach(line => {
              extractedLines.push({
                text: line.text.trim(),
                confidence: line.confidence / 100, // Normalize to 0-1
                bbox: line.bbox ? {
                  x0: line.bbox.x0,
                  y0: line.bbox.y0,
                  x1: line.bbox.x1,
                  y1: line.bbox.y1
                } : undefined
              });
            });
          }
        });
      }
    });
  }

  console.log(`✓ Extracted ${extractedLines.length} lines\n`);

  // Step 4: Display results
  console.log('='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));
  console.log();
  console.log('Overall Statistics:');
  console.log(`  Total lines: ${extractedLines.length}`);
  console.log(`  Overall confidence: ${result.data.confidence}%`);

  const avgConfidence = extractedLines.reduce((sum, line) => sum + line.confidence, 0) / extractedLines.length;
  console.log(`  Average line confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log();

  console.log('First 5 Lines:');
  extractedLines.slice(0, 5).forEach((line, idx) => {
    console.log(`  ${idx + 1}. "${line.text}" (${(line.confidence * 100).toFixed(1)}%)`);
  });
  console.log();

  console.log('Last 3 Lines:');
  extractedLines.slice(-3).forEach((line, idx) => {
    console.log(`  ${extractedLines.length - 2 + idx}. "${line.text}" (${(line.confidence * 100).toFixed(1)}%)`);
  });
  console.log();

  // Step 5: Verification checks
  console.log('='.repeat(60));
  console.log('VERIFICATION CHECKS');
  console.log('='.repeat(60));
  console.log();

  const checks = [
    {
      name: 'Lines extracted',
      pass: extractedLines.length > 0,
      value: extractedLines.length
    },
    {
      name: 'Expected line count (~44)',
      pass: extractedLines.length >= 40 && extractedLines.length <= 50,
      value: extractedLines.length
    },
    {
      name: 'Lines have text',
      pass: extractedLines.every(line => line.text && line.text.length > 0),
      value: 'All lines have text'
    },
    {
      name: 'Lines have confidence',
      pass: extractedLines.every(line => typeof line.confidence === 'number'),
      value: 'All lines have confidence scores'
    },
    {
      name: 'Lines have bounding boxes',
      pass: extractedLines.every(line => line.bbox !== undefined),
      value: 'All lines have bbox data'
    }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const status = check.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${check.name}`);
    console.log(`         ${check.value}`);
    if (!check.pass) allPassed = false;
  });

  console.log();
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('✓✓✓ ALL CHECKS PASSED - FIX IS WORKING ✓✓✓');
  } else {
    console.log('✗✗✗ SOME CHECKS FAILED ✗✗✗');
  }
  console.log('='.repeat(60));
  console.log();

  // Cleanup
  await worker.terminate();

  return allPassed;
}

// Run verification
verifyOcrFix()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n✗ VERIFICATION FAILED WITH ERROR:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  });
