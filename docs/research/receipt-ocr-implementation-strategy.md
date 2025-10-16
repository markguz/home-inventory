# Receipt OCR Implementation Strategy

**Quick Reference Guide for Developers**

---

## Quick Start: 3-Step Implementation

### Step 1: Install Dependencies (5 minutes)

```bash
cd home-inventory

# Already installed: tesseract.js (noted in package.json)
# Install image processing
npm install sharp

# Optional: For advanced preprocessing
npm install opencv4nodejs
```

### Step 2: Create OCR API Route (30 minutes)

**File**: `src/app/api/receipts/process/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await image.arrayBuffer());

    // Preprocess image
    const preprocessed = await sharp(buffer)
      .resize(1200, null, { fit: 'inside' })
      .grayscale()
      .normalize()
      .median(3)
      .sharpen()
      .toBuffer();

    // Run OCR
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(preprocessed);
    await worker.terminate();

    // Parse text (basic pattern matching)
    const parsed = parseReceiptText(text);

    return NextResponse.json({
      success: true,
      rawText: text,
      parsed: parsed
    });

  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    );
  }
}

function parseReceiptText(text: string) {
  // Extract total
  const totalMatch = text.match(/total:?\s*\$?(\d+\.\d{2})/i);
  const total = totalMatch ? parseFloat(totalMatch[1]) : null;

  // Extract date
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  const date = dateMatch ? dateMatch[1] : null;

  // Extract items (basic pattern: text followed by price)
  const itemPattern = /(.+?)\s+\$?(\d+\.\d{2})/g;
  const items = [...text.matchAll(itemPattern)]
    .map(m => ({
      name: m[1].trim(),
      price: parseFloat(m[2])
    }))
    .filter(item =>
      item.name.length > 2 &&
      item.price > 0 &&
      !item.name.toLowerCase().includes('total')
    );

  return {
    total,
    date,
    items,
    confidence: items.length > 0 ? 0.7 : 0.3
  };
}
```

### Step 3: Create Upload Component (1 hour)

**File**: `src/components/receipts/receipt-upload.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ParsedItem {
  name: string;
  price: number;
}

export function ReceiptUpload() {
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.loading('Processing receipt...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/receipts/process', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setParsedData(data.parsed);
        toast.success(`Found ${data.parsed.items.length} items!`);
      } else {
        toast.error(data.error || 'Failed to process receipt');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process receipt');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id="receipt-upload"
        />
        <label htmlFor="receipt-upload" className="cursor-pointer">
          <Button disabled={uploading} asChild>
            <span>
              {uploading ? 'Processing...' : 'Upload Receipt'}
            </span>
          </Button>
        </label>
      </div>

      {parsedData && (
        <div className="space-y-4">
          <h3 className="font-semibold">Extracted Items</h3>
          {parsedData.items.map((item: ParsedItem, i: number) => (
            <div key={i} className="flex justify-between p-2 border rounded">
              <span>{item.name}</span>
              <span>${item.price.toFixed(2)}</span>
            </div>
          ))}
          {parsedData.total && (
            <div className="font-bold flex justify-between">
              <span>Total</span>
              <span>${parsedData.total.toFixed(2)}</span>
            </div>
          )}
          <Button onClick={() => {
            // TODO: Add items to inventory
            toast.success('Items added to inventory!');
          }}>
            Add to Inventory
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## Architecture Overview

```
User Upload Image
        ↓
  [ Preprocessing ]
   - Resize to 1200px
   - Convert to grayscale
   - Enhance contrast
   - Remove noise
   - Sharpen
        ↓
   [ Tesseract.js OCR ]
   - Extract raw text
   - ~2-3 seconds
        ↓
   [ Parse Text ]
   - Extract date, total
   - Find line items
   - Pattern matching
        ↓
   [ Return to Client ]
   - Show parsed items
   - Allow review/edit
   - Add to inventory
```

---

## Key Design Decisions

### ✅ **Decision 1: Server-Side OCR Processing**

**Why:**
- Preprocessing requires sharp (Node.js library)
- Better performance on server
- Reduces client bundle size
- Allows caching and rate limiting

**Alternative**: Client-side OCR with Web Workers
- **Pros**: No server load, works offline
- **Cons**: Larger bundle, slower on mobile

---

### ✅ **Decision 2: Pattern-Based Parsing for MVP**

**Why:**
- Zero cost
- Fast (< 100ms)
- Good enough for 60-70% of receipts
- Easy to debug and improve

**Alternative**: LLM Parsing (GPT-4)
- **Pros**: 85-95% accuracy, handles complex formats
- **Cons**: $0.01-0.03 per receipt, slower
- **Recommendation**: Add as premium feature later

---

### ✅ **Decision 3: Manual Review Required**

**Why:**
- OCR is not 100% accurate
- Users need to verify before saving
- Builds trust in the system
- Allows learning from corrections

**Implementation:**
- Show extracted items in editable form
- Highlight low-confidence items
- Allow adding missing items
- Save corrections for future improvements

---

## Testing Strategy

### Unit Tests

```typescript
// tests/ocr/parser.test.ts
import { parseReceiptText } from '@/lib/ocr/parser';

describe('Receipt Parser', () => {
  it('should extract total', () => {
    const text = 'SUBTOTAL $45.00\nTAX $3.60\nTOTAL $48.60';
    const result = parseReceiptText(text);
    expect(result.total).toBe(48.60);
  });

  it('should extract date', () => {
    const text = 'Date: 10/15/2025\nStore #1234';
    const result = parseReceiptText(text);
    expect(result.date).toBe('10/15/2025');
  });

  it('should extract line items', () => {
    const text = 'Milk $3.99\nBread $2.50\nEggs $4.29';
    const result = parseReceiptText(text);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].name).toBe('Milk');
    expect(result.items[0].price).toBe(3.99);
  });
});
```

### Integration Tests

```typescript
// tests/api/receipts.test.ts
import { POST } from '@/app/api/receipts/process/route';

describe('Receipt Processing API', () => {
  it('should process receipt image', async () => {
    const formData = new FormData();
    const testImage = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
    formData.append('image', testImage);

    const response = await POST({
      formData: () => Promise.resolve(formData)
    } as any);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.parsed).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/receipt-upload.spec.ts
import { test, expect } from '@playwright/test';

test('should upload and process receipt', async ({ page }) => {
  await page.goto('/receipts/upload');

  // Upload test receipt
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/receipt-sample.jpg');

  // Wait for processing
  await expect(page.locator('text=Processing...')).toBeVisible();
  await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: 10000 });

  // Verify items extracted
  await expect(page.locator('text=Extracted Items')).toBeVisible();
  const items = page.locator('[data-testid="parsed-item"]');
  await expect(items).toHaveCount(3);
});
```

---

## Performance Optimization

### 1. Image Size Limits

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 4000; // pixels

if (file.size > MAX_FILE_SIZE) {
  throw new Error('Image too large. Max 5MB.');
}

const { width, height } = await sharp(buffer).metadata();
if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
  buffer = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside' })
    .toBuffer();
}
```

### 2. Caching Tesseract Worker

```typescript
// lib/ocr/tesseract.ts
let worker: Worker | null = null;

export async function getOCRWorker() {
  if (!worker) {
    worker = await createWorker('eng');
  }
  return worker;
}

// Remember to terminate on server shutdown
process.on('SIGTERM', async () => {
  if (worker) {
    await worker.terminate();
  }
});
```

### 3. Progressive Loading

```typescript
// Show preview immediately, process in background
function ReceiptUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  function handleFileSelect(file: File) {
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Process in background
    processReceipt(file);
  }
}
```

---

## Error Handling

### Common Errors and Solutions

```typescript
// lib/ocr/errors.ts
export class OCRError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'OCRError';
  }
}

export const OCRErrors = {
  NO_TEXT_DETECTED: new OCRError(
    'No text detected in image',
    'NO_TEXT',
    'Could not read text from receipt. Please try:\n• Better lighting\n• Flatter surface\n• Clearer photo'
  ),

  LOW_QUALITY: new OCRError(
    'Image quality too low',
    'LOW_QUALITY',
    'Image appears blurry or low quality. Please retake the photo.'
  ),

  INVALID_FORMAT: new OCRError(
    'Invalid image format',
    'INVALID_FORMAT',
    'Please upload a valid image file (JPG, PNG, WebP)'
  )
};
```

---

## Future Enhancements

### Phase 2: Store-Specific Parsers

```typescript
// lib/ocr/stores/walmart.ts
export function parseWalmartReceipt(text: string) {
  // Walmart-specific patterns
  const items = text.match(/\d{12}\s+(.+?)\s+(\d+\.\d{2})\s+[A-Z]/g);
  // ... custom logic
}

// lib/ocr/parser.ts
function detectStore(text: string): Store | null {
  if (text.toLowerCase().includes('walmart')) {
    return 'walmart';
  }
  // ... more stores
}
```

### Phase 3: LLM-Enhanced Parsing

```typescript
// lib/ocr/llm-parser.ts
import { OpenAI } from 'openai';

export async function parseWithGPT4(text: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{
      role: 'system',
      content: 'Extract structured data from receipt text.'
    }, {
      role: 'user',
      content: `Parse this receipt:\n\n${text}\n\nReturn JSON with: store, date, items[], total, tax`
    }],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Phase 4: Batch Processing

```typescript
// Process multiple receipts
export async function processBatch(images: File[]) {
  const worker = await getOCRWorker();

  const results = await Promise.all(
    images.map(async (image) => {
      const buffer = await preprocessImage(image);
      const { data: { text } } = await worker.recognize(buffer);
      return parseReceiptText(text);
    })
  );

  return results;
}
```

---

## Monitoring & Analytics

### Track Accuracy

```typescript
// Track user corrections to improve parser
export async function recordCorrection(
  originalData: ParsedData,
  correctedData: ParsedData
) {
  await prisma.receiptCorrection.create({
    data: {
      originalItems: originalData.items,
      correctedItems: correctedData.items,
      accuracy: calculateAccuracy(originalData, correctedData)
    }
  });
}

function calculateAccuracy(original: ParsedData, corrected: ParsedData): number {
  const totalFields = corrected.items.length * 2; // name + price
  const correctFields = corrected.items.filter((item, i) => {
    const orig = original.items[i];
    return orig?.name === item.name && orig?.price === item.price;
  }).length * 2;

  return correctFields / totalFields;
}
```

### Performance Metrics

```typescript
// Track processing time
export async function trackProcessingTime(
  receiptId: string,
  startTime: number,
  endTime: number
) {
  const duration = endTime - startTime;

  await prisma.receiptMetrics.create({
    data: {
      receiptId,
      processingTime: duration,
      timestamp: new Date()
    }
  });

  // Alert if processing is slow
  if (duration > 5000) {
    console.warn(`Slow OCR processing: ${duration}ms for receipt ${receiptId}`);
  }
}
```

---

## Security Considerations

### 1. Input Validation

```typescript
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateImage(file: File) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
}
```

### 2. Rate Limiting

```typescript
// Using next-rate-limit or similar
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

export async function POST(request: NextRequest) {
  try {
    await limiter.check(10, 'RECEIPT_UPLOAD'); // 10 requests per minute
  } catch {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // ... rest of handler
}
```

### 3. Privacy Protection

```typescript
// Don't store raw receipt images longer than necessary
export async function cleanupOldReceipts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Delete old receipt images (keep parsed data)
  await prisma.receipt.updateMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      imageUrl: { not: null }
    },
    data: {
      imageUrl: null // Remove image URL, keep parsed data
    }
  });
}
```

---

## Deployment Checklist

- [ ] Install dependencies (`tesseract.js`, `sharp`)
- [ ] Create OCR API route
- [ ] Add image preprocessing
- [ ] Implement receipt parser
- [ ] Create upload component
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Add rate limiting
- [ ] Configure environment variables
- [ ] Test with sample receipts
- [ ] Deploy to staging
- [ ] Gather user feedback
- [ ] Optimize based on metrics
- [ ] Deploy to production

---

## Resources

- **Tesseract.js Docs**: https://tesseract.projectnaptha.com/
- **Sharp Docs**: https://sharp.pixelplumbing.com/
- **Sample Receipts for Testing**: https://github.com/JustCabaret/AIReceiptParser/tree/main/backend/receipts
- **Full Research Report**: `/docs/research/receipt-ocr-research.md`

---

**Ready to start? Begin with Step 1 above! 🚀**
