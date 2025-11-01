# OCR Fix Implementation Checklist

**Priority:** CRITICAL
**Estimated Time:** 2-4 hours
**Expected Outcome:** 90-100% item extraction accuracy

---

## Quick Reference

### Current Problem
- ❌ 86% garbled text rate
- ❌ Only 3/19 items extracted
- ❌ Unreadable output: ") Geme BriL POPERS TCT"

### Expected After Fix
- ✅ <5% garbled text rate
- ✅ 18-19/19 items extracted
- ✅ Readable output: "GV 100 BRD WHEAT"

---

## Phase 1: Preprocessing Fix (30 minutes)

### Changes Needed

#### 1. Update Default Configuration
**File:** `home-inventory/src/features/receipt-processing/services/ocr.service.ts`
**Line:** 33-37

```typescript
// CHANGE THIS:
const DEFAULT_OCR_OPTIONS: OcrProcessingOptions = {
  preprocess: true,
  validate: true,
  preprocessingLevel: 'standard',
};

// TO THIS:
const DEFAULT_OCR_OPTIONS: OcrProcessingOptions = {
  preprocess: false,  // ✅ Disabled by default
  validate: true,
  preprocessingLevel: 'none',  // ✅ New level
};
```

#### 2. Add Type Definition
**File:** `home-inventory/src/features/receipt-processing/types.ts`
**Find:** `preprocessingLevel?: 'quick' | 'standard' | 'full';`

```typescript
// CHANGE THIS:
preprocessingLevel?: 'quick' | 'standard' | 'full';

// TO THIS:
preprocessingLevel?: 'none' | 'quick' | 'standard' | 'full';
```

#### 3. Update Preprocessing Logic
**File:** `home-inventory/src/features/receipt-processing/services/ocr.service.ts`
**Line:** 76-93

```typescript
// CHANGE THIS:
if (options.preprocess !== false) {
  if (options.preprocessingLevel === 'quick') {
    processedBuffer = await quickPreprocess(imageBuffer);
    processingApplied.push('quick-preprocessing');
  } else {
    processedBuffer = await fullPreprocess(imageBuffer);
    processingApplied.push('full-preprocessing');
  }

  // Get processed dimensions
  const processedMetadata = await sharp.default(processedBuffer).metadata();
  processedSize = {
    width: processedMetadata.width || 0,
    height: processedMetadata.height || 0,
  };
}

// TO THIS:
if (options.preprocess === true) {  // ✅ Opt-in instead of opt-out
  if (options.preprocessingLevel === 'none') {
    // No preprocessing - pass through original
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

#### 4. Add No-Preprocessing Function (Optional)
**File:** `home-inventory/src/features/receipt-processing/utils/image-preprocessor.ts`
**Add after line 262:**

```typescript
/**
 * No preprocessing - pass through original image
 * @param imageBuffer - Raw image buffer
 * @returns Original image buffer unchanged
 */
export async function noPreprocess(imageBuffer: Buffer): Promise<Buffer> {
  return imageBuffer;
}
```

### Validation Commands

```bash
# 1. Run unit tests
cd /export/projects/homeinventory/home-inventory
npm test -- tests/unit/features/receipt-processing/ocr.service.test.ts

# 2. Quick test with out.png
node -e "
const { getOcrService } = require('./src/features/receipt-processing/services/ocr.service');
const fs = require('fs');
(async () => {
  const ocr = getOcrService();
  const img = fs.readFileSync('/export/projects/homeinventory/out.png');
  const result = await ocr.processImage(img);
  console.log('Lines:', result.lines.length);
  console.log('Processing:', result.processingApplied);
  console.log('Sample:', result.lines.slice(0, 3).map(l => l.text));
  await ocr.terminate();
})();
"

# 3. Full validation
node scripts/validate-ocr-fix.js
```

### Success Criteria
- [ ] `preprocess: false` by default
- [ ] Lines extracted: 40+
- [ ] Garbled lines: <10%
- [ ] Processing includes: 'validation', 'no-preprocessing', 'native-tesseract'
- [ ] Text is readable

---

## Phase 2: PSM Optimization (1 hour)

### Changes Needed

#### 1. Test PSM Modes First
**Create:** `home-inventory/scripts/test-psm-modes.js`

```javascript
const { recognize } = require('node-tesseract-ocr');
const fs = require('fs');

const testImage = '/export/projects/homeinventory/out.png';
const psmModes = [4, 6, 13];

async function testPSM() {
  console.log('Testing PSM modes...\n');

  for (const psm of psmModes) {
    console.log(`=== PSM ${psm} ===`);
    const start = Date.now();

    try {
      const result = await recognize(testImage, {
        lang: 'eng',
        psm: psm,
        oem: 3,
      });

      const lines = result.split('\n').filter(l => l.trim().length > 0);
      const garbled = lines.filter(l => /[^\x20-\x7E]+/.test(l)).length;

      console.log(`Duration: ${((Date.now() - start) / 1000).toFixed(2)}s`);
      console.log(`Lines: ${lines.length}`);
      console.log(`Garbled: ${garbled} (${(garbled/lines.length*100).toFixed(1)}%)`);
      console.log(`Sample: ${lines[0]}\n`);
    } catch (error) {
      console.error(`Error: ${error.message}\n`);
    }
  }
}

testPSM();
```

**Run:**
```bash
cd /export/projects/homeinventory/home-inventory
node scripts/test-psm-modes.js
```

#### 2. Update PSM Configuration
**File:** `home-inventory/src/features/receipt-processing/services/ocr.service.ts`
**Line:** 108-112

```typescript
// CHANGE THIS:
const ocrText = await recognize(tmpFilePath, {
  lang: 'eng',
  psm: 6,  // ❌ Single column
  oem: 3,
});

// TO THIS:
const ocrText = await recognize(tmpFilePath, {
  lang: 'eng',
  psm: 13,  // ✅ Raw line (best for receipts)
  oem: 3,
});
```

#### 3. (Optional) Make PSM Configurable
**File:** `home-inventory/src/features/receipt-processing/types.ts`

```typescript
export interface OcrProcessingOptions {
  preprocess?: boolean;
  validate?: boolean;
  preprocessingLevel?: 'none' | 'quick' | 'standard' | 'full';
  psm?: 3 | 4 | 6 | 11 | 13;  // ✅ Add PSM option
  oem?: 0 | 1 | 2 | 3;         // ✅ Add OEM option
}
```

**File:** `home-inventory/src/features/receipt-processing/services/ocr.service.ts`
**Line:** 108

```typescript
const ocrText = await recognize(tmpFilePath, {
  lang: 'eng',
  psm: options.psm || 13,  // ✅ Configurable
  oem: options.oem || 3,
});
```

### Validation Commands

```bash
# 1. Test PSM modes
node scripts/test-psm-modes.js

# 2. Validate with best PSM
node scripts/validate-ocr-fix.js

# 3. Integration tests
npm run test:integration -- --grep "OCR"
```

### Success Criteria
- [ ] PSM 13 selected as best mode
- [ ] Lines extracted: 44+
- [ ] Garbled lines: <5%
- [ ] Items extracted: 18+
- [ ] Processing time: <5s

---

## Phase 3: Buffer Optimization (Optional, 2 hours)

**Only implement if Phases 1-2 don't achieve 90%+ accuracy**

### Option A: Async I/O (Recommended)

**File:** `home-inventory/src/features/receipt-processing/services/ocr.service.ts`
**Lines:** 95-142

```typescript
// BEFORE
const tmpFilePath = path.join(tmpDir, tmpFileName);
try {
  fs.writeFileSync(tmpFilePath, processedBuffer);  // ❌ Sync
  const ocrText = await recognize(tmpFilePath, { ... });
  // ... parsing ...
} finally {
  fs.unlinkSync(tmpFilePath);  // ❌ Sync
}

// AFTER
const tmpFilePath = path.join(tmpDir, tmpFileName);
try {
  await fs.promises.writeFile(tmpFilePath, processedBuffer);  // ✅ Async

  const ocrText = await recognize(tmpFilePath, {
    lang: 'eng',
    psm: 13,
    oem: 3,
  });

  // ... parsing ...

} finally {
  try {
    const exists = await fs.promises.access(tmpFilePath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      await fs.promises.unlink(tmpFilePath);  // ✅ Async
    }
  } catch (cleanupError) {
    console.warn('[OCR] Cleanup failed:', cleanupError);
  }
}
```

### Option B: Lossless PNG Encoding

**File:** `home-inventory/src/features/receipt-processing/utils/image-preprocessor.ts`
**Line:** 218

```typescript
// CHANGE THIS:
pipeline = pipeline.png({ quality: 100, compressionLevel: 6 });

// TO THIS:
pipeline = pipeline.png({
  quality: 100,
  compressionLevel: 0,  // ✅ No compression
  progressive: false,
  adaptiveFiltering: false,
});
```

---

## Complete Test Suite

### Create Validation Script
**File:** `home-inventory/scripts/validate-ocr-fix.js`

```javascript
const { getOcrService } = require('../src/features/receipt-processing/services/ocr.service');
const { ParserService } = require('../src/features/receipt-processing/services/parser.service');
const fs = require('fs');

async function validate() {
  console.log('=== OCR Fix Validation ===\n');

  const testImage = '/export/projects/homeinventory/out.png';
  const expectedItems = 19;

  const imageBuffer = fs.readFileSync(testImage);
  const ocr = getOcrService();
  const parser = new ParserService();

  const start = Date.now();
  const ocrResult = await ocr.processImage(imageBuffer);
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  const receipt = parser.parseReceipt(ocrResult.lines);

  // Check garbled text
  const garbled = ocrResult.lines.filter(l => /[^\x20-\x7E]+/.test(l.text));

  // Results
  console.log(`Processing: ${duration}s`);
  console.log(`Applied: ${ocrResult.processingApplied.join(', ')}`);
  console.log(`\nOCR Results:`);
  console.log(`  Lines: ${ocrResult.lines.length}`);
  console.log(`  Confidence: ${(ocrResult.lines.reduce((s, l) => s + l.confidence, 0) / ocrResult.lines.length * 100).toFixed(1)}%`);
  console.log(`  Garbled: ${garbled.length} (${(garbled.length/ocrResult.lines.length*100).toFixed(1)}%)`);

  console.log(`\nParser Results:`);
  console.log(`  Items: ${receipt.items.length}`);
  console.log(`  Expected: ${expectedItems}`);
  console.log(`  Accuracy: ${(receipt.items.length/expectedItems*100).toFixed(1)}%`);

  console.log(`\nSample Items:`);
  receipt.items.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i+1}. ${item.name} - $${item.price.toFixed(2)}`);
  });

  // Validation
  const passed =
    receipt.items.length >= expectedItems * 0.9 &&
    garbled.length < ocrResult.lines.length * 0.05;

  console.log(`\n=== ${passed ? 'PASSED ✅' : 'FAILED ❌'} ===`);

  await ocr.terminate();
}

validate().catch(console.error);
```

### Run All Tests

```bash
# 1. Unit tests
npm run test:unit

# 2. Integration tests
npm run test:integration

# 3. Validation script
node scripts/validate-ocr-fix.js

# 4. E2E tests (optional)
npm run test:e2e -- --grep "receipt"
```

---

## Expected Results Timeline

### Before Any Changes
```
Lines: 44
Garbled: 38 (86%)
Items: 3
Accuracy: 15.8%
Sample: ) Geme BriL POPERS TCT
Status: FAILED ❌
```

### After Phase 1 (Preprocessing Disabled)
```
Lines: 44
Garbled: 4 (9%)
Items: 17
Accuracy: 89.5%
Sample: GV 100 BRD WHEAT
Status: PASSED ✅ (if >90%, stop here)
```

### After Phase 2 (PSM Optimized)
```
Lines: 46
Garbled: 1 (2%)
Items: 19
Accuracy: 100%
Sample: GV 100 BRD WHEAT BREAD
Status: PASSED ✅
```

---

## Rollback Plan

If issues occur after deployment:

```bash
# Option 1: Git revert
git revert <commit-hash>
git push origin main

# Option 2: Hotfix - restore preprocessing
# Edit ocr.service.ts line 34:
preprocess: true,  // Temporary rollback
preprocessingLevel: 'quick',  // Less aggressive

# Deploy hotfix
git commit -am "hotfix: Re-enable preprocessing temporarily"
git push origin main
```

---

## Deployment Checklist

- [ ] **Phase 1 Complete**
  - [ ] Code changes applied
  - [ ] Unit tests pass
  - [ ] Validation script passes
  - [ ] Manual testing with 3+ receipts

- [ ] **Phase 2 Complete (if needed)**
  - [ ] PSM modes tested
  - [ ] Best PSM selected
  - [ ] Code updated
  - [ ] Tests pass

- [ ] **Pre-Deployment**
  - [ ] Code review completed
  - [ ] PR approved
  - [ ] Staging tests pass
  - [ ] Performance benchmarks OK

- [ ] **Deployment**
  - [ ] Deploy to staging
  - [ ] Monitor error rates
  - [ ] Process 10+ real receipts
  - [ ] Deploy to production

- [ ] **Post-Deployment**
  - [ ] Monitor success rates
  - [ ] Check processing times
  - [ ] Gather user feedback
  - [ ] Document lessons learned

---

## Quick Commands Reference

```bash
# Navigate to project
cd /export/projects/homeinventory/home-inventory

# Run specific test
npm test -- tests/unit/features/receipt-processing/ocr.service.test.ts

# Quick OCR test
node -e "const{getOcrService}=require('./src/features/receipt-processing/services/ocr.service');const fs=require('fs');(async()=>{const o=getOcrService(),i=fs.readFileSync('/export/projects/homeinventory/out.png'),r=await o.processImage(i);console.log('Lines:',r.lines.length,'Garbled:',r.lines.filter(l=>/[^\x20-\x7E]+/.test(l.text)).length);await o.terminate();})();"

# Full validation
node scripts/validate-ocr-fix.js

# Test PSM modes
node scripts/test-psm-modes.js

# Build and test
npm run build && npm run test:all
```

---

## Support & References

- **Design Document:** `hive/architecture/ocr-garbled-text-fix-design.md`
- **Test Data:** `/export/projects/homeinventory/out.png`
- **LIOS Baseline:** `/export/projects/homeinventory/lios-ocr.txt`
- **Analysis:** `hive/testing/ocr-failure-analysis.json`

---

**Last Updated:** 2025-10-31
**Status:** Ready for Implementation
**Next Action:** Begin Phase 1 - Disable Preprocessing
