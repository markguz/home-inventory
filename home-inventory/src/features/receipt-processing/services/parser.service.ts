/**
 * Receipt Parser Service - Extracts structured data from OCR text
 */

import { createId } from '@paralleldrive/cuid2';
import type { OcrLine, ExtractedItem, ParsedReceipt, ParserConfig } from '../types';

/**
 * Default parser configuration
 */
const DEFAULT_CONFIG: ParserConfig = {
  minItemConfidence: 0.5, // Native Tesseract produces highly accurate results (95%+)
  minPriceConfidence: 0.7,
  currencySymbol: '$',
  dateFormats: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
};

/**
 * Receipt Parser Service for extracting items, prices, and metadata
 */
export class ReceiptParserService {
  private config: ParserConfig;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse OCR lines into structured receipt data
   * @param lines - Array of OCR lines
   * @returns Parsed receipt with extracted items and metadata
   */
  parseReceipt(lines: OcrLine[]): ParsedReceipt {
    const rawText = lines.map((l) => l.text).join('\n');

    // Extract items with prices
    const items = this.extractItems(lines);

    // Extract totals
    const total = this.extractTotal(lines);
    const subtotal = this.extractSubtotal(lines);
    const tax = this.extractTax(lines);

    // Extract metadata
    const date = this.extractDate(lines);
    const merchantName = this.extractMerchantName(lines);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(lines, items);

    return {
      items,
      total,
      subtotal,
      tax,
      date,
      merchantName,
      confidence,
      rawText,
    };
  }

  /**
   * Extract items with prices from OCR lines
   * Enhanced with better price detection and multi-line support
   * @param lines - Array of OCR lines
   * @returns Array of extracted items
   */
  private extractItems(lines: OcrLine[]): ExtractedItem[] {
    const items: ExtractedItem[] = [];

    // Simple, robust price pattern for native Tesseract output
    // Matches any decimal price: 1.99, 123.45, 1,99, 1.9O (O as 0), etc.
    // Works with receipt formats: "ITEM BARCODE PRICE FLAG" or "ITEM PRICE"
    const pricePattern = /(\d+[.,][O0o]?\d{1,2})/;

    // Quantity patterns
    const quantityPattern = /^(\d+)\s*x\s*/i;
    const altQuantityPattern = /(\d+)\s*@|qty:\s*(\d+)|quantity:\s*(\d+)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const text = line.text.trim();

      // Skip common non-item lines
      if (this.isNonItemLine(text)) continue;

      // Look for any price in the line (robust approach)
      const priceMatch = text.match(pricePattern);
      if (!priceMatch) continue;

      // Extract and validate price
      const priceStr = priceMatch[1]
        .replace(/[Oo]/g, '0')
        .replace(',', '.');
      const price = parseFloat(priceStr);

      if (isNaN(price) || price <= 0 || price > 10000) {
        continue;
      }

      // Extract quantity if present
      let quantity = 1;
      const quantityMatch = text.match(quantityPattern);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
      } else {
        const altQuantityMatch = text.match(altQuantityPattern);
        if (altQuantityMatch) {
          quantity = parseInt(
            altQuantityMatch[1] || altQuantityMatch[2] || altQuantityMatch[3]
          );
        }
      }

      // Extract item name: everything before the price, cleaned up
      const priceIndex = text.indexOf(priceMatch[1]);
      let itemName = text.substring(0, priceIndex).trim();

      // Remove trailing codes (barcodes, flags, etc.)
      // Keep only the actual item description
      itemName = itemName
        // Remove 10+ digit barcodes at the end
        .replace(/\s+\d{10,}\s*[A-Z]?\s*$/, '')
        // Remove trailing single letters that are flags
        .replace(/\s+[A-Z]\s*$/, '')
        // Remove quantity prefix if present
        .replace(/^(\d+)\s*x\s*/i, '')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();

      // Skip if name is too short or confidence is too low
      if (itemName.length < 2 || line.confidence < this.config.minItemConfidence) {
        continue;
      }

      items.push({
        id: createId(),
        name: itemName,
        price,
        quantity,
        confidence: line.confidence,
        lineNumber: i,
        rawText: text,
      });
    }

    return items;
  }

  /**
   * Check if a line is likely not an item (e.g., headers, totals, etc.)
   * @param text - Line text
   * @returns True if line should be skipped
   */
  private isNonItemLine(text: string): boolean {
    const nonItemPatterns = [
      /^total/i,
      /^subtotal/i,
      /^tax/i,
      /^receipt/i,
      /^thank you/i,
      /^date/i,
      /^time/i,
      /^cashier/i,
      /^payment/i,
      /^change/i,
      /^card/i,
      /^\s*$/,
      // Date patterns (should not be combined with items)
      /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,
      /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
    ];

    return nonItemPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Extract total amount from receipt
   * Enhanced to handle OCR errors and multiple formats
   * @param lines - Array of OCR lines
   * @returns Total amount or null
   */
  private extractTotal(lines: OcrLine[]): number | null {
    // Enhanced patterns to handle OCR errors: O/0 confusion, spacing issues
    const totalPatterns = [
      /total\s*:?\s*\$?\s*(\d+[.,][O0o]\d|[\d]+[.,]\d{1,2})/i,
      /grand\s*total\s*:?\s*\$?\s*(\d+[.,][O0o]\d|[\d]+[.,]\d{1,2})/i,
      /amount\s*due\s*:?\s*\$?\s*(\d+[.,][O0o]\d|[\d]+[.,]\d{1,2})/i,
      /balance\s*:?\s*\$?\s*(\d+[.,][O0o]\d|[\d]+[.,]\d{1,2})/i,
    ];

    // Look from bottom up (total usually at end)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      for (const pattern of totalPatterns) {
        const match = line.text.match(pattern);
        if (match) {
          // Clean up OCR errors
          const totalStr = match[1]
            .replace(/[Oo]/g, '0')
            .replace(',', '.');
          const total = parseFloat(totalStr);

          // Validate total is reasonable
          if (!isNaN(total) && total > 0 && total < 100000) {
            return total;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract subtotal amount from receipt
   * @param lines - Array of OCR lines
   * @returns Subtotal amount or null
   */
  private extractSubtotal(lines: OcrLine[]): number | null {
    const subtotalPattern = /subtotal\s*:?\s*\$?\s*(\d+[.,]\d{2})/i;

    for (const line of lines) {
      const match = line.text.match(subtotalPattern);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }

    return null;
  }

  /**
   * Extract tax amount from receipt
   * @param lines - Array of OCR lines
   * @returns Tax amount or null
   */
  private extractTax(lines: OcrLine[]): number | null {
    const taxPattern = /tax\s*:?\s*\$?\s*(\d+[.,]\d{2})/i;

    for (const line of lines) {
      const match = line.text.match(taxPattern);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }

    return null;
  }

  /**
   * Extract date from receipt
   * Enhanced with more date formats and validation
   * @param lines - Array of OCR lines
   * @returns Date or null
   */
  private extractDate(lines: OcrLine[]): Date | null {
    // Comprehensive date patterns
    const datePatterns = [
      // MM/DD/YYYY, DD/MM/YYYY
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      // YYYY-MM-DD
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      // Month DD, YYYY (e.g., "Jan 15, 2024")
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
      // DD Month YYYY (e.g., "15 January 2024")
      /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i,
    ];

    // Look in first 10 lines (date usually at top)
    const searchLines = lines.slice(0, Math.min(10, lines.length));

    for (const line of searchLines) {
      for (const pattern of datePatterns) {
        const match = line.text.match(pattern);
        if (match) {
          const dateStr = match[0] || match[1];
          const date = new Date(dateStr);

          // Validate date is reasonable (not too far in past/future)
          const now = new Date();
          const fiveYearsAgo = new Date(now.getFullYear() - 5, 0, 1);
          const oneYearAhead = new Date(now.getFullYear() + 1, 11, 31);

          if (
            !isNaN(date.getTime()) &&
            date >= fiveYearsAgo &&
            date <= oneYearAhead
          ) {
            return date;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract merchant name from receipt (usually in first few lines)
   * Enhanced with better filtering and common merchant patterns
   * @param lines - Array of OCR lines
   * @returns Merchant name or null
   */
  private extractMerchantName(lines: OcrLine[]): string | null {
    // Look for merchant name in first 8 lines
    const firstLines = lines.slice(0, Math.min(8, lines.length));

    // Common merchant-related keywords
    const merchantKeywords = /store|shop|market|mart|inc|ltd|llc|corp/i;

    // Patterns to exclude (not merchant names)
    const excludePatterns = [
      /receipt|invoice|bill/i,
      /\d{3,}/, // Long numbers (phone, receipt numbers)
      /^\d+$/, // Only digits
      /thank you|thanks/i,
      /welcome|visit/i,
    ];

    let bestCandidate: { text: string; confidence: number; score: number } | null = null;

    for (let i = 0; i < firstLines.length; i++) {
      const line = firstLines[i];
      const text = line.text.trim();

      // Skip short lines
      if (text.length < 3) continue;

      // Skip if matches exclude patterns
      if (excludePatterns.some(pattern => pattern.test(text))) continue;

      // Skip if contains prices
      if (text.match(/\$?\d+[.,]\d{2}/)) continue;

      // Calculate score for this candidate
      let score = line.confidence;

      // Boost score for lines with merchant keywords
      if (merchantKeywords.test(text)) {
        score += 0.2;
      }

      // Boost score for lines at the very top
      if (i === 0) {
        score += 0.15;
      } else if (i === 1) {
        score += 0.1;
      }

      // Boost score for lines with proper capitalization (title case)
      if (text.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/)) {
        score += 0.1;
      }

      // Boost score for lines with all caps (common for merchant names)
      if (text === text.toUpperCase() && text.length > 3) {
        score += 0.1;
      }

      // Prefer medium-length names (5-30 chars)
      if (text.length >= 5 && text.length <= 30) {
        score += 0.05;
      }

      // Update best candidate if this is better
      if (
        line.confidence > 0.6 &&
        (!bestCandidate || score > bestCandidate.score)
      ) {
        bestCandidate = { text, confidence: line.confidence, score };
      }
    }

    return bestCandidate ? bestCandidate.text : null;
  }

  /**
   * Calculate overall confidence score for the parsed receipt
   * @param lines - Array of OCR lines
   * @param items - Extracted items
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(lines: OcrLine[], items: ExtractedItem[]): number {
    if (lines.length === 0) return 0;

    // Average OCR confidence
    const ocrConfidence = lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length;

    // Item extraction confidence (based on number of items found)
    const itemConfidence = items.length > 0 ? Math.min(items.length / 5, 1) : 0;

    // Average item confidence
    const avgItemConfidence = items.length > 0
      ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length
      : 0;

    // Weighted average
    return (ocrConfidence * 0.4) + (itemConfidence * 0.3) + (avgItemConfidence * 0.3);
  }
}

/**
 * Create a parser service instance
 * @param config - Optional parser configuration
 * @returns Parser service instance
 */
export function createParserService(config?: Partial<ParserConfig>): ReceiptParserService {
  return new ReceiptParserService(config);
}
