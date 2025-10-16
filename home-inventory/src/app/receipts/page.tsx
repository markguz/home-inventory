import type { Metadata } from 'next';
import { ReceiptProcessor } from '@/features/receipt-processing/components/ReceiptProcessor';

/**
 * Metadata for Receipt Processing Page
 */
export const metadata: Metadata = {
  title: 'Receipt Processing | Home Inventory',
  description: 'Upload and process receipts to automatically extract and add items to your inventory',
};

/**
 * Receipt Processing Page
 *
 * Features:
 * - Drag-and-drop receipt upload
 * - OCR text extraction with Tesseract.js
 * - Intelligent item parsing
 * - Item review and editing
 * - Batch item creation
 * - Responsive design with mobile support
 *
 * The ReceiptProcessor component handles all UI and business logic including:
 * - Page layout and styling
 * - Breadcrumb navigation
 * - Error boundaries
 * - Loading states
 * - Multi-step workflow (upload -> review -> create)
 */
export default function ReceiptsPage() {
  return <ReceiptProcessor />;
}
