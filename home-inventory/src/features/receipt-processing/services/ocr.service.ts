/**
 * OCR Service - Wraps tesseract.js for optical character recognition
 * Enhanced with image validation and preprocessing
 */

import { createWorker, Worker } from 'tesseract.js';
import type { OcrLine, OcrProcessingOptions } from '../types';
import { validateImageOrThrow } from '../utils/image-validator';
import {
  preprocessImage,
  quickPreprocess,
  fullPreprocess,
} from '../utils/image-preprocessor';

/**
 * OCR processing result with metadata
 */
export interface OcrResult {
  lines: OcrLine[];
  processingApplied: string[];
  metadata: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
  };
}

/**
 * Default OCR processing options
 */
const DEFAULT_OCR_OPTIONS: OcrProcessingOptions = {
  preprocess: true,
  validate: true,
  preprocessingLevel: 'standard',
};

/**
 * OCR Service class for processing images with Tesseract
 */
export class OcrService {
  private worker: Worker | null = null;
  private initialized = false;

  /**
   * Initialize the OCR worker
   * @throws Error if initialization fails
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // For Next.js server-side execution, we need to explicitly provide the worker path
      // to avoid module resolution issues in the server context
      interface WorkerOptions {
        logger: (m: { status: string; progress?: number }) => void;
        workerPath?: string;
      }

      const workerOptions: WorkerOptions = {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      };

      // In Node.js environments (including Next.js server functions),
      // resolve the tesseract.js worker-script path explicitly
      // Worker Threads requires ABSOLUTE paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((typeof window === 'undefined') && (global as any).process) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
          const path = require('path');
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
          const fs = require('fs');

          // Method 1: Try to resolve from require.resolve (but handle path mangling in Next.js)
          let workerScriptPath: string | null = null;

          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const moduleResolve = require.resolve;
            let tesseractModulePath = moduleResolve('tesseract.js');

            // Fix path mangling in Next.js server context (remove [project] placeholders)
            tesseractModulePath = tesseractModulePath.replace(/\/\[project\]\/home-inventory/g, '');

            const tesseractDir = path.dirname(tesseractModulePath);
            const candidatePath = path.resolve(tesseractDir, 'worker-script', 'node', 'index.js');

            // Verify the path exists before using it
            if (fs.existsSync(candidatePath)) {
              workerScriptPath = candidatePath;
            }
          } catch (resolveError) {
            console.warn('[OCR] Direct resolve failed, trying fallback method', resolveError);
          }

          // Method 2: Fallback - assume standard node_modules location
          if (!workerScriptPath) {
            const fallbackPath = path.resolve(
              process.cwd(),
              'node_modules',
              'tesseract.js',
              'src',
              'worker-script',
              'node',
              'index.js'
            );

            if (fs.existsSync(fallbackPath)) {
              workerScriptPath = fallbackPath;
            }
          }

          // Method 3: Last resort - check parent directories
          if (!workerScriptPath) {
            const nodeModulesPath = path.resolve(process.cwd(), '..', 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
            if (fs.existsSync(nodeModulesPath)) {
              workerScriptPath = nodeModulesPath;
            }
          }

          if (workerScriptPath) {
            console.log(`[OCR] Using worker path: ${workerScriptPath}`);
            workerOptions.workerPath = workerScriptPath;
          } else {
            console.warn('[OCR] Could not find tesseract.js worker path, using default');
          }
        } catch (pathError) {
          console.warn('[OCR] Error resolving worker path, using default', pathError);
        }
      }

      this.worker = await createWorker('eng', 1, workerOptions);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw new Error('OCR initialization failed');
    }
  }

  /**
   * Process an image buffer and extract text with confidence scores
   * @param imageBuffer - Image buffer (JPEG, PNG, WebP)
   * @param options - Processing options
   * @returns OCR result with lines and metadata
   */
  async processImage(
    imageBuffer: Buffer,
    options: Partial<OcrProcessingOptions> = {}
  ): Promise<OcrResult> {
    const opts = { ...DEFAULT_OCR_OPTIONS, ...options };

    if (!this.worker || !this.initialized) {
      await this.initialize();
    }

    try {
      let processedBuffer = imageBuffer;
      const processingApplied: string[] = [];
      let metadata = {
        originalSize: { width: 0, height: 0 },
        processedSize: { width: 0, height: 0 },
      };

      // Step 1: Validate image
      if (opts.validate) {
        await validateImageOrThrow(imageBuffer);
        processingApplied.push('validation');
      }

      // Step 2: Preprocess image
      if (opts.preprocess) {
        let preprocessResult;

        switch (opts.preprocessingLevel) {
          case 'quick':
            processedBuffer = await quickPreprocess(imageBuffer);
            processingApplied.push('quick-preprocessing');
            break;
          case 'full':
            processedBuffer = await fullPreprocess(imageBuffer);
            processingApplied.push('full-preprocessing');
            break;
          case 'standard':
          default:
            preprocessResult = await preprocessImage(imageBuffer);
            processedBuffer = preprocessResult.buffer;
            processingApplied.push('standard-preprocessing', ...preprocessResult.applied);
            metadata = preprocessResult.metadata;
            break;
        }
      }

      // Step 3: Perform OCR
      const result = await this.worker!.recognize(processedBuffer);
      processingApplied.push('ocr');

      // Extract lines with confidence scores
      // Handle both tesseract.js v5 and v6 response formats
      interface TesseractResult {
        data?: { lines?: unknown[] };
        lines?: unknown[];
      }
      const resultData = ((result as TesseractResult).data || result) as TesseractResult;
      const resultLines = (resultData.lines || []) as unknown[];

      interface TesseractLine {
        text?: string;
        confidence?: number;
        bbox?: { x0?: number; y0?: number; x1?: number; y1?: number };
      }
      const lines: OcrLine[] = resultLines.map((line) => {
        const tessLine = line as TesseractLine;
        return {
          text: (tessLine.text || '').trim(),
          confidence: ((tessLine.confidence || 0) / 100), // Normalize to 0-1
          bbox: tessLine.bbox
            ? {
                x0: tessLine.bbox.x0 || 0,
                y0: tessLine.bbox.y0 || 0,
                x1: tessLine.bbox.x1 || 0,
                y1: tessLine.bbox.y1 || 0,
              }
            : undefined,
        };
      });

      return {
        lines: lines.filter((line) => line.text.length > 0),
        processingApplied,
        metadata,
      };
    } catch (error) {
      console.error('OCR processing failed:', error);

      // Provide helpful error message
      if (error instanceof Error) {
        throw error; // Re-throw validation errors with their messages
      }

      throw new Error('Failed to process image with OCR');
    }
  }

  /**
   * Process image without preprocessing (legacy method for backward compatibility)
   * @param imageBuffer - Image buffer
   * @returns Array of OCR lines
   * @deprecated Use processImage with options instead
   */
  async processImageRaw(imageBuffer: Buffer): Promise<OcrLine[]> {
    const result = await this.processImage(imageBuffer, {
      preprocess: false,
      validate: false,
    });
    return result.lines;
  }

  /**
   * Get overall OCR confidence for the processed text
   * @param lines - Array of OCR lines
   * @returns Average confidence score (0-1)
   */
  calculateOverallConfidence(lines: OcrLine[]): number {
    if (lines.length === 0) return 0;

    const totalConfidence = lines.reduce((sum, line) => sum + line.confidence, 0);
    return totalConfidence / lines.length;
  }

  /**
   * Cleanup and terminate the OCR worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
let ocrServiceInstance: OcrService | null = null;

/**
 * Get the singleton OCR service instance
 * @returns OCR service instance
 */
export function getOcrService(): OcrService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OcrService();
  }
  return ocrServiceInstance;
}
