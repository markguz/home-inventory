/**
 * Receipt Processing API Route
 * POST /api/receipts/process
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOcrService } from '@/features/receipt-processing/services/ocr.service';
import { createParserService } from '@/features/receipt-processing/services/parser.service';
import type { ParsedReceipt } from '@/features/receipt-processing/types';

/**
 * Maximum file size: 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Supported image types
 */
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Process receipt image with OCR and extract items
 * POST /api/receipts/process
 */
export async function POST(request: NextRequest) {
  let ocrService;

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported file type. Please upload JPEG, PNG, or WebP',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Processing receipt image: ${file.name} (${file.size} bytes)`);

    // Initialize OCR service
    ocrService = getOcrService();
    await ocrService.initialize();

    // Process image with OCR
    const ocrResult = await ocrService.processImage(buffer);
    console.log(`OCR extracted ${ocrResult.lines.length} lines with processing: ${ocrResult.processingApplied.join(', ')}`);

    // Parse receipt data
    const parserService = createParserService();
    const parsedReceipt: ParsedReceipt = parserService.parseReceipt(ocrResult.lines);

    console.log(`Parsed ${parsedReceipt.items.length} items from receipt`);

    // Calculate confidence score
    const ocrConfidence = ocrService.calculateOverallConfidence(ocrResult.lines);

    // Return parsed receipt data
    return NextResponse.json({
      success: true,
      data: {
        ...parsedReceipt,
        ocrConfidence,
        metadata: {
          linesProcessed: ocrResult.lines.length,
          itemsExtracted: parsedReceipt.items.length,
          processingTime: new Date().toISOString(),
          processingApplied: ocrResult.processingApplied,
          imageDimensions: ocrResult.metadata,
        },
      },
    });
  } catch (error) {
    console.error('Error processing receipt:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('OCR')) {
        return NextResponse.json(
          { success: false, error: 'Failed to process image with OCR' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process receipt' },
      { status: 500 }
    );
  } finally {
    // Note: We don't terminate the OCR worker here as it's a singleton
    // and will be reused for subsequent requests
  }
}
