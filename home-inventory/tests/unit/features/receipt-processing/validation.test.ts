/**
 * Unit tests for Receipt Processing Validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateFileSize,
  validateImageType,
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_TYPES,
} from '@/features/receipt-processing/utils/validation';

describe('Receipt Processing Validation', () => {
  describe('validateFileSize', () => {
    it('should accept valid file sizes', () => {
      expect(validateFileSize(1024)).toBe(true); // 1KB
      expect(validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
    });

    it('should reject files larger than MAX_FILE_SIZE', () => {
      expect(validateFileSize(MAX_FILE_SIZE + 1)).toBe(false);
      expect(validateFileSize(20 * 1024 * 1024)).toBe(false); // 20MB
    });

    it('should reject zero or negative sizes', () => {
      expect(validateFileSize(0)).toBe(false);
      expect(validateFileSize(-1)).toBe(false);
    });
  });

  describe('validateImageType', () => {
    it('should accept supported image types', () => {
      SUPPORTED_IMAGE_TYPES.forEach((type) => {
        expect(validateImageType(type)).toBe(true);
      });
    });

    it('should reject unsupported image types', () => {
      expect(validateImageType('image/gif')).toBe(false);
      expect(validateImageType('image/bmp')).toBe(false);
      expect(validateImageType('image/svg+xml')).toBe(false);
      expect(validateImageType('application/pdf')).toBe(false);
    });

    it('should reject non-image types', () => {
      expect(validateImageType('text/plain')).toBe(false);
      expect(validateImageType('application/json')).toBe(false);
      expect(validateImageType('video/mp4')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(validateImageType('IMAGE/JPEG')).toBe(false);
      expect(validateImageType('Image/Png')).toBe(false);
    });
  });
});
