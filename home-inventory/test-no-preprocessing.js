/**
 * Test OCR with preprocessing DISABLED
 * This should match LIOS output quality (clean, readable text)
 */

const { recognize } = require('node-tesseract-ocr');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testNoPreprocessing() {
  console.log('=== OCR TEST: WITH PREPROCESSING DISABLED ===\n');

  const imagePath = path.join(__dirname, '..', 'out.png');
  if (!fs.existsSync(imagePath)) {
    console.error('Error: out.png not found');
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `ocr-test-${Date.now()}.png`);

  try {
    // Write RAW image directly (NO preprocessing)
    fs.writeFileSync(tmpFile, imageBuffer);

    console.log('Configuration:');
    console.log('  - Preprocessing: DISABLED (no normalization, no grayscale)');
    console.log('  - PSM: 6 (single uniform block)');
    console.log('  - OEM: 3 (LSTM)');
    console.log('  - Language: English\n');

    const result = await recognize(tmpFile, {
      lang: 'eng',
      psm: 6,
      oem: 3,
    });

    const lines = result
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    console.log(`Total lines extracted: ${lines.length}\n`);

    // Find lines with prices
    const pricePattern = /\d+[.,]\d{1,2}/;
    const priceLines = lines.filter(l => pricePattern.test(l));

    console.log(`Lines with prices: ${priceLines.length}\n`);

    console.log('First 20 lines of output:');
    console.log('─'.repeat(70));
    lines.slice(0, 20).forEach((line, i) => {
      const hasPrice = pricePattern.test(line) ? ' ✓' : '';
      console.log(`${String(i+1).padStart(2)}. ${line}${hasPrice}`);
    });
    console.log('─'.repeat(70));

    console.log('\nLIOE OUTPUT (Expected - 100% accuracy):');
    console.log('─'.repeat(70));
    console.log(`1. GV 100 BRD 078742366900 F 1.33 N`);
    console.log(`2. GV 100 BRD 078742366900 F 1.83 N`);
    console.log(`3. DELI POP CKN 078742223620 2.98 X`);
    console.log(`4. PIROULINE 042456050410 F 3.95 N`);
    console.log(`5. CRM OF MSHRM 051000012610 F 1.00 N`);
    console.log('─'.repeat(70));

    console.log('\nQuality Assessment:');
    const itemLines = priceLines.filter(l => {
      // Lines like "GV 100 BRD 078742366900 F 1.33 N" or "DELI POP CKN 078742223620 2.98 X"
      return /[A-Z]{2,}/.test(l) && /\d{9,}/.test(l);
    });

    console.log(`  - Item-like lines: ${itemLines.length}`);
    console.log(`  - Close to LIOS baseline (19 items): ${itemLines.length >= 15 ? '✓ YES' : '✗ NO'}`);

    const garbledCount = lines.filter(l => /[^\w\s.,$()-]/g.test(l)).length;
    console.log(`  - Garbled lines: ${garbledCount}/${lines.length} (${(garbledCount/lines.length*100).toFixed(1)}%)`);
    console.log(`  - Quality: ${garbledCount < lines.length * 0.2 ? '✓ GOOD' : '✗ POOR'}`);

    console.log('\n=== TEST COMPLETE ===');
    console.log(`Result: ${itemLines.length >= 15 ? 'PASS ✓' : 'FAIL ✗'}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
}

testNoPreprocessing();
