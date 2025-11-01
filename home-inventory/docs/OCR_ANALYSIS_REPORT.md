# OCR Analysis Report: Tesseract Garbled Text Issue

**Date**: 2025-10-31
**Issue**: Tesseract produces garbled text (confidence 0.31) while LIOS produces clean text

## Executive Summary

**ROOT CAUSE**: Aggressive preprocessing pipeline is **degrading** text quality instead of improving it.

**Evidence**:
- LIOS Output: Clean, readable text ("Walmart", "Neighborhood Market", "832-772-9978")
- Our Output: Garbled text ("pe E", "fu i i", "ste Taal 1 1") with 31% confidence
- Our code calls `fullPreprocess()` by default which applies 5+ destructive operations

## Detailed Analysis

### 1. Image Preprocessing Pipeline Issues

**Current DEFAULT_PREPROCESSING_CONFIG** (lines 23-29 in image-preprocessor.ts):
```typescript
{
  enableCLAHE: false,        // Disabled (good!)
  enableNoiseReduction: false, // Disabled (good!)
  enableDeskewing: false,     // Disabled (good!)
  enableNormalization: true,  // ENABLED - Could be problematic
  sharpen: false,             // Disabled (good!)
}
```

**The Problem**: When `preprocessingLevel: 'standard'` is used (default), it calls `fullPreprocess()` which **OVERRIDES** the defaults and enables ALL operations:

```typescript
// Line 268-277: fullPreprocess() enables EVERYTHING
export async function fullPreprocess(imageBuffer: Buffer): Promise<Buffer> {
  const result = await preprocessImage(imageBuffer, {
    enableCLAHE: true,           // ❌ Over-processing
    enableNoiseReduction: true,   // ❌ Damages text clarity
    enableDeskewing: true,        // ❌ Computationally expensive
    enableNormalization: true,    // ❌ Over-adjusts contrast
    sharpen: true,                // ❌ Causes artifacts
  });
}
```

**Each preprocessing step is destructive**:

1. **Grayscale** (Line 186) - Always applied, reasonable but removes color information
2. **Resize** (Line 190) - Always applied, can blur text if downscaling too much
3. **Noise Reduction** (Line 62-65) - `median(1)` blur can damage sharp text edges
4. **CLAHE** (Line 51-55) - `normalize() + gamma(1.2)` over-contrasts text
5. **Normalization** (Line 88-92) - `normalize() + linear(1.2, -10)` can blow out text
6. **Sharpen** (Line 72-81) - Aggressive parameters can create artifacts around text

### 2. OCR Service Implementation Issues

**Line 76-82 in ocr.service.ts**:
```typescript
if (options.preprocess !== false) {
  if (options.preprocessingLevel === 'quick') {
    processedBuffer = await quickPreprocess(imageBuffer);  // Uses minimal preprocessing
  } else {
    processedBuffer = await fullPreprocess(imageBuffer);   // Uses ALL preprocessing (BAD!)
  }
}
```

**The Bug**:
- Default is `preprocessingLevel: 'standard'` (line 36)
- But the code only checks for `'quick'`, everything else falls through to `fullPreprocess()`
- This means **'standard' is treated the same as 'full'** - maximum preprocessing!

### 3. LIOS vs Our Approach

**LIOS Approach** (from lios-ocr.txt):
- Minimal or no preprocessing
- OCR the image as-is
- Result: Clean, accurate text

**Our Approach** (from test-ocr-results.json):
- Full preprocessing pipeline (5+ operations)
- Heavy image manipulation
- Result: Garbled text with 31% confidence

### 4. Tesseract Configuration

**Current config** (Line 108-112):
```typescript
const ocrText = await recognize(tmpFilePath, {
  lang: 'eng',
  psm: 6,  // Single column (good for receipts)
  oem: 3,  // Tesseract + LSTM (best engine)
});
```

**The Tesseract config is fine**. The problem is the **preprocessed image** being fed to it.

## Root Cause Ranking

1. **CRITICAL**: `fullPreprocess()` applies ALL destructive operations (CLAHE, noise reduction, sharpening, double normalization)
2. **HIGH**: `preprocessingLevel: 'standard'` incorrectly falls through to `fullPreprocess()` instead of using defaults
3. **MEDIUM**: Multiple normalize operations compound contrast issues
4. **LOW**: Temp file I/O is fine, not the issue
5. **LOW**: Tesseract parameters are optimal

## Recommended Fixes (In Order of Priority)

### Quick Fix #1: Disable Preprocessing Entirely
**Fastest test** - Bypass preprocessing to match LIOS behavior:
```typescript
const result = await ocrService.processImage(imageBuffer, {
  preprocess: false,  // ← Test this first!
  validate: true,
  preprocessingLevel: 'quick'
});
```

### Quick Fix #2: Fix 'standard' Preprocessing Logic
**Current Bug**: 'standard' falls through to fullPreprocess()
```typescript
// ocr.service.ts line 76-82
if (options.preprocess !== false) {
  if (options.preprocessingLevel === 'quick') {
    processedBuffer = await quickPreprocess(imageBuffer);
  } else if (options.preprocessingLevel === 'standard') {
    // ← ADD THIS CASE
    processedBuffer = await preprocessImage(imageBuffer); // Uses DEFAULT_PREPROCESSING_CONFIG
  } else {
    processedBuffer = await fullPreprocess(imageBuffer);
  }
}
```

### Quick Fix #3: Use Only Grayscale
**Minimal preprocessing** - Just convert to grayscale:
```typescript
export async function minimalPreprocess(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .grayscale()  // Only grayscale, nothing else
    .png({ quality: 100 })
    .toBuffer();
}
```

### Quick Fix #4: High-Res Downscaling Only
**Keep only the downscaling** (lines 162-173):
- High-res images (>2000px) benefit from 0.5x downscaling
- But skip CLAHE, normalization, sharpening

## Testing Order

1. **Test with `preprocess: false`** - Baseline against LIOS
2. **Test with `preprocessingLevel: 'quick'`** - Minimal operations
3. **Fix 'standard' level logic** - Use DEFAULT_PREPROCESSING_CONFIG
4. **Test with only grayscale** - Simplest safe preprocessing
5. **Test with downscaling + grayscale** - Optimal for high-res receipts

## Expected Results

**With `preprocess: false`**:
- Text: "Walmart", "Neighborhood Market", "832-772-9978" (clean)
- Confidence: 85-95%
- Processing Time: <3s

**With proper preprocessing**:
- Text: Same quality as no preprocessing
- Confidence: 90-95%
- Processing Time: 3-5s

## Conclusion

**The preprocessing pipeline is the culprit**. The `fullPreprocess()` function applies too many destructive operations that corrupt text instead of enhancing it. LIOS succeeds because it does minimal/no preprocessing.

**Immediate Action**: Test with `preprocess: false` to confirm hypothesis, then implement proper 'standard' level preprocessing with minimal operations.
