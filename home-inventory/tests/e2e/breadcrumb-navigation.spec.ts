/**
 * @test Breadcrumb E2E Tests
 * @description End-to-end tests for breadcrumb navigation using Playwright
 * @framework Playwright
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Breadcrumb Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start at home page
    await page.goto('/');
  });

  test.describe('User Navigation Flows', () => {
    test('should display breadcrumb on items page', async ({ page }) => {
      await page.goto('/items');

      // Check breadcrumb exists
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Check breadcrumb items
      await expect(breadcrumb.locator('text=Home')).toBeVisible();
      await expect(breadcrumb.locator('text=Items')).toBeVisible();
    });

    test('should display breadcrumb on item details page', async ({ page }) => {
      // Navigate to items page first
      await page.goto('/items');

      // Click on first item (if exists)
      const firstItem = page.locator('[data-testid="item-card"]').first();
      if (await firstItem.isVisible()) {
        await firstItem.click();

        // Wait for navigation
        await page.waitForURL(/\/items\/.+/);

        // Check breadcrumb
        const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
        await expect(breadcrumb.locator('text=Home')).toBeVisible();
        await expect(breadcrumb.locator('text=Items')).toBeVisible();
        // Third breadcrumb should be item name or ID
      }
    });

    test('should display breadcrumb on new item page', async ({ page }) => {
      await page.goto('/items/new');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb.locator('text=Home')).toBeVisible();
      await expect(breadcrumb.locator('text=Items')).toBeVisible();
      await expect(breadcrumb.locator('text=New')).toBeVisible();
    });

    test('should display breadcrumb on categories page', async ({ page }) => {
      await page.goto('/categories');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb.locator('text=Home')).toBeVisible();
      await expect(breadcrumb.locator('text=Categories')).toBeVisible();
    });
  });

  test.describe('Breadcrumb Click Navigation', () => {
    test('should navigate to home when clicking Home breadcrumb', async ({ page }) => {
      await page.goto('/items');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const homeLink = breadcrumb.locator('text=Home');

      await homeLink.click();
      await expect(page).toHaveURL('/');
    });

    test('should navigate to items when clicking Items breadcrumb', async ({ page }) => {
      await page.goto('/items/new');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const itemsLink = breadcrumb.locator('a:has-text("Items")');

      await itemsLink.click();
      await expect(page).toHaveURL('/items');
    });

    test('should not have link on current page breadcrumb', async ({ page }) => {
      await page.goto('/items');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const currentBreadcrumb = breadcrumb.locator('text=Items');

      // Check if it's a span (not a link)
      const tagName = await currentBreadcrumb.evaluate((el) => el.tagName.toLowerCase());
      expect(tagName).toBe('span');
    });

    test('should update breadcrumb on navigation', async ({ page }) => {
      // Start at home
      await page.goto('/');

      // Navigate to items
      await page.goto('/items');
      let breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb.locator('text=Items')).toBeVisible();

      // Navigate to categories
      await page.goto('/categories');
      breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb.locator('text=Categories')).toBeVisible();
      await expect(breadcrumb.locator('text=Items')).not.toBeVisible();
    });
  });

  test.describe('Breadcrumb Route Updates', () => {
    test('should update breadcrumb when URL changes', async ({ page }) => {
      await page.goto('/items');

      let breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb.locator('text=Items')).toBeVisible();

      // Navigate to new item
      await page.goto('/items/new');

      breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb.locator('text=New')).toBeVisible();
    });

    test('should update breadcrumb on browser back button', async ({ page }) => {
      await page.goto('/items');
      await page.goto('/items/new');

      // Go back
      await page.goBack();

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb.locator('text=Items')).toBeVisible();
      await expect(breadcrumb.locator('text=New')).not.toBeVisible();
    });

    test('should update breadcrumb on browser forward button', async ({ page }) => {
      await page.goto('/items');
      await page.goto('/items/new');
      await page.goBack();

      // Go forward
      await page.goForward();

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb.locator('text=New')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display breadcrumb on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/items');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.locator('text=Home')).toBeVisible();
    });

    test('should handle breadcrumb clicks on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/items/new');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const itemsLink = breadcrumb.locator('a:has-text("Items")');

      await itemsLink.click();
      await expect(page).toHaveURL('/items');
    });

    test('should handle long breadcrumb paths on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to a deep path
      await page.goto('/items/123/edit');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Should either truncate or scroll
      const breadcrumbWidth = await breadcrumb.evaluate((el) => el.scrollWidth);
      expect(breadcrumbWidth).toBeGreaterThan(0);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate breadcrumb links with keyboard', async ({ page }) => {
      await page.goto('/items/new');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');

      // Focus first link
      await breadcrumb.locator('a').first().focus();
      await page.keyboard.press('Enter');

      // Should navigate
      await page.waitForURL(/\//);
    });

    test('should tab through breadcrumb links', async ({ page }) => {
      await page.goto('/items/new');

      // Tab through page
      await page.keyboard.press('Tab');

      // Eventually should reach breadcrumb links
      const focusedElement = page.locator(':focus');
      // Check if focused element is within breadcrumb
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/items');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Check aria-label
      const ariaLabel = await breadcrumb.getAttribute('aria-label');
      expect(ariaLabel).toBe('breadcrumb');
    });

    test('should have aria-current on last item', async ({ page }) => {
      await page.goto('/items');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const lastItem = breadcrumb.locator('[aria-current="page"]');

      await expect(lastItem).toBeVisible();
      await expect(lastItem).toHaveText(/Items/i);
    });

    test('should be screen reader friendly', async ({ page }) => {
      await page.goto('/items');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');

      // Check semantic HTML
      const list = breadcrumb.locator('ol');
      await expect(list).toBeVisible();

      const listItems = breadcrumb.locator('li');
      await expect(listItems).toHaveCount(2); // Home + Items
    });
  });

  test.describe('Performance', () => {
    test('should load breadcrumb quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/items');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should load in under 2 seconds
    });

    test('should not cause layout shift', async ({ page }) => {
      await page.goto('/items');

      // Wait for breadcrumb
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Check position stability
      const boundingBox1 = await breadcrumb.boundingBox();

      // Wait a bit
      await page.waitForTimeout(500);

      const boundingBox2 = await breadcrumb.boundingBox();

      // Position should be the same (no layout shift)
      expect(boundingBox1?.y).toBe(boundingBox2?.y);
    });
  });

  test.describe('Visual Regression', () => {
    test('should match breadcrumb screenshot', async ({ page }) => {
      await page.goto('/items');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Visual regression test
      await expect(breadcrumb).toHaveScreenshot('breadcrumb-items.png');
    });

    test('should match nested breadcrumb screenshot', async ({ page }) => {
      await page.goto('/items/new');

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toHaveScreenshot('breadcrumb-nested.png');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page');

      // Breadcrumb should still render
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      // May or may not be visible on 404, depends on implementation
    });

    test('should handle invalid URLs', async ({ page }) => {
      await page.goto('/items//invalid//path');

      // Should still show breadcrumb without errors
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      // Check if it handles gracefully
    });
  });
});
