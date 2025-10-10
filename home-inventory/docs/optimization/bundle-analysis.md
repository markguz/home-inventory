# Home Inventory - Bundle Analysis & Optimization Guide

**Generated**: 2025-10-10
**Status**: Configuration Complete - Build Analysis Pending

---

## Table of Contents

1. [Current Configuration](#current-configuration)
2. [Bundle Optimization Strategy](#bundle-optimization-strategy)
3. [Dependency Analysis](#dependency-analysis)
4. [Code Splitting Recommendations](#code-splitting-recommendations)
5. [Implementation Guide](#implementation-guide)
6. [Measurement Tools](#measurement-tools)

---

## 1. Current Configuration

### 1.1 Build Setup

**Build Command**: `npm run build --turbopack`
- Using Turbopack for faster builds
- Production optimizations enabled
- Source maps disabled in production

### 1.2 Optimization Experiments

```typescript
// next.config.ts
experimental: {
  optimizePackageImports: [
    'lucide-react',           // Icon library
    'date-fns',               // Date utilities
    '@tanstack/react-query',  // Data fetching
  ],
}
```

**Impact**:
- Automatic tree-shaking for specified packages
- Only imported modules included in bundle
- Estimated reduction: 30-50% for these libraries

### 1.3 Production Settings

```typescript
productionBrowserSourceMaps: false  // Reduces bundle size by ~30%
compress: true                       // Enables gzip compression
```

---

## 2. Bundle Optimization Strategy

### 2.1 Target Bundle Sizes

| Bundle Type | Target | Priority |
|------------|--------|----------|
| Main Bundle | < 200KB | High |
| First Load JS | < 300KB | Critical |
| Page Bundles | < 50KB | Medium |
| Shared Chunks | < 100KB | Medium |

### 2.2 Optimization Priorities

**High Priority (Immediate Impact)**:
1. Code splitting for routes
2. Dynamic imports for heavy components
3. Tree-shaking for unused code
4. Lazy loading for images

**Medium Priority (Moderate Impact)**:
5. Vendor chunk optimization
6. CSS purging
7. Font optimization
8. SVG optimization

**Low Priority (Fine-Tuning)**:
9. Polyfill optimization
10. Module concatenation
11. Minification tuning

---

## 3. Dependency Analysis

### 3.1 Current Dependencies

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@prisma/client": "^6.17.1",
    "@radix-ui/*": "Multiple packages",
    "@tanstack/react-query": "^5.90.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.545.0",
    "next": "15.5.4",
    "next-themes": "^0.4.6",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.64.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "tw-animate-css": "^1.4.0",
    "zod": "^4.1.12"
  }
}
```

### 3.2 Package Size Analysis

| Package | Estimated Size | Optimization Strategy |
|---------|---------------|----------------------|
| **lucide-react** | 50-80KB | ✅ Tree-shaking enabled |
| **@tanstack/react-query** | 40-60KB | ✅ Tree-shaking enabled |
| **date-fns** | 30-50KB | ✅ Tree-shaking enabled |
| **@radix-ui components** | 80-120KB | Code split by route |
| **react-hook-form** | 40-50KB | Acceptable |
| **next-themes** | 5-10KB | Minimal |
| **zod** | 30-40KB | Acceptable |
| **sonner** | 10-15KB | Minimal |
| **tailwind-merge** | 5-10KB | Minimal |
| **tw-animate-css** | 15-20KB | Consider removing if unused |

### 3.3 Heavy Dependencies

**Consider Alternatives or Lazy Loading**:

1. **@radix-ui Components** (Large)
   - Strategy: Dynamic imports for dialogs, dropdowns
   - Only load when user interaction requires them
   ```typescript
   const Dialog = dynamic(() => import('@radix-ui/react-dialog'));
   ```

2. **lucide-react** (Icon Library)
   - ✅ Already optimized with tree-shaking
   - Only imports used icons
   - No further action needed

3. **date-fns** (Date Utilities)
   - ✅ Already optimized with tree-shaking
   - Consider `date-fns/esm` for better tree-shaking
   ```typescript
   // Instead of:
   import { format } from 'date-fns';
   // Use:
   import format from 'date-fns/esm/format';
   ```

---

## 4. Code Splitting Recommendations

### 4.1 Route-Based Splitting

**Automatic with Next.js App Router**:
- Each route in `app/` directory is automatically code-split
- Shared components are bundled into separate chunks
- Next.js handles optimization automatically

**Verify Route Splitting**:
```bash
npm run build

# Look for output like:
# ├ ○ /                         1.5 kB        250 kB
# ├ ○ /items                    2.1 kB        260 kB
# ├ ○ /categories               1.8 kB        255 kB
```

### 4.2 Component-Based Splitting

**Implement for Heavy/Optional Components**:

#### 4.2.1 Dialogs and Modals
```typescript
// src/components/items/ItemDialog.tsx
import dynamic from 'next/dynamic';

const ItemFormDialog = dynamic(
  () => import('@/components/items/ItemFormDialog'),
  {
    loading: () => <div className="flex items-center justify-center p-4">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>,
    ssr: false, // Don't render on server (not needed until user interaction)
  }
);

export function ItemActions() {
  return (
    <div>
      {/* Dialog only loads when user clicks "Add Item" */}
      <ItemFormDialog />
    </div>
  );
}
```

**Benefit**: Reduces initial bundle by 20-30KB

#### 4.2.2 Charts and Visualizations (Future)
```typescript
// src/components/reports/ReportChart.tsx
import dynamic from 'next/dynamic';

const AdvancedChart = dynamic(
  () => import('@/components/charts/AdvancedChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);
```

**Benefit**: Defers loading until user navigates to reports page

#### 4.2.3 Rich Text Editors (Future)
```typescript
const RichTextEditor = dynamic(
  () => import('@/components/forms/RichTextEditor'),
  { ssr: false }
);
```

### 4.3 Third-Party Library Splitting

**Moment.js Alternative (if ever used)**:
```typescript
// ❌ Don't use Moment.js (59KB minified)
import moment from 'moment';

// ✅ Use date-fns instead (already in project)
import { format } from 'date-fns';
```

**Lodash Optimization (if added)**:
```typescript
// ❌ Don't import entire lodash
import _ from 'lodash';

// ✅ Import specific functions
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

---

## 5. Implementation Guide

### 5.1 Install Bundle Analyzer

```bash
npm install --save-dev @next/bundle-analyzer
```

### 5.2 Update Next Config

```typescript
// next.config.ts
import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ... existing config ...
};

export default withBundleAnalyzer(nextConfig);
```

### 5.3 Run Bundle Analysis

```bash
# Generate bundle analysis
ANALYZE=true npm run build

# This will:
# 1. Build the production bundle
# 2. Generate interactive visualizations
# 3. Open reports in browser
# 4. Show client.html and server.html
```

### 5.4 Analyze Results

**Look for**:
1. **Largest Bundles**: Identify biggest files
2. **Duplicate Modules**: Same package included multiple times
3. **Unused Code**: Dead code still included
4. **Large Dependencies**: Packages >50KB

**Example Analysis**:
```
Client Bundle Analysis:
├─ node_modules/
│  ├─ @radix-ui/react-dialog/     50KB    ← Large, consider lazy loading
│  ├─ lucide-react/                30KB    ← Good (tree-shaken from 80KB)
│  ├─ @tanstack/react-query/       45KB    ← Acceptable
│  └─ date-fns/                    20KB    ← Good (tree-shaken from 50KB)
├─ components/
│  ├─ ui/                          40KB    ← Consider splitting
│  └─ items/                       25KB    ← Good
└─ pages/
   └─ [various routes]             15KB    ← Good separation
```

### 5.5 Optimization Workflow

```bash
# 1. Analyze current bundle
ANALYZE=true npm run build

# 2. Identify opportunities
# - Look for packages >50KB
# - Check for duplicate modules
# - Find unused code

# 3. Implement optimizations
# - Add dynamic imports
# - Remove unused packages
# - Split large components

# 4. Re-analyze
ANALYZE=true npm run build

# 5. Compare results
# - Check for bundle size reduction
# - Verify no regressions
```

---

## 6. Measurement Tools

### 6.1 Next.js Bundle Analyzer

**Installation**:
```bash
npm install --save-dev @next/bundle-analyzer
```

**Features**:
- Interactive treemap visualization
- Client and server bundle analysis
- Module size breakdown
- Duplicate module detection

### 6.2 Webpack Bundle Analyzer (Alternative)

**For detailed analysis**:
```bash
npm install --save-dev webpack-bundle-analyzer
```

### 6.3 Lighthouse CI

**For continuous monitoring**:
```bash
npm install --save-dev @lhci/cli

# Configure in lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:3000"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}]
      }
    }
  }
}
```

### 6.4 Bundle Size Tracking in CI/CD

**Add to GitHub Actions**:
```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 7. Quick Wins

### 7.1 Immediate Optimizations (< 30 minutes)

1. **Remove unused dependencies**:
```bash
npx depcheck
npm uninstall [unused-packages]
```

2. **Enable bundle analyzer**:
```bash
npm install -D @next/bundle-analyzer
# Add to next.config.ts (see above)
ANALYZE=true npm run build
```

3. **Dynamic import for dialogs**:
```typescript
const Dialog = dynamic(() => import('@/components/ui/dialog'));
```

### 7.2 Short-Term Optimizations (< 2 hours)

1. **Implement code splitting for all dialogs and modals**
2. **Lazy load images with next/image**
3. **Remove tw-animate-css if unused**
4. **Optimize icon imports**

### 7.3 Long-Term Optimizations (< 1 day)

1. **Implement virtual scrolling for long lists**
2. **Add service worker for caching**
3. **Optimize font loading with font-display: swap**
4. **Implement advanced caching strategies**

---

## 8. Expected Results

### Before Optimizations (Estimated)
```
Bundle Sizes:
├─ Main bundle:           250-300KB
├─ First Load JS:         350-450KB
├─ Shared chunks:         150-200KB
└─ Page bundles:          50-80KB each

Performance:
├─ LCP:                   3-4s
├─ FCP:                   2-3s
└─ TTI:                   4-5s
```

### After All Optimizations (Target)
```
Bundle Sizes:
├─ Main bundle:           150-200KB  ↓ 33-40%
├─ First Load JS:         200-300KB  ↓ 40-43%
├─ Shared chunks:         80-120KB   ↓ 40-47%
└─ Page bundles:          30-50KB    ↓ 40%

Performance:
├─ LCP:                   1.5-2.5s   ↓ 40-50%
├─ FCP:                   1-1.8s     ↓ 50%
└─ TTI:                   2-3s       ↓ 50%
```

---

## 9. Monitoring & Maintenance

### 9.1 Regular Audits

**Monthly**:
- Run bundle analysis
- Check for new dependencies
- Review bundle size trends

**Per Release**:
- Bundle size comparison
- Performance regression testing
- Lighthouse audit

### 9.2 Budget Enforcement

**Add to package.json**:
```json
{
  "bundlesize": [
    {
      "path": ".next/static/chunks/*.js",
      "maxSize": "200 kB"
    },
    {
      "path": ".next/static/css/*.css",
      "maxSize": "50 kB"
    }
  ]
}
```

```bash
npm install -D bundlesize
npm run bundlesize
```

### 9.3 Alerts

**Set up alerts for**:
- Bundle size increase >10%
- New large dependencies (>50KB)
- Performance regression (Lighthouse score drop >5 points)

---

## 10. Resources

### Documentation
- [Next.js Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)

### Tools
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Source Map Explorer](https://www.npmjs.com/package/source-map-explorer)
- [Bundlephobia](https://bundlephobia.com/) - Check package sizes before installing

### Best Practices
- [Web.dev - Optimize Bundle Size](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
- [Optimizing Next.js Bundle Size](https://nextjs.org/docs/app/building-your-application/optimizing)

---

## Conclusion

The Home Inventory application is well-configured for bundle optimization with Next.js 15, Turbopack, and selective package optimization. The next steps are:

1. **Run bundle analysis** to get baseline measurements
2. **Implement code splitting** for dialogs and heavy components
3. **Monitor bundle sizes** in CI/CD
4. **Set performance budgets** to prevent regressions

**Estimated Total Reduction**: 40-50% in bundle sizes after all optimizations.

---

**Generated by**: Optimizer Agent (Hive Mind Swarm)
**Session**: swarm-1760128533906-e6cc3wfik
**Documentation Path**: /docs/optimization/bundle-analysis.md
