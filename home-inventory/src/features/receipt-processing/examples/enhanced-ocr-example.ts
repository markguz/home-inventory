/**
 * Enhanced OCR Processing Example
 *
 * This example demonstrates how to use the improved OCR system
 * with validation, preprocessing, parsing, and confidence scoring.
 */

import { getOcrService } from '../services/ocr.service';
import { createParserService } from '../services/parser.service';
import { analyzeConfidence, meetsQualityThreshold } from '../utils/confidence-scorer';
import { validateImage } from '../utils/image-validator';
import type { EnhancedParsedReceipt } from '../types';

/**
 * Process receipt with full quality pipeline
 */
export async function processReceiptWithQuality(
  imageBuffer: Buffer
): Promise<EnhancedParsedReceipt> {
  console.log('Starting enhanced receipt processing...');

  // Step 1: Validate image quality (optional pre-check)
  console.log('Step 1: Validating image...');
  const validation = await validateImage(imageBuffer);

  if (!validation.isValid) {
    console.error('Image validation failed:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    throw new Error(`Image validation failed: ${validation.errors.join('; ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('Image quality warnings:');
    validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
  }

  console.log('✓ Image validation passed');
  console.log(`  Resolution: ${validation.metadata?.width}x${validation.metadata?.height}`);
  console.log(`  Sharpness: ${validation.quality.sharpness?.toFixed(2)}`);
  console.log(`  Contrast: ${validation.quality.contrast?.toFixed(2)}`);

  // Step 2: OCR with preprocessing
  console.log('\nStep 2: Performing OCR with preprocessing...');
  const ocrService = getOcrService();
  const ocrResult = await ocrService.processImage(imageBuffer, {
    preprocess: true,
    validate: true,
    preprocessingLevel: 'standard',
  });

  console.log('✓ OCR completed');
  console.log(`  Lines extracted: ${ocrResult.lines.length}`);
  console.log(`  Processing applied: ${ocrResult.processingApplied.join(', ')}`);
  console.log(`  Image size: ${ocrResult.metadata.originalSize.width}x${ocrResult.metadata.originalSize.height} → ${ocrResult.metadata.processedSize.width}x${ocrResult.metadata.processedSize.height}`);

  // Step 3: Parse receipt
  console.log('\nStep 3: Parsing receipt data...');
  const parser = createParserService();
  const receipt = parser.parseReceipt(ocrResult.lines);

  console.log('✓ Parsing completed');
  console.log(`  Items extracted: ${receipt.items.length}`);
  console.log(`  Total: ${receipt.total ? `$${receipt.total.toFixed(2)}` : 'not found'}`);
  console.log(`  Date: ${receipt.date ? receipt.date.toLocaleDateString() : 'not found'}`);
  console.log(`  Merchant: ${receipt.merchantName || 'not found'}`);

  // Step 4: Analyze confidence
  console.log('\nStep 4: Analyzing confidence...');
  const confidence = analyzeConfidence(receipt, ocrResult.lines);

  console.log('✓ Confidence analysis completed');
  console.log(`  Overall: ${(confidence.overall * 100).toFixed(1)}% (${confidence.status})`);
  console.log('  Field confidence:');
  confidence.fields.forEach(field => {
    const status = field.hasValue ? field.status : 'missing';
    console.log(`    ${field.field}: ${(field.confidence * 100).toFixed(1)}% (${status})`);
  });

  // Step 5: Check quality threshold
  console.log('\nStep 5: Checking quality threshold...');
  const meetsThreshold = meetsQualityThreshold(confidence, 0.7);

  if (!meetsThreshold) {
    console.warn('⚠️  Quality below recommended threshold (70%)');
    console.warn('Recommendations:');
    confidence.recommendations.forEach(rec => console.warn(`  - ${rec}`));
  } else {
    console.log('✓ Quality meets threshold');
  }

  // Create enhanced receipt
  const enhancedReceipt: EnhancedParsedReceipt = {
    ...receipt,
    qualityMetrics: {
      sharpness: validation.quality.sharpness || 0,
      contrast: validation.quality.contrast || 0,
      brightness: validation.quality.brightness || 0,
      resolution: {
        width: validation.metadata?.width || 0,
        height: validation.metadata?.height || 0,
      },
    },
    processingApplied: ocrResult.processingApplied,
    confidenceAnalysis: {
      overall: confidence.overall,
      status: confidence.status,
      recommendations: confidence.recommendations,
    },
  };

  return enhancedReceipt;
}

/**
 * Process receipt with quick mode (faster, less preprocessing)
 */
export async function processReceiptQuick(
  imageBuffer: Buffer
): Promise<EnhancedParsedReceipt> {
  const ocrService = getOcrService();

  // Quick OCR (minimal preprocessing)
  const ocrResult = await ocrService.processImage(imageBuffer, {
    preprocess: true,
    validate: false,
    preprocessingLevel: 'quick',
  });

  // Parse and analyze
  const parser = createParserService();
  const receipt = parser.parseReceipt(ocrResult.lines);
  const confidence = analyzeConfidence(receipt, ocrResult.lines);

  return {
    ...receipt,
    processingApplied: ocrResult.processingApplied,
    confidenceAnalysis: {
      overall: confidence.overall,
      status: confidence.status,
      recommendations: confidence.recommendations,
    },
  };
}

/**
 * Process receipt with maximum quality (slower, best results)
 */
export async function processReceiptMaxQuality(
  imageBuffer: Buffer
): Promise<EnhancedParsedReceipt> {
  const ocrService = getOcrService();

  // Full preprocessing pipeline
  const ocrResult = await ocrService.processImage(imageBuffer, {
    preprocess: true,
    validate: true,
    preprocessingLevel: 'full',
  });

  const parser = createParserService();
  const receipt = parser.parseReceipt(ocrResult.lines);
  const confidence = analyzeConfidence(receipt, ocrResult.lines);

  return {
    ...receipt,
    processingApplied: ocrResult.processingApplied,
    confidenceAnalysis: {
      overall: confidence.overall,
      status: confidence.status,
      recommendations: confidence.recommendations,
    },
  };
}

/**
 * Example usage with error handling
 */
export async function exampleUsage(imageBuffer: Buffer) {
  try {
    const receipt = await processReceiptWithQuality(imageBuffer);

    if (receipt.confidenceAnalysis && receipt.confidenceAnalysis.overall < 0.5) {
      console.warn('Low confidence receipt. Consider retaking photo.');
      console.warn('Suggestions:');
      receipt.confidenceAnalysis.recommendations.forEach(rec => {
        console.warn(`  - ${rec}`);
      });
    }

    return receipt;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Receipt processing failed:', error.message);
      // Error message includes detailed suggestions for improvement
    }
    throw error;
  }
}

/**
 * Batch processing example
 */
export async function processBatchReceipts(
  imageBuffers: Buffer[]
): Promise<EnhancedParsedReceipt[]> {
  console.log(`Processing ${imageBuffers.length} receipts...`);

  const results = await Promise.allSettled(
    imageBuffers.map(buffer => processReceiptQuick(buffer))
  );

  const successful: EnhancedParsedReceipt[] = [];
  const failed: Array<{ index: number; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push({ index, error: result.reason.message });
    }
  });

  console.log(`✓ Successful: ${successful.length}`);
  console.log(`✗ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.warn('Failed receipts:');
    failed.forEach(f => console.warn(`  Receipt ${f.index}: ${f.error}`));
  }

  return successful;
}
