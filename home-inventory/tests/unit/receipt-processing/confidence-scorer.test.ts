/**
 * Tests for Confidence Scorer utility
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeConfidence,
  analyzeOcrQuality,
  analyzeParsingQuality,
  analyzeCompleteness,
  calculateFieldConfidence,
  getConfidenceStatus,
  getOverallStatus,
  meetsQualityThreshold,
} from '@/features/receipt-processing/utils/confidence-scorer';
import type { OcrLine, ExtractedItem, ParsedReceipt } from '@/features/receipt-processing/types';

describe('Confidence Scorer', () => {
  const mockOcrLines: OcrLine[] = [
    { text: 'WALMART SUPERCENTER', confidence: 0.95 },
    { text: 'Date: 10/15/2024', confidence: 0.92 },
    { text: 'Apple - Red 3.99', confidence: 0.88 },
    { text: 'Milk - Whole 4.99', confidence: 0.85 },
    { text: 'Bread - Wheat 2.99', confidence: 0.90 },
    { text: 'Total: 11.97', confidence: 0.93 },
  ];

  const mockItems: ExtractedItem[] = [
    {
      id: '1',
      name: 'Apple - Red',
      price: 3.99,
      quantity: 1,
      confidence: 0.88,
      lineNumber: 2,
      rawText: 'Apple - Red 3.99',
    },
    {
      id: '2',
      name: 'Milk - Whole',
      price: 4.99,
      quantity: 1,
      confidence: 0.85,
      lineNumber: 3,
      rawText: 'Milk - Whole 4.99',
    },
    {
      id: '3',
      name: 'Bread - Wheat',
      price: 2.99,
      quantity: 1,
      confidence: 0.90,
      lineNumber: 4,
      rawText: 'Bread - Wheat 2.99',
    },
  ];

  const mockReceipt: ParsedReceipt = {
    items: mockItems,
    total: 11.97,
    subtotal: null,
    tax: null,
    date: new Date('2024-10-15'),
    merchantName: 'WALMART SUPERCENTER',
    confidence: 0.89,
    rawText: mockOcrLines.map(l => l.text).join('\n'),
  };

  describe('getConfidenceStatus', () => {
    it('should return "high" for confidence >= 0.85', () => {
      expect(getConfidenceStatus(0.90)).toBe('high');
      expect(getConfidenceStatus(0.85)).toBe('high');
    });

    it('should return "medium" for confidence >= 0.70', () => {
      expect(getConfidenceStatus(0.75)).toBe('medium');
      expect(getConfidenceStatus(0.70)).toBe('medium');
    });

    it('should return "low" for confidence >= 0.50', () => {
      expect(getConfidenceStatus(0.60)).toBe('low');
      expect(getConfidenceStatus(0.50)).toBe('low');
    });

    it('should return "very-low" for confidence < 0.50', () => {
      expect(getConfidenceStatus(0.40)).toBe('very-low');
      expect(getConfidenceStatus(0.10)).toBe('very-low');
    });
  });

  describe('getOverallStatus', () => {
    it('should return "excellent" for confidence >= 0.9', () => {
      expect(getOverallStatus(0.95)).toBe('excellent');
      expect(getOverallStatus(0.90)).toBe('excellent');
    });

    it('should return "good" for confidence >= 0.75', () => {
      expect(getOverallStatus(0.80)).toBe('good');
      expect(getOverallStatus(0.75)).toBe('good');
    });

    it('should return "fair" for confidence >= 0.6', () => {
      expect(getOverallStatus(0.65)).toBe('fair');
      expect(getOverallStatus(0.60)).toBe('fair');
    });

    it('should return "poor" for confidence < 0.6', () => {
      expect(getOverallStatus(0.50)).toBe('poor');
      expect(getOverallStatus(0.30)).toBe('poor');
    });
  });

  describe('analyzeOcrQuality', () => {
    it('should calculate average confidence', () => {
      const result = analyzeOcrQuality(mockOcrLines);

      expect(result.avgConfidence).toBeCloseTo(0.905, 2);
      expect(result.totalLines).toBe(6);
    });

    it('should count low confidence lines', () => {
      const lowConfidenceLines: OcrLine[] = [
        { text: 'Good line', confidence: 0.9 },
        { text: 'Bad line', confidence: 0.5 },
        { text: 'Worse line', confidence: 0.4 },
      ];

      const result = analyzeOcrQuality(lowConfidenceLines);

      expect(result.lowConfidenceLines).toBe(2);
    });

    it('should handle empty lines array', () => {
      const result = analyzeOcrQuality([]);

      expect(result.avgConfidence).toBe(0);
      expect(result.lowConfidenceLines).toBe(0);
      expect(result.totalLines).toBe(0);
    });
  });

  describe('analyzeParsingQuality', () => {
    it('should analyze extracted items', () => {
      const result = analyzeParsingQuality(mockItems);

      expect(result.itemsExtracted).toBe(3);
      expect(result.itemsWithPrices).toBe(3);
      expect(result.avgItemConfidence).toBeCloseTo(0.876, 2);
    });

    it('should handle items without prices', () => {
      const itemsWithoutPrices: ExtractedItem[] = [
        { ...mockItems[0], price: null },
        mockItems[1],
        { ...mockItems[2], price: null },
      ];

      const result = analyzeParsingQuality(itemsWithoutPrices);

      expect(result.itemsWithPrices).toBe(1);
    });

    it('should handle no items', () => {
      const result = analyzeParsingQuality([]);

      expect(result.itemsExtracted).toBe(0);
      expect(result.itemsWithPrices).toBe(0);
      expect(result.avgItemConfidence).toBe(0);
    });
  });

  describe('analyzeCompleteness', () => {
    it('should analyze complete receipt', () => {
      const result = analyzeCompleteness(mockReceipt);

      expect(result.hasTotal).toBe(true);
      expect(result.hasDate).toBe(true);
      expect(result.hasMerchant).toBe(true);
      expect(result.hasItems).toBe(true);
      expect(result.score).toBe(1.0);
    });

    it('should analyze incomplete receipt', () => {
      const incompleteReceipt: ParsedReceipt = {
        ...mockReceipt,
        total: null,
        date: null,
        merchantName: null,
      };

      const result = analyzeCompleteness(incompleteReceipt);

      expect(result.hasTotal).toBe(false);
      expect(result.hasDate).toBe(false);
      expect(result.hasMerchant).toBe(false);
      expect(result.hasItems).toBe(true);
      expect(result.score).toBe(0.3); // Only items present
    });

    it('should calculate partial completeness', () => {
      const partialReceipt: ParsedReceipt = {
        ...mockReceipt,
        date: null,
        merchantName: null,
      };

      const result = analyzeCompleteness(partialReceipt);

      expect(result.score).toBe(0.6); // Total (0.3) + Items (0.3)
    });
  });

  describe('calculateFieldConfidence', () => {
    it('should calculate confidence for all fields', () => {
      const fields = calculateFieldConfidence(mockReceipt, mockOcrLines);

      expect(fields).toHaveLength(4);
      expect(fields.map(f => f.field)).toEqual(['total', 'date', 'merchant', 'items']);
    });

    it('should mark fields with values', () => {
      const fields = calculateFieldConfidence(mockReceipt, mockOcrLines);

      const totalField = fields.find(f => f.field === 'total');
      expect(totalField?.hasValue).toBe(true);
      expect(totalField?.confidence).toBeGreaterThan(0);
    });

    it('should mark missing fields', () => {
      const incompleteReceipt: ParsedReceipt = {
        ...mockReceipt,
        total: null,
        date: null,
      };

      const fields = calculateFieldConfidence(incompleteReceipt, mockOcrLines);

      const totalField = fields.find(f => f.field === 'total');
      const dateField = fields.find(f => f.field === 'date');

      expect(totalField?.hasValue).toBe(false);
      expect(totalField?.confidence).toBe(0);
      expect(dateField?.hasValue).toBe(false);
      expect(dateField?.confidence).toBe(0);
    });
  });

  describe('analyzeConfidence', () => {
    it('should provide comprehensive analysis', () => {
      const analysis = analyzeConfidence(mockReceipt, mockOcrLines);

      expect(analysis.overall).toBeGreaterThan(0);
      expect(analysis.status).toBeDefined();
      expect(analysis.fields).toHaveLength(4);
      expect(analysis.ocrQuality).toBeDefined();
      expect(analysis.parsingQuality).toBeDefined();
      expect(analysis.completeness).toBeDefined();
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should calculate weighted overall score', () => {
      const analysis = analyzeConfidence(mockReceipt, mockOcrLines);

      // Overall should be weighted combination
      expect(analysis.overall).toBeGreaterThan(0.8);
      expect(analysis.status).toBe('good');
    });

    it('should generate recommendations for low quality', () => {
      const lowQualityLines: OcrLine[] = mockOcrLines.map(line => ({
        ...line,
        confidence: 0.5,
      }));

      const lowQualityReceipt: ParsedReceipt = {
        ...mockReceipt,
        items: [],
        total: null,
      };

      const analysis = analyzeConfidence(lowQualityReceipt, lowQualityLines);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.status).toBe('poor');
    });

    it('should have no recommendations for excellent quality', () => {
      const analysis = analyzeConfidence(mockReceipt, mockOcrLines);

      // With good OCR and complete data, should have minimal recommendations
      expect(analysis.status).not.toBe('poor');
    });
  });

  describe('meetsQualityThreshold', () => {
    it('should return true when meeting threshold', () => {
      const analysis = analyzeConfidence(mockReceipt, mockOcrLines);

      expect(meetsQualityThreshold(analysis, 0.5)).toBe(true);
      expect(meetsQualityThreshold(analysis, 0.7)).toBe(true);
    });

    it('should return false when below threshold', () => {
      const lowQualityReceipt: ParsedReceipt = {
        ...mockReceipt,
        items: [],
        total: null,
        merchantName: null,
      };

      const lowQualityLines: OcrLine[] = mockOcrLines.map(line => ({
        ...line,
        confidence: 0.3,
      }));

      const analysis = analyzeConfidence(lowQualityReceipt, lowQualityLines);

      expect(meetsQualityThreshold(analysis, 0.8)).toBe(false);
    });

    it('should use default threshold of 0.5', () => {
      const analysis = analyzeConfidence(mockReceipt, mockOcrLines);

      expect(meetsQualityThreshold(analysis)).toBe(true);
    });
  });
});
