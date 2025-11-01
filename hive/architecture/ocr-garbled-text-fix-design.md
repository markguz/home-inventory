# OCR Garbled Text Fix - System Architecture Design

**Date:** 2025-10-31
**Designer:** System Architecture Designer
**Status:** Design Complete - Ready for Implementation
**Priority:** CRITICAL

---

## Executive Summary

### Problem Statement
The OCR system produces garbled, unreadable text when processing receipts, extracting only 3 malformed items instead of the expected 19+ items. LIOS (baseline) achieves 100% accuracy with clean text extraction, indicating the issue is in our implementation, not the source image.

### Root Cause Analysis
After extensive investigation by research and testing agents, the issue has been narrowed to **THREE PRIMARY SUSPECTS**:

1. **Image Preprocessing Over-Processing** (90% confidence)
   - Current: `fullPreprocess()` applies CLAHE, noise reduction, sharpening, normalization
   - Evidence: LIOS uses minimal/no preprocessing and achieves perfect results
   - Impact: Aggressive preprocessing may damage text clarity

2. **PSM (Page Segmentation Mode) Misconfiguration** (75% confidence)
   - Current: PSM 6 (single column)
   - Alternative: PSM 13 (raw line), PSM 4 (single column of text), PSM 11 (sparse text)
   - Evidence: Receipt structure may not match PSM 6 assumptions

3. **Temp File Encoding Issues** (40% confidence)
   - Current: Writing preprocessed buffer to PNG temp file
   - Potential: Buffer corruption or encoding mismatch during file I/O
   - Alternative: Direct image processing without temp files

### Solution Overview
**Tiered fix approach with progressive validation:**

#### Phase 1: Quick Win (Preprocessing Fix)
- **Change:** Disable preprocessing by default, make it optional
- **Expected Result:** 80%+ accuracy improvement
- **Time to Implement:** 30 minutes
- **Risk:** Very Low

#### Phase 2: PSM Optimization (If Phase 1 insufficient)
- **Change:** Test PSM 13, 4, 11 configurations
- **Expected Result:** 95%+ accuracy
- **Time to Implement:** 1 hour
- **Risk:** Low

#### Phase 3: Buffer Handling (If needed)
- **Change:** Optimize temp file handling or use alternative approach
- **Expected Result:** Match LIOS baseline (100%)
- **Time to Implement:** 2 hours
- **Risk:** Medium

---

## Current State Analysis

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Receipt Upload                           │
│                  (Frontend Component)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Image Buffer
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API Route: /api/receipts/process               │
│                  (Next.js API Handler)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ imageBuffer
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   OcrService.processImage()                 │
│              (src/.../services/ocr.service.ts)              │
│                                                             │
│  1. Validate Image ✓                                       │
│  2. Get Metadata ✓                                         │
│  3. ❌ ISSUE: fullPreprocess() ← AGGRESSIVE PROCESSING     │
│  4. Write to Temp File                                     │
│  5. ❌ ISSUE: PSM 6 (may be suboptimal)                   │
│  6. ❌ ISSUE: Tesseract via node-tesseract-ocr             │
│  7. Parse Text → Lines                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ OcrResult { lines: OcrLine[] }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ParserService.parseReceipt()                   │
│             (src/.../services/parser.service.ts)            │
│                                                             │
│  - Extract items from lines ← DEPENDS ON CLEAN TEXT        │
│  - Parse prices, quantities                                │
│  - Calculate totals                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ ParsedReceipt { items: [] }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Receipt Review UI                          │
│                 (Frontend Display)                          │
└─────────────────────────────────────────────────────────────┘
```

### Problem Points Identified

#### Issue 1: Image Preprocessing (image-preprocessor.ts)
```typescript
// CURRENT - fullPreprocess() applies TOO MUCH processing
export async function fullPreprocess(imageBuffer: Buffer): Promise<Buffer> {
  const result = await preprocessImage(imageBuffer, {
    enableCLAHE: true,        // ❌ Over-enhancement
    enableNoiseReduction: true, // ❌ May blur text edges
    enableDeskewing: true,     // ❌ Computationally expensive
    enableNormalization: true, // ❌ May distort contrast
    sharpen: true,            // ❌ Creates artifacts
  });
  return result.buffer;
}
```

**Evidence from Testing:**
- LIOS baseline: NO preprocessing → 100% accuracy
- Current system: FULL preprocessing → garbled text
- Hypothesis: Over-processing damages text clarity

#### Issue 2: PSM Configuration (ocr.service.ts)
```typescript
// CURRENT - Line 108-112
const ocrText = await recognize(tmpFilePath, {
  lang: 'eng',
  psm: 6,  // ❌ Single column - may not match receipt structure
  oem: 3,  // Tesseract + LSTM (likely OK)
});
```

**PSM Mode Analysis:**

| PSM | Mode | Receipt Suitability | Notes |
|-----|------|---------------------|-------|
| 6 | Single column | ⚠️ Moderate | Assumes uniform column - receipts have mixed formatting |
| 13 | Raw line | ✅ High | Best for receipts - treats each line independently |
| 4 | Single column of text | ✅ High | Similar to 6 but more flexible |
| 11 | Sparse text | ⚠️ Low | For very sparse documents |
| 3 | Auto page segmentation | ⚠️ Low | May over-segment receipts |

**Recommendation:** Test PSM 13 (raw line) first, then PSM 4 as fallback.

#### Issue 3: Temp File Handling (ocr.service.ts)
```typescript
// CURRENT - Lines 95-102, 135-141
const tmpFilePath = path.join(tmpDir, tmpFileName);
fs.writeFileSync(tmpFilePath, processedBuffer); // ❌ Potential encoding issues

// ... OCR processing ...

fs.unlinkSync(tmpFilePath); // Cleanup
```

**Potential Issues:**
- Buffer → File → Tesseract may introduce encoding problems
- PNG encoding from Sharp may not be optimal for Tesseract
- Sync I/O may cause race conditions under load

**Alternative:** Check if `node-tesseract-ocr` supports Buffer input directly.

---

## Solution Architecture

### Design Decision Record (ADR)

**ADR-001: Disable Preprocessing by Default**

**Status:** RECOMMENDED
**Decision:** Change default preprocessing from `full` to `none` with opt-in

**Context:**
- LIOS achieves 100% accuracy with minimal/no preprocessing
- Current full preprocessing produces garbled text
- Tesseract is designed to handle raw images effectively

**Decision:**
- Set `DEFAULT_OCR_OPTIONS.preprocess = false`
- Keep preprocessing available as opt-in for low-quality images
- Add preprocessing level: `none`, `quick`, `full`

**Consequences:**
- **Positive:** Expected 80%+ accuracy improvement immediately
- **Positive:** Faster processing (no preprocessing overhead)
- **Positive:** Simpler debugging (fewer variables)
- **Negative:** May reduce quality on low-resolution images (acceptable trade-off)

**Alternatives Considered:**
1. Keep preprocessing, adjust parameters - Rejected (too many variables)
2. Make quick preprocessing default - Rejected (still adds overhead)

---

**ADR-002: Optimize PSM for Receipt Structure**

**Status:** RECOMMENDED (after ADR-001)
**Decision:** Change PSM from 6 (single column) to 13 (raw line)

**Context:**
- Receipts have mixed formatting (items, prices, barcodes, headers)
- PSM 6 assumes uniform single-column structure
- PSM 13 treats each line independently (better for receipts)

**Decision:**
- Primary: PSM 13 (raw line)
- Fallback: PSM 4 (single column of text)
- Keep OEM 3 (Tesseract + LSTM)

**Consequences:**
- **Positive:** Better handling of receipt structure
- **Positive:** More accurate line extraction
- **Neutral:** May need fine-tuning per receipt type
- **Negative:** Slightly slower than PSM 6 (negligible)

**Alternatives Considered:**
1. PSM 3 (auto) - Rejected (over-segments receipts)
2. PSM 11 (sparse) - Rejected (receipts aren't sparse)

---

**ADR-003: Retain Temp File Approach with Optimization**

**Status:** ACCEPTABLE (if ADR-001/002 insufficient)
**Decision:** Keep temp file approach but optimize encoding

**Context:**
- `node-tesseract-ocr` requires file path input (not Buffer)
- Current implementation works but may have encoding issues
- Changing to buffer input requires library switch

**Decision:**
- Retain temp file approach (required by node-tesseract-ocr)
- Optimize: Ensure PNG encoding is lossless
- Optimize: Use async I/O instead of sync
- Add error handling for file I/O failures

**Consequences:**
- **Positive:** Maintains compatibility with node-tesseract-ocr
- **Positive:** Lower risk than switching libraries
- **Neutral:** Temp files remain (acceptable for server environment)
- **Negative:** Still has I/O overhead (acceptable)

**Alternatives Considered:**
1. Switch back to tesseract.js (supports Buffer) - Rejected (already migrated)
2. Use node-tesseract-ocr Buffer support - INVESTIGATE (may not exist)

---

## Implementation Plan

### Phase 1: Preprocessing Fix (PRIORITY 1)

**Goal:** Disable aggressive preprocessing, test baseline accuracy

**Changes Required:**

#### 1.1 Update Default Configuration
**File:** `src/features/receipt-processing/services/ocr.service.ts`

```typescript
// BEFORE (Line 33-37)
const DEFAULT_OCR_OPTIONS: OcrProcessingOptions = {
  preprocess: true,  // ❌ Enabled by default
  validate: true,
  preprocessingLevel: 'standard',
};

// AFTER
const DEFAULT_OCR_OPTIONS: OcrProcessingOptions = {
  preprocess: false,  // ✅ Disabled by default
  validate: true,
  preprocessingLevel: 'none',  // ✅ New level: none
};
```

#### 1.2 Add 'none' Preprocessing Level
**File:** `src/features/receipt-processing/utils/image-preprocessor.ts`

```typescript
// Add to preprocessing levels (after Line 262)
/**
 * No preprocessing - pass through original image
 * Best for high-quality scans where Tesseract can handle raw input
 * @param imageBuffer - Raw image buffer
 * @returns Original image buffer unchanged
 */
export async function noPreprocess(imageBuffer: Buffer): Promise<Buffer> {
  // Return original image without any modifications
  // Tesseract is designed to handle raw images effectively
  return imageBuffer;
}
```

#### 1.3 Update Preprocessing Logic
**File:** `src/features/receipt-processing/services/ocr.service.ts`

```typescript
// BEFORE (Line 76-93)
if (options.preprocess !== false) {
  if (options.preprocessingLevel === 'quick') {
    processedBuffer = await quickPreprocess(imageBuffer);
    processingApplied.push('quick-preprocessing');
  } else {
    processedBuffer = await fullPreprocess(imageBuffer);
    processingApplied.push('full-preprocessing');
  }
  // ... metadata extraction ...
}

// AFTER
if (options.preprocess === true) {  // ✅ Opt-in instead of opt-out
  if (options.preprocessingLevel === 'none') {
    // No preprocessing
    processingApplied.push('no-preprocessing');
  } else if (options.preprocessingLevel === 'quick') {
    processedBuffer = await quickPreprocess(imageBuffer);
    processingApplied.push('quick-preprocessing');
  } else if (options.preprocessingLevel === 'full') {
    processedBuffer = await fullPreprocess(imageBuffer);
    processingApplied.push('full-preprocessing');
  }

  // Get processed dimensions (only if preprocessing applied)
  if (options.preprocessingLevel !== 'none') {
    const processedMetadata = await sharp.default(processedBuffer).metadata();
    processedSize = {
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
    };
  }
}
```

#### 1.4 Update Type Definitions
**File:** `src/features/receipt-processing/types.ts`

```typescript
// Add 'none' to preprocessing level type
export interface OcrProcessingOptions {
  preprocess?: boolean;
  validate?: boolean;
  preprocessingLevel?: 'none' | 'quick' | 'standard' | 'full';  // ✅ Add 'none'
}
```

**Testing Strategy:**
```bash
# Test 1: Verify preprocessing disabled
cd /export/projects/homeinventory/home-inventory
npm test -- tests/unit/features/receipt-processing/ocr.service.test.ts

# Test 2: Process test receipt
node -e "
const { getOcrService } = require('./src/features/receipt-processing/services/ocr.service.ts');
const fs = require('fs');
const ocr = getOcrService();
const img = fs.readFileSync('/export/projects/homeinventory/out.png');
ocr.processImage(img).then(r => {
  console.log('Lines extracted:', r.lines.length);
  console.log('Processing:', r.processingApplied);
  console.log('First 3 lines:', r.lines.slice(0,3).map(l => l.text));
});
"

# Expected output:
# Lines extracted: 44+
# Processing: ['validation', 'no-preprocessing', 'native-tesseract']
# First 3 lines: [clear readable text without garbled characters]
```

**Success Criteria:**
- ✅ Text is readable without garbled characters
- ✅ 19+ items extracted from test receipt
- ✅ Processing time < 5 seconds
- ✅ No preprocessing overhead

---

### Phase 2: PSM Optimization (PRIORITY 2)

**Goal:** Optimize page segmentation mode for receipt structure

**Changes Required:**

#### 2.1 Test Different PSM Modes
**File:** Create `home-inventory/scripts/test-psm-modes.js`

```javascript
const { recognize } = require('node-tesseract-ocr');
const fs = require('fs');
const path = require('path');

const testImage = '/export/projects/homeinventory/out.png';
const psmModes = [
  { psm: 4, name: 'Single column of text' },
  { psm: 6, name: 'Single column (current)' },
  { psm: 13, name: 'Raw line (recommended)' },
];

async function testPSM() {
  console.log('Testing PSM modes for receipt OCR...\n');

  for (const mode of psmModes) {
    console.log(`\n=== PSM ${mode.psm}: ${mode.name} ===`);
    const start = Date.now();

    try {
      const result = await recognize(testImage, {
        lang: 'eng',
        psm: mode.psm,
        oem: 3,
      });

      const lines = result.split('\n').filter(l => l.trim().length > 0);
      const duration = ((Date.now() - start) / 1000).toFixed(2);

      console.log(`Duration: ${duration}s`);
      console.log(`Lines extracted: ${lines.length}`);
      console.log(`First 5 lines:`);
      lines.slice(0, 5).forEach((line, i) => {
        console.log(`  ${i+1}. ${line}`);
      });

      // Check for garbled text
      const garbledCount = lines.filter(l => /[^\x20-\x7E]+/.test(l)).length;
      console.log(`Garbled lines: ${garbledCount} (${(garbledCount/lines.length*100).toFixed(1)}%)`);

    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testPSM();
```

**Run Test:**
```bash
cd /export/projects/homeinventory/home-inventory
node scripts/test-psm-modes.js > scripts/psm-test-results.txt
cat scripts/psm-test-results.txt
```

#### 2.2 Implement Best PSM Mode
**File:** `src/features/receipt-processing/services/ocr.service.ts`

```typescript
// BEFORE (Line 108-112)
const ocrText = await recognize(tmpFilePath, {
  lang: 'eng',
  psm: 6,  // ❌ Single column
  oem: 3,
});

// AFTER
const ocrText = await recognize(tmpFilePath, {
  lang: 'eng',
  psm: 13,  // ✅ Raw line (best for receipts)
  oem: 3,   // Keep Tesseract + LSTM
});
```

#### 2.3 Add PSM Configuration Option (Optional)
**File:** `src/features/receipt-processing/types.ts`

```typescript
export interface OcrProcessingOptions {
  preprocess?: boolean;
  validate?: boolean;
  preprocessingLevel?: 'none' | 'quick' | 'standard' | 'full';
  psm?: 3 | 4 | 6 | 11 | 13;  // ✅ Allow PSM override
  oem?: 0 | 1 | 2 | 3;         // ✅ Allow OEM override
}
```

**File:** `src/features/receipt-processing/services/ocr.service.ts`

```typescript
// Update recognize call (Line 108)
const ocrText = await recognize(tmpFilePath, {
  lang: 'eng',
  psm: options.psm || 13,  // ✅ Configurable with default 13
  oem: options.oem || 3,   // ✅ Configurable with default 3
});
```

**Testing Strategy:**
```bash
# Test each PSM mode and compare results
npm run test:integration -- --grep "PSM"

# Manual validation
node scripts/test-psm-modes.js
# Compare:
# - Number of lines extracted
# - Percentage of garbled text
# - Processing time
# - Item extraction accuracy
```

**Success Criteria:**
- ✅ PSM 13 extracts 40+ clean lines
- ✅ Less than 5% garbled text
- ✅ All 19+ items extracted correctly
- ✅ Processing time < 5 seconds

---

### Phase 3: Buffer Handling Optimization (PRIORITY 3)

**Goal:** Optimize temp file handling if Phases 1-2 insufficient

#### 3.1 Investigate Buffer Support
**Research:** Check if `node-tesseract-ocr` v2.2.1 supports Buffer input

```bash
# Check library source
cd /export/projects/homeinventory/home-inventory/node_modules/node-tesseract-ocr
cat README.md | grep -i buffer
cat index.js | head -50
```

#### 3.2 Option A: Direct Buffer Support (If Available)
**File:** `src/features/receipt-processing/services/ocr.service.ts`

```typescript
// IF library supports buffer input:
try {
  // Step 5: Run OCR directly from buffer (no temp file)
  console.log('[OCR] Running native Tesseract OCR from buffer...');
  const ocrText = await recognize(processedBuffer, {  // ✅ Pass buffer directly
    lang: 'eng',
    psm: 13,
    oem: 3,
  });

  processingApplied.push('native-tesseract-buffer');
  // ... rest of code ...

} catch (error) {
  console.error('[OCR] Tesseract processing failed:', error);
  // ... error handling ...
}
```

#### 3.3 Option B: Optimize Temp File Handling
**File:** `src/features/receipt-processing/services/ocr.service.ts`

```typescript
// BEFORE (Lines 95-102, 135-141)
const tmpFilePath = path.join(tmpDir, tmpFileName);
fs.writeFileSync(tmpFilePath, processedBuffer);  // ❌ Sync I/O
// ...
fs.unlinkSync(tmpFilePath);  // ❌ Sync I/O

// AFTER
const tmpFilePath = path.join(tmpDir, tmpFileName);

try {
  // Write with explicit encoding for lossless PNG
  await fs.promises.writeFile(tmpFilePath, processedBuffer, { flag: 'w' });  // ✅ Async I/O

  // Step 5: Run OCR with native Tesseract
  console.log('[OCR] Running native Tesseract OCR...');
  const ocrText = await recognize(tmpFilePath, {
    lang: 'eng',
    psm: 13,
    oem: 3,
  });

  processingApplied.push('native-tesseract');

  // ... parsing logic ...

} catch (error) {
  console.error('[OCR] Tesseract processing failed:', error);
  throw new Error(
    `OCR processing failed: ${error instanceof Error ? error.message : String(error)}`
  );
} finally {
  // Clean up temp file (async)
  try {
    if (await fs.promises.access(tmpFilePath).then(() => true).catch(() => false)) {
      await fs.promises.unlink(tmpFilePath);  // ✅ Async cleanup
    }
  } catch (cleanupError) {
    console.warn('[OCR] Failed to cleanup temp file:', cleanupError);
  }
}
```

#### 3.4 Ensure Lossless PNG Encoding
**File:** `src/features/receipt-processing/utils/image-preprocessor.ts`

```typescript
// Verify PNG quality settings (Line 218)
pipeline = pipeline.png({
  quality: 100,        // ✅ Maximum quality
  compressionLevel: 0, // ✅ No compression (was 6)
  progressive: false,  // ✅ Ensure compatibility
  adaptiveFiltering: false, // ✅ Simplify encoding
});
```

**Testing Strategy:**
```bash
# Test 1: Verify temp file integrity
node -e "
const fs = require('fs');
const sharp = require('sharp');

// Create test image
const original = fs.readFileSync('/export/projects/homeinventory/out.png');
const tmpPath = '/tmp/test-integrity.png';

// Write and read back
fs.writeFileSync(tmpPath, original);
const readBack = fs.readFileSync(tmpPath);

// Compare
sharp(original).metadata().then(m1 => {
  sharp(readBack).metadata().then(m2 => {
    console.log('Original:', m1.width, 'x', m1.height, m1.format);
    console.log('Read back:', m2.width, 'x', m2.height, m2.format);
    console.log('Match:', m1.width === m2.width && m1.height === m2.height);
  });
});
"

# Test 2: Full pipeline test
npm run test:integration -- --grep "OCR"
```

**Success Criteria:**
- ✅ Temp file identical to source buffer
- ✅ No corruption during I/O
- ✅ Async operations don't cause race conditions
- ✅ Cleanup always executes

---

## Testing Strategy

### Unit Tests

**File:** `home-inventory/tests/unit/features/receipt-processing/ocr.service.test.ts`

```typescript
describe('OcrService - Preprocessing Configuration', () => {
  it('should use no preprocessing by default', async () => {
    const ocr = getOcrService();
    const result = await ocr.processImage(testImageBuffer);

    expect(result.processingApplied).toContain('no-preprocessing');
    expect(result.processingApplied).not.toContain('full-preprocessing');
  });

  it('should allow opt-in to preprocessing', async () => {
    const ocr = getOcrService();
    const result = await ocr.processImage(testImageBuffer, {
      preprocess: true,
      preprocessingLevel: 'full'
    });

    expect(result.processingApplied).toContain('full-preprocessing');
  });

  it('should use PSM 13 by default', async () => {
    // Mock recognize call to verify PSM parameter
    const mockRecognize = jest.spyOn(require('node-tesseract-ocr'), 'recognize');

    const ocr = getOcrService();
    await ocr.processImage(testImageBuffer);

    expect(mockRecognize).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ psm: 13 })
    );
  });
});
```

### Integration Tests

**File:** `home-inventory/tests/integration/ocr-pipeline.test.ts`

```typescript
describe('OCR Pipeline - Real Receipt Processing', () => {
  const testReceipts = [
    { file: 'out.png', expectedItems: 19, description: 'Walmart receipt' },
    { file: 'heb.jpg', expectedItems: 29, description: 'HEB receipt' },
  ];

  testReceipts.forEach(({ file, expectedItems, description }) => {
    it(`should extract items from ${description}`, async () => {
      const imagePath = path.join(__dirname, '../../fixtures', file);
      const imageBuffer = fs.readFileSync(imagePath);

      const ocr = getOcrService();
      const ocrResult = await ocr.processImage(imageBuffer);

      // Verify lines extracted
      expect(ocrResult.lines.length).toBeGreaterThan(20);

      // Verify no garbled text
      const garbledLines = ocrResult.lines.filter(line =>
        /[^\x20-\x7E]+/.test(line.text) // Non-printable characters
      );
      expect(garbledLines.length).toBeLessThan(ocrResult.lines.length * 0.05); // < 5%

      // Parse receipt
      const parser = new ParserService();
      const receipt = parser.parseReceipt(ocrResult.lines);

      // Verify item extraction
      expect(receipt.items.length).toBeGreaterThanOrEqual(expectedItems * 0.9); // Allow 10% margin
      expect(receipt.items[0].name).toMatch(/^[A-Za-z0-9\s]+$/); // Readable text
    });
  });

  it('should process faster without preprocessing', async () => {
    const imageBuffer = fs.readFileSync('../../fixtures/out.png');
    const ocr = getOcrService();

    // Test without preprocessing
    const start1 = Date.now();
    await ocr.processImage(imageBuffer, { preprocess: false });
    const duration1 = Date.now() - start1;

    // Test with preprocessing
    const start2 = Date.now();
    await ocr.processImage(imageBuffer, {
      preprocess: true,
      preprocessingLevel: 'full'
    });
    const duration2 = Date.now() - start2;

    expect(duration1).toBeLessThan(duration2);
  });
});
```

### Validation Tests

**File:** `home-inventory/scripts/validate-ocr-fix.js`

```javascript
const { getOcrService } = require('../src/features/receipt-processing/services/ocr.service');
const { ParserService } = require('../src/features/receipt-processing/services/parser.service');
const fs = require('fs');
const path = require('path');

async function validateFix() {
  console.log('=== OCR Fix Validation ===\n');

  const testImage = '/export/projects/homeinventory/out.png';
  const liosBaseline = fs.readFileSync('/export/projects/homeinventory/lios-ocr.txt', 'utf8');

  // Count expected items from LIOS baseline
  const liosLines = liosBaseline.split('\n').filter(l => l.trim());
  const expectedItems = liosLines.filter(l => /\d+\.\d{2}/.test(l)).length;

  console.log(`LIOS Baseline: ${liosLines.length} lines, ~${expectedItems} items\n`);

  // Test current implementation
  const imageBuffer = fs.readFileSync(testImage);
  const ocr = getOcrService();
  const parser = new ParserService();

  const start = Date.now();
  const ocrResult = await ocr.processImage(imageBuffer);
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  const receipt = parser.parseReceipt(ocrResult.lines);

  // Results
  console.log(`Processing completed in ${duration}s`);
  console.log(`Processing applied: ${ocrResult.processingApplied.join(', ')}`);
  console.log(`\nOCR Results:`);
  console.log(`  Lines extracted: ${ocrResult.lines.length}`);
  console.log(`  Average confidence: ${(ocrResult.lines.reduce((sum, l) => sum + l.confidence, 0) / ocrResult.lines.length * 100).toFixed(1)}%`);

  // Check for garbled text
  const garbledLines = ocrResult.lines.filter(l => /[^\x20-\x7E]+/.test(l.text));
  console.log(`  Garbled lines: ${garbledLines.length} (${(garbledLines.length/ocrResult.lines.length*100).toFixed(1)}%)`);

  console.log(`\nParser Results:`);
  console.log(`  Items extracted: ${receipt.items.length}`);
  console.log(`  Expected: ~${expectedItems}`);
  console.log(`  Accuracy: ${(receipt.items.length/expectedItems*100).toFixed(1)}%`);

  // Sample items
  console.log(`\nFirst 5 items:`);
  receipt.items.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i+1}. ${item.name} - $${item.price.toFixed(2)} (confidence: ${(item.confidence*100).toFixed(0)}%)`);
  });

  // Validation
  const passed = receipt.items.length >= expectedItems * 0.9 && garbledLines.length < ocrResult.lines.length * 0.05;

  console.log(`\n=== Validation: ${passed ? 'PASSED ✅' : 'FAILED ❌'} ===`);

  return { passed, receipt, ocrResult, duration };
}

validateFix();
```

---

## Expected Results

### Before Fix (Current State)
```
OCR Results:
  Lines extracted: 44
  Average confidence: 35%
  Garbled lines: 38 (86%)

Parser Results:
  Items extracted: 3
  Expected: ~19
  Accuracy: 15.8%

Sample items:
  1. ) Geme BriL POPERS TCT - $0.91
  2. Web (0 FASOND GTS 42 £ - $1.48
  3. W crac bag RIE a £ - $1.44
```

### After Phase 1 (Disable Preprocessing)
```
OCR Results:
  Lines extracted: 44
  Average confidence: 85%
  Garbled lines: 2 (4.5%)

Parser Results:
  Items extracted: 18
  Expected: ~19
  Accuracy: 94.7%

Sample items:
  1. GV 100 BRD - $0.91
  2. WELCH'S SEASONED GTS 42 - $1.48
  3. WHEAT CRACKERS BAG - $1.44
```

### After Phase 2 (PSM Optimization)
```
OCR Results:
  Lines extracted: 46
  Average confidence: 92%
  Garbled lines: 0 (0%)

Parser Results:
  Items extracted: 19
  Expected: ~19
  Accuracy: 100%

Sample items:
  1. GV 100 BRD WHEAT - $0.91
  2. WELCH'S SEASONED GRITS 42 OZ - $1.48
  3. WHEAT CRACKER BAG FAMILY SIZE - $1.44
```

---

## Risk Analysis

### Phase 1 Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Reduced quality on low-res images | Medium | Low | Keep preprocessing available as opt-in |
| Breaking existing tests | Low | Medium | Update test expectations before deployment |
| Performance regression | Very Low | Low | Preprocessing adds overhead, removing improves speed |

### Phase 2 Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| PSM 13 worse on some receipts | Low | Medium | Make PSM configurable, test multiple modes |
| Increased processing time | Very Low | Low | PSM 13 is designed for line-by-line, not slower |
| Breaking backwards compatibility | Very Low | Low | PSM is internal config, no API changes |

### Phase 3 Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Buffer support doesn't exist | Medium | Low | Keep temp file approach (already working) |
| Async I/O race conditions | Low | Medium | Use proper async/await, add error handling |
| File system permissions | Very Low | High | Use OS temp directory with proper fallbacks |

---

## Deployment Strategy

### Pre-Deployment Checklist
- [ ] All unit tests pass
- [ ] Integration tests validate 90%+ accuracy
- [ ] Manual validation with 3+ test receipts
- [ ] Performance benchmarks show no regression
- [ ] Code review completed
- [ ] Documentation updated

### Deployment Steps

1. **Deploy Phase 1**
   ```bash
   # Update code
   git checkout -b fix/ocr-preprocessing
   # Apply Phase 1 changes
   git commit -m "fix: Disable aggressive OCR preprocessing by default"

   # Test locally
   npm run test:unit
   npm run test:integration
   node scripts/validate-ocr-fix.js

   # Deploy to staging
   git push origin fix/ocr-preprocessing
   # Create PR, review, merge
   ```

2. **Monitor & Validate**
   - Run validation tests on staging
   - Process 10+ real receipts
   - Monitor error rates
   - Check processing times

3. **Deploy Phase 2 (If Needed)**
   - Only if Phase 1 doesn't achieve 90%+ accuracy
   - Follow same process

4. **Rollback Plan**
   ```bash
   # If issues arise:
   git revert <commit-hash>
   git push origin main
   # Or: Hotfix with preprocess: true temporarily
   ```

### Success Metrics

| Metric | Current | Target | Phase 1 | Phase 2 |
|--------|---------|--------|---------|---------|
| Item extraction accuracy | 15.8% | 90%+ | 85-95% | 95-100% |
| Garbled text rate | 86% | <5% | <10% | <2% |
| Processing time | ~2.1s | <5s | ~1.5s | ~1.8s |
| User satisfaction | N/A | >90% | TBD | TBD |

---

## Future Enhancements

### Post-Fix Improvements (Priority 4)

1. **Adaptive Preprocessing**
   - Analyze image quality metrics
   - Apply preprocessing only to low-quality images
   - Machine learning model to predict optimal preprocessing

2. **Multi-PSM Fallback**
   - Try PSM 13 first
   - Fallback to PSM 4 if confidence < 80%
   - Ensemble approach for best results

3. **Confidence-Based Validation**
   - Reject OCR results with avg confidence < 70%
   - Prompt user for manual review
   - Learn from corrections

4. **Receipt Type Detection**
   - Classify receipt format (Walmart, HEB, Whole Foods, etc.)
   - Optimize PSM and preprocessing per merchant
   - Custom parsers for known formats

---

## Appendix

### A. Code Locations

| Component | File Path | Lines |
|-----------|-----------|-------|
| OcrService | `src/features/receipt-processing/services/ocr.service.ts` | 1-226 |
| ImagePreprocessor | `src/features/receipt-processing/utils/image-preprocessor.ts` | 1-279 |
| ParserService | `src/features/receipt-processing/services/parser.service.ts` | 1-500+ |
| Types | `src/features/receipt-processing/types.ts` | 1-100 |
| API Route | `src/app/api/receipts/process/route.ts` | 1-200 |

### B. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| node-tesseract-ocr | 2.2.1 | Native Tesseract OCR wrapper |
| tesseract.js | 6.0.1 | JavaScript OCR (legacy, consider removing) |
| sharp | Latest | Image processing and preprocessing |
| fs | Built-in | File I/O for temp files |
| os | Built-in | Temp directory access |

### C. References

- [LIOS OCR Baseline](../../lios-ocr.txt) - 100% accuracy reference
- [OCR Failure Analysis](../testing/ocr-failure-analysis.json) - Detailed problem investigation
- [Test Results](../testing/receipt-validation-results.json) - Current state metrics
- [Tesseract PSM Modes](https://github.com/tesseract-ocr/tesseract/blob/main/doc/tesseract.1.asc) - Official documentation

---

## Conclusion

This architecture design provides a **clear, phased approach** to fixing the garbled text issue:

1. **Phase 1 (High Priority):** Disable preprocessing - Expected 80-95% accuracy improvement
2. **Phase 2 (Medium Priority):** Optimize PSM - Expected 95-100% accuracy
3. **Phase 3 (Low Priority):** Buffer handling - Only if Phases 1-2 insufficient

The design is **low-risk, high-reward** with clear rollback paths and comprehensive testing. Implementation should take **2-4 hours total** with validation.

**Next Steps:**
1. Review this design with team
2. Implement Phase 1 changes
3. Run validation tests
4. Deploy to staging
5. Monitor results
6. Proceed to Phase 2 if needed

**Design Status:** ✅ **COMPLETE - READY FOR IMPLEMENTATION**
