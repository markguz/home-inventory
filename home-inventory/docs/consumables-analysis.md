# Consumables Implementation Analysis Report

**Date:** 2025-10-11
**Analyst:** Code Analyzer Agent
**Project:** Home Inventory System
**Feature:** Consumables Alert System

---

## Executive Summary

**Overall Quality Score: 4.5/10**

The consumables alert feature is in an **incomplete and partially implemented state**. While basic quantity tracking exists, critical features for a full consumables system are missing. Significant security, accessibility, and architectural issues were identified that require immediate attention.

### Critical Findings
- 🔴 **Dual ORM Configuration**: Both Prisma and Drizzle are used inconsistently
- 🔴 **No Authentication**: API endpoints are completely unprotected
- 🔴 **Incomplete Feature**: Missing consumable-specific fields and logic
- 🔴 **Hardcoded Thresholds**: Alert threshold (5) is hardcoded in UI

---

## 1. Code Quality Analysis

### 1.1 Database Schema Design

**Current State:**
```prisma
// Prisma Schema (schema.prisma)
model Item {
  id           String    @id @default(cuid())
  name         String
  quantity     Int       @default(1)
  // ... other fields
}
```

**Issues Identified:**

| Issue | Severity | Impact |
|-------|----------|--------|
| Missing `isConsumable` flag | 🔴 Critical | Cannot distinguish consumables from regular items |
| Missing `minThreshold` field | 🔴 Critical | Cannot customize alert threshold per item |
| Missing `consumableType` field | 🟡 High | Cannot categorize consumables (food, supplies, etc.) |
| No index on `quantity` | 🟡 High | Poor query performance for low-stock searches |
| Dual ORM schemas (Prisma + Drizzle) | 🔴 Critical | Schema drift risk, maintenance nightmare |

**Recommendations:**
```prisma
model Item {
  // Existing fields...
  quantity         Int       @default(1)
  isConsumable     Boolean   @default(false)
  minThreshold     Int?      // Null for non-consumables
  maxThreshold     Int?      // For overstocking alerts
  consumableType   String?   // "food", "supplies", "medication", etc.
  lastRestocked    DateTime?

  @@index([isConsumable, quantity]) // Composite index for alerts
  @@index([quantity])
}
```

### 1.2 API Route Validation

**Strengths:**
- ✅ Zod schemas used for validation (`itemSchema`, `itemUpdateSchema`)
- ✅ Type-safe validation with proper error messages
- ✅ Proper HTTP status codes (400, 404, 500)
- ✅ Try-catch error handling in all routes

**Weaknesses:**

```typescript
// Current validation in validations.ts
export const itemSchema = z.object({
  quantity: z.number().int().min(0).default(1),
  // ❌ Missing: No validation for consumable-specific fields
  // ❌ Missing: No foreign key existence validation
  // ❌ Missing: No business rule validation
})
```

**Issues:**

1. **Missing Foreign Key Validation**
   ```typescript
   // In route.ts line 74-80
   const item = await prisma.item.create({
     data: {
       ...itemData,
       tags: {
         create: tagIds.map((tagId) => ({ /* ... */ })),
       },
     },
   });
   // ❌ No check if tagIds exist before attempting to link
   ```

2. **Incomplete Business Logic Validation**
   - No validation that quantity can't decrease below 0 in updates
   - No validation of threshold logic (min < max)
   - No validation of consumable type enum values

3. **Error Handling Gaps**
   ```typescript
   catch (error) {
     console.error('Error creating item:', error);
     return NextResponse.json(
       { success: false, error: 'Failed to create item' },
       { status: 500 }
     );
   }
   // ❌ Generic error - doesn't distinguish between:
   //    - Database connection failure
   //    - Constraint violation
   //    - Foreign key error
   //    - Unique constraint violation
   ```

**Recommended Validation Schema:**
```typescript
export const consumableItemSchema = itemSchema.extend({
  isConsumable: z.boolean().default(false),
  minThreshold: z.number().int().min(0).optional(),
  maxThreshold: z.number().int().min(0).optional(),
  consumableType: z.enum([
    'food', 'beverage', 'cleaning', 'personal_care',
    'medication', 'office_supplies', 'other'
  ]).optional(),
}).refine(
  (data) => !data.maxThreshold || !data.minThreshold || data.maxThreshold > data.minThreshold,
  { message: "Max threshold must be greater than min threshold" }
).refine(
  (data) => !data.isConsumable || data.minThreshold !== undefined,
  { message: "Consumable items must have a minimum threshold" }
);
```

### 1.3 Type Safety Assessment

**Current State:**
- ✅ TypeScript used throughout
- ✅ Zod generates types via `z.infer<>`
- ✅ Prisma provides type-safe database access
- ⚠️ Mixed with Drizzle types causing confusion

**Type Safety Issues:**
```typescript
// In route.ts - async params pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ✅ GOOD: Proper Next.js 15 async params handling
}

// But in queries.ts - inconsistent ORM types
export async function getAllItems() {
  return db.query.items.findMany({ /* Drizzle types */ });
}
// vs routes using: prisma.item.findMany({ /* Prisma types */ })
// ❌ Type inconsistency between layers
```

### 1.4 Code Organization

**Directory Structure:**
```
src/
├── app/
│   └── api/items/          # API routes (uses Prisma)
├── db/
│   ├── queries.ts          # Database queries (uses Drizzle)
│   └── schema.ts           # Drizzle schema
├── lib/
│   └── validations.ts      # Zod schemas
└── prisma/
    └── schema.prisma       # Prisma schema
```

**Critical Architectural Issues:**

1. **Dual ORM Problem** 🔴
   - API routes import `prisma` from `@/lib/db`
   - Query functions use Drizzle ORM
   - Two separate schema definitions
   - **Risk**: Schema drift, type mismatches, maintenance burden

2. **No Service Layer** 🟡
   ```typescript
   // Current: Business logic in route handlers
   export async function POST(request: NextRequest) {
     const body = await request.json();
     const validatedData = itemSchema.parse(body);
     const item = await prisma.item.create({ /* ... */ });
     return NextResponse.json({ /* ... */ });
   }

   // Recommended: Service layer
   // services/itemService.ts
   export class ItemService {
     async createItem(data: ItemFormData): Promise<Item> {
       // Business logic here
       // Alert logic here
       // Validation here
     }
   }
   ```

3. **No Repository Pattern** 🟢
   - Direct ORM calls in routes
   - Difficult to mock for testing
   - Tight coupling to database implementation

**Recommendations:**
1. **URGENT**: Choose one ORM (recommend Prisma) and remove the other
2. Implement service layer for business logic
3. Add repository pattern for data access abstraction
4. Create proper error handling middleware

---

## 2. Performance Analysis

### 2.1 Database Query Efficiency

**Current Queries:**

```typescript
// queries.ts - getAllItems()
export async function getAllItems() {
  return db.query.items.findMany({
    with: {
      category: true,
      tags: { with: { tag: true } }
    },
    orderBy: desc(items.updatedAt)
  });
}
```

**Performance Issues:**

| Issue | Severity | Impact | Solution |
|-------|----------|--------|----------|
| No pagination in getAllItems | 🟡 High | Loads ALL items into memory | Add limit/offset |
| Eager loading all relations | 🟡 High | Unnecessary data transfer | Load on demand |
| No index on quantity | 🟡 High | Slow low-stock queries | Add index |
| No composite index | 🟡 High | Inefficient consumable queries | Add `(isConsumable, quantity)` |
| No query result caching | 🟢 Medium | Repeated identical queries | Add Redis/memory cache |

**Query Performance Recommendations:**

```typescript
// ❌ Current: No filtering capability
const items = await getAllItems(); // Loads everything!

// ✅ Recommended: Add filtering and pagination
export async function getLowStockConsumables(
  limit: number = 20,
  offset: number = 0
) {
  return db.query.items.findMany({
    where: and(
      eq(items.isConsumable, true),
      sql`${items.quantity} <= ${items.minThreshold}`
    ),
    with: {
      category: { columns: { id: true, name: true } }, // Select specific fields
    },
    orderBy: asc(items.quantity), // Most urgent first
    limit,
    offset,
  });
}
```

### 2.2 N+1 Query Analysis

**Current Implementation:**
```typescript
// API route - items/route.ts
const [items, total] = await Promise.all([
  prisma.item.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      location: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
    // ...
  }),
  prisma.item.count({ where }),
]);
```

**Analysis:**
- ✅ **Good**: Uses `include` which generates proper JOINs
- ✅ **Good**: Parallel execution with `Promise.all`
- ✅ **Good**: Selective field loading with `select`
- ⚠️ **Watch**: Tags relation could be expensive with many tags

**Potential N+1 in UI:**
```typescript
// items/page.tsx
{items.map((item) => (
  <Badge variant={item.quantity < 5 ? 'destructive' : 'default'}>
    {item.quantity}x
  </Badge>
))}
// ✅ No N+1 here - all data already loaded
```

### 2.3 Recommended Database Indexes

```sql
-- Performance Indexes
CREATE INDEX idx_items_quantity ON items(quantity);
CREATE INDEX idx_items_consumable_quantity ON items(isConsumable, quantity);
CREATE INDEX idx_items_category_id ON items(categoryId); -- Already exists
CREATE INDEX idx_items_location_id ON items(locationId); -- Already exists

-- Alert Query Optimization
CREATE INDEX idx_items_alert ON items(isConsumable, quantity, minThreshold)
  WHERE isConsumable = true AND quantity <= minThreshold;
```

### 2.4 Caching Strategy

**Current State:** ❌ No caching implemented

**Recommended Caching Layers:**

```typescript
// 1. In-memory cache for alert counts
import { LRUCache } from 'lru-cache';

const alertCache = new LRUCache<string, number>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function getAlertCount(): Promise<number> {
  const cached = alertCache.get('alert_count');
  if (cached !== undefined) return cached;

  const count = await prisma.item.count({
    where: {
      isConsumable: true,
      quantity: { lte: prisma.raw('minThreshold') },
    },
  });

  alertCache.set('alert_count', count);
  return count;
}

// 2. Cache invalidation on item updates
export async function updateItemQuantity(id: string, quantity: number) {
  const item = await prisma.item.update({
    where: { id },
    data: { quantity },
  });

  // Invalidate cache
  alertCache.delete('alert_count');

  return item;
}
```

**Cache Recommendations:**
- Alert count: 5 minute TTL
- Low-stock items list: 2 minute TTL
- Individual item details: 10 minute TTL
- Category/tag lists: 1 hour TTL (rarely change)

---

## 3. Security Review

### 3.1 Authentication & Authorization

**Current State:** 🔴 **CRITICAL VULNERABILITY**

```typescript
// API route - NO AUTH CHECKS
export async function POST(request: NextRequest) {
  // ❌ No authentication
  // ❌ No authorization
  // ❌ Anyone can create/modify/delete items
  const body = await request.json();
  // ...
}
```

**Security Risks:**
1. **No Authentication**: API endpoints are publicly accessible
2. **No Authorization**: No ownership validation
3. **No Rate Limiting**: Vulnerable to DoS attacks
4. **No CSRF Protection**: Cross-site request forgery possible

**Recommended Implementation:**

```typescript
// middleware/auth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return session;
}

// Protected route
export async function POST(request: NextRequest) {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;

  // Now we have authenticated user
  const userId = session.user.id;
  // ...
}
```

### 3.2 Input Validation & Sanitization

**SQL Injection Risk Analysis:**

```typescript
// queries.ts - searchItems function
export async function searchItems(query: string) {
  const searchPattern = `%${query}%`;
  return db.select().from(items).where(
    sql`${items.name} LIKE ${searchPattern} OR ${items.description} LIKE ${searchPattern}`
  );
}
```

**Analysis:**
- ✅ **Safe**: Drizzle parameterizes the query automatically
- ✅ **Safe**: `sql` template tag handles escaping
- ⚠️ **Note**: Looks risky but is actually safe

**XSS Vulnerability:**

```typescript
// validations.ts
export const itemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  notes: z.string().optional(),
  // ❌ No HTML sanitization
});
```

**Risk**: User could input:
```javascript
description: "<script>alert('XSS')</script>"
notes: "<img src=x onerror='malicious code'>"
```

**Recommended Sanitization:**

```typescript
import DOMPurify from 'isomorphic-dompurify';

export const itemSchema = z.object({
  name: z.string().min(1).max(200).transform(sanitize),
  description: z.string().optional().transform(sanitizeHTML),
  notes: z.string().optional().transform(sanitizeHTML),
});

function sanitize(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

function sanitizeHTML(value: string | undefined): string | undefined {
  if (!value) return value;
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u'],
    ALLOWED_ATTR: [],
  });
}
```

### 3.3 Data Validation Security

**Current Issues:**

1. **No Foreign Key Validation**
   ```typescript
   // User could send invalid IDs
   {
     categoryId: "non-existent-id",  // Will cause database error
     tagIds: ["fake-id-1", "fake-id-2"]  // Will fail silently or error
   }
   ```

2. **No Business Rule Validation**
   ```typescript
   // User could send:
   {
     quantity: -100,  // ✅ Prevented by z.number().min(0)
     minThreshold: 1000000,  // ❌ Not prevented - unrealistic
     maxThreshold: -50,  // ❌ Not prevented - invalid
   }
   ```

**Recommended Validation:**

```typescript
export const itemSchema = z.object({
  categoryId: z.string().refine(
    async (id) => await categoryExists(id),
    { message: "Category does not exist" }
  ),
  tagIds: z.array(z.string()).refine(
    async (ids) => await allTagsExist(ids),
    { message: "One or more tags do not exist" }
  ),
  quantity: z.number().int().min(0).max(999999),
  minThreshold: z.number().int().min(0).max(10000).optional(),
  maxThreshold: z.number().int().min(0).max(10000).optional(),
});
```

### 3.4 Error Information Leakage

**Current Implementation:**
```typescript
catch (error) {
  console.error('Error fetching items:', error);
  // ❌ Full error object logged (might contain sensitive data)
  return NextResponse.json(
    { success: false, error: 'Failed to fetch items' },
    // ✅ Generic message to user (good!)
    { status: 500 }
  );
}
```

**Recommendations:**
1. ✅ Keep generic error messages for users
2. ❌ Don't log full error objects in production
3. Use structured logging with sensitive data filtering
4. Implement error tracking (Sentry, LogRocket)

### 3.5 Security Checklist

| Security Control | Status | Priority | Notes |
|-----------------|--------|----------|-------|
| Authentication | ❌ Missing | 🔴 Critical | No auth system |
| Authorization | ❌ Missing | 🔴 Critical | No ownership checks |
| Input validation | ⚠️ Partial | 🟡 High | Zod validates types only |
| Output encoding | ❌ Missing | 🟡 High | No XSS protection |
| SQL injection protection | ✅ Present | ✅ Good | ORM handles it |
| Rate limiting | ❌ Missing | 🟡 High | DoS vulnerability |
| CSRF protection | ❌ Missing | 🟡 High | Need tokens |
| HTTPS enforcement | ⚠️ Unknown | 🟡 High | Check deployment |
| Secure headers | ⚠️ Unknown | 🟢 Medium | Check Next.js config |
| Dependency scanning | ⚠️ Unknown | 🟢 Medium | Run `npm audit` |

---

## 4. UX/Accessibility Analysis

### 4.1 Visual Design & Color Coding

**Current Implementation:**
```tsx
// items/page.tsx line 37
<Badge variant={item.quantity < 5 ? 'destructive' : 'default'}>
  {item.quantity}x
</Badge>
```

**Issues:**

1. **Color-Only Indicators** 🔴
   - WCAG 2.1 Guideline 1.4.1: Don't rely on color alone
   - Red badge for low stock has no supplementary indicator
   - Colorblind users cannot distinguish alert status

2. **Hardcoded Threshold** 🔴
   - Value of 5 is hardcoded
   - Not configurable per item
   - Not using database minThreshold field

3. **No Visual Hierarchy** 🟡
   - All low-stock items look the same
   - No distinction between "2 left" vs "4 left"
   - No urgency indicators

**Recommended Implementation:**

```tsx
function ItemAlertBadge({ item }: { item: Item }) {
  const threshold = item.minThreshold ?? 5;
  const isLowStock = item.isConsumable && item.quantity <= threshold;
  const isCritical = item.isConsumable && item.quantity <= threshold * 0.5;

  return (
    <Badge
      variant={isCritical ? 'destructive' : isLowStock ? 'warning' : 'default'}
      aria-label={
        isCritical
          ? `Critical: Only ${item.quantity} remaining`
          : isLowStock
          ? `Low stock: ${item.quantity} remaining`
          : `In stock: ${item.quantity} items`
      }
      role={isCritical ? 'alert' : 'status'}
    >
      {isCritical && <AlertTriangle className="w-3 h-3 mr-1" />}
      {isLowStock && !isCritical && <AlertCircle className="w-3 h-3 mr-1" />}
      {item.quantity}x
    </Badge>
  );
}
```

### 4.2 Screen Reader Compatibility

**Current State:** ❌ No accessibility features

**Missing ARIA Attributes:**

```tsx
// Current - NO screen reader support
<Badge variant="destructive">3x</Badge>

// Recommended
<Badge
  variant="destructive"
  role="alert"  // Announces to screen reader immediately
  aria-label="Low stock alert: Only 3 items remaining"
  aria-live="polite"  // For dynamic updates
>
  <span aria-hidden="true">3x</span>
  <span className="sr-only">Only 3 items remaining, below minimum threshold</span>
</Badge>
```

**Recommended Improvements:**

1. **Add Semantic HTML**
   ```tsx
   <section aria-labelledby="items-heading">
     <h1 id="items-heading">Items</h1>
     <div role="region" aria-label="Low stock alerts">
       {/* Alert items */}
     </div>
   </section>
   ```

2. **Add Live Regions for Dynamic Updates**
   ```tsx
   <div aria-live="polite" aria-atomic="true" className="sr-only">
     {alertCount} items are low on stock
   </div>
   ```

3. **Keyboard Navigation Enhancements**
   ```tsx
   // Add skip link
   <a href="#main-content" className="sr-only focus:not-sr-only">
     Skip to main content
   </a>

   // Add keyboard shortcuts
   <button
     onClick={filterLowStock}
     aria-keyshortcuts="Alt+L"
   >
     Show Low Stock Items (Alt+L)
   </button>
   ```

### 4.3 Color Contrast Analysis

**WCAG Requirements:**
- AA Standard: 4.5:1 for normal text
- AAA Standard: 7:1 for normal text
- Large text (18pt+): 3:1 (AA) or 4.5:1 (AAA)

**Badge Colors to Test:**

| Element | Background | Foreground | Required | Status |
|---------|-----------|------------|----------|--------|
| Destructive badge | Red | White | 4.5:1 | ⚠️ Needs testing |
| Default badge | Gray | Dark gray | 4.5:1 | ⚠️ Needs testing |
| Warning badge | Yellow | Black | 4.5:1 | ❌ Not implemented |

**Testing Commands:**
```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react
npm install --save-dev eslint-plugin-jsx-a11y

# Run in browser DevTools
# Chrome: Lighthouse Accessibility Audit
# Firefox: Accessibility Inspector
```

### 4.4 Mobile Responsiveness

**Current Implementation:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

**Analysis:**
- ✅ **Good**: Responsive grid layout
- ✅ **Good**: Breakpoints for different screen sizes
- ⚠️ **Concern**: Badge size on mobile devices
- ❌ **Missing**: Touch-friendly tap targets (min 44x44px)

**Recommended Improvements:**

```tsx
// Mobile-optimized badge
<Badge
  className="min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center"
  // Larger on mobile for better touch targets
>
  {item.quantity}x
</Badge>

// Swipe gestures for mobile
<div
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
  className="touch-pan-y"  // Enable touch scrolling
>
  {/* Item card */}
</div>
```

### 4.5 Accessibility Checklist

| Requirement | Status | Priority | Implementation |
|------------|--------|----------|----------------|
| Color contrast 4.5:1 | ⚠️ Unknown | 🔴 Critical | Test with tools |
| Keyboard navigation | ⚠️ Partial | 🔴 Critical | Add skip links |
| Screen reader labels | ❌ Missing | 🔴 Critical | Add ARIA labels |
| Focus indicators | ⚠️ Unknown | 🟡 High | Test visibility |
| Alt text for images | ✅ N/A | ✅ N/A | No images yet |
| Semantic HTML | ⚠️ Partial | 🟡 High | Add regions/landmarks |
| Live regions | ❌ Missing | 🟡 High | Add for alerts |
| Touch targets (44px) | ❌ Missing | 🟡 High | Increase badge size |
| Zoom support (200%) | ⚠️ Unknown | 🟢 Medium | Test responsive |
| Reduced motion | ❌ Missing | 🟢 Medium | Add prefers-reduced-motion |

---

## 5. Integration Verification

### 5.1 Data Flow Analysis

**Architecture Overview:**
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────┐
│ Next.js Route   │ ← Uses Prisma
│ /api/items      │
└──────┬──────────┘
       │ ORM Call
       ▼
┌─────────────────┐     ┌──────────────┐
│ Prisma Client   │     │   Drizzle    │ ← Used in queries.ts
└──────┬──────────┘     └──────┬───────┘
       │                        │
       └────────┬───────────────┘
                ▼
       ┌─────────────────┐
       │  SQLite Database │
       └─────────────────┘
```

**Critical Integration Issue:** 🔴

Two different ORMs access the same database:
- `prisma` used in `/app/api/items/route.ts`
- `drizzle` used in `/db/queries.ts`
- `schema.prisma` defines Prisma schema
- `schema.ts` defines Drizzle schema

**Risks:**
1. Schema drift between two definitions
2. Type mismatches between layers
3. Migration conflicts
4. Increased bundle size
5. Team confusion

**Example of Inconsistency:**

```typescript
// Prisma schema (schema.prisma) - Uses locationId reference
model Item {
  locationId   String
  location     Location  @relation(fields: [locationId], references: [id])
}

// Drizzle schema (schema.ts) - Uses location as string
export const items = sqliteTable('items', {
  location: text('location').notNull(),  // ❌ Different structure!
});
```

### 5.2 Component Integration

**Flow: Database → API → UI**

```typescript
// 1. Database Layer (queries.ts - Drizzle)
export async function getAllItems() {
  return db.query.items.findMany({
    with: { category: true, tags: { with: { tag: true } } }
  });
}

// 2. Page Layer (items/page.tsx)
export default async function ItemsPage() {
  const items = await getAllItems();  // ✅ Uses Drizzle
  // ...
}

// 3. API Layer (api/items/route.ts)
export async function GET(request: NextRequest) {
  const items = await prisma.item.findMany({...});  // ❌ Uses Prisma
  // ...
}
```

**Problem**: Different data shapes from different sources!

```typescript
// Drizzle returns:
{
  id: "...",
  location: "Kitchen",  // String
  category: { id: "...", name: "Food" }
}

// Prisma returns:
{
  id: "...",
  locationId: "...",  // ID reference
  location: { id: "...", name: "Kitchen" }  // Object
}
```

### 5.3 Alert Logic Integration

**Current State:**

```typescript
// UI hardcodes threshold
<Badge variant={item.quantity < 5 ? 'destructive' : 'default'}>

// Database has no threshold field
// No API endpoint for alerts
// No centralized alert logic
```

**Missing Integration Points:**

1. **No Alert API Endpoint**
   ```typescript
   // Needed: GET /api/items/alerts
   export async function GET() {
     const alerts = await prisma.item.findMany({
       where: {
         isConsumable: true,
         quantity: { lte: prisma.$raw('minThreshold') }
       }
     });
     return NextResponse.json({ success: true, data: alerts });
   }
   ```

2. **No Centralized Alert Logic**
   ```typescript
   // Needed: services/alertService.ts
   export class AlertService {
     static checkAlert(item: Item): AlertLevel {
       if (!item.isConsumable) return 'none';
       const threshold = item.minThreshold ?? 5;
       if (item.quantity === 0) return 'out_of_stock';
       if (item.quantity <= threshold * 0.5) return 'critical';
       if (item.quantity <= threshold) return 'low';
       return 'normal';
     }
   }
   ```

3. **No Real-time Updates**
   - Quantity changes don't trigger alerts
   - No notification system
   - No WebSocket/SSE for live updates

### 5.4 Edge Case Analysis

**Identified Edge Cases:**

| Scenario | Current Behavior | Expected Behavior | Status |
|----------|------------------|-------------------|--------|
| Quantity = 0 | Shows "0x" badge | Should show "Out of Stock" | ❌ Not handled |
| Quantity < 0 | Prevented by validation | Should never happen | ✅ Good |
| Delete item while viewing | 404 error | Graceful error + redirect | ❌ Poor UX |
| Concurrent quantity updates | Last write wins | Optimistic locking | ❌ No conflict resolution |
| Invalid threshold (min > max) | No validation | Should reject | ❌ Not validated |
| Non-consumable with threshold | Allowed | Should be null/ignored | ❌ No validation |
| Threshold changes during browse | Shows old value | Should update | ❌ No cache invalidation |
| Tag deleted while item has tag | Foreign key error | Cascade delete | ⚠️ Depends on DB constraints |

**Recommended Edge Case Handling:**

```typescript
// 1. Out of Stock Detection
function getStockStatus(item: Item): StockStatus {
  if (item.quantity === 0) return 'out_of_stock';
  if (!item.isConsumable) return 'not_applicable';
  const threshold = item.minThreshold ?? 5;
  if (item.quantity <= threshold * 0.5) return 'critical';
  if (item.quantity <= threshold) return 'low';
  return 'normal';
}

// 2. Optimistic Locking for Concurrent Updates
export async function updateQuantity(id: string, newQuantity: number, version: number) {
  const item = await prisma.item.updateMany({
    where: {
      id,
      version  // Only update if version matches
    },
    data: {
      quantity: newQuantity,
      version: { increment: 1 }
    }
  });

  if (item.count === 0) {
    throw new Error('Conflict: Item was modified by another user');
  }

  return item;
}

// 3. Graceful Error Handling
export async function getItemById(id: string) {
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return { success: false, error: 'not_found' };
    }
    return { success: true, data: item };
  } catch (error) {
    logger.error('Database error:', error);
    return { success: false, error: 'database_error' };
  }
}
```

### 5.5 Integration Test Requirements

**Critical Integration Tests Needed:**

```typescript
// 1. Full CRUD Flow Test
describe('Item CRUD with Alerts', () => {
  it('should create consumable item and trigger alert', async () => {
    const item = await createItem({
      name: 'Coffee Beans',
      isConsumable: true,
      quantity: 3,
      minThreshold: 5,
    });

    const alerts = await getAlerts();
    expect(alerts).toContainEqual(expect.objectContaining({ id: item.id }));
  });

  it('should update quantity and remove from alerts', async () => {
    const item = await createItem({ quantity: 3, minThreshold: 5 });
    await updateQuantity(item.id, 10);

    const alerts = await getAlerts();
    expect(alerts).not.toContainEqual(expect.objectContaining({ id: item.id }));
  });
});

// 2. ORM Consistency Test
describe('Prisma vs Drizzle Consistency', () => {
  it('should return same data shape from both ORMs', async () => {
    const itemId = 'test-id';

    const prismaResult = await prisma.item.findUnique({ where: { id: itemId } });
    const drizzleResult = await db.query.items.findFirst({ where: eq(items.id, itemId) });

    expect(normalizeItem(prismaResult)).toEqual(normalizeItem(drizzleResult));
  });
});

// 3. Alert Threshold Test
describe('Alert Threshold Logic', () => {
  it('should respect custom threshold per item', async () => {
    const item1 = await createItem({ quantity: 3, minThreshold: 10 });
    const item2 = await createItem({ quantity: 3, minThreshold: 2 });

    expect(isLowStock(item1)).toBe(true);
    expect(isLowStock(item2)).toBe(false);
  });
});

// 4. Concurrent Update Test
describe('Concurrent Updates', () => {
  it('should handle concurrent quantity updates', async () => {
    const item = await createItem({ quantity: 10 });

    // Simulate two users updating at the same time
    await Promise.all([
      updateQuantity(item.id, 8),
      updateQuantity(item.id, 7),
    ]);

    const result = await getItemById(item.id);
    expect([7, 8]).toContain(result.quantity);
  });
});
```

---

## 6. Performance Benchmarks

### 6.1 Current Performance Metrics

**Estimated Query Performance** (needs actual measurement):

| Operation | Estimated Time | Items Count | Status |
|-----------|---------------|-------------|---------|
| getAllItems() | ~50ms | 100 | ⚠️ Slow |
| getAllItems() | ~500ms | 1000 | 🔴 Very slow |
| getAllItems() | ~5s | 10000 | 🔴 Unacceptable |
| GET /api/items (paginated) | ~30ms | 20 items | ✅ Good |
| GET /api/items/[id] | ~10ms | 1 item | ✅ Good |
| POST /api/items | ~20ms | 1 item | ✅ Good |

**Bottleneck Analysis:**

```typescript
// Current bottleneck in items/page.tsx
export default async function ItemsPage() {
  const items = await getAllItems();  // ❌ Loads ALL items!
  // With 10,000 items = ~5 second load time
  // With 100,000 items = page crash
}
```

### 6.2 Recommended Performance Optimizations

**1. Implement Pagination**
```typescript
// Replace getAllItems with paginated version
export default async function ItemsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string }
}) {
  const page = parseInt(searchParams.page ?? '1');
  const limit = parseInt(searchParams.limit ?? '20');

  const { items, total } = await getPaginatedItems(page, limit);

  return (
    <>
      <ItemGrid items={items} />
      <Pagination page={page} limit={limit} total={total} />
    </>
  );
}
```

**2. Add Database Indexes**
```sql
-- Measure before indexes
EXPLAIN QUERY PLAN
SELECT * FROM items WHERE quantity <= 5 AND isConsumable = true;

-- Add indexes
CREATE INDEX idx_items_alert ON items(isConsumable, quantity);

-- Measure after indexes (should be 10-100x faster)
```

**3. Implement Query Result Caching**
```typescript
import { unstable_cache } from 'next/cache';

export const getAlertCount = unstable_cache(
  async () => {
    return await prisma.item.count({
      where: {
        isConsumable: true,
        quantity: { lte: prisma.$raw('minThreshold') }
      }
    });
  },
  ['alert-count'],
  { revalidate: 60 } // Cache for 60 seconds
);
```

**4. Lazy Load Relations**
```typescript
// Instead of eager loading everything
const items = await prisma.item.findMany({
  include: { category: true, location: true, tags: true }
});

// Load only what's needed
const items = await prisma.item.findMany({
  select: {
    id: true,
    name: true,
    quantity: true,
    isConsumable: true,
    minThreshold: true,
    category: { select: { name: true } }
    // Don't load location and tags if not needed
  }
});
```

### 6.3 Performance Testing Script

```typescript
// scripts/benchmark-queries.ts
import { performance } from 'perf_hooks';

async function benchmark() {
  const tests = [
    { name: 'getAllItems', fn: getAllItems },
    { name: 'getAlerts', fn: getAlerts },
    { name: 'searchItems', fn: () => searchItems('coffee') },
  ];

  for (const test of tests) {
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await test.fn();
      const end = performance.now();
      times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`${test.name}:`, {
      avg: `${avg.toFixed(2)}ms`,
      min: `${min.toFixed(2)}ms`,
      max: `${max.toFixed(2)}ms`,
    });
  }
}

benchmark();
```

---

## 7. Recommendations & Action Plan

### 7.1 Priority Matrix

```
CRITICAL (Do First)          HIGH (Do Soon)
┌─────────────────────┐    ┌─────────────────────┐
│ • Fix Dual ORM      │    │ • Add Accessibility │
│ • Add Auth/AuthZ    │    │ • Add DB Indexes    │
│ • Add Consumable    │    │ • Service Layer     │
│   Fields            │    │ • Error Tracking    │
│ • Fix Hardcoded     │    │ • Input Sanitization│
│   Threshold         │    └─────────────────────┘
└─────────────────────┘

MEDIUM (Plan)               LOW (Future)
┌─────────────────────┐    ┌─────────────────────┐
│ • Repository Pattern│    │ • GraphQL API       │
│ • Caching Layer     │    │ • Real-time Updates │
│ • Mobile Optimization│   │ • Advanced Analytics│
│ • Integration Tests │    │ • Export/Import     │
└─────────────────────┘    └─────────────────────┘
```

### 7.2 Three-Phase Implementation Plan

#### Phase 1: Critical Fixes (Week 1-2)

**Goal**: Fix breaking issues and security vulnerabilities

1. **Unify Database Access** 🔴
   ```bash
   # Decision: Keep Prisma, remove Drizzle
   npm uninstall drizzle-orm drizzle-kit
   # Update all queries to use Prisma
   # Remove /db/schema.ts
   ```

2. **Add Consumable Fields** 🔴
   ```prisma
   // schema.prisma
   model Item {
     // ... existing fields
     isConsumable     Boolean   @default(false)
     minThreshold     Int?
     maxThreshold     Int?
     consumableType   String?
     lastRestocked    DateTime?

     @@index([isConsumable, quantity])
   }
   ```

3. **Implement Authentication** 🔴
   ```bash
   npm install next-auth @auth/prisma-adapter
   # Setup NextAuth with GitHub/Google provider
   # Add middleware for protected routes
   ```

4. **Fix Hardcoded Threshold** 🔴
   ```typescript
   // Replace
   item.quantity < 5
   // With
   item.isConsumable && item.quantity <= (item.minThreshold ?? 5)
   ```

**Deliverables:**
- [ ] Single ORM (Prisma)
- [ ] Database migration with new fields
- [ ] Authentication system
- [ ] Dynamic threshold logic

#### Phase 2: Quality Improvements (Week 3-4)

**Goal**: Improve code quality, accessibility, and performance

1. **Add Accessibility Features** 🟡
   - ARIA labels on all alerts
   - Icons + color for status
   - Screen reader announcements
   - Keyboard navigation
   - Color contrast verification

2. **Performance Optimization** 🟡
   ```sql
   -- Add indexes
   CREATE INDEX idx_items_consumable_alert
   ON items(isConsumable, quantity, minThreshold)
   WHERE isConsumable = true;
   ```

   ```typescript
   // Add caching
   import { LRUCache } from 'lru-cache';
   const cache = new LRUCache({ max: 100, ttl: 300000 });
   ```

3. **Service Layer Architecture** 🟡
   ```
   src/
   ├── services/
   │   ├── itemService.ts
   │   ├── alertService.ts
   │   └── notificationService.ts
   ├── repositories/
   │   └── itemRepository.ts
   └── app/api/
       └── items/ (thin controllers)
   ```

4. **Validation Enhancement** 🟡
   - Add foreign key validation
   - Add business rule validation
   - Add XSS sanitization
   - Add rate limiting

**Deliverables:**
- [ ] WCAG 2.1 AA compliance
- [ ] Database indexes in place
- [ ] Service layer implemented
- [ ] Enhanced validation

#### Phase 3: Advanced Features (Week 5-6)

**Goal**: Add polish and advanced functionality

1. **Alert API Endpoint** 🟢
   ```typescript
   // GET /api/items/alerts
   // POST /api/items/[id]/restock
   // GET /api/items/stats
   ```

2. **Testing Infrastructure** 🟢
   ```bash
   npm install --save-dev jest @testing-library/react
   npm install --save-dev @testing-library/jest-dom
   npm install --save-dev playwright
   ```

3. **Error Tracking** 🟢
   ```bash
   npm install @sentry/nextjs
   # Setup Sentry for production error tracking
   ```

4. **Documentation** 🟢
   - API documentation (OpenAPI/Swagger)
   - Component Storybook
   - Developer guide
   - User manual

**Deliverables:**
- [ ] Complete API documentation
- [ ] 80% test coverage
- [ ] Error tracking in production
- [ ] User-facing documentation

### 7.3 Success Metrics

**After Phase 1:**
- [ ] Security score: A (no critical vulnerabilities)
- [ ] Zero authentication bypasses
- [ ] Configurable thresholds working
- [ ] Single ORM in use

**After Phase 2:**
- [ ] Accessibility score: 90+ (Lighthouse)
- [ ] Page load time: < 2s (with 1000 items)
- [ ] Query performance: < 100ms (with indexes)
- [ ] Code quality: B+ (SonarQube)

**After Phase 3:**
- [ ] Test coverage: > 80%
- [ ] Zero unhandled errors in production
- [ ] API documentation complete
- [ ] User satisfaction: 4+ / 5

---

## 8. Conclusion

### 8.1 Summary of Findings

The consumables alert feature is **partially implemented** with significant gaps in functionality, security, and accessibility. The current implementation provides basic quantity tracking with a hardcoded threshold, but lacks:

- Dedicated consumable fields and configuration
- Authentication and authorization
- Accessibility features for disabled users
- Performance optimization for scale
- Comprehensive testing

The **dual ORM configuration** (Prisma + Drizzle) is the most critical architectural issue and poses a significant risk of schema drift and type mismatches.

### 8.2 Overall Assessment

| Category | Score | Grade | Status |
|----------|-------|-------|--------|
| Code Quality | 5/10 | C | ⚠️ Needs improvement |
| Security | 2/10 | F | 🔴 Critical issues |
| Performance | 6/10 | C+ | ⚠️ Unoptimized |
| Accessibility | 3/10 | D | 🔴 Non-compliant |
| Integration | 4/10 | D+ | 🔴 Major issues |
| **Overall** | **4.5/10** | **D** | 🔴 **Not production-ready** |

### 8.3 Go/No-Go Recommendation

**Recommendation: 🔴 DO NOT DEPLOY TO PRODUCTION**

**Reasons:**
1. No authentication - anyone can modify data
2. Non-compliant with WCAG accessibility standards
3. Dual ORM setup risks data integrity
4. Hardcoded business logic
5. Missing critical features (configurable thresholds)

**Minimum Requirements for Production:**
- ✅ Authentication system implemented
- ✅ Single ORM in use
- ✅ Configurable alert thresholds
- ✅ Basic accessibility features
- ✅ Rate limiting on API endpoints

### 8.4 Next Steps

1. **Immediate**: Review this report with team
2. **Week 1**: Start Phase 1 critical fixes
3. **Week 2**: Security audit after auth implementation
4. **Week 3-4**: Implement Phase 2 improvements
5. **Week 5**: User acceptance testing
6. **Week 6**: Final security review before production

---

## Appendix A: Code Examples

### A.1 Complete Alert Service Implementation

```typescript
// services/alertService.ts
import { Item } from '@prisma/client';

export type AlertLevel = 'normal' | 'low' | 'critical' | 'out_of_stock' | 'not_applicable';

export interface AlertInfo {
  level: AlertLevel;
  message: string;
  color: 'default' | 'warning' | 'destructive';
  icon: 'check' | 'alert-circle' | 'alert-triangle' | 'x-circle';
  urgent: boolean;
}

export class AlertService {
  static checkAlert(item: Item): AlertInfo {
    if (!item.isConsumable) {
      return {
        level: 'not_applicable',
        message: 'Not a consumable item',
        color: 'default',
        icon: 'check',
        urgent: false,
      };
    }

    const threshold = item.minThreshold ?? 5;
    const criticalThreshold = Math.ceil(threshold * 0.5);

    if (item.quantity === 0) {
      return {
        level: 'out_of_stock',
        message: 'Out of stock - restock immediately',
        color: 'destructive',
        icon: 'x-circle',
        urgent: true,
      };
    }

    if (item.quantity <= criticalThreshold) {
      return {
        level: 'critical',
        message: `Critical: Only ${item.quantity} remaining (threshold: ${threshold})`,
        color: 'destructive',
        icon: 'alert-triangle',
        urgent: true,
      };
    }

    if (item.quantity <= threshold) {
      return {
        level: 'low',
        message: `Low stock: ${item.quantity} remaining (threshold: ${threshold})`,
        color: 'warning',
        icon: 'alert-circle',
        urgent: false,
      };
    }

    return {
      level: 'normal',
      message: `In stock: ${item.quantity} items`,
      color: 'default',
      icon: 'check',
      urgent: false,
    };
  }

  static async getActiveAlerts(prisma: PrismaClient): Promise<Item[]> {
    return await prisma.item.findMany({
      where: {
        isConsumable: true,
        OR: [
          { quantity: 0 },
          {
            AND: [
              { quantity: { lte: prisma.$raw('minThreshold') } },
              { minThreshold: { not: null } },
            ],
          },
        ],
      },
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { quantity: 'asc' }, // Most urgent first
    });
  }

  static async getAlertCounts(prisma: PrismaClient) {
    const [critical, low, outOfStock] = await Promise.all([
      prisma.item.count({
        where: {
          isConsumable: true,
          quantity: {
            gt: 0,
            lte: prisma.$raw('CAST(minThreshold * 0.5 AS INTEGER)'),
          },
        },
      }),
      prisma.item.count({
        where: {
          isConsumable: true,
          quantity: {
            gt: prisma.$raw('CAST(minThreshold * 0.5 AS INTEGER)'),
            lte: prisma.$raw('minThreshold'),
          },
        },
      }),
      prisma.item.count({
        where: {
          isConsumable: true,
          quantity: 0,
        },
      }),
    ]);

    return { critical, low, outOfStock, total: critical + low + outOfStock };
  }
}
```

### A.2 Complete Alert API Routes

```typescript
// app/api/items/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AlertService } from '@/services/alertService';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level'); // 'critical', 'low', 'all'

    let where: any = {
      isConsumable: true,
      userId: session.user.id, // Filter by user
    };

    if (level === 'critical') {
      where.quantity = {
        gt: 0,
        lte: prisma.$raw('CAST(minThreshold * 0.5 AS INTEGER)'),
      };
    } else if (level === 'low') {
      where.quantity = {
        gt: prisma.$raw('CAST(minThreshold * 0.5 AS INTEGER)'),
        lte: prisma.$raw('minThreshold'),
      };
    } else if (level === 'out_of_stock') {
      where.quantity = 0;
    } else {
      // All alerts
      where.OR = [
        { quantity: 0 },
        { quantity: { lte: prisma.$raw('minThreshold') } },
      ];
    }

    const [items, counts] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: { select: { name: true, icon: true } },
          location: { select: { name: true } },
        },
        orderBy: { quantity: 'asc' },
      }),
      AlertService.getAlertCounts(prisma),
    ]);

    // Enrich with alert info
    const alertItems = items.map((item) => ({
      ...item,
      alert: AlertService.checkAlert(item),
    }));

    return NextResponse.json({
      success: true,
      data: alertItems,
      counts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
```

### A.3 Accessible Alert Badge Component

```typescript
// components/ItemAlertBadge.tsx
import { AlertTriangle, AlertCircle, XCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertService } from '@/services/alertService';
import type { Item } from '@prisma/client';

interface ItemAlertBadgeProps {
  item: Item;
  showLabel?: boolean;
}

export function ItemAlertBadge({ item, showLabel = true }: ItemAlertBadgeProps) {
  const alert = AlertService.checkAlert(item);

  const icons = {
    'x-circle': XCircle,
    'alert-triangle': AlertTriangle,
    'alert-circle': AlertCircle,
    check: Check,
  };

  const Icon = icons[alert.icon];

  return (
    <Badge
      variant={alert.color}
      role={alert.urgent ? 'alert' : 'status'}
      aria-label={alert.message}
      aria-live={alert.urgent ? 'assertive' : 'polite'}
      className="flex items-center gap-1 min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto"
    >
      <Icon
        className="w-4 h-4"
        aria-hidden="true"
      />
      <span className="font-medium">
        {item.quantity}x
      </span>
      {showLabel && (
        <span className="sr-only">
          {alert.message}
        </span>
      )}
    </Badge>
  );
}
```

---

## Appendix B: Testing Requirements

### B.1 Unit Tests

```typescript
// __tests__/services/alertService.test.ts
import { AlertService } from '@/services/alertService';

describe('AlertService', () => {
  describe('checkAlert', () => {
    it('should return not_applicable for non-consumable items', () => {
      const item = { isConsumable: false, quantity: 5 } as any;
      const alert = AlertService.checkAlert(item);
      expect(alert.level).toBe('not_applicable');
    });

    it('should return out_of_stock when quantity is 0', () => {
      const item = { isConsumable: true, quantity: 0, minThreshold: 5 } as any;
      const alert = AlertService.checkAlert(item);
      expect(alert.level).toBe('out_of_stock');
      expect(alert.urgent).toBe(true);
    });

    it('should return critical when below 50% of threshold', () => {
      const item = { isConsumable: true, quantity: 2, minThreshold: 10 } as any;
      const alert = AlertService.checkAlert(item);
      expect(alert.level).toBe('critical');
      expect(alert.urgent).toBe(true);
    });

    it('should return low when at or below threshold', () => {
      const item = { isConsumable: true, quantity: 5, minThreshold: 10 } as any;
      const alert = AlertService.checkAlert(item);
      expect(alert.level).toBe('low');
    });

    it('should return normal when above threshold', () => {
      const item = { isConsumable: true, quantity: 15, minThreshold: 10 } as any;
      const alert = AlertService.checkAlert(item);
      expect(alert.level).toBe('normal');
    });

    it('should use default threshold of 5 when not set', () => {
      const item = { isConsumable: true, quantity: 4, minThreshold: null } as any;
      const alert = AlertService.checkAlert(item);
      expect(alert.level).toBe('low');
    });
  });
});
```

### B.2 Integration Tests

```typescript
// __tests__/integration/alerts.test.ts
import { prisma } from '@/lib/db';
import { AlertService } from '@/services/alertService';

describe('Alert Integration', () => {
  beforeEach(async () => {
    await prisma.item.deleteMany();
  });

  it('should create item and detect low stock alert', async () => {
    const item = await prisma.item.create({
      data: {
        name: 'Coffee',
        isConsumable: true,
        quantity: 3,
        minThreshold: 5,
        categoryId: 'test-category',
        locationId: 'test-location',
      },
    });

    const alert = AlertService.checkAlert(item);
    expect(alert.level).toBe('low');

    const alerts = await AlertService.getActiveAlerts(prisma);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe(item.id);
  });

  it('should update quantity and clear alert', async () => {
    const item = await prisma.item.create({
      data: {
        name: 'Coffee',
        isConsumable: true,
        quantity: 3,
        minThreshold: 5,
        categoryId: 'test-category',
        locationId: 'test-location',
      },
    });

    const updated = await prisma.item.update({
      where: { id: item.id },
      data: { quantity: 10 },
    });

    const alert = AlertService.checkAlert(updated);
    expect(alert.level).toBe('normal');

    const alerts = await AlertService.getActiveAlerts(prisma);
    expect(alerts).toHaveLength(0);
  });
});
```

### B.3 E2E Tests

```typescript
// e2e/alerts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Consumable Alerts', () => {
  test('should display low stock badge', async ({ page }) => {
    await page.goto('/items');

    // Find item with low stock
    const lowStockBadge = page.locator('[aria-label*="Low stock"]');
    await expect(lowStockBadge).toBeVisible();

    // Check color
    await expect(lowStockBadge).toHaveClass(/warning/);

    // Check icon
    const icon = lowStockBadge.locator('svg');
    await expect(icon).toBeVisible();
  });

  test('should announce alerts to screen reader', async ({ page }) => {
    await page.goto('/items');

    // Check ARIA attributes
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();

    const ariaLabel = await alert.getAttribute('aria-label');
    expect(ariaLabel).toContain('Critical');
  });

  test('should filter by alert level', async ({ page }) => {
    await page.goto('/items?alert=critical');

    const items = page.locator('[data-testid="item-card"]');
    const count = await items.count();

    // All items should have critical alerts
    for (let i = 0; i < count; i++) {
      const badge = items.nth(i).locator('[role="alert"]');
      await expect(badge).toBeVisible();
    }
  });
});
```

---

## Appendix C: Migration Scripts

### C.1 Add Consumable Fields Migration

```prisma
// prisma/migrations/XXX_add_consumable_fields/migration.sql

-- Add new columns
ALTER TABLE "Item" ADD COLUMN "isConsumable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Item" ADD COLUMN "minThreshold" INTEGER;
ALTER TABLE "Item" ADD COLUMN "maxThreshold" INTEGER;
ALTER TABLE "Item" ADD COLUMN "consumableType" TEXT;
ALTER TABLE "Item" ADD COLUMN "lastRestocked" TIMESTAMP;

-- Add indexes for performance
CREATE INDEX "Item_isConsumable_quantity_idx" ON "Item"("isConsumable", "quantity");
CREATE INDEX "Item_quantity_idx" ON "Item"("quantity");

-- Add partial index for active alerts
CREATE INDEX "Item_active_alerts_idx" ON "Item"("isConsumable", "quantity", "minThreshold")
  WHERE "isConsumable" = true AND "quantity" <= "minThreshold";

-- Add check constraint
ALTER TABLE "Item" ADD CONSTRAINT "Item_threshold_check"
  CHECK ("maxThreshold" IS NULL OR "minThreshold" IS NULL OR "maxThreshold" > "minThreshold");
```

### C.2 Data Migration Script

```typescript
// scripts/migrate-consumables.ts
import { prisma } from '@/lib/db';

async function migrateConsumables() {
  console.log('Starting consumable migration...');

  // Mark items as consumable based on category
  const consumableCategories = ['Food', 'Beverages', 'Cleaning Supplies', 'Office Supplies'];

  const result = await prisma.item.updateMany({
    where: {
      category: {
        name: { in: consumableCategories },
      },
    },
    data: {
      isConsumable: true,
      minThreshold: 5, // Default threshold
    },
  });

  console.log(`Updated ${result.count} items as consumable`);

  // Set consumable types based on category
  for (const categoryName of consumableCategories) {
    const type = categoryName.toLowerCase().replace(' ', '_');
    await prisma.item.updateMany({
      where: {
        category: { name: categoryName },
        isConsumable: true,
      },
      data: {
        consumableType: type,
      },
    });
  }

  console.log('Migration complete!');
}

migrateConsumables()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Document Information

**Report Generated:** 2025-10-11
**Agent:** Code Analyzer (Hive Mind Swarm)
**Version:** 1.0
**Confidence Level:** High (based on code review and static analysis)

**Verification Status:**
- ✅ Database schema reviewed
- ✅ API routes analyzed
- ✅ UI components inspected
- ✅ Validation logic verified
- ⚠️ Performance metrics estimated (not measured)
- ⚠️ Security audit incomplete (no penetration testing)
- ⚠️ Accessibility not tested with real users

**Next Review:** After Phase 1 implementation (2 weeks)
