import { test, expect } from '@playwright/test';

test.describe('Add Item Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to add item page', async ({ page }) => {
    await page.click('text=Add Item');
    await expect(page).toHaveURL(/\/items\/new/);
    await expect(page.getByRole('heading', { name: /add item/i })).toBeVisible();
  });

  test('should display all form fields', async ({ page }) => {
    await page.goto('/items/new');

    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/quantity/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/location/i)).toBeVisible();
    await expect(page.getByLabel(/condition/i)).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/items/new');

    await page.click('button[type="submit"]');

    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/category is required/i)).toBeVisible();
    await expect(page.getByText(/location is required/i)).toBeVisible();
  });

  test('should successfully create new item', async ({ page }) => {
    await page.goto('/items/new');

    // Fill in required fields
    await page.fill('[name="name"]', 'Test Laptop');
    await page.fill('[name="description"]', 'A great laptop for testing');
    await page.fill('[name="quantity"]', '1');

    // Select category and location
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.selectOption('[name="locationId"]', { index: 1 });

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect and success message
    await expect(page).toHaveURL(/\/items\/[a-z0-9]+/);
    await expect(page.getByText(/item created successfully/i)).toBeVisible();
  });

  test('should create item with all optional fields', async ({ page }) => {
    await page.goto('/items/new');

    // Required fields
    await page.fill('[name="name"]', 'Complete Item');
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.selectOption('[name="locationId"]', { index: 1 });

    // Optional fields
    await page.fill('[name="description"]', 'Full description');
    await page.fill('[name="quantity"]', '5');
    await page.fill('[name="purchasePrice"]', '999.99');
    await page.fill('[name="currentValue"]', '899.99');
    await page.selectOption('[name="condition"]', 'excellent');
    await page.fill('[name="barcode"]', '123456789');
    await page.fill('[name="serialNumber"]', 'SN12345');
    await page.fill('[name="notes"]', 'Important notes');

    await page.click('button[type="submit"]');

    await expect(page.getByText(/item created successfully/i)).toBeVisible();
  });

  test('should validate numeric fields', async ({ page }) => {
    await page.goto('/items/new');

    await page.fill('[name="quantity"]', '-1');
    await page.fill('[name="purchasePrice"]', '-100');

    await page.blur('[name="quantity"]');
    await page.blur('[name="purchasePrice"]');

    await expect(page.getByText(/must be positive/i).first()).toBeVisible();
  });

  test('should validate URL format for image', async ({ page }) => {
    await page.goto('/items/new');

    await page.fill('[name="imageUrl"]', 'not-a-valid-url');
    await page.blur('[name="imageUrl"]');

    await expect(page.getByText(/invalid url/i)).toBeVisible();
  });

  test('should cancel item creation', async ({ page }) => {
    await page.goto('/items/new');

    await page.fill('[name="name"]', 'Test Item');

    await page.click('text=Cancel');

    await expect(page).toHaveURL('/');
  });

  test('should preserve form data on validation error', async ({ page }) => {
    await page.goto('/items/new');

    await page.fill('[name="name"]', 'Test Item');
    await page.fill('[name="description"]', 'Test description');

    await page.click('button[type="submit"]');

    // Should show error but preserve data
    await expect(page.locator('[name="name"]')).toHaveValue('Test Item');
    await expect(page.locator('[name="description"]')).toHaveValue(
      'Test description'
    );
  });

  test('should add tags to item', async ({ page }) => {
    await page.goto('/items/new');

    await page.fill('[name="name"]', 'Tagged Item');
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.selectOption('[name="locationId"]', { index: 1 });

    // Add tags
    await page.click('text=Add Tag');
    await page.fill('[placeholder="Search tags"]', 'Important');
    await page.click('text=Important');

    await page.click('button[type="submit"]');

    await expect(page.getByText(/item created successfully/i)).toBeVisible();
  });

  test('should upload image', async ({ page }) => {
    await page.goto('/items/new');

    await page.fill('[name="name"]', 'Item with Image');
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.selectOption('[name="locationId"]', { index: 1 });

    // Mock file upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    await expect(page.getByText(/image uploaded/i)).toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/items/new');

    // Navigate with Tab
    await page.keyboard.press('Tab');
    await expect(page.locator('[name="name"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[name="description"]')).toBeFocused();
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto('/items/new');

    await page.fill('[name="name"]', 'Test Item');
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.selectOption('[name="locationId"]', { index: 1 });

    await page.click('button[type="submit"]');

    await expect(page.getByText(/creating/i)).toBeVisible();
  });
});
