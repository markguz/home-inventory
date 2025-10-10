import { test, expect } from '@playwright/test';

test.describe('Item Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add new item successfully', async ({ page }) => {
    // Navigate to add item page
    await page.click('text=Add New Item');

    // Fill form
    await page.fill('input[name="name"]', 'Test Laptop');
    await page.fill('textarea[name="description"]', 'High-performance laptop for work');
    await page.selectOption('select[name="category"]', 'Electronics');
    await page.fill('input[name="location"]', 'Home Office');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="purchasePrice"]', '1299.99');
    await page.selectOption('select[name="condition"]', 'New');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=Item created successfully')).toBeVisible();

    // Verify item appears in list
    await expect(page.locator('text=Test Laptop')).toBeVisible();
  });

  test('should search for items', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'laptop');

    // Wait for debounce
    await page.waitForTimeout(600);

    // Verify filtered results
    await expect(page.locator('text=Laptop')).toBeVisible();

    // Verify other items are hidden
    await expect(page.locator('text=Coffee Maker')).not.toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    // Select category
    await page.selectOption('select[name="category"]', 'Electronics');

    // Verify only electronics items shown
    await expect(page.locator('text=Laptop')).toBeVisible();
    await expect(page.locator('text=Winter Coat')).not.toBeVisible();
  });

  test('should edit item', async ({ page }) => {
    // Find and click edit button for first item
    await page.click('[data-testid="item-card"]:first-child button:has-text("Edit")');

    // Update name
    await page.fill('input[name="name"]', 'Updated Item Name');

    // Save changes
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Item updated successfully')).toBeVisible();
    await expect(page.locator('text=Updated Item Name')).toBeVisible();
  });

  test('should delete item with confirmation', async ({ page }) => {
    // Set up dialog handler
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Are you sure');
      dialog.accept();
    });

    // Click delete button
    await page.click('[data-testid="item-card"]:first-child button:has-text("Delete")');

    // Verify item removed
    await expect(page.locator('text=Item deleted successfully')).toBeVisible();
  });

  test('should upload item image', async ({ page }) => {
    await page.click('text=Add New Item');

    // Fill required fields
    await page.fill('input[name="name"]', 'Item with Image');
    await page.selectOption('select[name="category"]', 'Electronics');
    await page.fill('input[name="location"]', 'Office');

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-image.jpg');

    // Verify preview shown
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();

    // Submit
    await page.click('button[type="submit"]');

    // Verify image in item card
    await expect(page.locator('[data-testid="item-image"]')).toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    await page.click('text=Add New Item');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Verify error messages
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Category is required')).toBeVisible();
  });

  test('should persist filters after page refresh', async ({ page }) => {
    // Apply filters
    await page.fill('input[placeholder*="Search"]', 'laptop');
    await page.selectOption('select[name="category"]', 'Electronics');

    // Reload page
    await page.reload();

    // Verify filters persisted
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('laptop');
    await expect(page.locator('select[name="category"]')).toHaveValue('Electronics');
  });

  test('should display item details', async ({ page }) => {
    // Click on item card
    await page.click('[data-testid="item-card"]:first-child');

    // Verify details page
    await expect(page.locator('h1')).toContainText('Item Details');
    await expect(page.locator('text=Purchase Date')).toBeVisible();
    await expect(page.locator('text=Purchase Price')).toBeVisible();
    await expect(page.locator('text=Condition')).toBeVisible();
  });

  test('should export items to CSV', async ({ page }) => {
    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export")');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/inventory.*\.csv/);
  });
});
