const fs = require('fs');
const path = require('path');

async function testFinalPipeline() {
  console.log('Testing Receipt Pipeline with Native Tesseract\n');
  console.log('=============================================\n');

  try {
    // Find and load the receipt image
    const recipientPath = path.join(__dirname, '..', 'out.png');
    if (!fs.existsSync(recipientPath)) {
      console.error('Error: out.png not found at', recipientPath);
      process.exit(1);
    }

    const imageBuffer = fs.readFileSync(recipientPath);
    console.log('Loaded receipt image (' + imageBuffer.length + ' bytes)\n');

    // Use the built services
    const OcrService = require('./dist/features/receipt-processing/services/ocr.service.js').OcrService;
    const ReceiptParserService = require('./dist/features/receipt-processing/services/parser.service.js').ReceiptParserService;

    // Run OCR
    console.log('Step 1: Running Native Tesseract OCR...');
    const ocrService = new OcrService();
    const ocrResult = await ocrService.processImage(imageBuffer, {
      preprocess: false,
      validate: false,
      preprocessingLevel: 'quick'
    });

    console.log('OCR completed');
    console.log('  - Lines extracted: ' + ocrResult.lines.length);
    console.log('  - Average confidence: ' + (ocrService.calculateOverallConfidence(ocrResult.lines)).toFixed(1) + '%\n');

    // Parse receipt
    console.log('Step 2: Parsing items...');
    const parserService = new ReceiptParserService();
    const parseResult = parserService.parseReceipt(ocrResult.lines);

    console.log('Parsing completed');
    console.log('  - Items extracted: ' + parseResult.items.length + '\n');

    if (parseResult.items.length > 0) {
      console.log('Extracted Items:');
      console.log('─────────────────────────────────────────────────────────────────────');
      parseResult.items.forEach((item, i) => {
        const num = String(i+1).padStart(2);
        const name = item.name.padEnd(40);
        const qty = item.quantity + 'x';
        const price = '$' + item.price.toFixed(2).padStart(7);
        console.log(num + '. ' + name + qty.padStart(3) + '  ' + price);
      });
      console.log('─────────────────────────────────────────────────────────────────────');
      console.log('\nTotal: ' + parseResult.items.length + ' items');

      const total = parseResult.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      console.log('Estimated Total: $' + total.toFixed(2));

      if (parseResult.total) {
        console.log('Receipt Total: $' + parseResult.total.toFixed(2));
      }
    } else {
      console.log('WARNING: No items extracted');
    }

    console.log('\n=============================================');
    const result = parseResult.items.length >= 15 ? 'SUCCESS' : 'NEEDS IMPROVEMENT';
    console.log('Result: ' + result);
    console.log('Target: 19+ items (LIOS baseline) | Achieved: ' + parseResult.items.length);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFinalPipeline();
