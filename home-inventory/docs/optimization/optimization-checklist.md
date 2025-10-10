# Home Inventory - Optimization Checklist

**Generated**: 2025-10-10
**Optimizer Agent**: Hive Mind Swarm (swarm-1760128533906-e6cc3wfik)

---

## Quick Reference

| Category | Completed | In Progress | Pending | Total |
|----------|-----------|-------------|---------|-------|
| **Configuration** | 8/8 | 0/8 | 0/8 | 100% |
| **Database** | 3/3 | 0/3 | 0/3 | 100% |
| **Caching** | 2/5 | 0/5 | 3/5 | 40% |
| **Runtime** | 0/6 | 0/6 | 6/6 | 0% |
| **Build Issues** | 2/3 | 1/3 | 0/3 | 67% |
| **Monitoring** | 0/4 | 0/4 | 4/4 | 0% |
| **TOTAL** | **15/29** | **1/29** | **13/29** | **55%** |

---

## 1. Configuration Optimizations

### ✅ Next.js Configuration (`next.config.ts`)

- [x] Image optimization configured
  - [x] AVIF format support
  - [x] WebP format support
  - [x] Device sizes defined
  - [x] 1-year cache TTL
- [x] Package import optimization
  - [x] lucide-react tree-shaking
  - [x] date-fns tree-shaking
  - [x] @tanstack/react-query tree-shaking
- [x] Production optimizations
  - [x] Source maps disabled
  - [x] Compression enabled
- [x] HTTP caching headers
  - [x] Static assets (1 year)
  - [x] API routes (no cache)
- [x] Turbopack configuration

**Files Modified**:
- `/home-inventory/next.config.ts` - Fully optimized

---

## 2. Database Optimizations

### ✅ Prisma Schema Indexes

- [x] Item model indexes
  - [x] categoryId index
  - [x] locationId index
  - [x] name index (for search)
- [x] ItemTag model indexes
  - [x] itemId index
  - [x] tagId index
  - [x] Unique constraint on [itemId, tagId]

**Files**:
- `/home-inventory/prisma/schema.prisma` - All indexes in place

### ✅ Query Optimizations

- [x] Pagination implemented (20 items/page)
- [x] Selective field fetching
- [x] Parallel query execution (Promise.all)

**Files**:
- `/home-inventory/src/app/api/items/route.ts` - Optimized
- `/home-inventory/src/app/api/categories/route.ts` - Clean
- `/home-inventory/src/app/api/locations/route.ts` - Clean
- `/home-inventory/src/app/api/tags/route.ts` - Clean

---

## 3. Caching Strategy

### ✅ Implemented

- [x] HTTP caching headers (next.config.ts)
- [x] Image caching (1 year TTL)

### ⏳ Pending Implementation

- [ ] **React Query Provider Setup**
  ```typescript
  // CREATE: src/providers/QueryProvider.tsx
  export function QueryProvider({ children }) {
    const [queryClient] = useState(() =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,     // 5 minutes
            cacheTime: 10 * 60 * 1000,    // 10 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
    );
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  ```

- [ ] **Add QueryProvider to Layout**
  ```typescript
  // UPDATE: src/app/layout.tsx
  import { QueryProvider } from '@/providers/QueryProvider';

  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    );
  }
  ```

- [ ] **ISR for Static Pages**
  ```typescript
  // UPDATE: src/app/categories/page.tsx
  export const revalidate = 3600; // 1 hour
  ```

**Files to Create/Modify**:
- `/home-inventory/src/providers/QueryProvider.tsx` - CREATE
- `/home-inventory/src/app/layout.tsx` - UPDATE
- `/home-inventory/src/app/categories/page.tsx` - UPDATE (add ISR)

---

## 4. Runtime Performance Optimizations

### ⏳ Component Memoization (Not Started)

- [ ] **Memoize ItemCard Component**
  ```typescript
  // UPDATE: src/components/items/ItemCard.tsx
  import { memo } from 'react';

  export const ItemCard = memo(function ItemCard({ item }) {
    // ... implementation
  }, (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id &&
           prevProps.item.updatedAt === nextProps.item.updatedAt;
  });
  ```

- [ ] **Memoize ItemList Component**
  ```typescript
  // UPDATE: src/components/items/ItemList.tsx
  import { memo, useMemo } from 'react';

  export const ItemList = memo(function ItemList({ items }) {
    const sortedItems = useMemo(() => {
      return [...items].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }, [items]);
    // ... render sortedItems
  });
  ```

- [ ] **Debounced Search**
  ```typescript
  // UPDATE: src/components/items/SearchBar.tsx
  import { useCallback } from 'react';
  import { debounce } from 'lodash'; // or implement custom

  const debouncedSearch = useCallback(
    debounce((query: string) => onSearch(query), 300),
    [onSearch]
  );
  ```

**Files to Modify**:
- `/home-inventory/src/components/items/ItemCard.tsx` - Add memo
- `/home-inventory/src/components/items/ItemList.tsx` - Add memo + useMemo
- `/home-inventory/src/components/items/SearchBar.tsx` - Add debounce

### ⏳ Lazy Loading (Not Started)

- [ ] **Lazy Load Images**
  ```typescript
  // UPDATE: src/components/items/ItemCard.tsx
  import Image from 'next/image';

  <Image
    src={item.imageUrl || '/placeholder.jpg'}
    alt={item.name}
    width={300}
    height={200}
    loading="lazy"
    placeholder="blur"
    blurDataURL="/placeholder-blur.jpg"
  />
  ```

- [ ] **Dynamic Import for Dialogs**
  ```typescript
  // UPDATE: src/components/items/ItemDialog.tsx
  import dynamic from 'next/dynamic';

  const ItemFormDialog = dynamic(
    () => import('@/components/items/ItemFormDialog'),
    {
      loading: () => <DialogSkeleton />,
      ssr: false,
    }
  );
  ```

- [ ] **Virtual Scrolling** (Future - only if lists >100 items)
  ```typescript
  // FUTURE: src/components/items/VirtualItemList.tsx
  import { useVirtualizer } from '@tanstack/react-virtual';
  ```

**Files to Modify**:
- `/home-inventory/src/components/items/ItemCard.tsx` - Lazy images
- Dialog components - Dynamic imports
- (Future) Virtual list component

---

## 5. Build & Bundle Optimizations

### ✅ Fixed Build Issues

- [x] Next.js 15 async params
  - [x] Updated `/api/items/[id]/route.ts`
- [x] Zod v4 API changes
  - [x] Changed `error.errors` to `error.issues` in all API routes

### 🔄 In Progress

- [~] **Complete Production Build**
  - [~] Fix remaining TypeScript issues
  - [ ] Missing `formatCurrency` function in utils
  - [ ] Verify all imports resolve

### ⏳ Pending

- [ ] **Bundle Analysis**
  ```bash
  npm install --save-dev @next/bundle-analyzer
  # Update next.config.ts with analyzer
  ANALYZE=true npm run build
  ```

**Files Modified**:
- `/home-inventory/src/app/api/items/route.ts` - Fixed Zod
- `/home-inventory/src/app/api/items/[id]/route.ts` - Fixed async params + Zod
- `/home-inventory/src/app/api/categories/route.ts` - Fixed Zod
- `/home-inventory/src/app/api/locations/route.ts` - Fixed Zod
- `/home-inventory/src/app/api/tags/route.ts` - Fixed Zod

**Files Needing Fix**:
- `/home-inventory/src/lib/utils.ts` - Add `formatCurrency` function
- `/home-inventory/src/components/items/ItemCard.tsx` - Fix imports

---

## 6. Performance Monitoring

### ⏳ Not Started

- [ ] **Lighthouse Audit**
  ```bash
  npm install -g lighthouse
  lighthouse http://localhost:3000 --view
  ```

- [ ] **Core Web Vitals Measurement**
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1

- [ ] **Bundle Size Tracking**
  ```bash
  npm install -D bundlesize
  # Add budget to package.json
  ```

- [ ] **Production Monitoring**
  ```typescript
  // UPDATE: src/app/layout.tsx
  import { Analytics } from '@vercel/analytics/react';

  <Analytics />
  ```

---

## 7. Quick Win Checklist (Priority Order)

### 🔥 Critical (Do First)

1. [ ] Fix build errors (`formatCurrency` utility)
2. [ ] Complete production build
3. [ ] Run Lighthouse audit for baseline

### ⚡ High Priority (Big Impact, Low Effort)

4. [ ] Set up React Query provider
5. [ ] Add memoization to ItemCard
6. [ ] Implement debounced search
7. [ ] Enable lazy loading for images

### 📊 Medium Priority (Moderate Impact)

8. [ ] Run bundle analysis
9. [ ] Add dynamic imports for dialogs
10. [ ] Memoize ItemList component
11. [ ] Set up ISR for categories/locations

### 🔮 Low Priority (Nice to Have)

12. [ ] Virtual scrolling (only if needed)
13. [ ] Advanced caching strategies
14. [ ] Production monitoring setup

---

## 8. Implementation Timeline

### Week 1: Foundation
- [x] Configuration optimizations
- [x] Database indexes
- [x] API optimizations
- [~] Fix build issues
- [ ] Complete production build

### Week 2: Client-Side Performance
- [ ] React Query setup
- [ ] Component memoization
- [ ] Debounced search
- [ ] Lazy loading

### Week 3: Measurement & Refinement
- [ ] Lighthouse audits
- [ ] Bundle analysis
- [ ] Performance testing
- [ ] Optimization refinement

### Week 4: Monitoring & Documentation
- [ ] Production monitoring
- [ ] Bundle size tracking
- [ ] Performance budgets
- [ ] Final documentation

---

## 9. Code Snippets for Quick Implementation

### Fix formatCurrency Utility

```typescript
// ADD TO: src/lib/utils.ts

/**
 * Format a number as currency
 * @param value - The numeric value to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a date string or Date object
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
}
```

### React Query Provider

```typescript
// CREATE: src/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,          // 5 minutes
            cacheTime: 10 * 60 * 1000,         // 10 minutes
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
          },
          mutations: {
            onError: (error) => {
              console.error('Mutation error:', error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Bundle Analyzer Setup

```typescript
// UPDATE: next.config.ts
import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ... existing config ...
};

export default withBundleAnalyzer(nextConfig);
```

### Debounce Utility

```typescript
// ADD TO: src/lib/utils.ts

/**
 * Debounce a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

---

## 10. Testing Checklist

### Before Deployment

- [ ] Production build completes successfully
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Bundle size < 300KB (First Load JS)
- [ ] API response times < 200ms
- [ ] Database queries < 50ms
- [ ] No console errors
- [ ] All tests passing

### Post-Deployment Monitoring

- [ ] Real user metrics (RUM) tracking
- [ ] Error rate < 0.1%
- [ ] 95th percentile response time < 500ms
- [ ] Bundle size alerts configured
- [ ] Performance budget enforcement

---

## 11. Resources & Documentation

### Internal Documentation
- [Performance Report](./performance-report.md) - Detailed analysis
- [Bundle Analysis Guide](./bundle-analysis.md) - Bundle optimization strategies

### External Resources
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Query](https://tanstack.com/query/latest)
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## 12. Success Metrics

### Current Baseline (To Be Measured)
- Bundle Size: TBD
- Lighthouse Score: TBD
- Core Web Vitals: TBD

### Target Metrics
- Main Bundle: < 200KB
- First Load JS: < 300KB
- Lighthouse Score: > 90
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

### Expected Improvements
- 40-60% reduction in load times
- 70-90% reduction in API calls (with caching)
- 40-50% reduction in bundle size
- 90% reduction in bandwidth for repeat visitors

---

## Conclusion

**Overall Progress**: 55% Complete (15/29 tasks)

**Next Immediate Steps**:
1. Fix `formatCurrency` utility function
2. Complete production build
3. Set up React Query provider
4. Run baseline Lighthouse audit

**Estimated Time to Complete All Optimizations**: 2-3 days of focused work

---

**Checklist Maintained by**: Optimizer Agent (Hive Mind Swarm)
**Session ID**: swarm-1760128533906-e6cc3wfik
**Last Updated**: 2025-10-10
**Status**: In Progress - Build Issues Being Resolved
