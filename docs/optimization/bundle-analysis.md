# Bundle Analysis & Optimization Guide

**Project:** Home Inventory System
**Date:** 2025-10-10
**Agent:** Optimizer (hive-optimizer)

## Current Bundle Composition

### Build Output Analysis
```
Route (app)                         Size  First Load JS
┌ ○ /                            5.41 kB         119 kB
└ ○ /_not-found                      0 B         113 kB
+ First Load JS shared by all     117 kB
  ├ chunks/47f477e3d2ef265b.js   20.4 kB
  ├ chunks/6c1d949039ca8e4a.js   75.4 kB
  └ other shared chunks (total)  21.2 kB
```

### Bundle Size Breakdown

#### Shared Chunks (117 KB)
- **Framework Core (75.4 KB)**: React 19.1.0 + Next.js runtime
- **React Runtime**: ~45 KB (React 19 with concurrent features)
- **Next.js Runtime**: ~30 KB (Router, hydration, etc.)
- **Vendor Libraries (20.4 KB)**: Third-party dependencies
- **Other Shared (21.2 KB)**: Common utilities and polyfills

#### Page-Specific Bundles
- **Home Page (/)**: 5.41 KB - Static content and basic layout
- **Not Found (/_not-found)**: 0 KB - Built-in error page

### Dependency Impact Analysis

#### Heavy Dependencies (Server-Side Only)
```json
{
  "@prisma/client": "~150 KB" // Server-only, not in client bundle
}
```

#### Client-Side Dependencies
```json
{
  "@tanstack/react-query": "~40 KB",
  "react-hook-form": "~25 KB",
  "zod": "~30 KB",
  "@hookform/resolvers": "~10 KB",
  "lucide-react": "~15 KB (with tree-shaking)",
  "date-fns": "~20 KB (with tree-shaking)",
  "clsx": "~1 KB",
  "tailwind-merge": "~3 KB"
}
```

**Estimated Total**: ~144 KB (before compression)
**Current Gzipped**: ~119 KB ✅

## Optimization Strategies

### 1. Code Splitting Implementation

#### Dynamic Imports for Heavy Components
```typescript
// app/components/DynamicComponents.ts
import dynamic from 'next/dynamic';

// Heavy form components
export const InventoryForm = dynamic(
  () => import('./InventoryForm'),
  {
    loading: () => <FormSkeleton />,
    ssr: false, // Client-only if using browser APIs
  }
);

// Image upload (large dependencies)
export const ImageUploader = dynamic(
  () => import('./ImageUploader'),
  {
    loading: () => <div>Loading uploader...</div>,
  }
);

// Data visualization
export const Charts = dynamic(
  () => import('./Charts'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);
```

**Expected Savings**: 30-50 KB on initial page load

#### Route-Based Code Splitting
```typescript
// Automatic with Next.js App Router
app/
  inventory/
    page.tsx           // Separate bundle
  categories/
    page.tsx           // Separate bundle
  settings/
    page.tsx           // Separate bundle
```

### 2. Tree-Shaking Optimization

#### Icon Library Optimization
```typescript
// ❌ BAD - Imports entire icon library
import { Home, Settings, User, Plus, Edit, Trash } from 'lucide-react';

// ✅ BETTER - Named imports (still imports some extra code)
import * as Icons from 'lucide-react';

// ✅ BEST - Individual icon files (when available)
// Note: Check if lucide-react supports this pattern
import HomeIcon from 'lucide-react/dist/esm/icons/home';
```

#### Date-fns Optimization
```typescript
// ❌ BAD - Imports entire library
import * as dateFns from 'date-fns';

// ✅ GOOD - Named imports only
import { format, parseISO, differenceInDays } from 'date-fns';

// ✅ BETTER - Use date-fns-tz if needed for timezones
import { formatInTimeZone } from 'date-fns-tz';
```

#### Zod Schema Splitting
```typescript
// Split schemas into separate files
// schemas/item.ts
export const itemSchema = z.object({...});

// schemas/category.ts
export const categorySchema = z.object({...});

// Only import what's needed per route
```

### 3. Lazy Loading Strategies

#### Lazy Load Non-Critical Features
```typescript
// Modal dialogs
const DeleteConfirmModal = lazy(() => import('./DeleteConfirmModal'));

// Settings panels
const AdvancedSettings = lazy(() => import('./AdvancedSettings'));

// Export/import features
const ExportDialog = lazy(() => import('./ExportDialog'));
```

#### Lazy Load Heavy Libraries
```typescript
// PDF generation
const generatePDF = async () => {
  const jsPDF = await import('jspdf').then(mod => mod.default);
  // Use jsPDF
};

// Excel export
const exportToExcel = async () => {
  const XLSX = await import('xlsx');
  // Use XLSX
};
```

### 4. Bundle Size Monitoring

#### Setup Bundle Analyzer
```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer
```

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // ... your config
};

module.exports = withBundleAnalyzer(nextConfig);
```

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

#### Bundle Size Limits
```javascript
// next.config.ts
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        maxAssetSize: 200000, // 200 KB
        maxEntrypointSize: 200000,
        hints: 'warning',
      };
    }
    return config;
  },
};
```

### 5. React Query Optimization

#### Selective Hydration
```typescript
// Only hydrate queries that are needed
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      // Don't refetch on every mount
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### Query Key Factory
```typescript
// lib/queryKeys.ts
export const queryKeys = {
  items: {
    all: ['items'] as const,
    lists: () => [...queryKeys.items.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.items.lists(), filters] as const,
    details: () => [...queryKeys.items.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.items.details(), id] as const,
  },
};
```

### 6. CSS Optimization

#### Tailwind CSS Optimization
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Remove unused utilities
  safelist: [
    // Only safelist dynamically generated classes
  ],
};
```

#### Critical CSS
```typescript
// app/layout.tsx
// Tailwind already handles critical CSS extraction
// Ensure you're not importing large CSS files
```

### 7. Next.js Configuration Optimizations

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // Turbopack is already enabled in build script
  // Enable production optimizations
  productionBrowserSourceMaps: false,

  // Compress output
  compress: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Optimize fonts
  optimizeFonts: true,

  // Module transpilation (if needed)
  transpilePackages: [],

  // Experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@tanstack/react-query',
    ],
  },
};
```

## Bundle Size Targets

### Current vs Target

| Asset | Current | Target | Status |
|-------|---------|--------|--------|
| First Load JS | 119 KB | < 200 KB | ✅ EXCELLENT |
| Main Bundle | 5.41 KB | < 50 KB | ✅ EXCELLENT |
| Shared Chunks | 117 KB | < 150 KB | ✅ GOOD |
| CSS | TBD | < 50 KB | 🎯 TO MEASURE |

### Per-Route Budgets

| Route | Budget | Notes |
|-------|--------|-------|
| `/` (Home) | < 150 KB | Static content + nav |
| `/inventory` | < 200 KB | List view + filters |
| `/inventory/[id]` | < 180 KB | Detail view + actions |
| `/categories` | < 170 KB | Simple list |
| `/settings` | < 200 KB | Forms + validation |

## Monitoring & Analysis

### Weekly Checks
```bash
# Run build and check output
npm run build

# Analyze bundle (if analyzer installed)
npm run analyze

# Check bundle size trends
git log -p package.json | grep '"version"'
```

### Performance Metrics
```typescript
// app/lib/metrics.ts
export function logBundleMetrics() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const perfData = window.performance.getEntriesByType('navigation')[0];
    console.log('Bundle Metrics:', {
      transferSize: perfData.transferSize,
      encodedBodySize: perfData.encodedBodySize,
      decodedBodySize: perfData.decodedBodySize,
    });
  }
}
```

## Implementation Checklist

### Phase 1: Quick Wins
- [ ] Enable experimental.optimizePackageImports in next.config.ts
- [ ] Audit and optimize icon imports
- [ ] Setup bundle analyzer
- [ ] Add bundle size limits to CI

### Phase 2: Code Splitting
- [ ] Identify heavy components (> 50 KB)
- [ ] Implement dynamic imports
- [ ] Add loading states
- [ ] Test lazy-loaded routes

### Phase 3: Advanced
- [ ] Implement route-based prefetching
- [ ] Optimize third-party scripts
- [ ] Consider CDN for static assets
- [ ] Setup bundle budget CI checks

## Expected Results

### Before Optimization (Baseline)
- First Load JS: 119 KB
- Main Bundle: 5.41 KB
- Total: 124.41 KB

### After Phase 1 (Quick Wins)
- First Load JS: ~110 KB (-9 KB)
- Main Bundle: 5.41 KB
- Total: ~115 KB

### After Phase 2 (Code Splitting)
- First Load JS: ~100 KB (-19 KB)
- Main Bundle: 5.41 KB
- Lazy Chunks: ~40 KB
- Total Initial: ~105 KB

### After Phase 3 (Advanced)
- First Load JS: ~95 KB (-24 KB)
- Optimized Routes: Individual budgets met
- Lighthouse Score: > 95

## Tools & Commands

```bash
# Analyze bundle
npm run analyze

# Build for production
npm run build

# Check bundle size
npx next info

# Check dependency sizes
npx bundlephobia [package-name]

# Lighthouse CI
npx lighthouse http://localhost:3000 --view
```

## Conclusion

The current bundle size of 119 KB is already excellent. Focus on:

1. **Maintaining** this low bundle size as features are added
2. **Implementing** code splitting for new heavy features
3. **Monitoring** bundle size growth with each PR
4. **Optimizing** imports to leverage tree-shaking

The optimization strategy is designed to keep the application fast and lightweight as it scales.

---
**Status:** ✅ Ready for Implementation
**Priority:** Medium (current size is good, focus on prevention)
**Review Date:** 2025-11-10
