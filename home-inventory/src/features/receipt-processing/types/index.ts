/**
 * Type definitions for receipt processing feature
 */

/**
 * Represents a raw OCR text line from a receipt
 */
export interface OcrLine {
  text: string;
  confidence: number;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

/**
 * Represents an extracted item from a receipt
 */
export interface ExtractedItem {
  id: string;
  name: string;
  price: number | null;
  quantity: number;
  confidence: number;
  lineNumber: number;
  rawText: string;
}

/**
 * Represents a parsed receipt with extracted data
 */
export interface ParsedReceipt {
  items: ExtractedItem[];
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  date: Date | null;
  merchantName: string | null;
  confidence: number;
  rawText: string;
}

/**
 * Receipt processing status
 */
export type ReceiptStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Receipt processing result
 */
export interface ReceiptProcessingResult {
  id: string;
  status: ReceiptStatus;
  parsedReceipt?: ParsedReceipt;
  error?: string;
}

/**
 * Configuration for receipt parser
 */
export interface ParserConfig {
  minItemConfidence: number;
  minPriceConfidence: number;
  currencySymbol: string;
  dateFormats: string[];
}

/**
 * Confidence scoring for extracted data
 */
export interface ConfidenceScore {
  overall: number;
  ocr: number;
  parsing: number;
  itemExtraction: number;
}

/**
 * Image quality metrics
 */
export interface ImageQualityMetrics {
  sharpness: number;
  contrast: number;
  brightness: number;
  resolution: { width: number; height: number };
}

/**
 * OCR processing options
 */
export interface OcrProcessingOptions {
  preprocess: boolean;
  validate: boolean;
  preprocessingLevel: 'quick' | 'standard' | 'full';
}

/**
 * Enhanced parsed receipt with quality metrics
 */
export interface EnhancedParsedReceipt extends ParsedReceipt {
  qualityMetrics?: ImageQualityMetrics;
  processingApplied?: string[];
  confidenceAnalysis?: {
    overall: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  };
}
