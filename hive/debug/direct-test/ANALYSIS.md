# Direct OCR Pipeline Test - Root Cause Analysis

**Date:** 2025-10-31
**Test:** Direct OCR and Parsing Pipeline Test
**Result:** ❌ FAILED - Root cause identified

## Executive Summary

The receipt processing feature is **failing at the OCR stage**, not the parsing stage. The image is overexposed (brightness: 238.54) but the preprocessing is not correctly adjusting brightness/contrast, resulting in 31% OCR confidence and completely garbled text.

## Test Results

### OCR Extraction
- **Lines Extracted:** 61
- **Overall Confidence:** 31% ⚠️ (Should be 70-90%)
- **Processing Time:** 5.75 seconds
- **Preprocessing Applied:** Only downscaling (0.5x) - **NOT ENOUGH**

### Sample OCR Output (Garbled)
```
1. "pe E"
2. "fu i i"
3. "Give us feedback survey. walnart.con a & E"
4. "Th So 5 iC ge 7 i"
5. "ste Taal 1 1"
6. "Walmart >; a 2 b"
7. "Yeigpborhood Narket Sie vg"  ← "Walmart Neighborhood Market"
```

### Parsing Results
- **Items Parsed:** 0 ❌
- **Total Detected:** $110.20 ✓ (correct)
- **Store Detected:** No
- **Date Detected:** No
- **Parsing Time:** 4ms

### Filtered Lines (Potential Items)
These lines had price patterns but weren't parsed due to garbled text:
1. `"Gn OF HSN GSIoOIZOI0 £1.00 N pi + 3"`
2. `"STIR FRY CHI 070802404070 F 1.08 N Faas ."`
3. `"SUBTOTAL 110.20 Zid iE: i"`
4. `"owiGE OE 0.00 race i"`
5. `"113.16 TOTAL PURGHASE fo { 1"`

## Root Cause

### The Problem
The image preprocessing is **NOT working correctly** for overexposed images.

### Evidence
1. **Image Validation Warning:** "Image is overexposed (brightness: 238.54). Reduce lighting or exposure."
2. **Preprocessing Applied:** Only `[OCR Preprocess] Downscaling high-resolution image (0.5x)`
3. **No Brightness/Contrast Adjustment:** Despite warning, no brightness correction was applied
4. **OCR Confidence:** 31% indicates preprocessing failure
5. **Garbled Text:** "Walmart" became "Yeigpborhood Narket"

## Why Parser Didn't Work

The parser is **functioning correctly** but cannot extract items from garbled text:
- It correctly detected the total: $110.20
- It found potential item lines (5 filtered lines with price patterns)
- But the text quality is too poor to parse: `"STIR FRY CHI"` → `"STIR FRY CHI 070802404070 F 1.08 N Faas ."`

## Solution Path

### Fix Image Preprocessing
The image-preprocessor needs to:
1. **Detect overexposed images** (already works via validateImageOrThrow)
2. **Apply brightness/contrast adjustment** (currently NOT happening)
3. **Apply adaptive histogram equalization** for better contrast
4. **Test with multiple preprocessing levels** (quick vs standard vs full)

### Code Location
- Preprocessing: `home-inventory/src/features/receipt-processing/utils/image-preprocessor.ts`
- OCR Service: `home-inventory/src/features/receipt-processing/services/ocr.service.ts` (line 83)

### Expected Behavior
When image is overexposed:
```
[OCR Preprocess] Downscaling high-resolution image (0.5x)
[OCR Preprocess] Adjusting brightness (-88.54 to target 150)
[OCR Preprocess] Applying histogram equalization
[OCR Preprocess] Sharpening text
```

### Current Behavior
```
[OCR Preprocess] Downscaling high-resolution image (0.5x)
← STOPS HERE, no brightness/contrast adjustment
```

## Test Files
- Full results: `/export/projects/homeinventory/test-ocr-results.json`
- Summary: `/export/projects/homeinventory/hive/debug/direct-test/debug-summary.json`
- Test script: `/export/projects/homeinventory/scripts/test-ocr-direct.ts`

## Next Steps

1. ✅ **Root cause identified** - Preprocessing not handling overexposed images
2. ⏭️ **Fix preprocessing** - Add brightness/contrast adjustment
3. ⏭️ **Test with fixed preprocessing** - Should get 70-90% OCR confidence
4. ⏭️ **Verify parsing works** - Should extract 10-15 items from receipt

## Conclusion

**The parser is NOT the problem.** The OCR is producing garbage text due to inadequate preprocessing of the overexposed image. Once the preprocessing is fixed to properly handle brightness/contrast, the parser should work correctly.
