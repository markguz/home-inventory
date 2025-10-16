/**
 * Image Validation Utility - Validates image quality for OCR processing
 * Checks dimensions, file size, sharpness, and contrast
 */

import sharp from 'sharp';

/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
  } | null;
  quality: {
    sharpness?: number;
    contrast?: number;
    brightness?: number;
  };
}

/**
 * Image validation configuration
 */
export interface ImageValidationConfig {
  minWidth: number;
  minHeight: number;
  minFileSize: number;
  maxFileSize: number;
  minSharpness: number;
  minContrast: number;
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ImageValidationConfig = {
  minWidth: 600,
  minHeight: 400,
  minFileSize: 50 * 1024, // 50KB
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minSharpness: 10, // Variance threshold for Laplacian
  minContrast: 30, // Standard deviation threshold
};

/**
 * Calculate image sharpness using Laplacian variance
 * @param imageBuffer - Image buffer
 * @returns Sharpness score (higher is sharper)
 */
async function calculateSharpness(imageBuffer: Buffer): Promise<number> {
  try {
    // Convert to grayscale and get raw pixel data
    const { data, info } = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;

    // Apply Laplacian filter (simplified - measures edge variance)
    let variance = 0;

    // Sample center region (avoid edges)
    const sampleSize = Math.min(100, Math.floor(width / 4), Math.floor(height / 4));
    const startX = Math.floor((width - sampleSize) / 2);
    const startY = Math.floor((height - sampleSize) / 2);

    let sum = 0;
    let sumSquare = 0;
    let count = 0;

    for (let y = startY; y < startY + sampleSize && y < height - 1; y++) {
      for (let x = startX; x < startX + sampleSize && x < width - 1; x++) {
        const idx = y * width + x;
        const current = data[idx];
        const right = data[idx + 1];
        const down = data[idx + width];

        // Approximate Laplacian
        const laplacian = Math.abs(2 * current - right - down);
        sum += laplacian;
        sumSquare += laplacian * laplacian;
        count++;
      }
    }

    // Calculate variance
    const mean = sum / count;
    variance = sumSquare / count - mean * mean;

    return variance;
  } catch (error) {
    console.error('Sharpness calculation failed:', error);
    return 0;
  }
}

/**
 * Calculate image contrast using standard deviation
 * @param imageBuffer - Image buffer
 * @returns Contrast score (higher is more contrast)
 */
async function calculateContrast(imageBuffer: Buffer): Promise<number> {
  try {
    const { data, info } = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calculate standard deviation
    let sum = 0;
    let sumSquare = 0;
    const count = data.length;

    for (let i = 0; i < count; i++) {
      sum += data[i];
      sumSquare += data[i] * data[i];
    }

    const mean = sum / count;
    const variance = sumSquare / count - mean * mean;
    const stdDev = Math.sqrt(variance);

    return stdDev;
  } catch (error) {
    console.error('Contrast calculation failed:', error);
    return 0;
  }
}

/**
 * Calculate image brightness (mean pixel value)
 * @param imageBuffer - Image buffer
 * @returns Brightness score (0-255)
 */
async function calculateBrightness(imageBuffer: Buffer): Promise<number> {
  try {
    const { data } = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  } catch (error) {
    console.error('Brightness calculation failed:', error);
    return 0;
  }
}

/**
 * Validate image for OCR processing
 * @param imageBuffer - Image buffer to validate
 * @param config - Validation configuration
 * @returns Validation result with errors and warnings
 */
export async function validateImage(
  imageBuffer: Buffer,
  config: Partial<ImageValidationConfig> = {}
): Promise<ImageValidationResult> {
  const cfg = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];
  let metadata = null;
  const quality: ImageValidationResult['quality'] = {};

  try {
    // Get image metadata
    const sharpInstance = sharp(imageBuffer);
    const meta = await sharpInstance.metadata();

    metadata = {
      width: meta.width || 0,
      height: meta.height || 0,
      format: meta.format || 'unknown',
      size: imageBuffer.length,
      hasAlpha: meta.hasAlpha || false,
    };

    // Validate dimensions
    if (!meta.width || !meta.height) {
      errors.push('Could not determine image dimensions');
    } else {
      if (meta.width < cfg.minWidth || meta.height < cfg.minHeight) {
        errors.push(
          `Image resolution too low: ${meta.width}x${meta.height}. Minimum: ${cfg.minWidth}x${cfg.minHeight}`
        );
      } else if (meta.width < cfg.minWidth * 1.5 || meta.height < cfg.minHeight * 1.5) {
        warnings.push(
          `Image resolution is marginal: ${meta.width}x${meta.height}. Recommended: ${Math.floor(cfg.minWidth * 1.5)}x${Math.floor(cfg.minHeight * 1.5)} or higher`
        );
      }
    }

    // Validate file size
    if (imageBuffer.length < cfg.minFileSize) {
      errors.push(
        `File size too small: ${(imageBuffer.length / 1024).toFixed(2)}KB. Minimum: ${(cfg.minFileSize / 1024).toFixed(2)}KB`
      );
    } else if (imageBuffer.length > cfg.maxFileSize) {
      errors.push(
        `File size too large: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB. Maximum: ${(cfg.maxFileSize / 1024 / 1024).toFixed(2)}MB`
      );
    }

    // Calculate quality metrics (skip if basic validation failed)
    if (errors.length === 0 && meta.width && meta.height) {
      // Sharpness check
      quality.sharpness = await calculateSharpness(imageBuffer);
      if (quality.sharpness < cfg.minSharpness) {
        errors.push(
          `Image is too blurry (sharpness: ${quality.sharpness.toFixed(2)}). Please use a clearer image with better focus.`
        );
      } else if (quality.sharpness < cfg.minSharpness * 1.5) {
        warnings.push(
          `Image sharpness is marginal (${quality.sharpness.toFixed(2)}). Consider using a clearer image.`
        );
      }

      // Contrast check
      quality.contrast = await calculateContrast(imageBuffer);
      if (quality.contrast < cfg.minContrast) {
        warnings.push(
          `Image has low contrast (${quality.contrast.toFixed(2)}). Better lighting may improve results.`
        );
      }

      // Brightness check
      quality.brightness = await calculateBrightness(imageBuffer);
      if (quality.brightness < 50) {
        warnings.push(
          `Image is too dark (brightness: ${quality.brightness.toFixed(2)}). Better lighting may improve results.`
        );
      } else if (quality.brightness > 200) {
        warnings.push(
          `Image is overexposed (brightness: ${quality.brightness.toFixed(2)}). Reduce lighting or exposure.`
        );
      }
    }
  } catch (error) {
    errors.push(
      `Failed to validate image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata,
    quality,
  };
}

/**
 * Validate image and throw detailed error if invalid
 * @param imageBuffer - Image buffer to validate
 * @param config - Validation configuration
 * @throws Error with detailed validation messages
 */
export async function validateImageOrThrow(
  imageBuffer: Buffer,
  config?: Partial<ImageValidationConfig>
): Promise<void> {
  const result = await validateImage(imageBuffer, config);

  if (!result.isValid) {
    const errorMessage = [
      'Image validation failed:',
      ...result.errors,
      result.warnings.length > 0 ? '\nWarnings:' : '',
      ...result.warnings,
      '\nSuggestions for better results:',
      '- Use a resolution of at least 900x600 pixels',
      '- Ensure good lighting without glare',
      '- Hold the camera steady and focus on the receipt',
      '- Flatten the receipt to avoid distortion',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log warnings even if valid
  if (result.warnings.length > 0) {
    console.warn('Image validation warnings:', result.warnings.join('; '));
  }
}
