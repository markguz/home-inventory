/**
 * Debug OCR Test - Check what Tesseract actually returns
 */

const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

async function debugOCR() {
  console.log('Debugging OCR output...\n');

  const worker = await createWorker('eng');
  const imagePath = '/export/projects/homeinventory/sample_receipts/heb.jpg';

  console.log('Processing:', imagePath);
  const result = await worker.recognize(imagePath);

  console.log('\n=== Full OCR Result Structure ===');
  console.log('Result keys:', Object.keys(result));
  console.log('\nData keys:', Object.keys(result.data));

  console.log('\n=== Text Content ===');
  console.log('Full text:', result.data.text);

  console.log('\n=== Lines ===');
  console.log('Lines type:', typeof result.data.lines);
  console.log('Lines is Array:', Array.isArray(result.data.lines));
  console.log('Lines length:', result.data.lines ? result.data.lines.length : 'undefined');

  if (result.data.lines && result.data.lines.length > 0) {
    console.log('\nFirst line structure:', result.data.lines[0]);
  }

  console.log('\n=== Words ===');
  if (result.data.words && result.data.words.length > 0) {
    console.log('Words count:', result.data.words.length);
    console.log('First 3 words:', result.data.words.slice(0, 3).map(w => ({
      text: w.text,
      confidence: w.confidence
    })));
  }

  console.log('\n=== Confidence ===');
  console.log('Overall confidence:', result.data.confidence);

  await worker.terminate();
}

debugOCR().catch(console.error);
