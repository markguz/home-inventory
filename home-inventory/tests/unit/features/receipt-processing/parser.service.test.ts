/**
 * Unit tests for Receipt Parser Service
 */

import { describe, it, expect } from 'vitest';
import { createParserService } from '@/features/receipt-processing/services/parser.service';
import type { OcrLine } from '@/features/receipt-processing/types';

describe('ReceiptParserService', () => {
  const parserService = createParserService();

  describe('parseReceipt', () => {
    it('should parse a simple receipt with items', () => {
      const ocrLines: OcrLine[] = [
        { text: 'GROCERY STORE', confidence: 0.95 },
        { text: '123 Main St', confidence: 0.90 },
        { text: '01/15/2025', confidence: 0.88 },
        { text: 'Apples 2.99', confidence: 0.85 },
        { text: 'Bananas 1.49', confidence: 0.87 },
        { text: 'Milk 3.99', confidence: 0.90 },
        { text: 'Subtotal 8.47', confidence: 0.92 },
        { text: 'Tax 0.68', confidence: 0.90 },
        { text: 'Total 9.15', confidence: 0.93 },
      ];

      const result = parserService.parseReceipt(ocrLines);

      expect(result.items).toHaveLength(3);
      expect(result.items[0].name).toBe('Apples');
      expect(result.items[0].price).toBe(2.99);
      expect(result.items[1].name).toBe('Bananas');
      expect(result.items[1].price).toBe(1.49);
      expect(result.items[2].name).toBe('Milk');
      expect(result.items[2].price).toBe(3.99);
    });

    it('should extract total, subtotal, and tax', () => {
      const ocrLines: OcrLine[] = [
        { text: 'Item One 5.00', confidence: 0.85 },
        { text: 'Subtotal: $5.00', confidence: 0.90 },
        { text: 'Tax: $0.40', confidence: 0.88 },
        { text: 'Total: $5.40', confidence: 0.92 },
      ];

      const result = parserService.parseReceipt(ocrLines);

      expect(result.subtotal).toBe(5.00);
      expect(result.tax).toBe(0.40);
      expect(result.total).toBe(5.40);
    });

    it('should extract merchant name from first lines', () => {
      const ocrLines: OcrLine[] = [
        { text: 'WALMART SUPERCENTER', confidence: 0.95 },
        { text: 'Store #1234', confidence: 0.88 },
        { text: 'Item 1.99', confidence: 0.85 },
      ];

      const result = parserService.parseReceipt(ocrLines);

      expect(result.merchantName).toBe('WALMART SUPERCENTER');
    });

    it('should extract date in various formats', () => {
      const ocrLines: OcrLine[] = [
        { text: 'Date: 01/15/2025', confidence: 0.90 },
        { text: 'Item 1.99', confidence: 0.85 },
      ];

      const result = parserService.parseReceipt(ocrLines);

      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.getFullYear()).toBe(2025);
    });

    it('should handle items with quantities', () => {
      const ocrLines: OcrLine[] = [
        { text: '3 x Apples 5.97', confidence: 0.88 },
        { text: '2 x Oranges 3.98', confidence: 0.85 },
      ];

      const result = parserService.parseReceipt(ocrLines);

      expect(result.items[0].quantity).toBe(3);
      expect(result.items[0].name).toBe('Apples');
      expect(result.items[1].quantity).toBe(2);
      expect(result.items[1].name).toBe('Oranges');
    });

    it('should skip non-item lines', () => {
      const ocrLines: OcrLine[] = [
        { text: 'Thank you for shopping', confidence: 0.90 },
        { text: 'Total items: 5', confidence: 0.88 },
        { text: 'Apple 1.99', confidence: 0.85 },
        { text: 'Receipt #12345', confidence: 0.87 },
      ];

      const result = parserService.parseReceipt(ocrLines);

      // Should only extract the one valid item
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Apple');
    });

    it('should filter out low confidence items', () => {
      const ocrLines: OcrLine[] = [
        { text: 'Good Item 5.99', confidence: 0.85 },
        { text: 'Bad Item 2.99', confidence: 0.50 }, // Below threshold
      ];

      const result = parserService.parseReceipt(ocrLines);

      // Should only include high-confidence item
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Good Item');
    });

    it('should calculate confidence score', () => {
      const ocrLines: OcrLine[] = [
        { text: 'Item 1 5.99', confidence: 0.90 },
        { text: 'Item 2 3.99', confidence: 0.85 },
        { text: 'Total 9.98', confidence: 0.92 },
      ];

      const result = parserService.parseReceipt(ocrLines);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty input', () => {
      const result = parserService.parseReceipt([]);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBeNull();
      expect(result.merchantName).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle prices with dollar signs', () => {
      const ocrLines: OcrLine[] = [
        { text: 'Item One $12.99', confidence: 0.85 },
        { text: 'Item Two $ 5.49', confidence: 0.82 },
      ];

      const result = parserService.parseReceipt(ocrLines);

      expect(result.items[0].price).toBe(12.99);
      expect(result.items[1].price).toBe(5.49);
    });
  });
});
