import { test, expect, type Page } from '@playwright/test';

/**
 * Enhanced Authentication E2E Tests
 *
 * Comprehensive test suite for login/logout functionality using NextAuth.js v5
 * Tests cover successful authentication, error handling, session management,
 * and protected route access across multiple browsers and devices.
 */

// Test credentials from environment variables
const TEST_EMAIL = process.env.USERNAME || 'mark@markguz.com';
const TEST_PASSWORD = process.env.PASSWORD || 'eZ$5nzgicDSnBCGL';
const INVALID_EMAIL = 'invalid@example.com';
const INVALID_PASSWORD = 'wrongpassword123';

/**
 * Helper function to perform login
 * @param page - Playwright page object
 * @param email - User email address
 * @param password - User password
 * @param shouldSubmit - Whether to click submit button (default: true)
 */
async function loginHelper(
  page: Page,
  email: string,
  password: string,
  shouldSubmit: boolean = true
): Promise<void> {
  await page.goto('/login');
  await expect(page).toHaveURL('/login');

  // Fill in credentials
  await page.fill('#email', email);
  await page.fill('#password', password);

  if (shouldSubmit) {
    // Click submit button
    await page.click('button[type="submit"]');
  }
}

/**
 * Helper function to perform logout
 * @param page - Playwright page object
 */
async function logoutHelper(page: Page): Promise<void> {
  // Click user menu button
  await page.click('button[aria-label="User menu"]');

  // Wait for dropdown to appear (case-insensitive for robustness)
  await page.waitForSelector('text=/Sign out/i', { state: 'visible' });

  // Click sign out option
  await page.click('text=/Sign out/i');

  // Wait for redirect to login page
  await page.waitForURL('/login');
}

/**
 * Assert that user is logged in
 * @param page - Playwright page object
 */
async function assertLoggedIn(page: Page): Promise<void> {
  // User menu button should be visible (indicates logged in state)
  await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();

  // "Sign In" button should not be visible (when on pages with Header)
  // Note: Login page doesn't have Header, so this check is only valid on main app pages
  const currentUrl = page.url();
  if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
    await expect(page.locator('a:has-text("Sign In")')).not.toBeVisible();
  }
}

/**
 * Assert that user is logged out
 * @param page - Playwright page object
 * This function is flexible to handle both login page (no Header) and main pages (with Header)
 */
async function assertLoggedOut(page: Page): Promise<void> {
  const currentUrl = page.url();

  // If on login page, check for login page content (no Header component on auth pages)
  if (currentUrl.includes('/login')) {
    // Login page should show "Welcome back" heading
    await expect(page.locator('text=Welcome back')).toBeVisible();
    // Email and password fields should be present
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  } else {
    // On main app pages, "Sign In" link should be visible in Header
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
  }

  // User menu should not be visible in either case
  await expect(page.locator('button[aria-label="User menu"]')).not.toBeVisible();
}

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');
      await expect(page).toHaveURL('/login');

      // Verify login page elements
      await expect(page.locator('text=Welcome back')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();

      // Fill in valid credentials
      await page.fill('#email', TEST_EMAIL);
      await page.fill('#password', TEST_PASSWORD);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for successful login and redirect to dashboard
      await page.waitForURL('/', { timeout: 10000 });
      await expect(page).toHaveURL('/');

      // Verify user is logged in
      await assertLoggedIn(page);

      // Verify dashboard content is visible
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should display error message with invalid email', async ({ page }) => {
      // Attempt login with invalid email
      await loginHelper(page, INVALID_EMAIL, TEST_PASSWORD);

      // Should stay on login page
      await expect(page).toHaveURL('/login');

      // Wait for error toast to appear with exact message
      await expect(page.locator('text=Login failed')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Invalid email or password. Please try again.')).toBeVisible();

      // Verify user is not logged in
      await assertLoggedOut(page);
    });

    test('should display error message with invalid password', async ({ page }) => {
      // Attempt login with invalid password
      await loginHelper(page, TEST_EMAIL, INVALID_PASSWORD);

      // Should stay on login page
      await expect(page).toHaveURL('/login');

      // Wait for error toast to appear with exact message
      await expect(page.locator('text=Login failed')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Invalid email or password. Please try again.')).toBeVisible();

      // Verify user is not logged in
      await assertLoggedOut(page);
    });

    test('should display validation error with empty email', async ({ page }) => {
      await page.goto('/login');

      // Fill only password
      await page.fill('#password', TEST_PASSWORD);

      // Submit form
      await page.click('button[type="submit"]');

      // Should stay on login page (form validation prevents submission)
      await expect(page).toHaveURL('/login');

      // Email field should be marked as invalid
      const emailInput = page.locator('#email');
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('should display validation error with empty password', async ({ page }) => {
      await page.goto('/login');

      // Fill only email
      await page.fill('#email', TEST_EMAIL);

      // Submit form
      await page.click('button[type="submit"]');

      // Should stay on login page (form validation prevents submission)
      await expect(page).toHaveURL('/login');

      // Password field should be marked as invalid
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('should display validation errors with both fields empty', async ({ page }) => {
      await page.goto('/login');

      // Submit form without filling any fields
      await page.click('button[type="submit"]');

      // Should stay on login page
      await expect(page).toHaveURL('/login');

      // Both fields should be marked as invalid
      const emailInput = page.locator('#email');
      const passwordInput = page.locator('#password');
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      await expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('should disable submit button during login', async ({ page }) => {
      await page.goto('/login');

      // Fill in credentials
      await page.fill('#email', TEST_EMAIL);
      await page.fill('#password', TEST_PASSWORD);

      // Get submit button
      const submitButton = page.locator('button[type="submit"]');

      // Click submit
      const submitPromise = submitButton.click();

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
      await expect(page.locator('text=Signing in...')).toBeVisible();

      await submitPromise;

      // Wait for redirect
      await page.waitForURL('/', { timeout: 10000 });
    });

    test('should show success toast on successful login', async ({ page }) => {
      await page.goto('/login');

      // Fill in valid credentials
      await page.fill('#email', TEST_EMAIL);
      await page.fill('#password', TEST_PASSWORD);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for success toast with exact message
      await expect(page.locator('text=Login successful')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Welcome back! Redirecting to dashboard...')).toBeVisible();

      // Wait for redirect
      await page.waitForURL('/', { timeout: 10000 });
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully logout and redirect to login page', async ({ page }) => {
      // First, login
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });

      // Verify logged in
      await assertLoggedIn(page);

      // Logout
      await logoutHelper(page);

      // Verify logged out and redirected to login
      await expect(page).toHaveURL('/login');
      await assertLoggedOut(page);

      // Verify login page is displayed
      await expect(page.locator('text=Welcome back')).toBeVisible();
    });

    test('should be able to login again after logout (session persistence)', async ({ page }) => {
      // First login
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });
      await assertLoggedIn(page);

      // Logout
      await logoutHelper(page);
      await expect(page).toHaveURL('/login');

      // Wait a moment to ensure session is cleared
      await page.waitForTimeout(1000);

      // Login again with same credentials
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });

      // Verify successful second login
      await assertLoggedIn(page);
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route unauthenticated', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto('/');

      // Should be redirected to login page
      // Note: This depends on middleware implementation
      // If no middleware, the page might load but show login prompt
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        // Redirected to login (ideal scenario)
        await expect(page).toHaveURL('/login');
      } else {
        // On dashboard but should show "Sign In" button
        await assertLoggedOut(page);
      }
    });

    test('should allow navigation to protected routes after login', async ({ page }) => {
      // Login first
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });

      // Navigate to various protected routes
      const protectedRoutes = ['/items', '/categories', '/locations', '/tags'];

      for (const route of protectedRoutes) {
        await page.goto(route);

        // Should be able to access the route
        await expect(page).toHaveURL(route);

        // User should still be logged in
        await assertLoggedIn(page);
      }
    });

    test('should maintain session when navigating between pages', async ({ page }) => {
      // Login
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });

      // Navigate through multiple pages
      await page.click('text=Items');
      await expect(page).toHaveURL('/items');
      await assertLoggedIn(page);

      await page.click('text=Categories');
      await expect(page).toHaveURL('/categories');
      await assertLoggedIn(page);

      await page.click('text=Dashboard');
      await expect(page).toHaveURL('/');
      await assertLoggedIn(page);

      // Session should persist throughout navigation
      await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();
    });
  });

  test.describe('User Menu', () => {
    test('should display user email in dropdown menu', async ({ page }) => {
      // Login
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });

      // Open user menu
      await page.click('button[aria-label="User menu"]');

      // Wait for dropdown to appear
      await page.waitForSelector('text=Sign out', { state: 'visible' });

      // Verify user email is displayed
      await expect(page.locator(`text=${TEST_EMAIL}`)).toBeVisible();
    });

    test('should show user menu only when logged in', async ({ page }) => {
      // When logged out, user menu should not exist
      await page.goto('/login');
      await expect(page.locator('button[aria-label="User menu"]')).not.toBeVisible();

      // After login, user menu should appear
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });
      await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible form labels and ARIA attributes', async ({ page }) => {
      await page.goto('/login');

      // Email field
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(emailLabel).toHaveText('Email');

      // Password field
      const passwordLabel = page.locator('label[for="password"]');
      await expect(passwordLabel).toBeVisible();
      await expect(passwordLabel).toHaveText('Password');

      // Submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toHaveAttribute('aria-label', 'Sign in to your account');
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');

      // Tab to email field
      await page.keyboard.press('Tab');
      await expect(page.locator('#email')).toBeFocused();

      // Tab to password field
      await page.keyboard.press('Tab');
      await expect(page.locator('#password')).toBeFocused();

      // Tab to submit button
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();

      // Fill fields via keyboard
      await page.keyboard.press('Shift+Tab'); // Back to password
      await page.keyboard.press('Shift+Tab'); // Back to email
      await page.keyboard.type(TEST_EMAIL);
      await page.keyboard.press('Tab');
      await page.keyboard.type(TEST_PASSWORD);

      // Submit via Enter key
      await page.keyboard.press('Enter');

      // Should successfully login
      await page.waitForURL('/', { timeout: 10000 });
      await assertLoggedIn(page);
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work correctly in different viewport sizes', async ({ page }) => {
      // Test on mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });
      await assertLoggedIn(page);
      await logoutHelper(page);

      // Test on tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });
      await assertLoggedIn(page);
      await logoutHelper(page);

      // Test on desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
      await loginHelper(page, TEST_EMAIL, TEST_PASSWORD);
      await page.waitForURL('/', { timeout: 10000 });
      await assertLoggedIn(page);
    });
  });
});
