/**
 * Helper Utilities for Receipt Processing Tests
 *
 * Provides utility functions for testing receipt processing workflows,
 * including API mocking, file handling, and test data generation.
 */

import { Page, expect } from '@playwright/test';
import type { ParsedReceipt } from '@/features/receipt-processing/types';
import path from 'path';
import fs from 'fs';

/**
 * Wait for toast notification with specific message
 */
export async function waitForToast(
  page: Page,
  message: string | RegExp,
  timeout = 10000
): Promise<void> {
  const toastLocator = typeof message === 'string'
    ? page.locator('[data-sonner-toast]', { hasText: message })
    : page.locator('[data-sonner-toast]').filter({ hasText: message });

  await expect(toastLocator).toBeVisible({ timeout });
}

/**
 * Wait for toast to disappear
 */
export async function waitForToastHidden(
  page: Page,
  message: string | RegExp,
  timeout = 10000
): Promise<void> {
  const toastLocator = typeof message === 'string'
    ? page.locator('[data-sonner-toast]', { hasText: message })
    : page.locator('[data-sonner-toast]').filter({ hasText: message });

  await expect(toastLocator).toBeHidden({ timeout });
}

/**
 * Mock the receipt processing API with custom response
 */
export async function mockReceiptProcessingApi(
  page: Page,
  response: { success: boolean; data?: any; error?: string },
  options?: {
    delay?: number;
    status?: number;
  }
): Promise<void> {
  await page.route('**/api/receipts/process', async (route) => {
    // Simulate processing delay
    if (options?.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    await route.fulfill({
      status: options?.status || (response.success ? 200 : 400),
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock successful receipt processing with custom data
 */
export async function mockSuccessfulProcessing(
  page: Page,
  receipt: ParsedReceipt,
  options?: { delay?: number }
): Promise<void> {
  await mockReceiptProcessingApi(
    page,
    {
      success: true,
      data: {
        ...receipt,
        ocrConfidence: receipt.confidence,
        metadata: {
          linesProcessed: 50,
          itemsExtracted: receipt.items.length,
          processingTime: new Date().toISOString(),
        },
      },
    },
    options
  );
}

/**
 * Mock failed receipt processing
 */
export async function mockFailedProcessing(
  page: Page,
  errorMessage = 'Failed to process receipt',
  options?: { delay?: number; status?: number }
): Promise<void> {
  await mockReceiptProcessingApi(
    page,
    {
      success: false,
      error: errorMessage,
    },
    {
      delay: options?.delay,
      status: options?.status || 500,
    }
  );
}

/**
 * Upload receipt file via file input
 */
export async function uploadReceiptFile(
  page: Page,
  filePath: string
): Promise<void> {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
}

/**
 * Wait for receipt processing to complete
 */
export async function waitForProcessingComplete(
  page: Page,
  timeout = 30000
): Promise<void> {
  // Wait for processing state
  await expect(page.locator('text=Processing receipt...')).toBeVisible({ timeout: 5000 });

  // Wait for review screen
  await expect(page.locator('text=Review Receipt Items')).toBeVisible({ timeout });
}

/**
 * Get item count from review screen
 */
export async function getReviewItemCount(page: Page): Promise<number> {
  const itemsText = await page.locator('h2 + p').textContent();
  return parseInt(itemsText?.match(/(\d+) items/)?.[1] || '0');
}

/**
 * Edit item name in review screen
 */
export async function editItemName(
  page: Page,
  itemIndex: number,
  newName: string
): Promise<void> {
  const itemNameButton = page.locator('[class*="col-span-5"] button').nth(itemIndex);
  await itemNameButton.click();

  const nameInput = page.locator('[class*="col-span-5"] input').nth(itemIndex);
  await nameInput.fill(newName);

  // Click away to save
  await page.locator('h2:text("Review Receipt Items")').click();
}

/**
 * Edit item price in review screen
 */
export async function editItemPrice(
  page: Page,
  itemIndex: number,
  newPrice: string | number
): Promise<void> {
  const priceInput = page
    .locator('[class*="col-span-2"] input[type="number"][step="0.01"]')
    .nth(itemIndex);

  await priceInput.clear();
  await priceInput.fill(String(newPrice));
}

/**
 * Edit item quantity in review screen
 */
export async function editItemQuantity(
  page: Page,
  itemIndex: number,
  newQuantity: string | number
): Promise<void> {
  const qtyInput = page
    .locator('[class*="col-span-2"] input[type="number"][min="1"]')
    .nth(itemIndex);

  await qtyInput.clear();
  await qtyInput.fill(String(newQuantity));
}

/**
 * Delete item from review screen
 */
export async function deleteItem(page: Page, itemIndex: number): Promise<void> {
  const deleteButton = page.locator('button svg[class*="lucide-trash"]').nth(itemIndex);
  await deleteButton.click();
  await page.waitForTimeout(200); // Wait for state update
}

/**
 * Confirm items and add to inventory
 */
export async function confirmItems(page: Page): Promise<void> {
  const confirmButton = page.locator('button:has-text("Add")');
  await confirmButton.click();
}

/**
 * Cancel review and return to upload
 */
export async function cancelReview(page: Page): Promise<void> {
  const cancelButton = page.locator('button:has-text("Cancel")');
  await cancelButton.click();
}

/**
 * Create a test image file for upload testing
 */
export async function createTestImageFile(
  fileName: string,
  sizeInBytes?: number
): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp-test-files');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, fileName);

  // Create a minimal valid JPEG file (1x1 pixel)
  const minimalJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0xff, 0xd9,
  ]);

  if (sizeInBytes && sizeInBytes > minimalJpeg.length) {
    // Pad file to reach desired size
    const padding = Buffer.alloc(sizeInBytes - minimalJpeg.length, 0);
    fs.writeFileSync(filePath, Buffer.concat([minimalJpeg, padding]));
  } else {
    fs.writeFileSync(filePath, minimalJpeg);
  }

  return filePath;
}

/**
 * Clean up test files
 */
export function cleanupTestFiles(): void {
  const tempDir = path.join(process.cwd(), 'temp-test-files');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Verify receipt review screen elements
 */
export async function verifyReviewScreen(page: Page): Promise<void> {
  // Verify header
  await expect(page.locator('h2:text("Review Receipt Items")')).toBeVisible();

  // Verify table headers
  await expect(page.locator('text=Item Name')).toBeVisible();
  await expect(page.locator('text=Price')).toBeVisible();
  await expect(page.locator('text=Qty')).toBeVisible();
  await expect(page.locator('text=Confidence')).toBeVisible();

  // Verify action buttons
  await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  await expect(page.locator('button:has-text("Add")')).toBeVisible();
}

/**
 * Get all item data from review screen
 */
export async function getReviewItems(page: Page): Promise<Array<{
  name: string;
  price: string;
  quantity: string;
  confidence: string;
}>> {
  const items: Array<{
    name: string;
    price: string;
    quantity: string;
    confidence: string;
  }> = [];

  const rows = page.locator('[class*="grid-cols-12"]').filter({ hasText: /\$|[0-9]/ });
  const count = await rows.count();

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);

    const name = await row.locator('[class*="col-span-5"]').first().textContent() || '';
    const priceInput = row.locator('[class*="col-span-2"] input[step="0.01"]');
    const price = await priceInput.inputValue();
    const qtyInput = row.locator('[class*="col-span-2"] input[min="1"]');
    const quantity = await qtyInput.inputValue();
    const confidence = await row.locator('[class*="col-span-2"]').nth(2).textContent() || '';

    items.push({
      name: name.trim(),
      price,
      quantity,
      confidence: confidence.trim(),
    });
  }

  return items;
}

/**
 * Performance measurement helper
 */
export async function measureProcessingTime(
  page: Page,
  filePath: string
): Promise<{ duration: number; itemCount: number }> {
  const startTime = Date.now();

  await uploadReceiptFile(page, filePath);
  await waitForProcessingComplete(page);

  const endTime = Date.now();
  const duration = endTime - startTime;
  const itemCount = await getReviewItemCount(page);

  return { duration, itemCount };
}

/**
 * Check if receipt has metadata
 */
export async function hasReceiptMetadata(page: Page): Promise<{
  hasMerchant: boolean;
  hasDate: boolean;
  hasTotal: boolean;
}> {
  const merchantText = page.locator('text=/Merchant:/');
  const dateText = page.locator('text=/Date:/');
  const totalText = page.locator('text=/Total:/');

  return {
    hasMerchant: (await merchantText.count()) > 0,
    hasDate: (await dateText.count()) > 0,
    hasTotal: (await totalText.count()) > 0,
  };
}

/**
 * Verify confidence badge exists
 */
export async function verifyConfidenceBadge(
  page: Page,
  expected: 'High' | 'Medium' | 'Low'
): Promise<void> {
  const badge = page.locator(`text=${expected}`);
  await expect(badge).toBeVisible();
}

/**
 * Get sample receipt path
 */
export function getSampleReceiptPath(fileName: string): string {
  return path.join(process.cwd(), '..', 'sample_receipts', fileName);
}

/**
 * Sample receipt file names
 */
export const SAMPLE_RECEIPTS = {
  HEB: 'heb.jpg',
  WHOLEFOODS: 'wholefoods.jpeg',
  UNTITLED: 'Untitled.jpeg',
} as const;
