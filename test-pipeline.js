const fs = require('fs');
const path = require('path');

async function testReceiptPipeline() {
  console.log('Testing Receipt Processing Pipeline\n');
  console.log('=====================================\n');

  try {
    // Dynamically import the services
    const ocrServiceModule = await import('./home-inventory/dist/features/receipt-processing/services/ocr.service.js');
    const parserServiceModule = await import('./home-inventory/dist/features/receipt-processing/services/parser.service.js');

    const OcrService = ocrServiceModule.OcrService;
    const ReceiptParserService = parserServiceModule.ReceiptParserService;

    // Read the test image
    const imagePath = './out.png';
    if (!fs.existsSync(imagePath)) {
      console.error('Image not found: ' + imagePath);
      process.exit(1);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    console.log('Loaded image: out.png (' + imageBuffer.length + ' bytes)\n');

    // Step 1: OCR Processing
    console.log('Step 1: Running OCR...');
    const ocrService = new OcrService();
    const ocrResult = await ocrService.processImage(imageBuffer);

    console.log('OCR completed');
    console.log('  - Lines detected: ' + ocrResult.lines.length);
    const avgConfidence = (ocrResult.lines.reduce((sum, l) => sum + l.confidence, 0) / ocrResult.lines.length * 100).toFixed(1);
    console.log('  - Average confidence: ' + avgConfidence + '%\n');

    // Show first 5 lines
    console.log('  First 5 OCR lines:');
    ocrResult.lines.slice(0, 5).forEach((line, i) => {
      const conf = (line.confidence * 100).toFixed(0);
      console.log('    [' + i + '] (' + conf + '%) "' + line.text + '"');
    });
    console.log();

    // Step 2: Item Extraction
    console.log('Step 2: Parsing items...');
    const parserService = new ReceiptParserService();
    const parseResult = parserService.parseReceipt(ocrResult.lines);

    console.log('Parsing completed');
    console.log('  - Items extracted: ' + parseResult.items.length + '\n');

    if (parseResult.items.length > 0) {
      console.log('  Extracted items:');
      parseResult.items.forEach((item, i) => {
        const conf = (item.confidence * 100).toFixed(0);
        console.log('    [' + i + '] ' + item.quantity + 'x "' + item.name + '" - $' + item.price.toFixed(2) + ' (' + conf + '%)');
      });
    } else {
      console.log('  WARNING: No items extracted');
    }

    console.log('\n=====================================');
    const status = parseResult.items.length > 0 ? 'SUCCESS' : 'FAILED';
    console.log('Result: ' + status);
    console.log('Items extracted: ' + parseResult.items.length);

  } catch (error) {
    console.error('Error during pipeline test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testReceiptPipeline().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
