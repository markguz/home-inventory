import { test, expect } from '@playwright/test';

test.describe('Edit Item Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Click on first item to go to details page
    await page.click('[data-testid="item-card"]:first-child');
  });

  test('should navigate to edit page', async ({ page }) => {
    await page.click('text=Edit');
    await expect(page).toHaveURL(/\/items\/[a-z0-9]+\/edit/);
    await expect(page.getByRole('heading', { name: /edit item/i })).toBeVisible();
  });

  test('should load existing item data', async ({ page }) => {
    await page.click('text=Edit');

    // Verify form is pre-filled
    const nameInput = page.locator('[name="name"]');
    await expect(nameInput).not.toHaveValue('');

    const descriptionInput = page.locator('[name="description"]');
    await expect(descriptionInput).toBeVisible();
  });

  test('should update item name', async ({ page }) => {
    await page.click('text=Edit');

    const originalName = await page.locator('[name="name"]').inputValue();
    const newName = `${originalName} - Updated`;

    await page.fill('[name="name"]', newName);
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: newName })).toBeVisible();
  });

  test('should update item description', async ({ page }) => {
    await page.click('text=Edit');

    await page.fill('[name="description"]', 'Updated description text');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
    await expect(page.getByText('Updated description text')).toBeVisible();
  });

  test('should update quantity', async ({ page }) => {
    await page.click('text=Edit');

    await page.fill('[name="quantity"]', '10');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
    await expect(page.getByText('×10')).toBeVisible();
  });

  test('should change category', async ({ page }) => {
    await page.click('text=Edit');

    await page.selectOption('[name="categoryId"]', { index: 2 });
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
  });

  test('should change location', async ({ page }) => {
    await page.click('text=Edit');

    await page.selectOption('[name="locationId"]', { index: 2 });
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
  });

  test('should update condition', async ({ page }) => {
    await page.click('text=Edit');

    await page.selectOption('[name="condition"]', 'fair');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
    await expect(page.locator('.bg-yellow-100')).toBeVisible();
  });

  test('should update prices', async ({ page }) => {
    await page.click('text=Edit');

    await page.fill('[name="purchasePrice"]', '1500.00');
    await page.fill('[name="currentValue"]', '1300.00');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
    await expect(page.getByText(/\$1,500\.00/)).toBeVisible();
    await expect(page.getByText(/\$1,300\.00/)).toBeVisible();
  });

  test('should update image URL', async ({ page }) => {
    await page.click('text=Edit');

    await page.fill('[name="imageUrl"]', 'https://example.com/new-image.jpg');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
  });

  test('should validate required fields on update', async ({ page }) => {
    await page.click('text=Edit');

    await page.fill('[name="name"]', '');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test('should cancel edit and return to details', async ({ page }) => {
    await page.click('text=Edit');

    await page.fill('[name="name"]', 'Changed Name');
    await page.click('text=Cancel');

    // Should return to details page without saving
    await expect(page).toHaveURL(/\/items\/[a-z0-9]+$/);
    await expect(page.getByText('Changed Name')).not.toBeVisible();
  });

  test('should add tags to existing item', async ({ page }) => {
    await page.click('text=Edit');

    await page.click('text=Add Tag');
    await page.fill('[placeholder="Search tags"]', 'Urgent');
    await page.click('text=Urgent');

    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
    await expect(page.getByText('Urgent')).toBeVisible();
  });

  test('should remove tags from item', async ({ page }) => {
    await page.click('text=Edit');

    // Find and click remove button on first tag
    await page.click('[data-testid="remove-tag"]:first-child');

    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
  });

  test('should update serial number and barcode', async ({ page }) => {
    await page.click('text=Edit');

    await page.fill('[name="serialNumber"]', 'SN999888777');
    await page.fill('[name="barcode"]', '987654321');

    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
    await expect(page.getByText('SN999888777')).toBeVisible();
  });

  test('should update warranty date', async ({ page }) => {
    await page.click('text=Edit');

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const dateStr = futureDate.toISOString().split('T')[0];

    await page.fill('[name="warrantyUntil"]', dateStr);
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
  });

  test('should show loading state during update', async ({ page }) => {
    await page.click('text=Edit');

    await page.fill('[name="name"]', 'Updated Name');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/updating/i)).toBeVisible();
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/items/*', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.click('text=Edit');
    await page.fill('[name="name"]', 'Updated Name');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/failed to update/i)).toBeVisible();
  });

  test('should preserve unchanged fields', async ({ page }) => {
    await page.click('text=Edit');

    const originalDescription = await page
      .locator('[name="description"]')
      .inputValue();

    // Only change name
    await page.fill('[name="name"]', 'New Name Only');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();

    // Verify description wasn't changed
    if (originalDescription) {
      await expect(page.getByText(originalDescription)).toBeVisible();
    }
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.click('text=Edit');

    await page.keyboard.press('Tab'); // Focus name
    await page.keyboard.type(' - Edited');

    await page.keyboard.press('Tab'); // Move to next field
    await page.keyboard.press('Tab'); // Continue navigating

    // Submit with Enter when on submit button
    while (!(await page.locator('button[type="submit"]').evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press('Tab');
    }

    await page.keyboard.press('Enter');

    await expect(page.getByText(/item updated successfully/i)).toBeVisible();
  });
});
