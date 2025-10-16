/**
 * Test Fixtures for Receipt Processing Tests
 *
 * Mock data for testing receipt processing workflows
 * without requiring actual OCR processing.
 */

import type { ExtractedItem, ParsedReceipt, OcrLine } from '@/features/receipt-processing/types';

/**
 * Mock OCR lines from a receipt
 */
export const mockOcrLines: OcrLine[] = [
  { text: 'WHOLE FOODS MARKET', confidence: 0.95 },
  { text: 'Store #12345', confidence: 0.92 },
  { text: '123 Main Street', confidence: 0.88 },
  { text: 'City, ST 12345', confidence: 0.85 },
  { text: '', confidence: 0.0 },
  { text: 'Date: 10/15/2025', confidence: 0.90 },
  { text: 'Time: 14:23', confidence: 0.87 },
  { text: '', confidence: 0.0 },
  { text: 'ORGANIC BANANAS', confidence: 0.92 },
  { text: '1.5 lb @ $0.69/lb      $1.04', confidence: 0.88 },
  { text: '', confidence: 0.0 },
  { text: 'ALMOND MILK', confidence: 0.94 },
  { text: '1 @ $3.99              $3.99', confidence: 0.91 },
  { text: '', confidence: 0.0 },
  { text: 'ORGANIC SPINACH', confidence: 0.89 },
  { text: '1 @ $2.49              $2.49', confidence: 0.86 },
  { text: '', confidence: 0.0 },
  { text: 'AVOCADOS', confidence: 0.93 },
  { text: '3 @ $1.29              $3.87', confidence: 0.90 },
  { text: '', confidence: 0.0 },
  { text: 'GREEK YOGURT', confidence: 0.91 },
  { text: '2 @ $4.99              $9.98', confidence: 0.88 },
  { text: '', confidence: 0.0 },
  { text: 'Subtotal:             $21.37', confidence: 0.85 },
  { text: 'Tax:                   $1.71', confidence: 0.83 },
  { text: 'Total:                $23.08', confidence: 0.87 },
  { text: '', confidence: 0.0 },
  { text: 'Thank you for shopping!', confidence: 0.90 },
];

/**
 * Mock extracted items
 */
export const mockExtractedItems: ExtractedItem[] = [
  {
    id: '1',
    name: 'ORGANIC BANANAS',
    price: 1.04,
    quantity: 1,
    confidence: 0.88,
    lineNumber: 9,
    rawText: '1.5 lb @ $0.69/lb      $1.04',
  },
  {
    id: '2',
    name: 'ALMOND MILK',
    price: 3.99,
    quantity: 1,
    confidence: 0.91,
    lineNumber: 12,
    rawText: '1 @ $3.99              $3.99',
  },
  {
    id: '3',
    name: 'ORGANIC SPINACH',
    price: 2.49,
    quantity: 1,
    confidence: 0.86,
    lineNumber: 15,
    rawText: '1 @ $2.49              $2.49',
  },
  {
    id: '4',
    name: 'AVOCADOS',
    price: 3.87,
    quantity: 3,
    confidence: 0.90,
    lineNumber: 18,
    rawText: '3 @ $1.29              $3.87',
  },
  {
    id: '5',
    name: 'GREEK YOGURT',
    price: 9.98,
    quantity: 2,
    confidence: 0.88,
    lineNumber: 21,
    rawText: '2 @ $4.99              $9.98',
  },
];

/**
 * Mock parsed receipt
 */
export const mockParsedReceipt: ParsedReceipt = {
  items: mockExtractedItems,
  total: 23.08,
  subtotal: 21.37,
  tax: 1.71,
  date: new Date('2025-10-15'),
  merchantName: 'WHOLE FOODS MARKET',
  confidence: 0.88,
  rawText: mockOcrLines.map((line) => line.text).join('\n'),
};

/**
 * Mock receipt with low confidence items
 */
export const mockLowConfidenceReceipt: ParsedReceipt = {
  items: [
    {
      id: '1',
      name: 'UNCLEAR ITEM 1',
      price: null,
      quantity: 1,
      confidence: 0.45,
      lineNumber: 5,
      rawText: 'UNCLEAR ITEM 1',
    },
    {
      id: '2',
      name: 'PARTIAL TEXT',
      price: 5.99,
      quantity: 1,
      confidence: 0.52,
      lineNumber: 8,
      rawText: 'PARTIAL TEXT      $5.99',
    },
  ],
  total: null,
  subtotal: null,
  tax: null,
  date: null,
  merchantName: null,
  confidence: 0.48,
  rawText: 'Low quality receipt text',
};

/**
 * Mock receipt with many items
 */
export const mockLargeReceipt: ParsedReceipt = {
  items: Array.from({ length: 25 }, (_, i) => ({
    id: `${i + 1}`,
    name: `ITEM ${i + 1}`,
    price: Math.round((Math.random() * 20 + 1) * 100) / 100,
    quantity: Math.floor(Math.random() * 3) + 1,
    confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
    lineNumber: i * 3,
    rawText: `ITEM ${i + 1}`,
  })),
  total: 125.43,
  subtotal: 115.50,
  tax: 9.93,
  date: new Date('2025-10-15'),
  merchantName: 'TEST GROCERY STORE',
  confidence: 0.85,
  rawText: 'Large receipt with many items',
};

/**
 * Mock API response for successful processing
 */
export const mockSuccessResponse = {
  success: true,
  data: {
    ...mockParsedReceipt,
    ocrConfidence: 0.88,
    metadata: {
      linesProcessed: mockOcrLines.length,
      itemsExtracted: mockExtractedItems.length,
      processingTime: new Date().toISOString(),
    },
  },
};

/**
 * Mock API response for processing error
 */
export const mockErrorResponse = {
  success: false,
  error: 'Failed to process receipt',
};

/**
 * Mock API response for invalid file
 */
export const mockInvalidFileResponse = {
  success: false,
  error: 'Unsupported file type. Please upload JPEG, PNG, or WebP',
};

/**
 * Mock API response for file too large
 */
export const mockFileTooLargeResponse = {
  success: false,
  error: 'File size exceeds 10MB limit',
};

/**
 * Helper to create custom mock receipt
 */
export function createMockReceipt(
  itemCount: number,
  options?: {
    merchantName?: string;
    total?: number;
    confidence?: number;
    includeMetadata?: boolean;
  }
): ParsedReceipt {
  const items: ExtractedItem[] = Array.from({ length: itemCount }, (_, i) => ({
    id: `${i + 1}`,
    name: `Test Item ${i + 1}`,
    price: Math.round((Math.random() * 15 + 2) * 100) / 100,
    quantity: Math.floor(Math.random() * 3) + 1,
    confidence: options?.confidence || Math.round((Math.random() * 0.2 + 0.8) * 100) / 100,
    lineNumber: i * 2,
    rawText: `Test Item ${i + 1}`,
  }));

  const total = options?.total || items.reduce((sum, item) => sum + (item.price || 0), 0);

  return {
    items,
    total,
    subtotal: total * 0.93,
    tax: total * 0.07,
    date: options?.includeMetadata ? new Date('2025-10-15') : null,
    merchantName: options?.includeMetadata ? (options.merchantName || 'TEST STORE') : null,
    confidence: options?.confidence || 0.85,
    rawText: items.map((item) => item.rawText).join('\n'),
  };
}

/**
 * Helper to create mock items for testing
 */
export function createMockItems(count: number): ExtractedItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    name: `Mock Item ${i + 1}`,
    price: Math.round((Math.random() * 20 + 1) * 100) / 100,
    quantity: Math.floor(Math.random() * 5) + 1,
    confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
    lineNumber: i * 3,
    rawText: `Mock Item ${i + 1}`,
  }));
}
