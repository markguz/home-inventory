/**
 * Tests for Image Preprocessor utility
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  preprocessImage,
  quickPreprocess,
  fullPreprocess,
} from '@/features/receipt-processing/utils/image-preprocessor';
import sharp from 'sharp';

describe('Image Preprocessor', () => {
  let testImage: Buffer;

  beforeAll(async () => {
    // Create a test image with some detail
    testImage = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 200, g: 200, b: 200 },
      },
    })
      .png()
      .toBuffer();
  });

  describe('preprocessImage', () => {
    it('should preprocess image with default config', async () => {
      const result = await preprocessImage(testImage);

      expect(result.buffer).toBeTruthy();
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.applied).toContain('grayscale');
      expect(result.applied).toContain('resize');
      expect(result.metadata).toBeDefined();
    });

    it('should apply CLAHE when enabled', async () => {
      const result = await preprocessImage(testImage, {
        enableCLAHE: true,
      });

      expect(result.applied).toContain('CLAHE');
    });

    it('should apply noise reduction when enabled', async () => {
      const result = await preprocessImage(testImage, {
        enableNoiseReduction: true,
      });

      expect(result.applied).toContain('noise-reduction');
    });

    it('should apply sharpening when enabled', async () => {
      const result = await preprocessImage(testImage, {
        sharpen: true,
      });

      expect(result.applied).toContain('sharpen');
    });

    it('should convert to grayscale', async () => {
      const result = await preprocessImage(testImage);

      // Check that output is grayscale
      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.channels).toBe(1); // Grayscale has 1 channel
    });

    it('should resize large images', async () => {
      // Create a large image
      const largeImage = await sharp({
        create: {
          width: 3000,
          height: 2000,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const result = await preprocessImage(largeImage);

      // Should be resized
      expect(result.metadata.processedSize.height).toBeLessThanOrEqual(1200);
    });

    it('should not enlarge small images', async () => {
      const smallImage = await sharp({
        create: {
          width: 400,
          height: 300,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const result = await preprocessImage(smallImage);

      // Dimensions should not be enlarged
      expect(result.metadata.processedSize.width).toBeLessThanOrEqual(400);
      expect(result.metadata.processedSize.height).toBeLessThanOrEqual(300);
    });

    it('should handle custom target size', async () => {
      const result = await preprocessImage(testImage, {
        targetSize: { width: 1000, height: 1000 },
      });

      expect(result.metadata.processedSize.width).toBeLessThanOrEqual(1000);
      expect(result.metadata.processedSize.height).toBeLessThanOrEqual(1000);
    });

    it('should output PNG format', async () => {
      const result = await preprocessImage(testImage);

      expect(result.metadata.format).toBe('png');
    });
  });

  describe('quickPreprocess', () => {
    it('should perform minimal preprocessing', async () => {
      const result = await quickPreprocess(testImage);

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);

      // Should be faster/simpler than full preprocessing
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('png');
    });
  });

  describe('fullPreprocess', () => {
    it('should perform complete preprocessing', async () => {
      const result = await fullPreprocess(testImage);

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('png');
      expect(metadata.channels).toBe(1); // Grayscale
    });
  });

  describe('Error handling', () => {
    it('should handle invalid image data', async () => {
      const invalidBuffer = Buffer.from('not an image');

      await expect(preprocessImage(invalidBuffer)).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const invalidBuffer = Buffer.from('invalid');

      try {
        await preprocessImage(invalidBuffer);
        expect.fail('Should have thrown');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('Failed to preprocess image');
        }
      }
    });
  });

  describe('Preprocessing stages', () => {
    it('should track applied operations', async () => {
      const result = await preprocessImage(testImage, {
        enableCLAHE: true,
        enableNoiseReduction: true,
        enableNormalization: true,
        sharpen: true,
      });

      // Check that all operations are tracked
      expect(result.applied.length).toBeGreaterThan(3);
      expect(result.applied).toContain('grayscale');
      expect(result.applied).toContain('CLAHE');
      expect(result.applied).toContain('noise-reduction');
      expect(result.applied).toContain('sharpen');
    });

    it('should preserve metadata through pipeline', async () => {
      const result = await preprocessImage(testImage);

      expect(result.metadata.originalSize.width).toBe(800);
      expect(result.metadata.originalSize.height).toBe(600);
      expect(result.metadata.processedSize.width).toBeGreaterThan(0);
      expect(result.metadata.processedSize.height).toBeGreaterThan(0);
    });
  });
});
