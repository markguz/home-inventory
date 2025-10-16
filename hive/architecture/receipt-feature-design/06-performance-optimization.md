# Performance Optimization Recommendations

## Performance Goals

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Image upload | < 2s | 2-5s | > 5s |
| OCR processing | < 10s | 10-20s | > 20s |
| Review UI render | < 500ms | 500ms-1s | > 1s |
| API response | < 300ms | 300-800ms | > 800ms |
| Item confirmation | < 1s | 1-3s | > 3s |
| **Total flow time** | **< 30s** | **30-60s** | **> 60s** |

---

## Client-Side Optimizations

### 1. Image Upload & Preprocessing

#### 1.1 Client-Side Compression

**Problem**: Large images (5-10 MB) take 10-30 seconds to upload

**Solution**: Compress before upload using browser-image-compression

```typescript
import imageCompression from 'browser-image-compression';

const optimizeImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1.5,              // Target 1.5 MB (good for OCR)
    maxWidthOrHeight: 1920,      // Max dimension
    useWebWorker: true,          // Non-blocking
    fileType: 'image/jpeg',      // JPEG better compression than PNG
    initialQuality: 0.85         // Slight quality reduction
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.warn('Compression failed, using original', error);
    return file; // Fallback to original
  }
};
```

**Impact**:
- Upload time: 10s → 2s (80% reduction)
- Storage costs: 5 MB → 1.5 MB (70% reduction)
- OCR speed: Slightly faster due to smaller image

---

#### 1.2 Progressive Image Upload

**Problem**: User waits for full upload before seeing any progress

**Solution**: Use chunked upload with progress indicator

```typescript
const uploadWithProgress = async (
  file: File,
  onProgress: (percent: number) => void
): Promise<string> => {
  const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await uploadChunk(chunk, i, totalChunks);
    onProgress(((i + 1) / totalChunks) * 100);
  }

  return finalizeUpload();
};
```

**UX Improvement**:
- User sees progress instead of blank loading
- Can cancel long uploads
- Better perceived performance

---

#### 1.3 Lazy Load Tesseract.js

**Problem**: 2 MB tesseract.js bundle loaded on every page

**Solution**: Code split and load only when needed

```typescript
// Before: Loaded on every page load
import Tesseract from 'tesseract.js';

// After: Lazy loaded when receipt feature accessed
const loadTesseract = async () => {
  const Tesseract = await import('tesseract.js');
  return Tesseract;
};

// In receipt upload component
useEffect(() => {
  if (userClickedReceiptFeature) {
    loadTesseract().then(setTesseractReady);
  }
}, [userClickedReceiptFeature]);
```

**Impact**:
- Initial page load: -2 MB (-30% bundle size)
- Time to interactive: 1-2s faster
- Only users using receipt feature pay the cost

---

### 2. OCR Processing

#### 2.1 Web Worker for Non-Blocking OCR

**Problem**: OCR processing freezes UI for 10-15 seconds

**Solution**: Run OCR in Web Worker

```typescript
// ocr-worker.ts
import Tesseract from 'tesseract.js';

let worker: Tesseract.Worker | null = null;

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'INIT') {
    worker = await Tesseract.createWorker('eng');
    self.postMessage({ type: 'READY' });
  }

  if (type === 'RECOGNIZE' && worker) {
    const result = await worker.recognize(data.image);
    self.postMessage({ type: 'RESULT', data: result });
  }
});

// Main thread
const ocrWorker = new Worker(new URL('./ocr-worker.ts', import.meta.url));

ocrWorker.postMessage({ type: 'INIT' });
ocrWorker.postMessage({ type: 'RECOGNIZE', data: { image: imageData } });
```

**Impact**:
- UI remains responsive during OCR
- User can interact with app while processing
- Better user experience on slower devices

---

#### 2.2 Cache Tesseract Language Data

**Problem**: 2-5 second delay loading language data on each use

**Solution**: Cache in IndexedDB

```typescript
const initTesseractWithCache = async () => {
  const worker = await Tesseract.createWorker('eng', 1, {
    cacheMethod: 'refresh', // Use browser cache
    cachePath: '/tesseract-data' // Service worker caching
  });

  // Store trained data in IndexedDB after first load
  const db = await openDB('tesseract-cache');
  const cached = await db.get('lang-data', 'eng');

  if (cached) {
    worker.loadLanguage(cached);
  } else {
    await worker.load('eng');
    const langData = await worker.getLanguageData();
    db.put('lang-data', langData, 'eng');
  }

  return worker;
};
```

**Impact**:
- First use: Same speed
- Subsequent uses: 2-5s faster initialization
- Reduces CDN bandwidth costs

---

#### 2.3 Image Preprocessing for Better OCR

**Problem**: Poor lighting/contrast leads to low confidence and re-processing

**Solution**: Auto-enhance images before OCR

```typescript
const preprocessForOCR = async (image: HTMLImageElement): Promise<Canvas> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // 1. Convert to grayscale (faster OCR)
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // 2. Increase contrast (better edge detection)
  const contrast = 1.3;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = ((data[i] - 128) * contrast) + 128;
    data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
    data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};
```

**Impact**:
- OCR confidence: +10-15% on average
- Reduced re-processing: 30% fewer retries
- Better extraction accuracy

---

### 3. UI Rendering

#### 3.1 Virtualized Lists for Many Items

**Problem**: Rendering 50+ items causes lag

**Solution**: Use react-window for virtualization

```typescript
import { FixedSizeList } from 'react-window';

const ExtractedItemsList = ({ items }: { items: ExtractedItem[] }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ExtractedItemRow item={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

**Impact**:
- 50 items: 2s render → 100ms render (95% faster)
- Smooth scrolling even with 100+ items
- Lower memory usage

---

#### 3.2 Optimize Image Display

**Problem**: Showing full-resolution images (5 MB) slows down review UI

**Solution**: Generate thumbnails for UI, keep original for detail view

```typescript
const generateThumbnail = async (file: File): Promise<string> => {
  const options = {
    maxWidthOrHeight: 400,  // Small for side-by-side view
    maxSizeMB: 0.1,
    useWebWorker: true
  };

  const thumbnail = await imageCompression(file, options);
  return URL.createObjectURL(thumbnail);
};

// In component
const [thumbnailUrl, setThumbnailUrl] = useState<string>();
const [fullImageUrl, setFullImageUrl] = useState<string>();

useEffect(() => {
  generateThumbnail(receiptImage).then(setThumbnailUrl);
  setFullImageUrl(URL.createObjectURL(receiptImage));
}, [receiptImage]);

return (
  <>
    <img src={thumbnailUrl} onClick={() => openLightbox(fullImageUrl)} />
  </>
);
```

**Impact**:
- Review page load: 3s → 500ms
- Reduced memory usage
- Faster initial render

---

#### 3.3 Debounced Auto-Save

**Problem**: Saving on every keystroke creates too many API calls

**Solution**: Debounce saves with 1-second delay

```typescript
import { useDebouncedCallback } from 'use-debounce';

const ReviewInterface = ({ receiptId, items }: Props) => {
  const saveChanges = useDebouncedCallback(
    async (updatedItems: ExtractedItem[]) => {
      await api.updateReceipt(receiptId, { extractedItems: updatedItems });
      showToast({ type: 'success', message: 'Changes saved' });
    },
    1000 // Wait 1s after last edit
  );

  const handleItemEdit = (itemId: string, changes: Partial<ExtractedItem>) => {
    const updated = items.map(item =>
      item.id === itemId ? { ...item, ...changes } : item
    );
    setItems(updated);
    saveChanges(updated); // Debounced
  };
};
```

**Impact**:
- API calls: 50 requests → 5 requests (90% reduction)
- Reduced server load
- Better rate limit headroom

---

## Server-Side Optimizations

### 4. API Response Times

#### 4.1 Database Query Optimization

**Problem**: Fetching receipt with items takes 800ms

**Solution**: Use JOIN instead of separate queries

```sql
-- Before: 2 queries (receipt, then items)
SELECT * FROM receipts WHERE id = $1; -- 100ms
SELECT * FROM extracted_items WHERE receipt_id = $1; -- 700ms

-- After: 1 query with JOIN
SELECT
  r.*,
  json_agg(
    json_build_object(
      'id', ei.id,
      'name', ei.name,
      'quantity', ei.quantity,
      'confidence', ei.confidence
    ) ORDER BY ei.created_at
  ) AS extracted_items
FROM receipts r
LEFT JOIN extracted_items ei ON ei.receipt_id = r.id
WHERE r.id = $1
  AND r.user_id = auth.uid()
GROUP BY r.id; -- 120ms
```

**Impact**:
- Query time: 800ms → 120ms (85% reduction)
- Reduced database round trips
- Better connection pool utilization

---

#### 4.2 Batch Insert Items

**Problem**: Creating 10 inventory items takes 1.5s (150ms each)

**Solution**: Single INSERT with multiple VALUES

```sql
-- Before: 10 separate INSERTs
INSERT INTO items (...) VALUES (...); -- x10

-- After: 1 batch INSERT
INSERT INTO items (name, quantity, category_id, location_id, receipt_id, user_id)
VALUES
  ('Item 1', 2, 'cat-uuid', 'loc-uuid', 'receipt-uuid', 'user-uuid'),
  ('Item 2', 1, 'cat-uuid', 'loc-uuid', 'receipt-uuid', 'user-uuid'),
  ...
RETURNING id, name, quantity;
```

**Impact**:
- Insert time: 1.5s → 200ms (87% reduction)
- Fewer database locks
- Better transaction performance

---

#### 4.3 Connection Pooling

**Problem**: Each API request opens new database connection (100ms overhead)

**Solution**: Use connection pool

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000
});

// In API route
const result = await pool.query('SELECT ...'); // Reuses connection
```

**Impact**:
- Per-request overhead: 100ms → 5ms
- Supports more concurrent requests
- Better resource utilization

---

### 5. Caching Strategies

#### 5.1 React Query for Client-Side Caching

**Problem**: Re-fetching same data on every navigation

**Solution**: React Query with appropriate stale times

```typescript
const useReceipt = (receiptId: string) => {
  return useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => api.getReceipt(receiptId),
    staleTime: 5 * 60 * 1000,    // Fresh for 5 minutes
    cacheTime: 30 * 60 * 1000,   // Keep in cache for 30 minutes
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
  });
};

// Prefetch receipt when user navigates to list
const prefetchReceipt = (receiptId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => api.getReceipt(receiptId)
  });
};
```

**Impact**:
- Navigation to cached page: 500ms → instant
- Reduced API calls: 50% fewer requests
- Better offline experience

---

#### 5.2 Cache Category/Location Lists

**Problem**: Fetching categories on every component mount

**Solution**: Long-lived cache with background refresh

```typescript
const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: Infinity,          // Never consider stale
    cacheTime: Infinity,          // Keep in cache forever
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 60 // Refresh hourly in background
  });
};
```

**Impact**:
- Zero loading time for categories
- Reduced database queries
- Always up-to-date via background refresh

---

#### 5.3 CDN for Image Serving

**Problem**: Serving images from origin server is slow

**Solution**: Use CDN with aggressive caching

```typescript
// In Supabase Storage configuration
const storageClient = supabase.storage.from('receipts-temp');

const getImageUrl = async (path: string) => {
  const { data } = await storageClient.createSignedUrl(path, 86400); // 24h

  // Add CDN URL transformation
  const cdnUrl = data.signedUrl.replace(
    'storage.example.com',
    'cdn.example.com'
  );

  return cdnUrl;
};
```

**Image Optimization Headers**:
```
Cache-Control: public, max-age=86400
Content-Type: image/jpeg
Vary: Accept-Encoding
```

**Impact**:
- Image load time: 1-3s → 100-300ms
- Reduced origin server bandwidth
- Better global performance

---

## Background Job Optimizations

### 6.1 Efficient Image Cleanup

**Problem**: Daily cleanup job scans entire table (slow as data grows)

**Solution**: Index-based cleanup with batching

```sql
-- Add index on expiration time
CREATE INDEX idx_receipts_expired ON receipts(image_expires_at)
  WHERE image_expires_at IS NOT NULL
    AND deleted_at IS NULL;

-- Efficient cleanup query (uses index)
WITH expired_images AS (
  SELECT id, image_url
  FROM receipts
  WHERE image_expires_at < NOW()
    AND image_url IS NOT NULL
    AND deleted_at IS NULL
  LIMIT 100 -- Process in batches
)
DELETE FROM storage.objects
WHERE bucket_id = 'receipts-temp'
  AND name IN (SELECT image_url FROM expired_images);

-- Update receipts
UPDATE receipts
SET image_url = NULL,
    image_expires_at = NULL
WHERE id IN (SELECT id FROM expired_images);
```

**Impact**:
- Cleanup time: 5 minutes → 30 seconds
- No table scans
- Can run more frequently

---

## Monitoring & Profiling

### Performance Metrics to Track

```typescript
// Client-side performance monitoring
const trackPerformance = (stage: string, duration: number) => {
  analytics.track('receipt_processing_performance', {
    stage,
    duration,
    timestamp: Date.now()
  });
};

// Example usage
const startTime = Date.now();
await processOCR(image);
trackPerformance('ocr', Date.now() - startTime);
```

**Key Metrics**:
1. **Image Upload Time**: P50, P95, P99
2. **OCR Processing Time**: By image size
3. **API Response Time**: By endpoint
4. **Database Query Time**: Slow query log
5. **Bundle Size**: Track over time
6. **Time to Interactive**: First meaningful paint

### Performance Budget

```javascript
// performance-budget.json
{
  "budgets": [
    {
      "resourceType": "script",
      "budget": 300 // KB
    },
    {
      "resourceType": "image",
      "budget": 1500 // KB
    },
    {
      "metric": "interactive",
      "budget": 3000 // ms
    }
  ]
}
```

---

## Load Testing Recommendations

### Simulate Real-World Usage

```typescript
// Using k6 for load testing
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 }     // Ramp down
  ]
};

export default function() {
  // 1. Upload receipt
  const image = open('./test-receipt.jpg', 'b');
  const uploadRes = http.post(
    'https://api.example.com/receipts/upload',
    { image: http.file(image, 'receipt.jpg') },
    { headers: { Authorization: `Bearer ${__ENV.TOKEN}` } }
  );
  check(uploadRes, { 'upload successful': (r) => r.status === 201 });

  sleep(10); // OCR processing time

  // 2. Create draft
  const draftRes = http.post(
    'https://api.example.com/receipts',
    JSON.stringify({ merchantName: 'Test Store', extractedItems: [...] }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(draftRes, { 'draft created': (r) => r.status === 201 });

  sleep(5);

  // 3. Confirm items
  const confirmRes = http.post(
    `https://api.example.com/receipts/${receiptId}/confirm`,
    JSON.stringify({ items: [...] })
  );
  check(confirmRes, { 'items confirmed': (r) => r.status === 201 });

  sleep(30); // User think time
}
```

**Test Goals**:
- 95% of requests complete in < 1s
- 0% error rate under normal load
- Graceful degradation under 2x load

---

## Summary: Quick Wins

| Optimization | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| Client-side image compression | Low | High (80% upload time) | HIGH |
| Lazy load Tesseract.js | Low | Medium (30% bundle) | HIGH |
| Batch database inserts | Low | High (87% insert time) | HIGH |
| React Query caching | Low | High (50% API calls) | HIGH |
| Web Worker for OCR | Medium | High (UI responsiveness) | MEDIUM |
| Virtualized lists | Medium | Medium (large lists) | MEDIUM |
| CDN for images | High | High (global performance) | MEDIUM |
| Image preprocessing | Medium | Medium (accuracy) | LOW |
| Connection pooling | Low | Medium (scalability) | LOW |

**Recommended Implementation Order**:
1. Client-side compression (immediate impact, low effort)
2. Batch inserts (database performance)
3. Lazy load Tesseract.js (bundle size)
4. React Query caching (API reduction)
5. Web Worker (UI responsiveness)
