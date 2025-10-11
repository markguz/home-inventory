# Breadcrumb Component Testing Requirements

## Overview
This document outlines the comprehensive testing requirements for the Breadcrumb navigation component that needs to be implemented.

## Component Specification

### Required Props
```typescript
interface BreadcrumbItem {
  label: string;        // Display text for the breadcrumb
  href?: string | null; // Link URL (null for current page)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];           // Array of breadcrumb items
  separator?: React.ReactNode;       // Custom separator (default: '/')
  className?: string;                // Optional custom className
}
```

### Component Location
- **Path**: `/export/projects/homeinventory/home-inventory/src/components/layout/Breadcrumb.tsx`
- **Export**: Named export `Breadcrumb`

### Implementation Requirements

#### 1. Semantic HTML Structure
```tsx
<nav aria-label="breadcrumb">
  <ol>
    <li>
      <a href="/">Home</a>
      <span aria-hidden="true">/</span>
    </li>
    <li>
      <span aria-current="page">Current Page</span>
    </li>
  </ol>
</nav>
```

#### 2. Accessibility Requirements (WCAG 2.1 Level AA)
- ✅ Use `<nav>` with `aria-label="breadcrumb"`
- ✅ Use semantic `<ol>` and `<li>` elements
- ✅ Add `aria-current="page"` to last item
- ✅ Hide separator from screen readers with `aria-hidden="true"`
- ✅ Ensure keyboard navigation works
- ✅ Maintain sufficient color contrast (4.5:1 minimum)
- ✅ Provide visible focus indicators

#### 3. Visual Behavior
- Last item should NOT be a link
- Separator should appear between items (not after last)
- Support custom separators (string or React component)
- Responsive design for mobile viewports
- Truncate or wrap long breadcrumb paths gracefully

#### 4. Next.js Integration
```tsx
// Example usage with usePathname
'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function PageWithBreadcrumb() {
  const pathname = usePathname();
  const items = generateBreadcrumbsFromPath(pathname);

  return <Breadcrumb items={items} />;
}
```

## Test Coverage

### Unit Tests (90%+ coverage)
**File**: `/export/projects/homeinventory/home-inventory/tests/components/Breadcrumb.test.tsx`

**Test Cases**:
- ✅ Renders breadcrumb navigation with items
- ✅ Renders with default separator
- ✅ Renders with custom separator (string)
- ✅ Renders with JSX element separator
- ✅ Handles empty items array
- ✅ Handles single item (no separator)
- ✅ Handles very long paths (10+ items)
- ✅ Handles special characters in labels
- ✅ Handles very long labels (100+ chars)
- ✅ Renders active items as links
- ✅ Renders last item without link
- ✅ No separator after last item
- ✅ TypeScript type validation
- ✅ Custom className support
- ✅ Performance test (< 100ms for 50 items)

### Integration Tests
**File**: `/export/projects/homeinventory/home-inventory/tests/integration/breadcrumb-navigation.test.tsx`

**Test Cases**:
- ✅ Generates breadcrumbs from root path
- ✅ Generates breadcrumbs from simple path
- ✅ Generates breadcrumbs from nested path
- ✅ Generates breadcrumbs from deep nested path
- ✅ Handles dynamic route segments [id]
- ✅ Handles UUID-style IDs
- ✅ Handles /new route
- ✅ Handles /edit route
- ✅ Capitalizes segments
- ✅ Converts kebab-case to Title Case
- ✅ Custom label mapping support
- ✅ Generates correct href for each segment
- ✅ No link for current page
- ✅ Handles trailing slash
- ✅ Handles multiple slashes
- ✅ Handles query parameters
- ✅ Handles hash fragments
- ✅ Updates on pathname change
- ✅ Maintains Home link across changes
- ✅ Efficient breadcrumb generation
- ✅ Memoization support

### Accessibility Tests
**File**: `/export/projects/homeinventory/home-inventory/tests/components/Breadcrumb.accessibility.test.tsx`

**Test Cases**:
- ✅ Has navigation role
- ✅ Has aria-label="breadcrumb"
- ✅ Uses semantic list structure
- ✅ Has aria-current="page" on current item
- ✅ Hides separator from screen readers
- ✅ Keyboard navigable with Tab
- ✅ Skips current page in tab order
- ✅ Supports Enter key on links
- ✅ Announces navigation properly
- ✅ Provides context for current location
- ✅ Provides meaningful link text
- ✅ No axe violations (simple)
- ✅ No axe violations (complex)
- ✅ No axe violations (custom separator)
- ✅ Sufficient color contrast
- ✅ Visible focus indicators
- ✅ Maintains focus order
- ✅ Mobile viewport accessibility
- ✅ Touch interaction support

### E2E Tests
**File**: `/export/projects/homeinventory/home-inventory/tests/e2e/breadcrumb-navigation.spec.ts`

**Test Cases**:
- ✅ Displays breadcrumb on items page
- ✅ Displays breadcrumb on item details
- ✅ Displays breadcrumb on new item page
- ✅ Displays breadcrumb on categories page
- ✅ Navigates to home on click
- ✅ Navigates to items on click
- ✅ No link on current page
- ✅ Updates on navigation
- ✅ Updates on URL change
- ✅ Updates on browser back
- ✅ Updates on browser forward
- ✅ Mobile viewport display
- ✅ Mobile click handling
- ✅ Long paths on mobile
- ✅ Keyboard navigation
- ✅ Tab through links
- ✅ Proper ARIA attributes
- ✅ aria-current on last item
- ✅ Screen reader friendly
- ✅ Loads quickly (< 2s)
- ✅ No layout shift
- ✅ Visual regression tests
- ✅ 404 handling
- ✅ Invalid URL handling

## Test Fixtures
**File**: `/export/projects/homeinventory/home-inventory/tests/fixtures/breadcrumb-fixtures.ts`

Provides:
- Common breadcrumb patterns
- Route path examples
- Label mappings
- Custom separators
- Helper functions
- Mock navigation objects

## Running Tests

### Unit & Integration Tests
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:components  # Component tests
npm run test:integration # Integration tests

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### All Tests
```bash
npm run test:all
```

## Coverage Targets

| Metric      | Target | Current |
|-------------|--------|---------|
| Statements  | 90%    | TBD     |
| Branches    | 85%    | TBD     |
| Functions   | 90%    | TBD     |
| Lines       | 90%    | TBD     |

## Implementation Checklist for Coder Agent

- [ ] Create `Breadcrumb.tsx` component in `/src/components/layout/`
- [ ] Implement proper TypeScript types
- [ ] Add ARIA attributes for accessibility
- [ ] Support custom separators
- [ ] Handle edge cases (empty, single item, long paths)
- [ ] Add responsive styling (mobile-friendly)
- [ ] Implement focus management
- [ ] Test with screen reader
- [ ] Ensure keyboard navigation works
- [ ] Run test suite and fix failures
- [ ] Achieve 90%+ coverage
- [ ] Create usage examples in docs
- [ ] Update Storybook (if applicable)

## Usage Examples

### Basic Usage
```tsx
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function ItemPage() {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Items', href: '/items' },
    { label: 'Item Details', href: null },
  ];

  return <Breadcrumb items={items} />;
}
```

### Dynamic Generation from Route
```tsx
'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { generateBreadcrumbsFromPath } from '@/lib/breadcrumbs';

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  const items = generateBreadcrumbsFromPath(pathname);

  return <Breadcrumb items={items} />;
}
```

### Custom Separator
```tsx
<Breadcrumb
  items={items}
  separator={<span className="text-gray-400">›</span>}
/>
```

### With Custom Styling
```tsx
<Breadcrumb
  items={items}
  className="bg-gray-100 p-4 rounded"
/>
```

## Known Issues & Considerations

1. **Long Paths on Mobile**: Consider truncating middle segments on small screens
2. **Dynamic Labels**: For ID-based routes, may need to fetch item names from API
3. **Performance**: Memoize breadcrumb generation for complex paths
4. **i18n**: Consider internationalization for labels
5. **URL Encoding**: Handle special characters in URLs properly

## Related Files

- **Component**: `/src/components/layout/Breadcrumb.tsx` (TO BE CREATED)
- **Utils**: `/src/lib/breadcrumbs.ts` (optional helper functions)
- **Tests**: `/tests/components/Breadcrumb.*.test.tsx`
- **E2E**: `/tests/e2e/breadcrumb-navigation.spec.ts`
- **Fixtures**: `/tests/fixtures/breadcrumb-fixtures.ts`

## Success Criteria

✅ All tests pass (unit, integration, accessibility, E2E)
✅ Coverage meets 90%+ threshold
✅ No accessibility violations (axe-core)
✅ Keyboard navigation works flawlessly
✅ Visual regression tests pass
✅ Mobile responsive
✅ Performance benchmarks met
✅ Documentation complete
✅ Code reviewed and approved

---

**Status**: Tests created, awaiting component implementation
**Assigned to**: Coder Agent
**Priority**: High
**Estimated Time**: 2-4 hours
