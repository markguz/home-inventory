# Receipt Image Processing Feature - Comprehensive Test Strategy

## Executive Summary

This document outlines the complete testing strategy for the receipt image processing feature in the Home Inventory application. The feature enables users to upload receipt images, extract text via OCR (Tesseract.js), parse items and prices, and automatically create inventory items.

**Test Coverage Goals:**
- Unit Tests: 80%+ coverage
- Component Tests: 75%+ coverage
- Integration Tests: 90%+ coverage for API routes
- E2E Tests: All critical user workflows
- Performance: Establish baselines and thresholds
- Security: Zero vulnerabilities in file handling
- Accessibility: WCAG 2.1 AA compliance

---

## 1. Unit Test Strategy

### 1.1 OCR Processing Module

**File:** `tests/unit/lib/ocr/tesseract-wrapper.test.ts`

| Test Case | Priority | Description | Coverage |
|-----------|----------|-------------|----------|
| `extractTextFromImage()` | P0 | Successfully extracts text from clean receipt | Core |
| `extractTextFromImage()` error handling | P0 | Handles Tesseract errors gracefully | Core |
| `extractTextFromImage()` with options | P1 | Supports language, PSM mode configuration | Extended |
| `preprocessImage()` | P1 | Image preprocessing improves OCR accuracy | Extended |
| Worker initialization | P2 | Worker pool management and cleanup | Extended |
| Memory cleanup | P1 | Properly terminates workers and frees memory | Core |

**Mock Strategy:**
```typescript
// Mock Tesseract.js worker
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => ({
    load: vi.fn().mockResolvedValue(undefined),
    loadLanguage: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    recognize: vi.fn().mockResolvedValue({
      data: { text: 'MOCK_OCR_OUTPUT' }
    }),
    terminate: vi.fn().mockResolvedValue(undefined)
  }))
}));
```

### 1.2 Receipt Parser Module

**File:** `tests/unit/lib/receipt/parser.test.ts`

| Test Case | Priority | Description | Expected Output |
|-----------|----------|-------------|-----------------|
| `parseReceiptText()` - grocery | P0 | Parse typical grocery receipt | Items array with prices |
| `parseReceiptText()` - restaurant | P1 | Parse restaurant receipt format | Items with quantities |
| `extractItems()` | P0 | Extract item lines from text | Filtered item array |
| `extractPrices()` | P0 | Parse various price formats ($12.99, 12,99€) | Normalized decimals |
| `extractDate()` | P0 | Parse multiple date formats | ISO 8601 date |
| `extractTotal()` | P1 | Extract receipt total | Decimal number |
| `validateParsedData()` | P0 | Validate parsed data schema | Boolean + errors |
| Empty text handling | P0 | Return empty array for no text | [] |
| Malformed text | P1 | Handle corrupted OCR output | Partial results |
| Very long item names | P2 | Truncate to 255 chars | Truncated string |

**Test Data:**
```typescript
// Sample OCR output
const mockGroceryReceipt = `
WALMART SUPERCENTER
123 MAIN ST
DATE: 10/15/2025

MILK 2% GAL          $4.99
BREAD WHEAT          $2.49
EGGS LARGE 12CT      $3.99
APPLES LB            $1.99

SUBTOTAL            $13.46
TAX                  $1.08
TOTAL               $14.54
`;
```

### 1.3 Price Parsing Module

**File:** `tests/unit/lib/receipt/price-parser.test.ts`

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| US format | "$12.99" | 12.99 |
| EU format | "12,99€" | 12.99 |
| UK format | "£12.99" | 12.99 |
| Without symbol | "12.99" | 12.99 |
| With thousands | "$1,234.56" | 1234.56 |
| Negative (return) | "-$5.00" | -5.00 |
| Invalid format | "abc" | null |
| Multiple symbols | "$$12.99" | null |

### 1.4 Date Parser Module

**File:** `tests/unit/lib/receipt/date-parser.test.ts`

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| US format | "10/15/2025" | 2025-10-15T00:00:00.000Z |
| EU format | "15-10-2025" | 2025-10-15T00:00:00.000Z |
| ISO format | "2025-10-15" | 2025-10-15T00:00:00.000Z |
| Long format | "October 15, 2025" | 2025-10-15T00:00:00.000Z |
| No date found | "" | Current date |
| Invalid date | "99/99/9999" | null |
| Ambiguous date | "01/02/03" | Configurable interpretation |

### 1.5 Data Validation Module

**File:** `tests/unit/lib/receipt/validation.test.ts`

| Test Case | Priority | Description |
|-----------|----------|-------------|
| Valid receipt data | P0 | All fields present and valid |
| Missing required fields | P0 | Items array required |
| Invalid price types | P0 | Prices must be numbers |
| Invalid date types | P1 | Dates must be Date objects |
| Empty items array | P1 | Allow empty but present |
| XSS in item names | P0 | Sanitize HTML entities |
| SQL injection attempts | P0 | Validate against injection |
| Item name length limits | P1 | Max 255 characters |

**Coverage Goal:** 85%+ for all parser modules

---

## 2. Component Test Strategy

### 2.1 ReceiptUpload Component

**File:** `tests/components/ReceiptUpload.test.tsx`

| Test Case | Priority | User Interaction | Expected Result |
|-----------|----------|------------------|-----------------|
| Render upload area | P0 | Component mounts | Shows upload dropzone |
| File selection via input | P0 | Click + select file | File preview appears |
| Drag and drop | P1 | Drag image over zone | Highlight + accept |
| Invalid file type | P0 | Upload .pdf file | Error message shown |
| File too large | P0 | Upload 20MB file | Error message shown |
| Multiple files | P1 | Select 3 files | Process first only |
| Cancel upload | P1 | Click cancel button | Upload aborted |
| Retry after error | P1 | Click retry | Re-initiates upload |

**Test Example:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiptUpload } from '@/components/receipt/ReceiptUpload';

describe('ReceiptUpload', () => {
  it('should accept valid image file', async () => {
    const onUpload = vi.fn();
    render(<ReceiptUpload onUpload={onUpload} />);

    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload receipt/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file);
    });
  });

  it('should reject non-image files', async () => {
    render(<ReceiptUpload onUpload={vi.fn()} />);

    const file = new File(['malicious'], 'bad.exe', { type: 'application/exe' });
    const input = screen.getByLabelText(/upload receipt/i);

    await userEvent.upload(input, file);

    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
  });
});
```

### 2.2 ReceiptPreview Component

**File:** `tests/components/ReceiptPreview.test.tsx`

| Test Case | Priority | Description |
|-----------|----------|-------------|
| Display image preview | P0 | Shows uploaded image |
| Rotation controls | P1 | Rotate 90° increments |
| Zoom controls | P2 | Zoom in/out on image |
| Loading state | P0 | Shows skeleton during load |
| Error state | P0 | Shows error message |
| Remove image | P1 | Button to clear preview |

### 2.3 ProcessingStatus Component

**File:** `tests/components/ProcessingStatus.test.tsx`

| Test Case | Priority | Description |
|-----------|----------|-------------|
| Uploading state | P0 | Progress bar + message |
| OCR processing state | P0 | Shows OCR stage |
| Parsing state | P0 | Shows parsing stage |
| Success state | P0 | Checkmark + success message |
| Error state | P0 | Error icon + message |
| Cancel button | P1 | Available during processing |
| Progress percentage | P1 | Updates from 0-100% |

### 2.4 ItemReviewList Component

**File:** `tests/components/ItemReviewList.test.tsx`

| Test Case | Priority | Description |
|-----------|----------|-------------|
| Display parsed items | P0 | List all extracted items |
| Edit item name | P0 | Inline editing |
| Edit item price | P0 | Inline editing with validation |
| Remove item | P0 | Delete from list |
| Category selection | P1 | Dropdown per item |
| Location selection | P1 | Dropdown per item |
| Select all items | P1 | Checkbox to select all |
| Save selected items | P0 | Submit to API |

**Coverage Goal:** 75%+ for all components

---

## 3. Integration Test Strategy

### 3.1 Receipt Upload API

**File:** `tests/integration/api/receipts/upload.test.ts`

| Test Case | Priority | Request | Expected Response |
|-----------|----------|---------|-------------------|
| Upload valid image | P0 | POST multipart/form-data | 201 + receipt ID |
| Upload without auth | P0 | No session token | 401 Unauthorized |
| Upload invalid file type | P0 | .exe file | 400 Bad Request |
| Upload oversized file | P0 | 20MB file | 413 Payload Too Large |
| Upload with malformed data | P1 | Corrupted multipart | 400 Bad Request |
| Concurrent uploads | P1 | 5 simultaneous | All succeed |
| Rate limiting | P2 | 100 requests/min | 429 after limit |

**Test Example:**
```typescript
import { POST } from '@/app/api/receipts/upload/route';
import { getServerSession } from 'next-auth';

vi.mock('next-auth');

describe('POST /api/receipts/upload', () => {
  it('should upload receipt image successfully', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123' }
    });

    const formData = new FormData();
    const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
    formData.append('receipt', blob, 'receipt.jpg');

    const request = new Request('http://localhost:3000/api/receipts/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('receiptId');
    expect(data).toHaveProperty('imageUrl');
  });
});
```

### 3.2 Receipt Processing API

**File:** `tests/integration/api/receipts/process.test.ts`

| Test Case | Priority | Description |
|-----------|----------|-------------|
| Process uploaded receipt | P0 | OCR + parse + return items |
| Process with OCR failure | P0 | Graceful error handling |
| Process empty receipt | P1 | Return empty items array |
| Process with invalid receipt ID | P0 | 404 Not Found |
| Process unauthorized receipt | P0 | 403 Forbidden |
| Process already processed | P1 | Return cached results |

### 3.3 Database Integration

**File:** `tests/integration/db/receipt-items.test.ts`

| Test Case | Priority | Description |
|-----------|----------|-------------|
| Create items from receipt | P0 | Batch insert items |
| Transaction rollback on error | P0 | All-or-nothing creation |
| Foreign key constraints | P0 | Category and location exist |
| Duplicate item detection | P1 | Handle gracefully |
| Orphaned receipt cleanup | P2 | Delete old processed receipts |

**Coverage Goal:** 90%+ for all API routes

---

## 4. End-to-End Test Strategy

### 4.1 Happy Path Workflow

**File:** `tests/e2e/receipt-upload-happy-path.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('complete receipt upload and item creation workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  // Navigate to receipt upload
  await page.click('text=Add Receipt');
  await expect(page).toHaveURL('/receipts/upload');

  // Upload receipt
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/receipts/grocery-clean.jpg');

  // Wait for processing
  await expect(page.locator('text=Processing receipt...')).toBeVisible();
  await expect(page.locator('text=Items found: 4')).toBeVisible({ timeout: 10000 });

  // Review items
  const itemsList = page.locator('[data-testid="parsed-items"]');
  await expect(itemsList.locator('li')).toHaveCount(4);

  // Edit first item
  await itemsList.locator('li').first().click();
  await page.fill('input[name="itemName"]', 'Organic Milk');
  await page.click('button:has-text("Save Changes")');

  // Save all items
  await page.click('button:has-text("Add to Inventory")');

  // Verify success
  await expect(page.locator('text=4 items added successfully')).toBeVisible();
  await expect(page).toHaveURL('/items');
});
```

### 4.2 E2E Test Scenarios

| Test Case | Priority | File | Description |
|-----------|----------|------|-------------|
| Happy path | P0 | `receipt-upload-happy-path.spec.ts` | Complete workflow end-to-end |
| Multiple items receipt | P0 | `receipt-multiple-items.spec.ts` | 10+ items processed correctly |
| Edit before save | P1 | `receipt-edit-items.spec.ts` | Modify parsed data before saving |
| Category assignment | P1 | `receipt-category-assignment.spec.ts` | Auto-assign and manual override |
| Error recovery | P0 | `receipt-error-recovery.spec.ts` | Upload fails, retry succeeds |
| Cancel workflow | P1 | `receipt-cancel-upload.spec.ts` | Cancel at various stages |
| Mobile workflow | P1 | `receipt-mobile-upload.spec.ts` | Test on mobile viewport |
| Keyboard navigation | P1 | `receipt-keyboard-nav.spec.ts` | Complete with keyboard only |
| Duplicate receipt | P2 | `receipt-duplicate-detection.spec.ts` | Warn on duplicate upload |
| Network failure | P1 | `receipt-network-failure.spec.ts` | Handle offline/network errors |

### 4.3 Cross-Browser Testing

- Chromium (primary)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

**Coverage Goal:** All P0 and P1 scenarios across all browsers

---

## 5. Performance Testing Strategy

### 5.1 Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Single receipt OCR | < 5 seconds | Time from upload to parsed data |
| API upload response | < 2 seconds | Network request duration |
| Batch 5 receipts | < 30 seconds | Sequential processing |
| Large image (5MB) | < 10 seconds | OCR processing time |
| Memory per receipt | < 150MB | Process memory delta |
| Concurrent users (5) | No failures | Load testing |
| Database query time | < 100ms | Item creation queries |

### 5.2 Performance Test Cases

**File:** `tests/performance/receipt-processing.bench.ts`

```typescript
import { describe, bench } from 'vitest';
import { extractTextFromImage } from '@/lib/ocr/tesseract-wrapper';
import fs from 'fs';

describe('OCR Performance', () => {
  const receiptImage = fs.readFileSync('tests/fixtures/receipts/grocery-clean.jpg');

  bench('extract text from clean receipt', async () => {
    await extractTextFromImage(receiptImage);
  }, { iterations: 10 });

  bench('extract text from blurry receipt', async () => {
    const blurryImage = fs.readFileSync('tests/fixtures/receipts/grocery-blurry.jpg');
    await extractTextFromImage(blurryImage);
  }, { iterations: 10 });
});
```

### 5.3 Load Testing

**File:** `tests/performance/load-test.ts`

- Simulate 10 concurrent users uploading receipts
- Measure average response time
- Measure 95th percentile response time
- Monitor server resource usage (CPU, memory)
- Identify bottlenecks

---

## 6. Security Testing Strategy

### 6.1 File Upload Security

| Test Case | Priority | Attack Vector | Expected Defense |
|-----------|----------|---------------|------------------|
| Executable upload | P0 | Upload .exe file | MIME type validation rejects |
| Path traversal | P0 | Filename: ../../etc/passwd | Sanitize filename |
| Oversized file | P0 | 20MB upload | Size limit enforced (5MB) |
| Malicious image | P0 | Image with embedded script | File validation catches |
| Double extension | P0 | file.jpg.exe | Extension validation |
| MIME type spoofing | P0 | .exe with image/jpeg MIME | Magic number validation |

**Test Example:**
```typescript
describe('File Upload Security', () => {
  it('should reject executable files', async () => {
    const maliciousFile = new File(['MZ...'], 'virus.exe', {
      type: 'application/x-msdownload'
    });

    const response = await uploadReceipt(maliciousFile);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid file type');
  });

  it('should sanitize filenames for path traversal', async () => {
    const file = new File(['image'], '../../etc/passwd.jpg', {
      type: 'image/jpeg'
    });

    const response = await uploadReceipt(file);

    expect(response.body.filename).not.toContain('..');
    expect(response.body.filename).toMatch(/^[a-z0-9-]+\.jpg$/);
  });
});
```

### 6.2 Data Injection Security

| Test Case | Priority | Injection Type | Test Data |
|-----------|----------|----------------|-----------|
| XSS in item name | P0 | Cross-site scripting | `<script>alert('xss')</script>` |
| SQL injection | P0 | SQL injection | `'; DROP TABLE items; --` |
| Command injection | P0 | OS command | `; rm -rf /` |
| NoSQL injection | P1 | MongoDB injection | `{$ne: null}` |
| LDAP injection | P2 | LDAP injection | `*)(objectClass=*)` |

### 6.3 Authentication & Authorization

| Test Case | Priority | Description |
|-----------|----------|-------------|
| Upload without session | P0 | Reject unauthenticated requests |
| Access other user's receipt | P0 | Reject unauthorized access |
| CSRF protection | P0 | Verify token on mutations |
| Session fixation | P1 | Regenerate session after login |
| Brute force protection | P1 | Rate limit failed attempts |

**Coverage Goal:** Zero security vulnerabilities

---

## 7. Accessibility Testing Strategy

### 7.1 WCAG 2.1 AA Compliance

| Criterion | Priority | Test Method |
|-----------|----------|-------------|
| Keyboard navigation | P0 | Manual testing + axe-core |
| Screen reader support | P0 | NVDA/JAWS testing |
| Focus indicators | P0 | Visual inspection |
| Color contrast | P0 | Automated (axe-core) |
| Alt text for images | P0 | Automated validation |
| Form labels | P0 | Automated validation |
| ARIA attributes | P1 | Manual + automated |
| Error announcements | P0 | Screen reader testing |

### 7.2 Accessibility Test Cases

**File:** `tests/accessibility/receipt-upload-a11y.test.tsx`

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReceiptUpload } from '@/components/receipt/ReceiptUpload';

expect.extend(toHaveNoViolations);

describe('ReceiptUpload Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ReceiptUpload />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should announce upload progress to screen readers', async () => {
    const { getByRole } = render(<ReceiptUpload />);

    const status = getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });
});
```

### 7.3 Keyboard Navigation Test

**File:** `tests/e2e/receipt-keyboard-nav.spec.ts`

```typescript
test('complete workflow using keyboard only', async ({ page }) => {
  await page.goto('/receipts/upload');

  // Focus on file input
  await page.keyboard.press('Tab');
  await expect(page.locator('input[type="file"]')).toBeFocused();

  // Trigger file dialog (simulated)
  await page.keyboard.press('Enter');

  // Navigate to submit button
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('button:has-text("Upload")')).toBeFocused();

  // Submit
  await page.keyboard.press('Enter');
});
```

**Coverage Goal:** WCAG 2.1 AA compliance with 0 violations

---

## 8. Test Data & Fixtures

### 8.1 Sample Receipt Images

**Location:** `tests/fixtures/receipts/`

| Filename | Description | Use Case |
|----------|-------------|----------|
| `grocery-clean.jpg` | Perfect quality grocery receipt | Happy path testing |
| `grocery-blurry.jpg` | Slightly blurred receipt | OCR resilience |
| `grocery-rotated-90.jpg` | Rotated 90° clockwise | Rotation handling |
| `restaurant-receipt.jpg` | Restaurant bill format | Format variation |
| `hardware-store.jpg` | Home improvement store | Format variation |
| `receipt-partial.jpg` | Torn/cropped receipt | Edge case |
| `receipt-faded.jpg` | Faded thermal paper | Edge case |
| `receipt-handwritten.jpg` | Handwritten receipt | Edge case |
| `receipt-empty.jpg` | Blank paper | Error handling |
| `receipt-large-5mb.jpg` | 5MB high-res image | Performance testing |
| `receipt-multiple.jpg` | Multiple receipts in one | Edge case |

### 8.2 Mock OCR Output

**Location:** `tests/fixtures/ocr-output/`

**File:** `grocery-clean.json`
```json
{
  "text": "WALMART SUPERCENTER\n123 MAIN ST\nCITY, ST 12345\n\nDATE: 10/15/2025  TIME: 14:32\n\nMILK 2% GAL          $4.99\nBREAD WHEAT          $2.49\nEGGS LARGE 12CT      $3.99\nAPPLES LB @ $1.99    $1.99\n\nSUBTOTAL            $13.46\nTAX                  $1.08\nTOTAL               $14.54\n\nCASH                $20.00\nCHANGE               $5.46\n\nTHANK YOU!",
  "confidence": 94.5
}
```

### 8.3 Expected Parsed Data

**Location:** `tests/fixtures/parsed-data/`

**File:** `grocery-clean-expected.json`
```json
{
  "items": [
    {
      "name": "Milk 2% Gal",
      "price": 4.99,
      "quantity": 1
    },
    {
      "name": "Bread Wheat",
      "price": 2.49,
      "quantity": 1
    },
    {
      "name": "Eggs Large 12ct",
      "price": 3.99,
      "quantity": 1
    },
    {
      "name": "Apples",
      "price": 1.99,
      "quantity": 1,
      "unit": "lb"
    }
  ],
  "date": "2025-10-15T14:32:00.000Z",
  "total": 14.54,
  "subtotal": 13.46,
  "tax": 1.08,
  "store": "Walmart Supercenter"
}
```

### 8.4 Database Seed Data

**Location:** `tests/fixtures/db/`

**File:** `test-categories.json`
```json
[
  { "id": "cat-1", "name": "Groceries", "icon": "shopping-cart" },
  { "id": "cat-2", "name": "Electronics", "icon": "laptop" },
  { "id": "cat-3", "name": "Home & Garden", "icon": "home" }
]
```

**File:** `test-locations.json`
```json
[
  { "id": "loc-1", "name": "Kitchen" },
  { "id": "loc-2", "name": "Pantry" },
  { "id": "loc-3", "name": "Garage" }
]
```

### 8.5 Test Users

**File:** `tests/fixtures/db/test-users.json`
```json
{
  "testUser": {
    "id": "user-test-123",
    "email": "test@example.com",
    "password": "hashedPassword123",
    "name": "Test User",
    "role": "USER"
  },
  "adminUser": {
    "id": "user-admin-123",
    "email": "admin@example.com",
    "password": "hashedPassword456",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

---

## 9. Mocking Strategy

### 9.1 Tesseract.js Mocking

**Unit Tests - Full Mock:**
```typescript
// tests/setup/mocks/tesseract.ts
import { vi } from 'vitest';

export const mockTesseractWorker = {
  load: vi.fn().mockResolvedValue(undefined),
  loadLanguage: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn().mockResolvedValue(undefined),
  recognize: vi.fn(),
  terminate: vi.fn().mockResolvedValue(undefined),
};

export const mockTesseract = {
  createWorker: vi.fn(() => mockTesseractWorker),
};

vi.mock('tesseract.js', () => mockTesseract);
```

**Integration Tests - Partial Mock:**
```typescript
// Use real Tesseract with test images
import { createWorker } from 'tesseract.js';

// Don't mock, use actual OCR with known test images
```

**Performance Tests - Real Implementation:**
```typescript
// No mocking - measure actual OCR performance
```

### 9.2 File System Mocking

```typescript
import { vi } from 'vitest';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake image')),
  unlink: vi.fn().mockResolvedValue(undefined),
}));
```

### 9.3 Prisma Mocking

**Unit Tests:**
```typescript
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

// Example usage
prismaMock.item.createMany.mockResolvedValue({ count: 4 });
```

**Integration Tests:**
```typescript
// Use test database, not mocks
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL
});
```

### 9.4 NextAuth Mocking

```typescript
import { vi } from 'vitest';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// In tests
vi.mocked(getServerSession).mockResolvedValue({
  user: { id: 'user-123', email: 'test@example.com' }
});
```

---

## 10. Test Implementation Checklist

### 10.1 Setup Tasks

- [ ] Install additional test dependencies (if needed)
- [ ] Create test fixtures directory structure
- [ ] Generate sample receipt images
- [ ] Create mock OCR output files
- [ ] Create expected parsed data files
- [ ] Set up test database
- [ ] Configure test environment variables
- [ ] Create test user accounts
- [ ] Set up CI/CD test pipeline

### 10.2 Unit Test Implementation

- [ ] OCR wrapper tests (8 test cases)
- [ ] Receipt parser tests (10 test cases)
- [ ] Price parser tests (8 test cases)
- [ ] Date parser tests (7 test cases)
- [ ] Data validation tests (8 test cases)
- [ ] Item extraction tests (5 test cases)
- [ ] Error handling tests (6 test cases)

### 10.3 Component Test Implementation

- [ ] ReceiptUpload component (8 test cases)
- [ ] ReceiptPreview component (6 test cases)
- [ ] ProcessingStatus component (7 test cases)
- [ ] ItemReviewList component (8 test cases)
- [ ] Error boundary tests (3 test cases)
- [ ] Loading states tests (4 test cases)

### 10.4 Integration Test Implementation

- [ ] Upload API tests (7 test cases)
- [ ] Processing API tests (6 test cases)
- [ ] Database integration tests (5 test cases)
- [ ] Authentication middleware tests (4 test cases)
- [ ] File storage tests (3 test cases)

### 10.5 E2E Test Implementation

- [ ] Happy path workflow (1 test)
- [ ] Multiple items workflow (1 test)
- [ ] Edit items workflow (1 test)
- [ ] Category assignment (1 test)
- [ ] Error recovery (1 test)
- [ ] Cancel workflow (1 test)
- [ ] Mobile workflow (1 test)
- [ ] Keyboard navigation (1 test)
- [ ] Duplicate detection (1 test)
- [ ] Network failure (1 test)

### 10.6 Performance Test Implementation

- [ ] OCR performance benchmarks (3 benchmarks)
- [ ] API response time tests (2 tests)
- [ ] Memory usage tests (2 tests)
- [ ] Concurrent user tests (1 test)
- [ ] Load testing (1 test)

### 10.7 Security Test Implementation

- [ ] File upload security (6 tests)
- [ ] Data injection tests (5 tests)
- [ ] Authentication tests (3 tests)
- [ ] Authorization tests (2 tests)
- [ ] Rate limiting tests (1 test)

### 10.8 Accessibility Test Implementation

- [ ] Automated accessibility tests (5 tests)
- [ ] Keyboard navigation tests (3 tests)
- [ ] Screen reader tests (manual)
- [ ] Focus management tests (2 tests)
- [ ] Color contrast validation (automated)

---

## 11. Test Execution Plan

### 11.1 Development Phase

```bash
# Watch mode during development
npm run test:watch

# Run specific test suites
npm run test:unit         # Unit tests only
npm run test:components   # Component tests only
npm run test:integration  # Integration tests only

# Coverage reporting
npm run test:coverage
```

### 11.2 Pre-Commit Phase

```bash
# Run all tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Type checking
npm run typecheck
```

### 11.3 CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v3
```

### 11.4 Release Phase

```bash
# Full test suite
npm run test:all

# E2E tests on all browsers
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Performance tests
npm run test:performance

# Security scan
npm audit
```

---

## 12. Success Criteria

### 12.1 Code Coverage

- Overall coverage: **≥ 80%**
- Unit test coverage: **≥ 85%**
- Integration test coverage: **≥ 90%**
- Component test coverage: **≥ 75%**

### 12.2 Test Execution

- All P0 tests: **100% passing**
- All P1 tests: **≥ 95% passing**
- Test execution time: **< 5 minutes** (excluding E2E)
- E2E execution time: **< 15 minutes**

### 12.3 Quality Gates

- Zero security vulnerabilities
- Zero accessibility violations (WCAG 2.1 AA)
- All performance benchmarks met
- All E2E workflows functional
- No flaky tests (< 1% failure rate)

### 12.4 Documentation

- All test files documented
- Mock strategies documented
- Test data documented
- Setup instructions complete
- Troubleshooting guide available

---

## 13. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OCR accuracy issues | High | Medium | Test with diverse receipt samples |
| Flaky E2E tests | Medium | High | Use proper wait strategies, retry logic |
| Performance degradation | High | Low | Establish baselines, monitor trends |
| Test data maintenance | Low | High | Automate fixture generation |
| Mock drift from reality | Medium | Medium | Regular integration test runs |
| CI/CD timeout | Medium | Low | Optimize test execution, parallel runs |

---

## 14. Maintenance Plan

### 14.1 Regular Activities

- **Weekly:** Review test failures, update flaky tests
- **Monthly:** Review coverage reports, add missing tests
- **Quarterly:** Update test data, review mock strategies
- **Release:** Run full test suite, update documentation

### 14.2 Test Debt Management

- Track skipped/pending tests
- Prioritize test fixes in backlog
- Regular refactoring of test code
- Update deprecated test utilities

---

## Appendix A: Test Metrics Dashboard

Track these metrics in your testing dashboard:

- Test pass rate (overall, per suite)
- Code coverage trends
- Test execution time trends
- Flaky test rate
- Security vulnerability count
- Accessibility violation count
- Performance benchmark trends
- Mean time to detect (MTTD) bugs
- Mean time to resolve (MTTR) bugs

---

## Appendix B: Reference Links

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Axe](https://github.com/nickcolley/jest-axe)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-15
**Author:** Testing Agent (Hive Mind Collective)
**Status:** Ready for Implementation
