import { test, expect } from '@playwright/test';

test.describe('Search and Filter E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should search by item name', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'laptop');
    await page.waitForTimeout(600); // Debounce

    const items = page.locator('[data-testid="item-card"]');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Laptop');
  });

  test('should search by description', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'barista');
    await page.waitForTimeout(600);

    await expect(page.locator('text=Coffee Maker')).toBeVisible();
  });

  test('should combine search and category filter', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'item');
    await page.selectOption('select[name="category"]', 'Electronics');

    await page.waitForTimeout(600);

    const items = page.locator('[data-testid="item-card"]');
    await expect(items).toHaveCount(1);
  });

  test('should filter by location', async ({ page }) => {
    await page.selectOption('select[name="location"]', 'Kitchen');

    await expect(page.locator('text=Coffee Maker')).toBeVisible();
    await expect(page.locator('text=Laptop')).not.toBeVisible();
  });

  test('should filter by condition', async ({ page }) => {
    await page.selectOption('select[name="condition"]', 'Excellent');

    const items = page.locator('[data-testid="item-card"]');
    for (let i = 0; i < await items.count(); i++) {
      await expect(items.nth(i)).toContainText('Excellent');
    }
  });

  test('should sort by price ascending', async ({ page }) => {
    await page.selectOption('select[name="sort"]', 'price-asc');

    const firstPrice = await page.locator('[data-testid="item-price"]').first().textContent();
    const lastPrice = await page.locator('[data-testid="item-price"]').last().textContent();

    const first = parseFloat(firstPrice.replace(/[^0-9.]/g, ''));
    const last = parseFloat(lastPrice.replace(/[^0-9.]/g, ''));

    expect(first).toBeLessThanOrEqual(last);
  });

  test('should sort by date newest first', async ({ page }) => {
    await page.selectOption('select[name="sort"]', 'date-desc');

    const dates = await page.locator('[data-testid="item-date"]').allTextContents();

    // Verify dates are in descending order
    for (let i = 0; i < dates.length - 1; i++) {
      const date1 = new Date(dates[i]);
      const date2 = new Date(dates[i + 1]);
      expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
    }
  });

  test('should clear all filters', async ({ page }) => {
    // Apply multiple filters
    await page.fill('input[placeholder*="Search"]', 'laptop');
    await page.selectOption('select[name="category"]', 'Electronics');
    await page.selectOption('select[name="location"]', 'Office');

    // Click clear filters
    await page.click('button:has-text("Clear Filters")');

    // Verify all filters cleared
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
    await expect(page.locator('select[name="category"]')).toHaveValue('');
    await expect(page.locator('select[name="location"]')).toHaveValue('');

    // Verify all items shown
    const items = page.locator('[data-testid="item-card"]');
    await expect(items).toHaveCount(3);
  });

  test('should show no results message', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'nonexistent item xyz');
    await page.waitForTimeout(600);

    await expect(page.locator('text=No items found')).toBeVisible();
  });

  test('should update URL with filter params', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'laptop');
    await page.selectOption('select[name="category"]', 'Electronics');

    await page.waitForTimeout(600);

    const url = page.url();
    expect(url).toContain('search=laptop');
    expect(url).toContain('category=Electronics');
  });
});
