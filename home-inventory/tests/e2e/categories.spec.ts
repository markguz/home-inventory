import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'
const TEST_EMAIL = 'admin@homeinventory.local'
const TEST_PASSWORD = 'admin123'

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/**`)
  await page.waitForLoadState('networkidle')
}

async function navigateToCategories(page: Page) {
  await page.goto(`${BASE_URL}/categories`)
  await page.waitForLoadState('networkidle')
}

test.describe('Category Edit Form', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToCategories(page)
  })

  test('should open edit category dialog', async ({ page }) => {
    const categoryCard = page.locator('[class*="Card"]').first()
    await categoryCard.hover()
    const menuButton = categoryCard.locator('button[class*="ghost"]').first()
    await menuButton.click()
    const editOption = page.locator('text=Edit').first()
    await editOption.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const title = dialog.locator('h2')
    await expect(title).toContainText('Edit Category')
  })

  test('should successfully update a category', async ({ page }) => {
    const categoryCard = page.locator('[class*="Card"]').first()
    await categoryCard.hover()
    const menuButton = categoryCard.locator('button[class*="ghost"]').first()
    await menuButton.click()
    const editOption = page.locator('text=Edit').first()
    await editOption.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const nameInput = dialog.locator('input[placeholder*="Tools"]').first()
    const currentValue = await nameInput.inputValue()
    const newName = `Updated ${Date.now()}`
    
    await nameInput.clear()
    await nameInput.fill(newName)

    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/categories/') && response.request().method() === 'PUT'
    )

    const submitButton = dialog.locator('button[type="submit"]')
    await submitButton.click()

    const response = await responsePromise
    const responseBody = await response.json()

    expect(response.status()).toBe(200)
    expect(responseBody.success).toBe(true)

    await expect(dialog).not.toBeVisible({ timeout: 5000 })
    
    const toast = page.locator('text=Category updated successfully')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })

  test('should create a new category', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add Category")').first()
    await addButton.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const nameInput = dialog.locator('input[placeholder*="Tools"]').first()
    const newCategoryName = `Category ${Date.now()}`
    await nameInput.fill(newCategoryName)

    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/categories') && response.request().method() === 'POST'
    )

    const submitButton = dialog.locator('button[type="submit"]')
    await submitButton.click()

    const response = await responsePromise
    expect(response.status()).toBe(201)

    const successToast = page.locator('text=Category created successfully')
    await expect(successToast).toBeVisible({ timeout: 5000 })
  })
})
