/**
 * Validation utilities for receipt processing
 */

import { z } from 'zod';

/**
 * Maximum file size: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Supported image MIME types
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Validate image file size
 * @param size - File size in bytes
 * @returns True if valid
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Validate image MIME type
 * @param mimeType - File MIME type
 * @returns True if valid
 */
export function validateImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as typeof SUPPORTED_IMAGE_TYPES[number]);
}

/**
 * Zod schema for receipt upload validation
 */
export const receiptUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => validateFileSize(file.size),
    {
      message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  ).refine(
    (file) => validateImageType(file.type),
    {
      message: 'File must be a JPEG, PNG, or WebP image',
    }
  ),
});

/**
 * Zod schema for extracted item validation
 */
export const extractedItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200),
  price: z.number().nullable(),
  quantity: z.number().int().min(1),
  confidence: z.number().min(0).max(1),
});

/**
 * Zod schema for receipt processing request
 */
export const receiptProcessRequestSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  mimeType: z.enum(SUPPORTED_IMAGE_TYPES),
});

export type ReceiptUploadData = z.infer<typeof receiptUploadSchema>;
export type ExtractedItemData = z.infer<typeof extractedItemSchema>;
export type ReceiptProcessRequest = z.infer<typeof receiptProcessRequestSchema>;
