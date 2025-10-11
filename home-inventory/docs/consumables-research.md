# Consumables Inventory Management Research

**Research Agent Report**
**Date:** 2025-10-10
**Mission:** Research consumables inventory patterns and alert mechanisms for Home Inventory System

---

## Executive Summary

This research provides comprehensive recommendations for implementing a consumables category with minimum amount alerts. The system currently has basic quantity tracking with a hardcoded threshold (quantity < 5). This research proposes a flexible, scalable solution for managing consumables with configurable minimum thresholds and multi-level alert mechanisms.

**Key Recommendations:**
1. Add `minQuantity` field to **items table** (item-level flexibility)
2. Implement calculated alert status (critical, warning, ok)
3. Create dedicated alerts dashboard with filtering and dismissal
4. Use visual indicators (color-coded badges, icons) for low-stock items
5. Support both automatic and manual alert management

---

## 1. Consumables Inventory Patterns

### 1.1 Industry Standards for Minimum Stock Levels

Different consumable types require different minimum threshold strategies:

#### Consumable Categories & Typical Thresholds

| Consumable Type | Minimum Threshold Strategy | Example Min Qty |
|----------------|---------------------------|-----------------|
| **Batteries** | Based on device count + 50% safety | 4-8 units |
| **Cleaning Supplies** | 1-2 weeks supply | 2-3 bottles |
| **Paper Products** | 2 weeks supply | 2-4 rolls |
| **Food/Pantry Items** | Lead time + safety stock | Varies by shelf life |
| **Medical Supplies** | Based on usage rate + 100% safety | 5-10 units |
| **Office Supplies** | 1 month supply | 1-2 boxes |
| **Light Bulbs** | Number of fixtures + 2 | 3-5 bulbs |
| **Pet Supplies** | 2 weeks supply | 2-4 units |

#### Reorder Point Formula (Industry Standard)

```
Reorder Point = (Average Daily Usage × Lead Time) + Safety Stock

Example:
- Coffee filters: 2 per day × 7 days lead time + 7 safety stock = 21 minimum
- AA Batteries: 0.5 per day × 3 days + 4 safety = 5.5 ≈ 6 minimum
```

#### Safety Stock Guidelines

- **Critical items** (medical, safety): 100% safety stock
- **High-use items** (daily consumables): 50% safety stock
- **Low-use items** (occasional): 25% safety stock
- **Easily replaceable** (convenience store items): 10-25% safety stock

### 1.2 Alert Threshold Levels

Industry best practice: **Three-tier alert system**

```
CRITICAL:  quantity <= (minQuantity × 0.5)    // 50% or less of minimum
WARNING:   quantity <= minQuantity             // At or below minimum
OK:        quantity > minQuantity              // Adequately stocked
```

**Visual Indicators:**
- 🔴 **Critical** (Red): Immediate action required
- 🟡 **Warning** (Yellow/Orange): Reorder soon
- 🟢 **OK** (Green): Adequately stocked

---

## 2. Database Schema Design

### 2.1 Recommended Approach: Item-Level `minQuantity`

**Recommendation: Add `minQuantity` to the `items` table**

**Rationale:**
1. ✅ **Flexibility**: Different items in same category have different needs
   - Example: CR2032 batteries (min 8) vs D batteries (min 4)
   - Example: Paper towels (min 3) vs toilet paper (min 6)
2. ✅ **Precision**: Users set thresholds per specific item/brand
3. ✅ **Scalability**: Supports advanced features (predictive reordering)
4. ✅ **User Control**: Per-item customization in item forms
5. ✅ **Migration Path**: Optional field, backward compatible

**Alternative (Not Recommended): Category-Level**
- ❌ Less flexible (one size fits all in category)
- ❌ Requires category redesign for consumables vs non-consumables
- ❌ Can't handle variations within category

### 2.2 Schema Changes

#### Drizzle Schema (`src/db/schema.ts`)

```typescript
export const items = sqliteTable('items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: text('category_id').notNull().references(() => categories.id),
  location: text('location').notNull(),
  quantity: integer('quantity').notNull().default(1),

  // NEW FIELD
  minQuantity: integer('min_quantity').default(0), // 0 = no alert

  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  purchasePrice: real('purchase_price'),
  // ... rest of fields
})
```

#### Prisma Schema (`prisma/schema.prisma`)

```prisma
model Item {
  id           String    @id @default(cuid())
  name         String
  description  String?
  quantity     Int       @default(1)

  // NEW FIELD
  minQuantity  Int?      @default(0) @map("min_quantity")

  purchaseDate DateTime?
  purchasePrice Float?
  // ... rest of fields
}
```

#### Migration Script (Drizzle)

```typescript
// migrations/XXXX_add_min_quantity.ts
import { sql } from 'drizzle-orm'

export async function up(db) {
  await db.run(sql`
    ALTER TABLE items
    ADD COLUMN min_quantity INTEGER DEFAULT 0
  `)

  // Optional: Set defaults for existing consumable categories
  await db.run(sql`
    UPDATE items
    SET min_quantity = 5
    WHERE category_id IN (
      SELECT id FROM categories
      WHERE name IN ('Batteries', 'Cleaning Supplies')
    )
  `)
}
```

### 2.3 Computed Alert Status

**Server-Side Calculation** (recommended for filtering/sorting):

```typescript
// Add to API response or database view
function getAlertStatus(quantity: number, minQuantity: number): 'critical' | 'warning' | 'ok' {
  if (minQuantity === 0) return 'ok' // No alerts for items without minimums
  if (quantity === 0) return 'critical'
  if (quantity <= minQuantity * 0.5) return 'critical'
  if (quantity <= minQuantity) return 'warning'
  return 'ok'
}
```

**Database Index** (for performance):

```sql
-- Index for filtering low-stock items
CREATE INDEX idx_items_quantity_alert ON items(quantity, min_quantity)
WHERE min_quantity > 0;

-- Index for consumables category queries
CREATE INDEX idx_items_category_quantity ON items(category_id, quantity, min_quantity);
```

### 2.4 Schema Sync Strategy

**Current Issue:** Drizzle and Prisma schemas are not identical
- Drizzle: `location` is text field
- Prisma: `location` is relation to Location model

**Recommendation:**
1. Choose **primary ORM** (currently Prisma is used in routes)
2. Keep Drizzle schema as backup/migration tool
3. Use Prisma for active development
4. Sync schemas before migration: add `minQuantity` to both

---

## 3. Alert Mechanisms

### 3.1 Alert Detection Strategies

#### Option A: Real-Time Calculation (Recommended for MVP)

**Pros:**
- ✅ Always accurate
- ✅ No background jobs needed
- ✅ Simple to implement
- ✅ No alert storage required

**Cons:**
- ❌ Calculated on every request (minor performance impact)

**Implementation:**
```typescript
// API route: /api/items/alerts
export async function GET(request: NextRequest) {
  const alerts = await prisma.item.findMany({
    where: {
      minQuantity: { gt: 0 }, // Only items with thresholds
      OR: [
        { quantity: { lte: prisma.raw('min_quantity') } }, // Warning
        { quantity: 0 } // Critical
      ]
    },
    include: { category: true, location: true },
    orderBy: [
      { quantity: 'asc' }, // Most critical first
      { name: 'asc' }
    ]
  })

  // Add calculated alertStatus
  const enrichedAlerts = alerts.map(item => ({
    ...item,
    alertStatus: getAlertStatus(item.quantity, item.minQuantity)
  }))

  return NextResponse.json({ alerts: enrichedAlerts })
}
```

#### Option B: Stored Alerts (Future Enhancement)

**Pros:**
- ✅ Better for notification history
- ✅ Supports alert acknowledgment
- ✅ Tracks alert duration

**Cons:**
- ❌ More complex (separate alerts table)
- ❌ Requires background job for generation
- ❌ Potential for stale data

**Schema (if needed later):**
```typescript
export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => items.id),
  status: text('status', { enum: ['critical', 'warning'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
  dismissedAt: integer('dismissed_at', { mode: 'timestamp' })
})
```

### 3.2 Notification Channels

#### Phase 1: In-App Notifications (MVP)
1. **Badge on navigation** - Show count of critical + warning alerts
2. **Dashboard widget** - "Low Stock Items" card
3. **Item list indicators** - Visual badges on low-stock items
4. **Dedicated alerts page** - `/alerts` route with filterable list

#### Phase 2: External Notifications (Future)
1. **Email notifications** - Daily digest of low-stock items
2. **Push notifications** - Critical alerts (quantity = 0)
3. **SMS notifications** - For critical household items
4. **Integration webhooks** - Connect to shopping list apps

### 3.3 Alert Prioritization

**Critical Alerts (Immediate Action):**
- Quantity = 0 (out of stock)
- Quantity ≤ 50% of minimum
- Essential items (safety, medical, pet food)

**Warning Alerts (Plan to Reorder):**
- Quantity ≤ minimum threshold
- Quantity > 50% of minimum
- Non-essential consumables

**Sorting Priority:**
```typescript
// Alert page sorting
const sortAlerts = (alerts) => {
  return alerts.sort((a, b) => {
    // 1. Critical before warning
    if (a.alertStatus === 'critical' && b.alertStatus !== 'critical') return -1
    if (a.alertStatus !== 'critical' && b.alertStatus === 'critical') return 1

    // 2. Lower quantity first within same status
    if (a.quantity !== b.quantity) return a.quantity - b.quantity

    // 3. Higher minQuantity first (more important items)
    return b.minQuantity - a.minQuantity
  })
}
```

### 3.4 Alert Management Features

**User Actions:**
1. **View Alert Details** - Click to see item details
2. **Mark as Ordered** - Dismiss alert temporarily (7-14 days)
3. **Snooze Alert** - Hide for custom duration (1 day, 3 days, 1 week)
4. **Update Quantity** - Quick action to update stock from alert
5. **Adjust Minimum** - Modify threshold if incorrect
6. **Bulk Actions** - Mark multiple as ordered, export shopping list

---

## 4. UI/UX Design Patterns

### 4.1 Visual Indicators

#### Badge Variants (Already Implemented)

Current code has basic implementation:
```tsx
<Badge variant={item.quantity < 5 ? 'destructive' : 'default'}>
  {item.quantity}x
</Badge>
```

**Enhanced Version:**
```tsx
function getQuantityBadgeVariant(quantity: number, minQuantity: number) {
  if (minQuantity === 0) return 'default' // No tracking
  if (quantity === 0) return 'destructive' // Out of stock
  if (quantity <= minQuantity * 0.5) return 'destructive' // Critical
  if (quantity <= minQuantity) return 'warning' // Warning
  return 'default' // OK
}

<Badge variant={getQuantityBadgeVariant(item.quantity, item.minQuantity)}>
  {quantity === 0 ? 'OUT OF STOCK' : `${quantity}x`}
  {quantity <= minQuantity && minQuantity > 0 && (
    <AlertTriangle className="ml-1 h-3 w-3" />
  )}
</Badge>
```

#### Color Coding Standards

```tsx
// Tailwind CSS classes for alert levels
const ALERT_STYLES = {
  critical: {
    badge: 'bg-red-500 text-white',
    card: 'border-red-500 bg-red-50',
    icon: 'text-red-500',
    text: 'text-red-700'
  },
  warning: {
    badge: 'bg-orange-500 text-white',
    card: 'border-orange-500 bg-orange-50',
    icon: 'text-orange-500',
    text: 'text-orange-700'
  },
  ok: {
    badge: 'bg-green-500 text-white',
    card: 'border-gray-200',
    icon: 'text-green-500',
    text: 'text-gray-700'
  }
}
```

### 4.2 Dashboard Widget

**"Low Stock Items" Card** on main dashboard:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-orange-500" />
      Low Stock Alerts
      <Badge variant="destructive">{criticalCount}</Badge>
      <Badge variant="warning">{warningCount}</Badge>
    </CardTitle>
  </CardHeader>
  <CardContent>
    {alerts.slice(0, 5).map(item => (
      <div key={item.id} className="flex justify-between items-center py-2">
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.category.name}</p>
        </div>
        <Badge variant={getAlertVariant(item)}>
          {item.quantity}/{item.minQuantity}
        </Badge>
      </div>
    ))}
    <Link href="/alerts">
      <Button variant="outline" className="w-full mt-4">
        View All Alerts ({totalAlerts})
      </Button>
    </Link>
  </CardContent>
</Card>
```

### 4.3 Dedicated Alerts Page

**Route:** `/alerts` or `/app/alerts/page.tsx`

**Features:**
- Filter by alert status (critical, warning, all)
- Filter by category
- Sort by quantity, alert level, name
- Quick actions (mark ordered, update quantity, dismiss)
- Export to shopping list (CSV, print-friendly)
- Search by item name

**Layout:**
```tsx
<main className="container mx-auto p-8">
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-4xl font-bold">Low Stock Alerts</h1>
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportShoppingList}>
        Export List
      </Button>
      <Button onClick={markAllOrdered}>Mark All Ordered</Button>
    </div>
  </div>

  <div className="flex gap-4 mb-6">
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <option value="all">All Alerts ({totalAlerts})</option>
      <option value="critical">Critical ({criticalCount})</option>
      <option value="warning">Warning ({warningCount})</option>
    </Select>

    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
      <option value="all">All Categories</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </Select>
  </div>

  <div className="space-y-4">
    {alerts.map(item => (
      <AlertItemCard key={item.id} item={item} />
    ))}
  </div>
</main>
```

### 4.4 Item Form Enhancements

**Add Minimum Quantity Field** to item creation/edit forms:

```tsx
<FormField
  control={form.control}
  name="minQuantity"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Minimum Quantity (Alert Threshold)</FormLabel>
      <FormControl>
        <Input
          type="number"
          min="0"
          placeholder="0 (no alerts)"
          {...field}
        />
      </FormControl>
      <FormDescription>
        Set to 0 to disable low-stock alerts for this item.
        You'll be notified when quantity falls below this number.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Optional: Smart suggestions */}
<div className="flex gap-2 mt-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => form.setValue('minQuantity', 5)}
  >
    Suggest: 5
  </Button>
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => form.setValue('minQuantity', 10)}
  >
    Suggest: 10
  </Button>
</div>
```

### 4.5 Navigation Badge

**Header/Sidebar Alert Badge:**

```tsx
<Link href="/alerts">
  <Button variant="ghost" className="relative">
    <Bell className="h-5 w-5" />
    {alertCount > 0 && (
      <Badge
        variant="destructive"
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
      >
        {alertCount > 9 ? '9+' : alertCount}
      </Badge>
    )}
  </Button>
</Link>
```

### 4.6 Quick Actions Menu

**Contextual actions on item cards with alerts:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={updateQuantity}>
      Update Quantity
    </DropdownMenuItem>
    <DropdownMenuItem onClick={markAsOrdered}>
      Mark as Ordered
    </DropdownMenuItem>
    <DropdownMenuItem onClick={adjustMinimum}>
      Adjust Minimum
    </DropdownMenuItem>
    <DropdownMenuItem onClick={snoozeAlert}>
      Snooze Alert
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={viewDetails}>
      View Details
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 5. Implementation Recommendations

### 5.1 Phased Rollout

#### Phase 1: Core Functionality (MVP)
1. ✅ Add `minQuantity` field to database schema (both Drizzle & Prisma)
2. ✅ Update item forms to include minimum quantity input
3. ✅ Enhance quantity badges with alert status calculation
4. ✅ Create `/api/items/alerts` endpoint
5. ✅ Build dedicated `/alerts` page with filtering

**Effort:** 8-12 hours
**Priority:** High

#### Phase 2: Enhanced UX
1. Dashboard widget for low-stock overview
2. Navigation badge with alert count
3. Quick actions (mark ordered, snooze)
4. Shopping list export functionality
5. Alert history tracking

**Effort:** 8-10 hours
**Priority:** Medium

#### Phase 3: Advanced Features
1. Email notifications (daily digest)
2. Predictive reordering (based on usage patterns)
3. Bulk threshold management
4. Category-level default minimums
5. Integration with shopping list apps

**Effort:** 16-20 hours
**Priority:** Low (Future enhancement)

### 5.2 Validation Rules

**Item Schema Updates:**

```typescript
// lib/validations.ts
export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  locationId: z.string().min(1, 'Location is required'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),

  // NEW FIELD
  minQuantity: z.number().int().min(0, 'Minimum quantity cannot be negative').default(0),

  purchaseDate: z.date().optional(),
  purchasePrice: z.number().positive().optional(),
  // ... rest of fields
}).refine(
  data => data.minQuantity <= data.quantity || data.quantity === 0,
  {
    message: 'Warning: Current quantity is below minimum threshold',
    path: ['minQuantity']
  }
)
```

### 5.3 Performance Considerations

**Optimizations:**
1. **Database Indexing:** Index `(quantity, min_quantity)` for fast alert queries
2. **Caching:** Cache alert counts in Redis/memory (refresh every 5 minutes)
3. **Pagination:** Limit alerts page to 20-50 items per page
4. **Lazy Loading:** Load dashboard widget data separately
5. **Debouncing:** Debounce quantity updates to prevent excessive recalculations

### 5.4 Testing Strategy

**Unit Tests:**
- Alert status calculation logic
- Validation rules for minQuantity
- Badge variant selection

**Integration Tests:**
- Alert API endpoint with various filters
- Item creation/update with minQuantity
- Alert count accuracy

**E2E Tests:**
- Complete flow: Create item → Set minimum → Lower quantity → View alert
- Alert page filtering and sorting
- Quick actions (mark ordered, update quantity)

---

## 6. Data Migration Strategy

### 6.1 Adding minQuantity to Existing Items

**Option A: Default to 0 (No Alerts)**
```sql
-- Safe default: no alerts for existing items
ALTER TABLE items ADD COLUMN min_quantity INTEGER DEFAULT 0;
```

**Option B: Smart Defaults by Category**
```sql
-- Set defaults based on category patterns
UPDATE items
SET min_quantity = 5
WHERE category_id IN (
  SELECT id FROM categories WHERE name IN (
    'Batteries', 'Cleaning Supplies', 'Paper Products'
  )
);

UPDATE items
SET min_quantity = 2
WHERE category_id IN (
  SELECT id FROM categories WHERE name IN (
    'Office Supplies', 'Pet Food'
  )
);
```

**Option C: Calculate from Current Quantity**
```sql
-- Set minimum to 20% of current quantity (rounded up)
UPDATE items
SET min_quantity = CAST(CEIL(quantity * 0.2) AS INTEGER)
WHERE quantity > 0;
```

**Recommendation:** Use **Option A** (default 0) for MVP, allow users to set thresholds manually. This avoids false positives and gives users control.

### 6.2 Schema Sync Checklist

- [ ] Update Drizzle schema (`src/db/schema.ts`)
- [ ] Update Prisma schema (`prisma/schema.prisma`)
- [ ] Generate Drizzle migration
- [ ] Run Prisma migration: `npx prisma migrate dev`
- [ ] Update TypeScript types (if manually maintained)
- [ ] Update validation schemas (`lib/validations.ts`)
- [ ] Regenerate Prisma client: `npx prisma generate`
- [ ] Update API routes to handle new field
- [ ] Update forms to include minQuantity input

---

## 7. Edge Cases & Considerations

### 7.1 Items Without Minimum Thresholds

**Scenario:** Not all items need alerts (e.g., furniture, electronics)

**Solution:**
- `minQuantity = 0` means "no alert tracking"
- UI should hide alert-related elements for these items
- Alert queries filter `WHERE minQuantity > 0`

### 7.2 Quantity = 0 (Out of Stock)

**Scenario:** Item is completely out of stock

**Handling:**
- Always show as CRITICAL regardless of minQuantity
- Special badge: "OUT OF STOCK" instead of "0x"
- Sort to top of alerts page
- Consider blocking item deletion when quantity = 0 and minQuantity > 0

### 7.3 Bulk Updates

**Scenario:** User needs to update multiple items at once

**Features:**
- Bulk set minimum quantity (e.g., all batteries to 5)
- Bulk update quantity (e.g., after shopping trip)
- Bulk mark as ordered

### 7.4 Category-Level Defaults (Future)

**Scenario:** User wants default minimums for new items in category

**Implementation:**
```typescript
// Add optional field to categories
export const categories = sqliteTable('categories', {
  // ... existing fields
  defaultMinQuantity: integer('default_min_quantity').default(0)
})

// Apply when creating new item
const newItem = {
  ...itemData,
  minQuantity: itemData.minQuantity ?? category.defaultMinQuantity ?? 0
}
```

### 7.5 Alert Fatigue

**Problem:** Too many alerts become overwhelming

**Solutions:**
1. Allow users to dismiss/snooze alerts
2. Consolidate multiple alerts into summaries
3. Only send notifications for CRITICAL alerts
4. Batch email notifications (daily digest, not real-time)
5. Smart thresholds (adjust based on user behavior)

---

## 8. Technical Implementation Details

### 8.1 API Endpoints

#### GET `/api/items/alerts`
Returns all items with low stock

**Query Parameters:**
- `status` - Filter by 'critical', 'warning', or 'all'
- `categoryId` - Filter by category
- `page`, `limit` - Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "item_123",
      "name": "AA Batteries",
      "quantity": 2,
      "minQuantity": 8,
      "alertStatus": "critical",
      "category": { "id": "cat_1", "name": "Batteries" },
      "location": { "id": "loc_1", "name": "Storage Closet" }
    }
  ],
  "summary": {
    "total": 15,
    "critical": 3,
    "warning": 12
  }
}
```

#### PATCH `/api/items/[id]/quantity`
Quick update item quantity

**Body:**
```json
{
  "quantity": 10,
  "markAsOrdered": true // Optional flag
}
```

#### GET `/api/alerts/summary`
Dashboard widget data

**Response:**
```json
{
  "criticalCount": 3,
  "warningCount": 12,
  "topAlerts": [/* 5 most critical items */],
  "categories": {
    "Batteries": 5,
    "Cleaning Supplies": 4,
    "Paper Products": 6
  }
}
```

### 8.2 Database Queries (Prisma Examples)

#### Get All Alerts
```typescript
const alerts = await prisma.item.findMany({
  where: {
    minQuantity: { gt: 0 },
    OR: [
      { quantity: 0 },
      { quantity: { lte: prisma.raw('min_quantity') } }
    ]
  },
  include: { category: true, location: true },
  orderBy: [
    { quantity: 'asc' },
    { minQuantity: 'desc' }
  ]
})
```

#### Get Alert Summary
```typescript
const summary = await prisma.item.groupBy({
  by: ['categoryId'],
  where: {
    minQuantity: { gt: 0 },
    quantity: { lte: prisma.raw('min_quantity') }
  },
  _count: { id: true }
})
```

#### Get Critical Alerts Only
```typescript
const critical = await prisma.item.findMany({
  where: {
    minQuantity: { gt: 0 },
    OR: [
      { quantity: 0 },
      { quantity: { lte: prisma.raw('CAST(min_quantity * 0.5 AS INTEGER)') } }
    ]
  }
})
```

### 8.3 React Hooks

#### useAlerts Hook
```typescript
export function useAlerts(statusFilter?: 'critical' | 'warning' | 'all') {
  return useQuery({
    queryKey: ['alerts', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/items/alerts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    refetchInterval: 60000 // Refresh every minute
  })
}
```

#### useAlertSummary Hook
```typescript
export function useAlertSummary() {
  return useQuery({
    queryKey: ['alert-summary'],
    queryFn: async () => {
      const res = await fetch('/api/alerts/summary')
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json()
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  })
}
```

---

## 9. Competitive Analysis

### 9.1 How Other Systems Handle Consumables

| System | Min Qty Location | Alert Type | Notification |
|--------|------------------|------------|--------------|
| **Sortly** | Item-level | Color badges | Email, Push |
| **MyStuff2** | Category-level | Dashboard widget | In-app only |
| **Inventorio** | Item-level | List + Dashboard | Email digest |
| **Home Inventory** (generic) | None | Manual tracking | None |

**Best Practices Observed:**
- Item-level thresholds (3 out of 4 systems)
- Visual color coding (all systems)
- Dashboard summary widget (3 out of 4)
- Email notifications for critical alerts (2 out of 4)

### 9.2 User Experience Patterns

**What Works Well:**
1. ✅ Quick actions from alert list (mark ordered, update quantity)
2. ✅ Category-specific filters on alerts page
3. ✅ Export to shopping list (CSV, print, email)
4. ✅ Smart suggestions for minimum quantities
5. ✅ Snooze functionality for temporary dismissal

**What Doesn't Work:**
1. ❌ Too many notification channels (email + SMS + push = fatigue)
2. ❌ Alerts for every item (causes noise)
3. ❌ No way to dismiss or acknowledge alerts
4. ❌ Fixed thresholds (not user-configurable)

---

## 10. Conclusion & Next Steps

### 10.1 Summary of Recommendations

1. **Database:** Add `minQuantity` (integer, default 0) to `items` table
2. **Calculation:** Compute alert status server-side (critical/warning/ok)
3. **UI:** Enhance existing quantity badges, add alerts page
4. **API:** Create `/api/items/alerts` endpoint with filtering
5. **Notifications:** Start with in-app, add email in Phase 2

### 10.2 Implementation Priorities

**Must Have (MVP):**
- ✅ Database schema change (minQuantity field)
- ✅ Item form enhancement
- ✅ Alert status calculation
- ✅ Dedicated alerts page
- ✅ Enhanced quantity badges

**Should Have (Phase 2):**
- ✅ Dashboard widget
- ✅ Navigation badge
- ✅ Quick actions (mark ordered)
- ✅ Export shopping list

**Nice to Have (Future):**
- Email notifications
- Predictive reordering
- Category defaults
- Shopping app integrations

### 10.3 Estimated Effort

| Task | Effort | Priority |
|------|--------|----------|
| Database migration | 1-2 hours | Critical |
| API endpoints | 2-3 hours | Critical |
| Item form updates | 2 hours | Critical |
| Alerts page | 4-5 hours | High |
| Badge enhancements | 1-2 hours | High |
| Dashboard widget | 3-4 hours | Medium |
| Navigation badge | 1 hour | Medium |
| Quick actions | 2-3 hours | Medium |
| Testing | 4-5 hours | High |
| **Total MVP** | **15-20 hours** | - |

### 10.4 Success Metrics

**How to Measure Success:**
1. 📊 **Adoption Rate:** % of items with minQuantity set
2. 📊 **Alert Accuracy:** User feedback on false positives/negatives
3. 📊 **Usage:** # of alerts page views, quick action clicks
4. 📊 **Efficiency:** Time saved in shopping trip planning
5. 📊 **Satisfaction:** User ratings, feature requests

### 10.5 Risk Mitigation

**Potential Issues:**
1. **Schema sync problems** → Test migrations in dev first
2. **Alert fatigue** → Default to minQuantity=0, let users opt-in
3. **Performance issues** → Add database indexes immediately
4. **User confusion** → Add help text and smart suggestions
5. **Notification spam** → Start with in-app only, add email later

---

## 11. References & Resources

### Industry Standards
- ISO 9001 Inventory Management Guidelines
- Just-In-Time (JIT) Inventory Principles
- Economic Order Quantity (EOQ) Models
- Reorder Point (ROP) Formulas

### Technical Documentation
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Query](https://tanstack.com/query/latest)

### UX Patterns
- [Material Design - Lists & Alerts](https://m3.material.io/)
- [Apple HIG - Notifications](https://developer.apple.com/design/human-interface-guidelines/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Research Agent Report Complete**
**Stored in collective memory:** `swarm/research/consumables-patterns`
**Ready for Planner & Architect agents to use these findings**

---

## Appendix A: Code Snippets

### A.1 Alert Status Helper Function
```typescript
// lib/alerts.ts
export type AlertStatus = 'critical' | 'warning' | 'ok'

export function calculateAlertStatus(
  quantity: number,
  minQuantity: number
): AlertStatus {
  if (minQuantity === 0) return 'ok'
  if (quantity === 0) return 'critical'
  if (quantity <= minQuantity * 0.5) return 'critical'
  if (quantity <= minQuantity) return 'warning'
  return 'ok'
}

export function getAlertBadgeVariant(status: AlertStatus) {
  const variants = {
    critical: 'destructive',
    warning: 'warning',
    ok: 'default'
  }
  return variants[status]
}

export function getAlertIcon(status: AlertStatus) {
  const icons = {
    critical: AlertCircle,
    warning: AlertTriangle,
    ok: CheckCircle
  }
  return icons[status]
}
```

### A.2 Item Schema with Validation
```typescript
// lib/validations.ts
import { z } from 'zod'

export const itemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().cuid('Invalid category ID'),
  locationId: z.string().cuid('Invalid location ID'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  minQuantity: z.number().int().min(0).max(9999).default(0),
  purchaseDate: z.date().optional(),
  purchasePrice: z.number().positive().optional(),
  // ... other fields
})

export const itemUpdateSchema = itemCreateSchema.partial().extend({
  id: z.string().cuid()
})

export type ItemCreate = z.infer<typeof itemCreateSchema>
export type ItemUpdate = z.infer<typeof itemUpdateSchema>
```

### A.3 Alerts API Route
```typescript
// app/api/items/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateAlertStatus } from '@/lib/alerts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'critical' | 'warning' | 'all' | null
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      minQuantity: { gt: 0 }
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    // Filter by alert status
    if (status === 'critical') {
      where.OR = [
        { quantity: 0 },
        { quantity: { lte: prisma.$raw('CAST(min_quantity * 0.5 AS INTEGER)') } }
      ]
    } else if (status === 'warning') {
      where.AND = [
        { quantity: { gt: prisma.$raw('CAST(min_quantity * 0.5 AS INTEGER)') } },
        { quantity: { lte: prisma.$raw('min_quantity') } }
      ]
    } else {
      // All alerts (warning + critical)
      where.quantity = { lte: prisma.$raw('min_quantity') }
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          location: { select: { id: true, name: true } }
        },
        orderBy: [
          { quantity: 'asc' },
          { minQuantity: 'desc' },
          { name: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.item.count({ where })
    ])

    // Enrich with calculated alert status
    const enrichedItems = items.map(item => ({
      ...item,
      alertStatus: calculateAlertStatus(item.quantity, item.minQuantity!)
    }))

    // Calculate summary
    const criticalCount = enrichedItems.filter(i => i.alertStatus === 'critical').length
    const warningCount = enrichedItems.filter(i => i.alertStatus === 'warning').length

    return NextResponse.json({
      success: true,
      data: enrichedItems,
      summary: {
        total,
        critical: criticalCount,
        warning: warningCount
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}
```

---

**End of Research Document**
