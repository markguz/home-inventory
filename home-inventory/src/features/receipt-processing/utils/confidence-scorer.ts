/**
 * Confidence Scoring Utility - Provides detailed confidence metrics
 * for OCR and parsing results
 */

import type { OcrLine, ExtractedItem, ParsedReceipt } from '../types';

/**
 * Field-level confidence scores
 */
export interface FieldConfidence {
  field: string;
  confidence: number;
  status: 'high' | 'medium' | 'low' | 'very-low';
  hasValue: boolean;
}

/**
 * Detailed confidence analysis
 */
export interface ConfidenceAnalysis {
  overall: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  fields: FieldConfidence[];
  ocrQuality: {
    avgConfidence: number;
    lowConfidenceLines: number;
    totalLines: number;
  };
  parsingQuality: {
    itemsExtracted: number;
    itemsWithPrices: number;
    avgItemConfidence: number;
  };
  completeness: {
    hasTotal: boolean;
    hasDate: boolean;
    hasMerchant: boolean;
    hasItems: boolean;
    score: number;
  };
  recommendations: string[];
}

/**
 * Confidence thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  high: 0.85,
  medium: 0.70,
  low: 0.50,
  veryLow: 0.30,
} as const;

/**
 * Get confidence status from score
 * @param confidence - Confidence score (0-1)
 * @returns Confidence status
 */
export function getConfidenceStatus(
  confidence: number
): 'high' | 'medium' | 'low' | 'very-low' {
  if (confidence >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  if (confidence >= CONFIDENCE_THRESHOLDS.low) return 'low';
  return 'very-low';
}

/**
 * Get overall status from confidence score
 * @param confidence - Overall confidence score (0-1)
 * @returns Overall status
 */
export function getOverallStatus(
  confidence: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (confidence >= 0.9) return 'excellent';
  if (confidence >= 0.75) return 'good';
  if (confidence >= 0.6) return 'fair';
  return 'poor';
}

/**
 * Analyze OCR quality
 * @param lines - OCR lines
 * @returns OCR quality metrics
 */
export function analyzeOcrQuality(lines: OcrLine[]) {
  if (lines.length === 0) {
    return {
      avgConfidence: 0,
      lowConfidenceLines: 0,
      totalLines: 0,
    };
  }

  const totalConfidence = lines.reduce((sum, line) => sum + line.confidence, 0);
  const avgConfidence = totalConfidence / lines.length;
  const lowConfidenceLines = lines.filter(
    (line) => line.confidence < CONFIDENCE_THRESHOLDS.medium
  ).length;

  return {
    avgConfidence,
    lowConfidenceLines,
    totalLines: lines.length,
  };
}

/**
 * Analyze parsing quality
 * @param items - Extracted items
 * @returns Parsing quality metrics
 */
export function analyzeParsingQuality(items: ExtractedItem[]) {
  if (items.length === 0) {
    return {
      itemsExtracted: 0,
      itemsWithPrices: 0,
      avgItemConfidence: 0,
    };
  }

  const itemsWithPrices = items.filter((item) => item.price !== null).length;
  const totalConfidence = items.reduce((sum, item) => sum + item.confidence, 0);
  const avgItemConfidence = totalConfidence / items.length;

  return {
    itemsExtracted: items.length,
    itemsWithPrices,
    avgItemConfidence,
  };
}

/**
 * Analyze receipt completeness
 * @param receipt - Parsed receipt
 * @returns Completeness metrics
 */
export function analyzeCompleteness(receipt: ParsedReceipt) {
  const hasTotal = receipt.total !== null;
  const hasDate = receipt.date !== null;
  const hasMerchant = receipt.merchantName !== null;
  const hasItems = receipt.items.length > 0;

  // Calculate completeness score
  let score = 0;
  if (hasTotal) score += 0.3;
  if (hasDate) score += 0.2;
  if (hasMerchant) score += 0.2;
  if (hasItems) score += 0.3;

  return {
    hasTotal,
    hasDate,
    hasMerchant,
    hasItems,
    score,
  };
}

/**
 * Calculate field-level confidence
 * @param receipt - Parsed receipt
 * @param lines - OCR lines
 * @returns Field confidence scores
 */
export function calculateFieldConfidence(
  receipt: ParsedReceipt,
  lines: OcrLine[]
): FieldConfidence[] {
  const fields: FieldConfidence[] = [];

  // Total field
  if (receipt.total !== null) {
    // Find line with total
    const totalLine = lines.find((line) => /total/i.test(line.text));
    fields.push({
      field: 'total',
      confidence: totalLine?.confidence || 0.5,
      status: getConfidenceStatus(totalLine?.confidence || 0.5),
      hasValue: true,
    });
  } else {
    fields.push({
      field: 'total',
      confidence: 0,
      status: 'very-low',
      hasValue: false,
    });
  }

  // Date field
  if (receipt.date !== null) {
    const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
    const dateLine = lines.find((line) => datePattern.test(line.text));
    fields.push({
      field: 'date',
      confidence: dateLine?.confidence || 0.5,
      status: getConfidenceStatus(dateLine?.confidence || 0.5),
      hasValue: true,
    });
  } else {
    fields.push({
      field: 'date',
      confidence: 0,
      status: 'very-low',
      hasValue: false,
    });
  }

  // Merchant field
  if (receipt.merchantName !== null) {
    const merchantLine = lines.find((line) => line.text === receipt.merchantName);
    fields.push({
      field: 'merchant',
      confidence: merchantLine?.confidence || 0.6,
      status: getConfidenceStatus(merchantLine?.confidence || 0.6),
      hasValue: true,
    });
  } else {
    fields.push({
      field: 'merchant',
      confidence: 0,
      status: 'very-low',
      hasValue: false,
    });
  }

  // Items field (aggregate)
  if (receipt.items.length > 0) {
    const avgItemConfidence =
      receipt.items.reduce((sum, item) => sum + item.confidence, 0) / receipt.items.length;
    fields.push({
      field: 'items',
      confidence: avgItemConfidence,
      status: getConfidenceStatus(avgItemConfidence),
      hasValue: true,
    });
  } else {
    fields.push({
      field: 'items',
      confidence: 0,
      status: 'very-low',
      hasValue: false,
    });
  }

  return fields;
}

/**
 * Generate recommendations based on confidence analysis
 * @param analysis - Confidence analysis
 * @returns Array of recommendations
 */
export function generateRecommendations(analysis: ConfidenceAnalysis): string[] {
  const recommendations: string[] = [];

  // OCR quality recommendations
  if (analysis.ocrQuality.avgConfidence < CONFIDENCE_THRESHOLDS.medium) {
    recommendations.push(
      'Low OCR confidence detected. Consider retaking the photo with better lighting and focus.'
    );
  }

  if (
    analysis.ocrQuality.lowConfidenceLines / analysis.ocrQuality.totalLines >
    0.3
  ) {
    recommendations.push(
      'Many lines have low confidence. Ensure the receipt is flat and all text is clearly visible.'
    );
  }

  // Parsing quality recommendations
  if (analysis.parsingQuality.itemsExtracted === 0) {
    recommendations.push(
      'No items were extracted. Verify the receipt format and ensure item names and prices are visible.'
    );
  }

  if (
    analysis.parsingQuality.itemsWithPrices <
    analysis.parsingQuality.itemsExtracted * 0.7
  ) {
    recommendations.push(
      'Some items are missing price information. Ensure all prices are clearly visible.'
    );
  }

  // Completeness recommendations
  if (!analysis.completeness.hasTotal) {
    recommendations.push(
      'Total amount not found. Make sure the total is clearly visible in the image.'
    );
  }

  if (!analysis.completeness.hasDate) {
    recommendations.push(
      'Purchase date not found. Include the date section of the receipt in the image.'
    );
  }

  if (!analysis.completeness.hasMerchant) {
    recommendations.push(
      'Merchant name not detected. Include the store name/header in the image.'
    );
  }

  // Overall quality recommendation
  if (analysis.overall < CONFIDENCE_THRESHOLDS.medium) {
    recommendations.push(
      'Overall confidence is low. For best results: use good lighting, hold camera steady, ensure receipt is flat and fully visible.'
    );
  }

  return recommendations;
}

/**
 * Perform comprehensive confidence analysis
 * @param receipt - Parsed receipt
 * @param lines - OCR lines
 * @returns Detailed confidence analysis
 */
export function analyzeConfidence(
  receipt: ParsedReceipt,
  lines: OcrLine[]
): ConfidenceAnalysis {
  const ocrQuality = analyzeOcrQuality(lines);
  const parsingQuality = analyzeParsingQuality(receipt.items);
  const completeness = analyzeCompleteness(receipt);
  const fields = calculateFieldConfidence(receipt, lines);

  // Calculate overall confidence (weighted)
  const overall =
    ocrQuality.avgConfidence * 0.3 +
    parsingQuality.avgItemConfidence * 0.3 +
    completeness.score * 0.4;

  const status = getOverallStatus(overall);

  const analysis: ConfidenceAnalysis = {
    overall,
    status,
    fields,
    ocrQuality,
    parsingQuality,
    completeness,
    recommendations: [],
  };

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

/**
 * Check if receipt meets minimum quality threshold
 * @param analysis - Confidence analysis
 * @param threshold - Minimum threshold (default: 0.5)
 * @returns True if meets threshold
 */
export function meetsQualityThreshold(
  analysis: ConfidenceAnalysis,
  threshold: number = 0.5
): boolean {
  return analysis.overall >= threshold;
}
