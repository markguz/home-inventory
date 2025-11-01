/**
 * Image Preprocessing Utility - Enhances image quality before OCR
 * Implements CLAHE, noise reduction, deskewing, and normalization
 */

import sharp from 'sharp';

/**
 * Preprocessing configuration
 */
export interface PreprocessingConfig {
  enableCLAHE: boolean;
  enableNoiseReduction: boolean;
  enableDeskewing: boolean;
  enableNormalization: boolean;
  targetSize?: { width: number; height: number };
  sharpen: boolean;
}

/**
 * Default preprocessing configuration
 */
export const DEFAULT_PREPROCESSING_CONFIG: PreprocessingConfig = {
  enableCLAHE: false, // Disabled - causes over-processing
  enableNoiseReduction: false, // Disabled - damages text clarity
  enableDeskewing: false, // Computationally expensive
  enableNormalization: true, // Re-enabled for brightness adjustment on overexposed images
  sharpen: false, // Disabled - causes artifacts
};

/**
 * Preprocessing result
 */
export interface PreprocessingResult {
  buffer: Buffer;
  applied: string[];
  metadata: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
    format: string;
  };
}

/**
 * Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
 * Note: Sharp doesn't have native CLAHE, so we use a simplified approach
 * with normalization and gamma correction
 * @param sharpInstance - Sharp instance
 * @returns Modified Sharp instance
 */
function applyCLAHE(sharpInstance: sharp.Sharp): sharp.Sharp {
  return sharpInstance
    .normalize() // Stretch contrast using histogram
    .gamma(1.2); // Slight gamma correction for better text visibility
}

/**
 * Apply noise reduction using median filter (via blur)
 * @param sharpInstance - Sharp instance
 * @returns Modified Sharp instance
 */
function applyNoiseReduction(sharpInstance: sharp.Sharp): sharp.Sharp {
  // Use slight blur to reduce noise while preserving edges
  return sharpInstance.median(1); // 1-pixel median filter
}

/**
 * Apply sharpening to enhance text edges
 * @param sharpInstance - Sharp instance
 * @returns Modified Sharp instance
 */
function applySharpen(sharpInstance: sharp.Sharp): sharp.Sharp {
  return sharpInstance.sharpen({
    sigma: 1, // Gaussian mask sigma
    m1: 1.0, // Flat area threshold
    m2: 2.0, // Jagged area threshold
    x1: 2.0, // Flat area sharpening
    y2: 10.0, // Jagged area sharpening
    y3: 20.0, // Highly jagged area sharpening
  });
}

/**
 * Normalize brightness and contrast
 * @param sharpInstance - Sharp instance
 * @returns Modified Sharp instance
 */
function applyNormalization(sharpInstance: sharp.Sharp): sharp.Sharp {
  return sharpInstance
    .normalize() // Stretch luminosity to cover full dynamic range
    .linear(1.2, -10); // Slight contrast boost with brightness adjustment
}

/**
 * Detect and correct skew/rotation
 * Note: This is a placeholder - true deskewing requires additional libraries
 * For production, consider using opencv4nodejs or similar
 * @param imageBuffer - Image buffer
 * @returns Deskewed image buffer or original if detection fails
 */
async function deskewImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Simplified deskewing - just ensure proper orientation
    // For better results, integrate with opencv4nodejs or tesseract's built-in deskew
    const sharpInstance = sharp(imageBuffer);
    const metadata = await sharpInstance.metadata();

    // Auto-rotate based on EXIF orientation
    if (metadata.orientation) {
      return await sharpInstance.rotate().toBuffer();
    }

    return imageBuffer;
  } catch (error) {
    console.error('Deskewing failed, using original image:', error);
    return imageBuffer;
  }
}

/**
 * Resize image to optimal size for OCR
 * @param sharpInstance - Sharp instance
 * @param targetSize - Target size (optional)
 * @returns Modified Sharp instance
 */
function resizeForOCR(
  sharpInstance: sharp.Sharp,
  targetSize?: { width: number; height: number }
): sharp.Sharp {
  if (!targetSize) {
    // Default: ensure minimum dimension while maintaining aspect ratio
    return sharpInstance.resize(null, 1200, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  return sharpInstance.resize(targetSize.width, targetSize.height, {
    fit: 'inside',
    withoutEnlargement: true,
  });
}

/**
 * Preprocess image for optimal OCR results
 * @param imageBuffer - Raw image buffer
 * @param config - Preprocessing configuration
 * @returns Preprocessed image buffer and metadata
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  config: Partial<PreprocessingConfig> = {}
): Promise<PreprocessingResult> {
  const cfg = { ...DEFAULT_PREPROCESSING_CONFIG, ...config };
  const applied: string[] = [];

  try {
    // Get original metadata
    const originalMetadata = await sharp(imageBuffer).metadata();
    let processedBuffer = imageBuffer;

    // Step 0: Optimize for high-resolution receipts
    // High resolution (2000+ width) receipt images benefit from 0.5x downscaling
    // This improves OCR confidence by optimizing text size for Tesseract
    if ((originalMetadata.width || 0) > 2000) {
      console.log('[OCR Preprocess] Downscaling high-resolution image (0.5x)');
      const targetWidth = Math.round((originalMetadata.width || 2550) * 0.5);
      const targetHeight = Math.round((originalMetadata.height || 4200) * 0.5);
      processedBuffer = await sharp(processedBuffer)
        .resize(targetWidth, targetHeight, { fit: 'fill' })
        .toBuffer();
      applied.push('downscale-hi-res');
    }

    // Step 1: Deskewing (if enabled)
    if (cfg.enableDeskewing) {
      processedBuffer = await deskewImage(processedBuffer);
      applied.push('deskewing');
    }

    // Step 2: Create Sharp pipeline
    let pipeline = sharp(processedBuffer);

    // Convert to grayscale for better OCR (text is usually monochrome)
    // Grayscale is lightweight and improves text clarity
    pipeline = pipeline.grayscale();
    applied.push('grayscale');

    // Step 3: Resize to optimal size
    pipeline = resizeForOCR(pipeline, cfg.targetSize);
    applied.push('resize');

    // Step 4: Noise reduction
    if (cfg.enableNoiseReduction) {
      pipeline = applyNoiseReduction(pipeline);
      applied.push('noise-reduction');
    }

    // Step 5: CLAHE (contrast enhancement)
    if (cfg.enableCLAHE) {
      pipeline = applyCLAHE(pipeline);
      applied.push('CLAHE');
    }

    // Step 6: Normalization
    if (cfg.enableNormalization) {
      pipeline = applyNormalization(pipeline);
      applied.push('normalization');
    }

    // Step 7: Sharpening
    if (cfg.sharpen) {
      pipeline = applySharpen(pipeline);
      applied.push('sharpen');
    }

    // Convert to PNG for lossless processing
    pipeline = pipeline.png({ quality: 100, compressionLevel: 6 });

    // Execute pipeline
    const result = await pipeline.toBuffer({ resolveWithObject: true });

    return {
      buffer: result.data,
      applied,
      metadata: {
        originalSize: {
          width: originalMetadata.width || 0,
          height: originalMetadata.height || 0,
        },
        processedSize: {
          width: result.info.width,
          height: result.info.height,
        },
        format: result.info.format,
      },
    };
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    throw new Error(
      `Failed to preprocess image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Quick preprocessing for fast processing (minimal operations)
 * @param imageBuffer - Raw image buffer
 * @returns Preprocessed image buffer
 */
export async function quickPreprocess(imageBuffer: Buffer): Promise<Buffer> {
  const result = await preprocessImage(imageBuffer, {
    enableCLAHE: false,
    enableNoiseReduction: false,
    enableDeskewing: false,
    enableNormalization: true,
    sharpen: false,
  });

  return result.buffer;
}

/**
 * Full preprocessing for maximum quality (all operations)
 * @param imageBuffer - Raw image buffer
 * @returns Preprocessed image buffer
 */
export async function fullPreprocess(imageBuffer: Buffer): Promise<Buffer> {
  const result = await preprocessImage(imageBuffer, {
    enableCLAHE: true,
    enableNoiseReduction: true,
    enableDeskewing: true,
    enableNormalization: true,
    sharpen: true,
  });

  return result.buffer;
}
