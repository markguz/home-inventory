
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow a user to log in and log out', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Fill in the login form
    await page.fill('input[name="email"]', process.env.USERNAME || '');
    await page.fill('input[name="password"]', process.env.PASSWORD || '');

    // Click the login button
    await page.click('button[type="submit"]');

    // Wait for navigation to the dashboard
    await page.waitForURL('/');

    // Verify that the user is logged in
    await expect(page).toHaveURL('/');

    // Find and click the logout button
    await page.click('text=Logout');

    // Wait for navigation back to the login page
    await page.waitForURL('/login');

    // Verify that the user is logged out
    await expect(page).toHaveURL('/login');
  });
});
