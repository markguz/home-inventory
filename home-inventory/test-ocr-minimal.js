#!/usr/bin/env node
/**
 * Minimal OCR Test - Zero Preprocessing
 * Tests Tesseract directly on raw image to isolate preprocessing issues
 */

const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const IMAGE_PATH = '/export/projects/homeinventory/out.png';
const LIOS_OUTPUT_PATH = '/export/projects/homeinventory/lios-ocr.txt';

// PSM modes to test
const PSM_MODES = [
  { mode: 6, description: 'Assume uniform block of text' },
  { mode: 13, description: 'Raw line without text analysis' },
  { mode: 4, description: 'Column of text' },
  { mode: 3, description: 'Fully automatic page segmentation' }
];

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findPriceLines(text) {
  const lines = text.split('\n');
  const pricePattern = /\$?\d+[.,]\d{2}|\d+\.\d{2}/;

  return lines.map((line, index) => ({
    line: index + 1,
    text: line.trim(),
    hasPrice: pricePattern.test(line),
    prices: line.match(/\$?\d+[.,]\d{2}/g) || []
  })).filter(l => l.text.length > 0);
}

function calculateMetrics(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const priceLines = findPriceLines(text).filter(l => l.hasPrice);
  const avgLineLength = lines.reduce((sum, l) => sum + l.trim().length, 0) / lines.length;

  return {
    totalLines: lines.length,
    priceLines: priceLines.length,
    avgLineLength: avgLineLength.toFixed(1),
    confidence: 0 // Will be set by Tesseract
  };
}

async function testMinimalOCR(psmMode, description) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Testing PSM ${psmMode}: ${description}`, 'bright');
  log('='.repeat(80), 'cyan');

  try {
    const startTime = Date.now();

    // ZERO preprocessing - just read the file
    const imageBuffer = fs.readFileSync(IMAGE_PATH);

    log('\nRunning Tesseract with minimal config...', 'yellow');

    const result = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: () => {}, // Suppress logs
        tessedit_pageseg_mode: psmMode,
        tessedit_char_whitelist: '',
        preserve_interword_spaces: '1'
      }
    );

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    log(`\n✓ Processing completed in ${processingTime}s`, 'green');
    log(`✓ Confidence: ${result.data.confidence.toFixed(1)}%`, 'green');

    const metrics = calculateMetrics(result.data.text);
    metrics.confidence = result.data.confidence.toFixed(1);

    log('\n--- Metrics ---', 'blue');
    log(`Total Lines: ${metrics.totalLines}`);
    log(`Lines with Prices: ${metrics.priceLines}`);
    log(`Avg Line Length: ${metrics.avgLineLength} chars`);
    log(`OCR Confidence: ${metrics.confidence}%`);

    // Show first 20 lines with price indicators
    log('\n--- First 20 Lines (★ = contains price) ---', 'blue');
    const annotatedLines = findPriceLines(result.data.text);
    annotatedLines.slice(0, 20).forEach(item => {
      const marker = item.hasPrice ? '★' : ' ';
      const priceInfo = item.prices.length > 0 ? ` [${item.prices.join(', ')}]` : '';
      const color = item.hasPrice ? 'green' : 'reset';
      log(`${marker} L${item.line.toString().padStart(3, '0')}: ${item.text}${priceInfo}`, color);
    });

    return {
      psm: psmMode,
      description,
      metrics,
      text: result.data.text,
      success: true
    };

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    return {
      psm: psmMode,
      description,
      error: error.message,
      success: false
    };
  }
}

function compareLIOSOutput(tesseractResults) {
  if (!fs.existsSync(LIOS_OUTPUT_PATH)) {
    log('\n⚠ LIOS output not found for comparison', 'yellow');
    return;
  }

  const liosText = fs.readFileSync(LIOS_OUTPUT_PATH, 'utf-8');
  const liosMetrics = calculateMetrics(liosText);

  log('\n' + '='.repeat(80), 'cyan');
  log('LIOS OCR Output Comparison', 'bright');
  log('='.repeat(80), 'cyan');

  log('\n--- LIOS Metrics ---', 'blue');
  log(`Total Lines: ${liosMetrics.totalLines}`);
  log(`Lines with Prices: ${liosMetrics.priceLines}`);
  log(`Avg Line Length: ${liosMetrics.avgLineLength} chars`);

  log('\n--- First 20 Lines from LIOS (★ = contains price) ---', 'blue');
  const liosLines = findPriceLines(liosText);
  liosLines.slice(0, 20).forEach(item => {
    const marker = item.hasPrice ? '★' : ' ';
    const priceInfo = item.prices.length > 0 ? ` [${item.prices.join(', ')}]` : '';
    const color = item.hasPrice ? 'green' : 'reset';
    log(`${marker} L${item.line.toString().padStart(3, '0')}: ${item.text}${priceInfo}`, color);
  });

  // Compare best Tesseract result with LIOS
  const bestResult = tesseractResults
    .filter(r => r.success)
    .sort((a, b) => parseFloat(b.metrics.confidence) - parseFloat(a.metrics.confidence))[0];

  if (bestResult) {
    log('\n--- Comparison: Best Tesseract vs LIOS ---', 'yellow');
    log(`Tesseract PSM ${bestResult.psm}:`);
    log(`  Lines: ${bestResult.metrics.totalLines} vs ${liosMetrics.totalLines} (LIOS)`);
    log(`  Price Lines: ${bestResult.metrics.priceLines} vs ${liosMetrics.priceLines} (LIOS)`);
    log(`  Avg Length: ${bestResult.metrics.avgLineLength} vs ${liosMetrics.avgLineLength} (LIOS)`);
    log(`  Confidence: ${bestResult.metrics.confidence}%`);

    const lineDiff = Math.abs(bestResult.metrics.totalLines - liosMetrics.totalLines);
    const priceDiff = Math.abs(bestResult.metrics.priceLines - liosMetrics.priceLines);

    if (lineDiff < 5 && priceDiff < 2) {
      log('\n✓ Results are similar to LIOS - preprocessing likely NOT the issue', 'green');
    } else {
      log('\n⚠ Results differ significantly from LIOS - preprocessing may be corrupting data', 'red');
    }
  }
}

async function main() {
  log('\n' + '='.repeat(80), 'cyan');
  log('MINIMAL OCR TEST - ZERO PREPROCESSING', 'bright');
  log('='.repeat(80), 'cyan');

  log(`\nImage: ${IMAGE_PATH}`, 'yellow');
  log(`Testing ${PSM_MODES.length} PSM modes with NO preprocessing\n`, 'yellow');

  if (!fs.existsSync(IMAGE_PATH)) {
    log(`✗ Error: Image not found at ${IMAGE_PATH}`, 'red');
    process.exit(1);
  }

  const results = [];

  // Test each PSM mode
  for (const { mode, description } of PSM_MODES) {
    const result = await testMinimalOCR(mode, description);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  log('\n' + '='.repeat(80), 'cyan');
  log('SUMMARY', 'bright');
  log('='.repeat(80), 'cyan');

  const successfulResults = results.filter(r => r.success);

  if (successfulResults.length === 0) {
    log('\n✗ All PSM modes failed', 'red');
    process.exit(1);
  }

  // Sort by confidence
  successfulResults.sort((a, b) =>
    parseFloat(b.metrics.confidence) - parseFloat(a.metrics.confidence)
  );

  log('\nResults ranked by confidence:', 'blue');
  successfulResults.forEach((result, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    log(`${medal} PSM ${result.psm}: ${result.metrics.confidence}% confidence, ${result.metrics.priceLines} price lines`);
  });

  const bestResult = successfulResults[0];
  log(`\n✓ Best performer: PSM ${bestResult.psm} (${bestResult.description})`, 'green');
  log(`  Confidence: ${bestResult.metrics.confidence}%`, 'green');
  log(`  Price lines detected: ${bestResult.metrics.priceLines}`, 'green');

  // Compare with LIOS
  compareLIOSOutput(results);

  // Diagnostic conclusion
  log('\n' + '='.repeat(80), 'cyan');
  log('DIAGNOSTIC CONCLUSION', 'bright');
  log('='.repeat(80), 'cyan');

  if (parseInt(bestResult.metrics.priceLines) > 5) {
    log('\n✓ Tesseract CAN extract prices from raw image', 'green');
    log('→ Issue is likely in preprocessing or pipeline integration', 'yellow');
    log('→ Next step: Compare preprocessed vs raw image OCR', 'yellow');
  } else {
    log('\n⚠ Tesseract struggles even with raw image', 'yellow');
    log('→ May need different OCR engine or image enhancement', 'yellow');
    log('→ Consider: LIOS, Google Vision API, or manual enhancement', 'yellow');
  }

  log('');
}

// Run the test
main().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});
