/**
 * Test different Tesseract configurations to find optimal settings for receipt OCR
 * This helps identify why LIOS works but our implementation doesn't
 */

const { recognize } = require('node-tesseract-ocr');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testOcrConfigs() {
  console.log('=== TESSERACT CONFIGURATION DEBUGGING ===\n');

  const imagePath = path.join(__dirname, '..', 'out.png');
  if (!fs.existsSync(imagePath)) {
    console.error('Error: out.png not found');
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `ocr-test-${Date.now()}.png`);
  fs.writeFileSync(tmpFile, imageBuffer);

  // Test configurations
  const configs = [
    { psm: 3, oem: 3, name: 'PSM 3 (Auto OSD) + LSTM' },
    { psm: 4, oem: 3, name: 'PSM 4 (Single column) + LSTM' },
    { psm: 5, oem: 3, name: 'PSM 5 (Single block) + LSTM' },
    { psm: 6, oem: 3, name: 'PSM 6 (Uniform block) + LSTM (current)' },
    { psm: 11, oem: 3, name: 'PSM 11 (Sparse text) + LSTM' },
    { psm: 13, oem: 3, name: 'PSM 13 (Raw line) + LSTM' },
    { psm: 6, oem: 0, name: 'PSM 6 + Legacy Tesseract' },
    { psm: 6, oem: 1, name: 'PSM 6 + Neural nets only' },
    { psm: 6, oem: 2, name: 'PSM 6 + Legacy + Neural' },
  ];

  for (const config of configs) {
    console.log('\n' + '='.repeat(70));
    console.log(`TEST: ${config.name}`);
    console.log('='.repeat(70));

    try {
      const result = await recognize(tmpFile, {
        lang: 'eng',
        psm: config.psm,
        oem: config.oem,
      });

      const lines = result
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      console.log(`Total lines: ${lines.length}`);

      // Find lines with prices (decimal numbers)
      const priceLines = lines.filter(l => /\d+[.,]\d{1,2}/.test(l));
      console.log(`Lines with prices: ${priceLines.length}`);

      console.log('\nFirst 15 lines of output:');
      console.log('-'.repeat(70));
      lines.slice(0, 15).forEach((line, i) => {
        const hasPrice = /\d+[.,]\d{1,2}/.test(line) ? ' [HAS PRICE]' : '';
        console.log(`${String(i+1).padStart(2)}. ${line}${hasPrice}`);
      });

      // Quality assessment
      console.log('\nQuality Check:');
      const avgLineLength = lines.reduce((sum, l) => sum + l.length, 0) / lines.length;
      const hasGarbled = lines.some(l => /[^\w\s.,$()-]/g.test(l));
      const isClean = !hasGarbled && avgLineLength > 10;

      console.log(`  - Average line length: ${avgLineLength.toFixed(1)}`);
      console.log(`  - Contains garbled text: ${hasGarbled ? 'YES ⚠️' : 'NO ✓'}`);
      console.log(`  - Quality: ${isClean ? 'GOOD ✓' : 'POOR ✗'}`);

    } catch (error) {
      console.error(`ERROR: ${error.message}`);
    }
  }

  // Cleanup
  fs.unlinkSync(tmpFile);

  console.log('\n' + '='.repeat(70));
  console.log('EXPECTED OUTPUT (from LIOS - 100% accurate):');
  console.log('='.repeat(70));
  console.log(`GV 100 BRD 078742366900 F 1.33 N
GV 100 BRD 078742366900 F 1.83 N
DELI POP CKN 078742223620 2.98 X
PIROULINE 042456050410 F 3.95 N
CRM OF MSHRM 051000012610 F 1.00 N
CN SF T BEEF 070662404010 F 1.08 N
STIR FRY CKN 070662404070 F 1.08 N`);

  console.log('\n=== TEST COMPLETE ===');
  console.log('Review output above and identify which PSM/OEM combo produces closest match to LIOS output');
}

testOcrConfigs().catch(console.error);
