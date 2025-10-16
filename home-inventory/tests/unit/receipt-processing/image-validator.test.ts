/**
 * Tests for Image Validator utility
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { validateImage, validateImageOrThrow } from '@/features/receipt-processing/utils/image-validator';
import sharp from 'sharp';

describe('Image Validator', () => {
  let validImage: Buffer;
  let tooSmallImage: Buffer;
  let blurryImage: Buffer;

  beforeAll(async () => {
    // Create a valid test image (800x600, clear)
    validImage = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    // Create a too-small image (400x300)
    tooSmallImage = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    // Create a blurry image (heavily blurred)
    blurryImage = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .blur(50)
      .png()
      .toBuffer();
  });

  describe('validateImage', () => {
    it('should validate a good quality image', async () => {
      const result = await validateImage(validImage);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeTruthy();
      expect(result.metadata?.width).toBe(800);
      expect(result.metadata?.height).toBe(600);
    });

    it('should reject image with dimensions too small', async () => {
      const result = await validateImage(tooSmallImage);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('resolution too low');
    });

    it('should detect blurry images', async () => {
      const result = await validateImage(blurryImage);

      // Blurry image should have very low sharpness
      expect(result.quality.sharpness).toBeDefined();
      if (result.quality.sharpness !== undefined) {
        expect(result.quality.sharpness).toBeLessThan(50);
      }
    });

    it('should calculate quality metrics', async () => {
      const result = await validateImage(validImage);

      expect(result.quality).toBeDefined();
      expect(result.quality.sharpness).toBeGreaterThan(0);
      expect(result.quality.contrast).toBeGreaterThan(0);
      expect(result.quality.brightness).toBeGreaterThan(0);
    });

    it('should handle custom validation config', async () => {
      const result = await validateImage(validImage, {
        minWidth: 1000, // Higher than actual
        minHeight: 800,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('resolution too low'))).toBe(true);
    });

    it('should provide warnings for marginal quality', async () => {
      // Create image at minimum resolution
      const marginalImage = await sharp({
        create: {
          width: 700, // Above minimum but below 1.5x
          height: 500,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const result = await validateImage(marginalImage);

      // Should be valid but have warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateImageOrThrow', () => {
    it('should not throw for valid image', async () => {
      await expect(validateImageOrThrow(validImage)).resolves.toBeUndefined();
    });

    it('should throw for invalid image with detailed error', async () => {
      await expect(validateImageOrThrow(tooSmallImage)).rejects.toThrow(
        /Image validation failed/
      );
    });

    it('should include suggestions in error message', async () => {
      try {
        await validateImageOrThrow(tooSmallImage);
        expect.fail('Should have thrown');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('Suggestions for better results');
          expect(error.message).toContain('resolution');
        }
      }
    });
  });

  describe('File size validation', () => {
    it('should reject files that are too small', async () => {
      // Create a tiny image
      const tinyImage = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 1,
          background: { r: 0 },
        },
      })
        .png({ compressionLevel: 9 })
        .toBuffer();

      const result = await validateImage(tinyImage);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('File size too small'))).toBe(true);
    });

    it('should handle file size limits correctly', async () => {
      const result = await validateImage(validImage, {
        minFileSize: 100, // Very small
        maxFileSize: 100 * 1024 * 1024, // Very large
      });

      // Should pass file size checks
      expect(result.errors.some(e => e.includes('File size'))).toBe(false);
    });
  });
});
