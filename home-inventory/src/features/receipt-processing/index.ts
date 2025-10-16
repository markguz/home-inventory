/**
 * Receipt Processing Feature
 * Main entry point for the receipt processing feature
 */

// Components
export * from './components';

// Services
export { getOcrService, OcrService } from './services/ocr.service';
export { createParserService, ReceiptParserService } from './services/parser.service';

// Types
export type {
  OcrLine,
  ExtractedItem,
  ParsedReceipt,
  ReceiptStatus,
  ReceiptProcessingResult,
  ParserConfig,
  ConfidenceScore,
} from './types';

// Utilities
export {
  validateFileSize,
  validateImageType,
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_TYPES,
  receiptUploadSchema,
  extractedItemSchema,
  receiptProcessRequestSchema,
} from './utils/validation';
