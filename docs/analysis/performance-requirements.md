# Home Inventory System - Performance Requirements

## Executive Summary

This document defines performance benchmarks, optimization strategies, and monitoring requirements for the home inventory management system. The goal is to deliver a fast, responsive application that works well on all devices and network conditions.

---

## 1. Performance Targets

### 1.1 Core Web Vitals (Google Lighthouse)

**Target Scores** (Production):
| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| **Performance** | 90+ | 90-100 | 50-89 | 0-49 |
| **Accessibility** | 90+ | 90-100 | 50-89 | 0-49 |
| **Best Practices** | 90+ | 90-100 | 50-89 | 0-49 |
| **SEO** | 90+ | 90-100 | 50-89 | 0-49 |

**Web Vitals Targets**:
| Metric | Good | Needs Improvement | Poor | Our Target |
|--------|------|-------------------|------|------------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s | **≤ 2.0s** |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms | **≤ 100ms** |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 | **≤ 0.1** |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3.0s | > 3.0s | **≤ 1.5s** |
| **TTI** (Time to Interactive) | ≤ 3.8s | 3.8s - 7.3s | > 7.3s | **≤ 3.0s** |
| **TBT** (Total Blocking Time) | ≤ 200ms | 200ms - 600ms | > 600ms | **≤ 200ms** |

---

### 1.2 Page Load Performance

**Network Conditions**:
| Connection | Target Load Time | Max Load Time | Acceptable |
|------------|------------------|---------------|------------|
| **Fast 4G** (4 Mbps) | < 1.5s | 2.0s | ✅ |
| **Regular 4G** (1.6 Mbps) | < 2.5s | 3.5s | ✅ |
| **3G** (400 Kbps) | < 4.0s | 6.0s | ⚠️ Acceptable |
| **Slow 3G** (50 Kbps) | < 8.0s | 12.0s | ❌ Degraded |

**Page-Specific Targets**:
| Page | Initial Load | Subsequent Navigation | Cache Hit |
|------|--------------|----------------------|-----------|
| Dashboard | < 2.0s | < 500ms | < 200ms |
| Item List | < 2.0s | < 500ms | < 200ms |
| Item Detail | < 1.5s | < 400ms | < 150ms |
| Item Form | < 1.8s | < 500ms | < 200ms |
| Search Results | < 2.5s | < 600ms | < 300ms |

---

### 1.3 Interaction Performance

**User Interaction Response Times**:
| Action | Target | Max Acceptable | Critical Threshold |
|--------|--------|----------------|-------------------|
| Search (keystroke) | < 300ms | 500ms | 1000ms |
| Filter apply | < 400ms | 600ms | 1000ms |
| Form validation | < 50ms | 100ms | 200ms |
| Image upload | < 3.0s | 5.0s | 10.0s |
| Item create/update | < 1.0s | 2.0s | 3.0s |
| Delete item | < 500ms | 1.0s | 2.0s |
| Navigation (client) | < 200ms | 400ms | 800ms |
| Modal open/close | < 150ms | 300ms | 500ms |

---

### 1.4 Database Performance

**Query Performance** (SQLite):
| Query Type | Target | Max Acceptable | Optimization Needed |
|------------|--------|----------------|---------------------|
| Single item fetch | < 5ms | 10ms | > 20ms |
| Item list (20 items) | < 20ms | 50ms | > 100ms |
| Search (full-text) | < 100ms | 200ms | > 500ms |
| Filtered list | < 50ms | 100ms | > 200ms |
| Aggregations | < 100ms | 200ms | > 500ms |
| Item with relations | < 10ms | 20ms | > 50ms |

**Database Size Limits**:
- **MVP (SQLite)**: Up to 10,000 items, 2GB database size
- **Items**: Average 2KB per item (with metadata)
- **Images**: Stored externally (Cloudinary)
- **Expected DB size**: 20MB (10K items)

---

## 2. Bundle Size Optimization

### 2.1 JavaScript Bundle Targets

**Initial Bundle Sizes**:
| Bundle | Target | Max Acceptable | Current Baseline |
|--------|--------|----------------|------------------|
| **First Load JS** | < 200KB | 300KB | ~150KB (Next.js) |
| **Page JS** (avg) | < 50KB | 100KB | ~30KB |
| **Total JS** | < 500KB | 750KB | ~400KB |

**Bundle Breakdown**:
```
First Load JS (gzipped):
├─ Framework (Next.js, React): ~80KB
├─ UI Components (shadcn/ui): ~40KB
├─ Form Library (React Hook Form): ~24KB
├─ ORM (Drizzle): ~15KB
├─ Validation (Zod): ~12KB
├─ Utilities (date-fns, etc.): ~20KB
└─ App Code: ~50KB
─────────────────────────────────
Total: ~241KB (target: < 300KB)
```

**Optimization Strategies**:
1. **Dynamic Imports**: Lazy-load non-critical components
2. **Tree Shaking**: Remove unused exports
3. **Code Splitting**: Route-based splitting (automatic in Next.js)
4. **Bundle Analysis**: Regular `@next/bundle-analyzer` checks

```typescript
// Dynamic imports for heavy components
const ImageGallery = dynamic(() => import('@/components/ImageGallery'), {
  loading: () => <Skeleton />,
  ssr: false
})

const ChartWidget = dynamic(() => import('@/components/ChartWidget'), {
  ssr: false
})
```

---

### 2.2 CSS Bundle Targets

**CSS Size**:
| Bundle | Target | Max Acceptable | Optimization |
|--------|--------|----------------|--------------|
| **Critical CSS** | < 20KB | 30KB | Inline in `<head>` |
| **Total CSS** | < 50KB | 75KB | Tailwind purge |

**Tailwind Optimization**:
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  // Aggressive purging
  safelist: [],
  // Use JIT mode (default in Tailwind 3+)
  mode: 'jit'
}
```

---

## 3. Image Optimization

### 3.1 Image Performance Targets

**Image Load Times**:
| Image Type | Size | Load Time (4G) | Load Time (3G) |
|------------|------|----------------|----------------|
| Thumbnail | 10-20KB | < 300ms | < 800ms |
| Card Image | 30-50KB | < 500ms | < 1.5s |
| Detail Image | 100-200KB | < 1.0s | < 3.0s |
| Full Size | 200-500KB | < 2.0s | < 5.0s |

---

### 3.2 Next.js Image Optimization

**Configuration**:
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365 // 1 year
  }
}
```

**Usage**:
```tsx
import Image from 'next/image'

// Optimized image component
<Image
  src={item.imageUrl}
  alt={item.name}
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL={item.blurHash}
  loading="lazy" // Lazy load below fold
  quality={85} // Balance quality/size
  className="rounded-lg"
/>
```

---

### 3.3 Responsive Images

**Breakpoint Strategy**:
```tsx
// Image sizes for different viewports
<Image
  src={item.imageUrl}
  alt={item.name}
  width={1200}
  height={900}
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
/>

// Generates:
// Mobile (640px): 640px wide image
// Tablet (1024px): 512px wide image
// Desktop: 400px wide image
```

---

### 3.4 Progressive Image Loading

**LQIP (Low Quality Image Placeholder)**:
```typescript
// Generate blur placeholder at upload time
import { getPlaiceholder } from 'plaiceholder'

async function processImage(imageBuffer: Buffer) {
  const { base64, img } = await getPlaiceholder(imageBuffer)

  return {
    imageUrl: img.src,
    blurDataURL: base64
  }
}

// Use in component
<Image
  src={item.imageUrl}
  placeholder="blur"
  blurDataURL={item.blurDataURL}
  {...props}
/>
```

---

## 4. Database Optimization

### 4.1 Query Optimization

**Index Strategy**:
```sql
-- Indexes for common queries (created at schema level)
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_location ON items(location);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_updated_at ON items(updated_at DESC);
CREATE INDEX idx_items_quantity ON items(quantity);

-- Composite index for filtered lists
CREATE INDEX idx_items_category_location ON items(category_id, location);
```

**Query Patterns**:
```typescript
// ❌ BAD: N+1 query problem
async function getItemsWithCategories() {
  const items = await db.select().from(items)

  for (const item of items) {
    item.category = await db.select()
      .from(categories)
      .where(eq(categories.id, item.category_id))
  }

  return items
}

// ✅ GOOD: Single query with join
async function getItemsWithCategories() {
  return db.query.items.findMany({
    with: {
      category: true,
      tags: {
        with: { tag: true }
      }
    },
    limit: 20
  })
}
```

---

### 4.2 Pagination Strategy

**Cursor-Based Pagination** (Recommended):
```typescript
// Efficient for large datasets
async function getItemsPaginated(cursor?: string, limit = 20) {
  return db.query.items.findMany({
    where: cursor ? lt(items.id, cursor) : undefined,
    orderBy: desc(items.updated_at),
    limit: limit + 1 // Fetch one extra to check if more exist
  })
}

// Client-side usage
const items = await getItemsPaginated(lastItemId, 20)
const hasMore = items.length > 20
const displayItems = items.slice(0, 20)
```

**Offset-Based Pagination** (Simpler, less efficient):
```typescript
async function getItemsPage(page = 1, limit = 20) {
  const offset = (page - 1) * limit

  const [items, total] = await Promise.all([
    db.select().from(items).limit(limit).offset(offset),
    db.select({ count: count() }).from(items)
  ])

  return {
    items,
    total: total[0].count,
    page,
    totalPages: Math.ceil(total[0].count / limit)
  }
}
```

---

### 4.3 Caching Strategy

**React Cache (Server Components)**:
```typescript
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// Cache for the duration of a request
export const getCategories = cache(async () => {
  return db.query.categories.findMany({
    orderBy: asc(categories.name)
  })
})

// Cache with revalidation
export const getItems = unstable_cache(
  async () => {
    return db.query.items.findMany({
      limit: 20,
      orderBy: desc(items.updated_at)
    })
  },
  ['items-list'],
  {
    revalidate: 60, // Revalidate every 60 seconds
    tags: ['items']
  }
)
```

**SQLite Pragma Optimizations**:
```typescript
import Database from 'better-sqlite3'

const sqlite = new Database('inventory.db')

// Performance pragmas
sqlite.pragma('journal_mode = WAL') // Write-Ahead Logging
sqlite.pragma('synchronous = NORMAL') // Balance safety/speed
sqlite.pragma('cache_size = -64000') // 64MB cache
sqlite.pragma('temp_store = MEMORY') // Temp tables in memory
sqlite.pragma('mmap_size = 30000000000') // Memory-mapped I/O

export const db = drizzle(sqlite, { schema })
```

---

## 5. Network Performance

### 5.1 HTTP/2 and Compression

**Next.js Configuration**:
```typescript
// next.config.js
module.exports = {
  compress: true, // gzip compression
  poweredByHeader: false, // Remove X-Powered-By header

  // HTTP headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

---

### 5.2 Prefetching and Preloading

**Next.js Link Prefetching**:
```tsx
import Link from 'next/link'

// Automatic prefetch on hover (default)
<Link href="/inventory/item-123" prefetch={true}>
  View Item
</Link>

// Prefetch critical routes
<Link href="/inventory" prefetch={true}>
  Inventory
</Link>

// No prefetch for less common routes
<Link href="/settings" prefetch={false}>
  Settings
</Link>
```

**Resource Hints**:
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

### 5.3 API Response Optimization

**Response Compression**:
```typescript
// Middleware for API routes
import { NextResponse } from 'next/server'
import { gzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)

export async function compressResponse(data: any) {
  const json = JSON.stringify(data)

  if (json.length > 1024) { // Only compress if > 1KB
    const compressed = await gzipAsync(json)

    return new NextResponse(compressed, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    })
  }

  return NextResponse.json(data)
}
```

**Field Selection** (Only return needed fields):
```typescript
// ❌ BAD: Returns all fields
const items = await db.select().from(items)

// ✅ GOOD: Select only needed fields
const items = await db.select({
  id: items.id,
  name: items.name,
  imageUrl: items.imageUrl,
  category: {
    id: categories.id,
    name: categories.name
  }
}).from(items)
.leftJoin(categories, eq(items.category_id, categories.id))
```

---

## 6. Client-Side Performance

### 6.1 React Performance Optimization

**Memoization**:
```tsx
import { memo, useMemo, useCallback } from 'react'

// Memoize expensive components
export const ItemCard = memo(({ item }: { item: Item }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  )
})

// Memoize expensive calculations
function ItemList({ items }: { items: Item[] }) {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [items])

  const handleItemClick = useCallback((id: string) => {
    router.push(`/inventory/${id}`)
  }, [router])

  return (
    <>
      {sortedItems.map(item => (
        <ItemCard key={item.id} item={item} onClick={handleItemClick} />
      ))}
    </>
  )
}
```

---

### 6.2 Virtualization (Large Lists)

**React Virtual**:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export function VirtualizedItemList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated row height
    overscan: 5 // Render 5 extra items
  })

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <ItemCard item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### 6.3 Debouncing and Throttling

**Search Input Debouncing**:
```tsx
import { useDebouncedCallback } from 'use-debounce'

export function SearchInput() {
  const [query, setQuery] = useState('')

  const debouncedSearch = useDebouncedCallback(
    async (searchTerm: string) => {
      const results = await searchItems(searchTerm)
      setResults(results)
    },
    300 // 300ms delay
  )

  return (
    <input
      type="search"
      value={query}
      onChange={(e) => {
        setQuery(e.target.value)
        debouncedSearch(e.target.value)
      }}
      placeholder="Search inventory..."
    />
  )
}
```

---

## 7. Performance Monitoring

### 7.1 Lighthouse CI

**GitHub Actions Workflow**:
```yaml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm install -g @lhci/cli
      - run: lhci autorun
```

**Configuration**:
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000/', 'http://localhost:3000/inventory'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}
```

---

### 7.2 Real User Monitoring (RUM)

**Web Vitals Tracking**:
```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}

// Custom web vitals reporting
export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric)

  // Send to analytics service
  if (metric.label === 'web-vital') {
    // gtag('event', metric.name, { ... })
  }
}
```

---

### 7.3 Performance Budget

**Bundle Size Budget**:
```javascript
// next.config.js
module.exports = {
  experimental: {
    bundlePagesRouterDependencies: true
  },

  // Fail build if bundle too large
  onBuildComplete: async ({ success }) => {
    const { spawn } = require('child_process')

    if (success) {
      const bundleAnalysis = spawn('npm', ['run', 'analyze'])
      // Check bundle sizes and fail if exceeded
    }
  }
}
```

---

## 8. Performance Testing Checklist

### 8.1 Development Testing
- [ ] Lighthouse audit on every major feature
- [ ] Bundle analyzer check before merge
- [ ] Database query EXPLAIN QUERY PLAN
- [ ] Image optimization verified
- [ ] Network throttling tested (Fast 3G)
- [ ] React DevTools Profiler used

### 8.2 Pre-Deployment Testing
- [ ] Lighthouse CI passing (90+ scores)
- [ ] Web Vitals within targets
- [ ] Load testing (1000 concurrent users)
- [ ] Database performance (10K items)
- [ ] Mobile device testing (real devices)
- [ ] Slow network testing (Slow 3G)

### 8.3 Production Monitoring
- [ ] Real User Monitoring active
- [ ] Error tracking configured
- [ ] Performance alerts set up
- [ ] Weekly performance review
- [ ] Database query monitoring
- [ ] Image CDN performance tracking

---

## Document Control

- **Version**: 1.0
- **Date**: 2025-10-10
- **Author**: Analyst Agent (Hive Mind Swarm)
- **Status**: Complete
- **Next Review**: Post-MVP performance audit
