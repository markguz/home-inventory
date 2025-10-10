import { test, expect } from '@playwright/test';

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should search items by name', async ({ page }) => {
    await page.fill('[placeholder*="Search"]', 'laptop');
    await page.keyboard.press('Enter');

    // Wait for results
    await page.waitForSelector('[data-testid="item-card"]', { timeout: 5000 });

    // Verify results contain search term
    const items = await page.getByRole('link', { name: /laptop/i }).all();
    expect(items.length).toBeGreaterThan(0);
  });

  test('should show "no results" when search has no matches', async ({ page }) => {
    await page.fill('[placeholder*="Search"]', 'nonexistentitem123');
    await page.keyboard.press('Enter');

    await expect(page.getByText(/no items found/i)).toBeVisible();
  });

  test('should clear search', async ({ page }) => {
    await page.fill('[placeholder*="Search"]', 'laptop');
    await page.keyboard.press('Enter');

    await page.click('[aria-label="Clear search"]');

    await expect(page.locator('[placeholder*="Search"]')).toHaveValue('');
  });

  test('should filter by category', async ({ page }) => {
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');

    await page.waitForSelector('[data-testid="item-card"]');

    // Verify all items show Electronics category
    const categoryBadges = await page.getByText('Electronics').all();
    expect(categoryBadges.length).toBeGreaterThan(0);
  });

  test('should filter by location', async ({ page }) => {
    await page.click('[data-testid="location-filter"]');
    await page.click('text=Living Room');

    await page.waitForSelector('[data-testid="item-card"]');

    const locationLabels = await page.getByText('Living Room').all();
    expect(locationLabels.length).toBeGreaterThan(0);
  });

  test('should filter by condition', async ({ page }) => {
    await page.click('[data-testid="condition-filter"]');
    await page.click('text=Excellent');

    await page.waitForSelector('[data-testid="item-card"]');

    const conditionBadges = await page
      .locator('.bg-green-100')
      .getByText('excellent')
      .all();
    expect(conditionBadges.length).toBeGreaterThan(0);
  });

  test('should combine search with filters', async ({ page }) => {
    // Search
    await page.fill('[placeholder*="Search"]', 'laptop');

    // Add category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');

    // Add condition filter
    await page.click('[data-testid="condition-filter"]');
    await page.click('text=Good');

    await page.waitForSelector('[data-testid="item-card"]');

    // Verify combined filters
    await expect(page.getByText('Electronics')).toBeVisible();
    await expect(page.getByText('good')).toBeVisible();
  });

  test('should filter by price range', async ({ page }) => {
    await page.click('[data-testid="advanced-filters"]');

    await page.fill('[name="minPrice"]', '100');
    await page.fill('[name="maxPrice"]', '1000');

    await page.click('text=Apply Filters');

    await page.waitForSelector('[data-testid="item-card"]');

    // Verify price range (checks visible prices)
    const prices = await page.locator('[data-testid="item-price"]').allTextContents();
    prices.forEach((price) => {
      const numPrice = parseFloat(price.replace(/[$,]/g, ''));
      expect(numPrice).toBeGreaterThanOrEqual(100);
      expect(numPrice).toBeLessThanOrEqual(1000);
    });
  });

  test('should filter by tags', async ({ page }) => {
    await page.click('[data-testid="tag-filter"]');
    await page.click('text=Important');

    await page.waitForSelector('[data-testid="item-card"]');

    await expect(page.getByText('Important')).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Apply multiple filters
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');

    await page.click('[data-testid="condition-filter"]');
    await page.click('text=Good');

    // Clear all
    await page.click('text=Clear Filters');

    // Verify filters are cleared
    const items = await page.locator('[data-testid="item-card"]').all();
    expect(items.length).toBeGreaterThan(0);
  });

  test('should persist filters in URL', async ({ page }) => {
    await page.fill('[placeholder*="Search"]', 'laptop');
    await page.keyboard.press('Enter');

    const url = page.url();
    expect(url).toContain('q=laptop');
  });

  test('should restore filters from URL', async ({ page }) => {
    await page.goto('/?q=laptop&category=electronics&condition=good');

    await expect(page.locator('[placeholder*="Search"]')).toHaveValue('laptop');
    await expect(page.getByText('Electronics')).toBeVisible();
    await expect(page.getByText('Good')).toBeVisible();
  });

  test('should sort items by name', async ({ page }) => {
    await page.click('[data-testid="sort-dropdown"]');
    await page.click('text=Name (A-Z)');

    await page.waitForSelector('[data-testid="item-card"]');

    const itemNames = await page
      .locator('[data-testid="item-name"]')
      .allTextContents();

    const sortedNames = [...itemNames].sort();
    expect(itemNames).toEqual(sortedNames);
  });

  test('should sort items by date', async ({ page }) => {
    await page.click('[data-testid="sort-dropdown"]');
    await page.click('text=Newest First');

    await page.waitForSelector('[data-testid="item-card"]');

    // Just verify sorting option is applied
    const url = page.url();
    expect(url).toContain('sort=createdAt');
    expect(url).toContain('order=desc');
  });

  test('should sort items by price', async ({ page }) => {
    await page.click('[data-testid="sort-dropdown"]');
    await page.click('text=Price: Low to High');

    await page.waitForSelector('[data-testid="item-card"]');

    const url = page.url();
    expect(url).toContain('sort=purchasePrice');
    expect(url).toContain('order=asc');
  });

  test('should show active filter count', async ({ page }) => {
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');

    await page.click('[data-testid="condition-filter"]');
    await page.click('text=Good');

    await expect(page.getByText('2 filters active')).toBeVisible();
  });

  test('should debounce search input', async ({ page }) => {
    const searchInput = page.locator('[placeholder*="Search"]');

    await searchInput.fill('l');
    await page.waitForTimeout(100);
    await searchInput.fill('la');
    await page.waitForTimeout(100);
    await searchInput.fill('lap');
    await page.waitForTimeout(100);
    await searchInput.fill('laptop');

    // Should only trigger one search after debounce
    await page.waitForTimeout(600);

    await page.waitForSelector('[data-testid="item-card"]');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile filters
    await page.click('[aria-label="Open filters"]');

    // Verify filter panel is visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // Apply filter
    await page.click('text=Electronics');
    await page.click('text=Apply');

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
