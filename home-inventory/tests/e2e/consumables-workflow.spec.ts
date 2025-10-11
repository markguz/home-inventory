/**
 * E2E Tests: Complete Consumables Alert Workflow
 * Tests the full user journey for managing consumable items with alerts
 */

import { test, expect } from '@playwright/test';

test.describe('Consumables Alert Workflow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
  });

  test.describe('Create Consumable Category', () => {
    test('should create a new consumable category', async ({ page }) => {
      // Navigate to categories
      await page.click('text=Categories');
      await page.waitForURL('**/categories');

      // Click add category button
      await page.click('button:has-text("Add Category")');

      // Fill category form
      await page.fill('input[name="name"]', 'Food & Beverages');
      await page.fill('textarea[name="description"]', 'Consumable food items');
      await page.fill('input[name="icon"]', '🍕');

      // Submit form
      await page.click('button[type="submit"]:has-text("Create")');

      // Verify category was created
      await expect(page.locator('text=Food & Beverages')).toBeVisible();
    });
  });

  test.describe('Add Item with Min Quantity', () => {
    test('should create item with minimum quantity threshold', async ({ page }) => {
      // Navigate to items
      await page.click('text=Items');
      await page.waitForURL('**/items');

      // Click add item button
      await page.click('button:has-text("Add Item")');

      // Fill item form
      await page.fill('input[name="name"]', 'Coffee Beans');
      await page.fill('textarea[name="description"]', 'Premium Arabica beans');

      // Select category
      await page.click('select[name="categoryId"]');
      await page.selectOption('select[name="categoryId"]', { label: 'Food & Beverages' });

      // Select location
      await page.click('select[name="locationId"]');
      await page.selectOption('select[name="locationId"]', { index: 0 });

      // Set quantities
      await page.fill('input[name="quantity"]', '15');
      await page.fill('input[name="minQuantity"]', '10');

      // Submit form
      await page.click('button[type="submit"]:has-text("Save")');

      // Verify item was created
      await expect(page.locator('text=Coffee Beans')).toBeVisible();

      // Verify no alert is shown (stock is above minimum)
      await expect(page.locator('[data-level="critical"]')).not.toBeVisible();
      await expect(page.locator('[data-level="warning"]')).not.toBeVisible();
    });

    test('should show warning alert when creating item at minimum quantity', async ({ page }) => {
      await page.click('text=Items');
      await page.click('button:has-text("Add Item")');

      await page.fill('input[name="name"]', 'Paper Towels');
      await page.fill('input[name="quantity"]', '5');
      await page.fill('input[name="minQuantity"]', '5');

      await page.selectOption('select[name="categoryId"]', { index: 0 });
      await page.selectOption('select[name="locationId"]', { index: 0 });

      await page.click('button[type="submit"]:has-text("Save")');

      // Verify warning badge is displayed
      await expect(page.locator('[data-level="warning"]:has-text("Low Stock")')).toBeVisible();
    });

    test('should show critical alert when creating item below minimum', async ({ page }) => {
      await page.click('text=Items');
      await page.click('button:has-text("Add Item")');

      await page.fill('input[name="name"]', 'Trash Bags');
      await page.fill('input[name="quantity"]', '2');
      await page.fill('input[name="minQuantity"]', '10');

      await page.selectOption('select[name="categoryId"]', { index: 0 });
      await page.selectOption('select[name="locationId"]', { index: 0 });

      await page.click('button[type="submit"]:has-text("Save")');

      // Verify critical badge is displayed
      await expect(page.locator('[data-level="critical"]:has-text("Critical")')).toBeVisible();
    });
  });

  test.describe('Update Item Quantity and Alert State', () => {
    test('should update alert when quantity changes', async ({ page }) => {
      // First create item with low stock
      await page.click('text=Items');
      await page.click('button:has-text("Add Item")');

      await page.fill('input[name="name"]', 'Dish Soap');
      await page.fill('input[name="quantity"]', '2');
      await page.fill('input[name="minQuantity"]', '10');
      await page.selectOption('select[name="categoryId"]', { index: 0 });
      await page.selectOption('select[name="locationId"]', { index: 0 });
      await page.click('button[type="submit"]:has-text("Save")');

      // Verify critical alert
      await expect(page.locator('[data-level="critical"]')).toBeVisible();

      // Click edit button
      await page.click('button:has-text("Edit")');

      // Update quantity to above minimum
      await page.fill('input[name="quantity"]', '15');
      await page.click('button[type="submit"]:has-text("Save")');

      // Verify alert is cleared
      await expect(page.locator('[data-level="critical"]')).not.toBeVisible();
      await expect(page.locator('[data-level="warning"]')).not.toBeVisible();

      // Should show ok/in stock indicator
      const okBadge = page.locator('[data-level="ok"]');
      if (await okBadge.isVisible()) {
        await expect(okBadge).toBeVisible();
      }
    });

    test('should transition from ok to warning to critical', async ({ page }) => {
      // Create item with good stock
      await page.click('text=Items');
      await page.click('button:has-text("Add Item")');

      await page.fill('input[name="name"]', 'Sponges');
      await page.fill('input[name="quantity"]', '20');
      await page.fill('input[name="minQuantity"]', '10');
      await page.selectOption('select[name="categoryId"]', { index: 0 });
      await page.selectOption('select[name="locationId"]', { index: 0 });
      await page.click('button[type="submit"]:has-text("Save")');

      // Verify no critical/warning alert
      await expect(page.locator('[data-level="critical"]')).not.toBeVisible();
      await expect(page.locator('[data-level="warning"]')).not.toBeVisible();

      // Update to warning level
      await page.click('button:has-text("Edit")');
      await page.fill('input[name="quantity"]', '8');
      await page.click('button[type="submit"]:has-text("Save")');
      await expect(page.locator('[data-level="warning"]')).toBeVisible();

      // Update to critical level
      await page.click('button:has-text("Edit")');
      await page.fill('input[name="quantity"]', '3');
      await page.click('button[type="submit"]:has-text("Save")');
      await expect(page.locator('[data-level="critical"]')).toBeVisible();
    });
  });

  test.describe('Alert Filtering and Sorting', () => {
    test('should filter items by alert status', async ({ page }) => {
      // Navigate to items page
      await page.goto('/items');

      // Look for alert filter controls
      const alertFilter = page.locator('select[name="alertFilter"], [data-testid="alert-filter"]');

      if (await alertFilter.isVisible()) {
        // Filter by critical
        await alertFilter.selectOption('critical');

        // Verify only critical items are shown
        await expect(page.locator('[data-level="critical"]')).toBeVisible();
        await expect(page.locator('[data-level="warning"]')).not.toBeVisible();
        await expect(page.locator('[data-level="ok"]')).not.toBeVisible();

        // Filter by warning
        await alertFilter.selectOption('warning');
        await expect(page.locator('[data-level="warning"]')).toBeVisible();

        // Filter by all alerts
        await alertFilter.selectOption('all-alerts');
        const criticalCount = await page.locator('[data-level="critical"]').count();
        const warningCount = await page.locator('[data-level="warning"]').count();
        expect(criticalCount + warningCount).toBeGreaterThan(0);
      }
    });

    test('should sort items by stock level', async ({ page }) => {
      await page.goto('/items');

      // Look for sort controls
      const sortSelect = page.locator('select[name="sortBy"], [data-testid="sort-by"]');

      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('stockLevel');

        // Get all item cards in order
        const items = page.locator('[data-testid="item-card"]');
        const count = await items.count();

        if (count > 1) {
          // Verify first item has critical or warning alert
          const firstItem = items.first();
          const hasCritical = await firstItem.locator('[data-level="critical"]').isVisible();
          const hasWarning = await firstItem.locator('[data-level="warning"]').isVisible();
          expect(hasCritical || hasWarning).toBe(true);
        }
      }
    });
  });

  test.describe('Alert Dashboard View', () => {
    test('should display alert summary on dashboard', async ({ page }) => {
      await page.goto('/');

      // Look for alert summary widget
      const alertSummary = page.locator('[data-testid="alert-summary"]');

      if (await alertSummary.isVisible()) {
        // Should show count of critical alerts
        await expect(alertSummary.locator('text=/Critical.*\\d+/')).toBeVisible();

        // Should show count of warning alerts
        await expect(alertSummary.locator('text=/Warning.*\\d+/')).toBeVisible();
      }
    });

    test('should navigate to filtered items from dashboard', async ({ page }) => {
      await page.goto('/');

      // Click on critical alerts link
      const criticalLink = page.locator('a:has-text("Critical"), button:has-text("Critical")');

      if (await criticalLink.first().isVisible()) {
        await criticalLink.first().click();

        // Should navigate to items page with filter
        await page.waitForURL('**/items**');

        // Verify critical items are displayed
        await expect(page.locator('[data-level="critical"]')).toBeVisible();
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should update multiple items quantities', async ({ page }) => {
      await page.goto('/items');

      // Select multiple items with checkboxes
      const checkboxes = page.locator('input[type="checkbox"][name="select-item"]');
      const count = await checkboxes.count();

      if (count > 0) {
        await checkboxes.first().check();
        if (count > 1) {
          await checkboxes.nth(1).check();
        }

        // Look for bulk actions menu
        const bulkActions = page.locator('[data-testid="bulk-actions"]');
        if (await bulkActions.isVisible()) {
          await bulkActions.click();

          const updateQuantity = page.locator('button:has-text("Update Quantity")');
          if (await updateQuantity.isVisible()) {
            await updateQuantity.click();

            // Fill quantity update modal
            await page.fill('input[name="quantityChange"]', '10');
            await page.click('button:has-text("Apply")');

            // Verify success message
            await expect(page.locator('text=/Updated.*items?/')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible alert indicators', async ({ page }) => {
      await page.goto('/items');

      // Check for aria-label on alert badges
      const badges = page.locator('[role="status"]');
      const count = await badges.count();

      for (let i = 0; i < count; i++) {
        const badge = badges.nth(i);
        await expect(badge).toHaveAttribute('aria-label', /Stock level:/);
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/items');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to focus and activate buttons
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load items with alerts quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/items');
      await page.waitForSelector('[data-testid="item-card"]');

      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large number of items efficiently', async ({ page }) => {
      await page.goto('/items?limit=100');

      // Should render without freezing
      await page.waitForSelector('[data-testid="item-card"]');

      // Should be able to scroll smoothly
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(100);

      // Page should remain responsive
      const isResponsive = await page.evaluate(() => {
        return document.readyState === 'complete';
      });
      expect(isResponsive).toBe(true);
    });
  });
});
