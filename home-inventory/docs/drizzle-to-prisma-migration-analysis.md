# Drizzle to Prisma Migration Analysis

**Generated:** 2025-10-10
**Analyst:** Hive Mind Code Analyzer Agent
**Status:** 🚨 CRITICAL - Dual ORM Configuration Detected

---

## Executive Summary

### Critical Finding: Dual ORM Usage

This application is **simultaneously using both Drizzle ORM and Prisma**, creating a critical architectural conflict that requires immediate attention:

- **5 files actively using Drizzle ORM** (server actions, queries, schema)
- **6 API routes actively using Prisma** (all REST endpoints)
- **Major schema inconsistencies** between the two ORMs
- **No clear migration path** currently in place

**Risk Level:** 🔴 **CRITICAL**
**Impact:** Data inconsistency, conflicting migrations, maintenance nightmare
**Recommended Action:** Complete migration to Prisma (rationale below)

---

## 1. Complete File Inventory

### 1.1 Drizzle ORM Usage (5 Core Files)

| File Path | Lines | Usage Type | Query Complexity | Migration Priority |
|-----------|-------|------------|------------------|-------------------|
| `/src/db/schema.ts` | 76 | Schema Definition | N/A | 🔴 HIGH |
| `/src/db/index.ts` | 10 | DB Initialization | Simple | 🔴 HIGH |
| `/src/db/queries.ts` | 68 | Query Functions | Medium | 🟡 MEDIUM |
| `/src/app/actions/categories.ts` | 63 | Server Actions | Simple | 🟡 MEDIUM |
| `/src/app/actions/items.ts` | 73 | Server Actions | Simple | 🟡 MEDIUM |

**Total Drizzle Lines of Code:** ~290 lines

#### Drizzle Import Patterns:
```typescript
// Schema definition
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Database initialization
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'

// Query operators
import { eq, and, like, desc, sql, isNull } from 'drizzle-orm'
```

### 1.2 Prisma Usage (6 API Routes + 3 Type Files + Tests)

| File Path | Lines | Usage Type | Query Complexity | Migration Priority |
|-----------|-------|------------|------------------|-------------------|
| `/src/lib/db.ts` | 27 | Prisma Client Init | Simple | ✅ Keep |
| `/src/app/api/items/route.ts` | 112 | REST API | Medium | ✅ Keep |
| `/src/app/api/items/[id]/route.ts` | 118 | REST API | Medium | ✅ Keep |
| `/src/app/api/categories/route.ts` | 54 | REST API | Simple | ✅ Keep |
| `/src/app/api/tags/route.ts` | 54 | REST API | Simple | ✅ Keep |
| `/src/app/api/locations/route.ts` | 57 | REST API | Simple | ✅ Keep |
| `/src/app/api/search/route.ts` | 73 | REST API | Complex | ✅ Keep |
| `/src/types/category.types.ts` | 14 | Type Definitions | N/A | ✅ Keep |
| `/src/types/item.types.ts` | 48 | Type Definitions | N/A | ✅ Keep |
| `/tests/fixtures/alert-fixtures.ts` | 293 | Test Fixtures | N/A | ✅ Keep |

**Total Prisma Lines of Code:** ~850 lines

#### Prisma Import Patterns:
```typescript
// Client initialization
import { PrismaClient } from '@prisma/client'

// Type imports
import { Item, Category, Location, Tag, ItemTag } from '@prisma/client'
```

---

## 2. Schema Comparison Analysis

### 2.1 Category Model Comparison

| Field | Drizzle Schema | Prisma Schema | Status | Notes |
|-------|---------------|---------------|--------|-------|
| `id` | `text().primaryKey()` | `String @id @default(cuid())` | ✅ Compatible | Both use CUID |
| `name` | `text().notNull()` | `String @unique` | ⚠️ **Different** | Prisma has unique constraint |
| `slug` | `text().notNull().unique()` | ❌ **MISSING** | 🔴 **CRITICAL** | Drizzle has slug, Prisma doesn't |
| `description` | `text()` (nullable) | `String?` (nullable) | ✅ Compatible | Both nullable |
| `icon` | `text()` (nullable) | `String?` (nullable) | ✅ Compatible | Both nullable |
| `color` | ❌ **MISSING** | `String?` (nullable) | ⚠️ **Missing in Drizzle** | Prisma has color field |
| `minQuantity` | `integer().default(0)` | `Int? @default(0)` | ✅ Compatible | Same default |
| `createdAt` | `integer (timestamp mode)` | `DateTime @default(now())` | ⚠️ Type difference | Int vs DateTime |
| `updatedAt` | `integer (timestamp mode)` | `DateTime @updatedAt` | ⚠️ Type difference | Int vs DateTime |

**Schema Drift Score:** 🔴 **HIGH** (3 critical differences)

### 2.2 Item Model Comparison

| Field | Drizzle Schema | Prisma Schema | Status | Notes |
|-------|---------------|---------------|--------|-------|
| `id` | `text().primaryKey()` | `String @id @default(cuid())` | ✅ Compatible | Both use CUID |
| `name` | `text().notNull()` | `String` | ✅ Compatible | Same |
| `description` | `text()` (nullable) | `String?` (nullable) | ✅ Compatible | Both nullable |
| `categoryId` | `text().notNull().references()` | `String` with relation | ✅ Compatible | Foreign key |
| `location` | `text().notNull()` | ❌ **REPLACED** | 🔴 **CRITICAL** | Drizzle: string, Prisma: relation |
| `locationId` | ❌ **MISSING** | `String` (required) | 🔴 **CRITICAL** | Prisma uses Location relation |
| `quantity` | `integer().default(1)` | `Int @default(1)` | ✅ Compatible | Same default |
| `minQuantity` | `integer()` (nullable) | `Int?` (nullable) | ✅ Compatible | Both nullable |
| `purchaseDate` | `integer (timestamp mode)` | `DateTime?` | ⚠️ Type difference | Int vs DateTime |
| `purchasePrice` | `real()` (nullable) | `Float?` | ⚠️ Type difference | Real vs Float |
| `currentValue` | ❌ **MISSING** | `Float?` | ⚠️ Missing in Drizzle | Prisma has currentValue |
| `condition` | ❌ **MISSING** | `String? @default("good")` | ⚠️ Missing in Drizzle | Prisma has condition |
| `purchaseLocation` | `text()` (nullable) | ❌ **MISSING** | ⚠️ Missing in Prisma | Drizzle has purchaseLocation |
| `warrantyExpiry` | `integer (timestamp mode)` | `DateTime? (warrantyUntil)` | ⚠️ Different name | Same concept, different names |
| `lastMaintenance` | `integer (timestamp mode)` | ❌ **MISSING** | ⚠️ Missing in Prisma | Drizzle has lastMaintenance |
| `imageUrl` | `text()` (nullable) | `String?` | ✅ Compatible | Both nullable |
| `imageUrls` | `text (json mode)` | ❌ **MISSING** | ⚠️ Missing in Prisma | Drizzle has array field |
| `barcode` | ❌ **MISSING** | `String?` | ⚠️ Missing in Drizzle | Prisma has barcode |
| `serialNumber` | `text()` (nullable) | `String?` | ✅ Compatible | Both nullable |
| `modelNumber` | `text()` (nullable) | ❌ **MISSING** | ⚠️ Missing in Prisma | Drizzle has modelNumber |
| `notes` | `text()` (nullable) | `String?` | ✅ Compatible | Both nullable |
| `createdAt` | `integer (timestamp mode)` | `DateTime @default(now())` | ⚠️ Type difference | Int vs DateTime |
| `updatedAt` | `integer (timestamp mode)` | `DateTime @updatedAt` | ⚠️ Type difference | Int vs DateTime |

**Schema Drift Score:** 🔴 **CRITICAL** (10+ significant differences)

### 2.3 Location Model

| Status | Details |
|--------|---------|
| Drizzle | ❌ **DOES NOT EXIST** - uses string field instead |
| Prisma | ✅ **FULL MODEL** with parent/child hierarchy support |

**Prisma Location Schema:**
```prisma
model Location {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  parentId    String?
  parent      Location?  @relation("LocationHierarchy", fields: [parentId], references: [id])
  children    Location[] @relation("LocationHierarchy")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       Item[]
}
```

**Migration Impact:** 🔴 **CRITICAL** - Requires data migration from string to relational model

### 2.4 Tag/ItemTag Models

| Model | Drizzle | Prisma | Status |
|-------|---------|--------|--------|
| `Tag` | ✅ Exists | ✅ Exists | Compatible |
| `ItemTag` junction | `items_to_tags` table | `ItemTag` model with explicit ID | ⚠️ Different approach |

**Drizzle Junction Table:**
```typescript
export const itemsToTags = sqliteTable('items_to_tags', {
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
})
```

**Prisma Junction Model:**
```prisma
model ItemTag {
  id        String   @id @default(cuid())
  itemId    String
  tagId     String
  item      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([itemId, tagId])
  @@index([itemId])
  @@index([tagId])
}
```

---

## 3. Query Pattern Analysis

### 3.1 Drizzle Query Patterns

**File:** `/src/db/queries.ts`

```typescript
// ✅ Simple relational query
export async function getAllItems() {
  return db.query.items.findMany({
    with: {
      category: true,
      tags: { with: { tag: true } }
    },
    orderBy: desc(items.updatedAt)
  })
}

// ✅ Basic filtering
export async function getItemById(id: string) {
  return db.query.items.findFirst({
    where: eq(items.id, id),
    with: { category: true, tags: { with: { tag: true } } }
  })
}

// ⚠️ Raw SQL for search (migration needed)
export async function searchItems(query: string) {
  const searchPattern = `%${query}%`
  return db.select().from(items).where(
    sql`${items.name} LIKE ${searchPattern} OR ${items.description} LIKE ${searchPattern}`
  ).limit(20)
}

// ✅ Aggregation
export async function getItemStats() {
  const totalItems = await db.select({ count: sql<number>`count(*)` }).from(items)
  return { totalItems: totalItems[0].count, ... }
}
```

**Complexity Score:** Medium (requires moderate refactoring)

### 3.2 Prisma Query Patterns

**File:** `/src/app/api/items/route.ts`

```typescript
// ✅ Advanced pagination with filtering
const [items, total] = await Promise.all([
  prisma.item.findMany({
    where: {
      ...(categoryId && { categoryId }),
      ...(locationId && { locationId }),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      location: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  }),
  prisma.item.count({ where })
]);

// ✅ Advanced search with case-insensitive filtering
const where = {
  AND: [
    query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { serialNumber: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
      ],
    } : {},
    categoryId ? { categoryId } : {},
    locationId ? { locationId } : {},
  ],
};
```

**Complexity Score:** High (more sophisticated, production-ready patterns)

---

## 4. Migration Complexity Assessment

### 4.1 Complexity Matrix

| File/Module | Lines to Change | Complexity | Estimated Hours | Breaking Changes |
|-------------|----------------|------------|-----------------|------------------|
| **Phase 1: Schema Migration** |
| `prisma/schema.prisma` | +30 | Medium | 2-3h | Yes - add missing fields |
| Database migration | N/A | High | 1-2h | Yes - data transformation |
| **Phase 2: Remove Drizzle** |
| `src/db/schema.ts` | -76 (DELETE) | Low | 0.5h | Yes - remove file |
| `src/db/index.ts` | -10 (DELETE) | Low | 0.5h | Yes - remove file |
| `src/db/queries.ts` | -68 (REWRITE) | High | 4-6h | Yes - rewrite all queries |
| **Phase 3: Update Server Actions** |
| `src/app/actions/categories.ts` | ~40 | Medium | 2-3h | Yes - change imports/queries |
| `src/app/actions/items.ts` | ~50 | High | 3-4h | Yes - location model change |
| **Phase 4: Testing & Validation** |
| Update tests | ~100 | High | 3-4h | Yes - mock data changes |
| Integration testing | N/A | High | 2-3h | - |
| **Phase 5: Documentation** |
| Update docs | N/A | Low | 1-2h | - |

**Total Estimated Time:** 19-30 hours
**Risk Level:** 🔴 HIGH
**Recommended Team Size:** 2 developers
**Recommended Timeline:** 1-2 sprints (2-4 weeks)

### 4.2 Breaking Changes Inventory

#### 🔴 Critical Breaking Changes

1. **Location Data Migration**
   - Current: `item.location` is a string (e.g., "Kitchen")
   - Target: `item.locationId` references `Location` table
   - **Impact:** ALL existing item records need data migration
   - **Risk:** Data loss if not handled carefully

2. **Category Schema Changes**
   - Missing: `slug` field in Prisma schema
   - Missing: `color` field in Drizzle schema
   - **Impact:** Need to add slug field to Prisma OR remove from Drizzle
   - **Recommendation:** Add `slug` to Prisma (better for URLs)

3. **Timestamp Format Changes**
   - Drizzle: Unix timestamps (integer)
   - Prisma: ISO 8601 DateTime strings
   - **Impact:** ALL date fields need conversion
   - **Risk:** Timezone handling must be consistent

#### ⚠️ Moderate Breaking Changes

4. **Field Name Changes**
   - `warrantyExpiry` → `warrantyUntil`
   - Need to update all references

5. **Missing Fields Need Addition**
   - Prisma needs: `slug`, `modelNumber`, `purchaseLocation`, `lastMaintenance`, `imageUrls`
   - Drizzle needs: `color`, `currentValue`, `condition`, `barcode`
   - **Decision:** Add all fields to Prisma (more complete schema)

6. **Junction Table Structure**
   - Drizzle: Simple two-column junction
   - Prisma: Junction with ID and createdAt
   - **Impact:** Minimal (internal difference)

---

## 5. Step-by-Step Migration Plan

### Phase 1: Schema Unification (3-5 hours)

#### Step 1.1: Update Prisma Schema
```bash
# Location: prisma/schema.prisma
```

**Add Missing Fields to Category Model:**
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique  // 🆕 ADD THIS
  description String?
  icon        String?
  color       String?
  minQuantity Int?     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       Item[]
}
```

**Add Missing Fields to Item Model:**
```prisma
model Item {
  id                String    @id @default(cuid())
  name              String
  description       String?
  quantity          Int       @default(1)
  minQuantity       Int?

  // Purchase info
  purchaseDate      DateTime?
  purchasePrice     Float?
  purchaseLocation  String?   // 🆕 ADD THIS

  // Current state
  currentValue      Float?
  condition         String?   @default("good")

  // Identifiers
  barcode           String?
  serialNumber      String?
  modelNumber       String?   // 🆕 ADD THIS

  // Images
  imageUrl          String?
  imageUrls         Json?     // 🆕 ADD THIS (store as JSON array)

  // Maintenance
  warrantyUntil     DateTime?
  lastMaintenance   DateTime? // 🆕 ADD THIS

  // Other
  notes             String?

  // Relations
  categoryId        String
  category          Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  locationId        String
  location          Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  tags              ItemTag[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([categoryId])
  @@index([locationId])
  @@index([name])
}
```

#### Step 1.2: Generate and Review Migration
```bash
npx prisma migrate dev --name unify-schemas
```

**⚠️ IMPORTANT:** Review the generated SQL migration before applying!

#### Step 1.3: Create Data Migration Script

**File:** `prisma/migrations/data-migration.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { db as drizzleDb } from '../src/db';
import { items, categories } from '../src/db/schema';

const prisma = new PrismaClient();

async function migrateLocations() {
  console.log('🔄 Migrating location strings to Location model...');

  // Get all unique location strings from Drizzle
  const drizzleItems = await drizzleDb.select({
    location: items.location
  }).from(items);

  const uniqueLocations = [...new Set(drizzleItems.map(i => i.location))];

  // Create Location records in Prisma
  for (const locationName of uniqueLocations) {
    await prisma.location.upsert({
      where: { name: locationName },
      update: {},
      create: {
        name: locationName,
        description: `Migrated from legacy location string`
      }
    });
  }

  console.log(`✅ Created ${uniqueLocations.length} location records`);
}

async function migrateCategorySlugs() {
  console.log('🔄 Generating slugs for categories...');

  const categories = await prisma.category.findMany();

  for (const category of categories) {
    const slug = category.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.category.update({
      where: { id: category.id },
      data: { slug }
    });
  }

  console.log(`✅ Generated slugs for ${categories.length} categories`);
}

async function main() {
  try {
    await migrateLocations();
    await migrateCategorySlugs();
    console.log('✅ Data migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

**Run data migration:**
```bash
npx tsx prisma/migrations/data-migration.ts
```

---

### Phase 2: Remove Drizzle Dependencies (2-3 hours)

#### Step 2.1: Delete Drizzle Files
```bash
# ⚠️ BACKUP FIRST!
git checkout -b migrate-to-prisma

# Remove Drizzle files
rm src/db/schema.ts
rm src/db/index.ts
rm src/db/queries.ts

# Remove Drizzle from package.json
npm uninstall drizzle-orm drizzle-kit better-sqlite3
npm uninstall @types/better-sqlite3
```

#### Step 2.2: Create Prisma Query Helpers

**File:** `src/lib/queries.ts` (NEW - replaces `/src/db/queries.ts`)

```typescript
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// ✅ Replace: getAllItems
export async function getAllItems() {
  return prisma.item.findMany({
    include: {
      category: true,
      location: true,
      tags: {
        include: { tag: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

// ✅ Replace: getItemById
export async function getItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      tags: {
        include: { tag: true }
      }
    }
  });
}

// ✅ Replace: getItemsByCategory
export async function getItemsByCategory(categoryId: string) {
  return prisma.item.findMany({
    where: { categoryId },
    include: {
      category: true,
      location: true,
      tags: {
        include: { tag: true }
      }
    }
  });
}

// ✅ Replace: searchItems (improved from raw SQL)
export async function searchItems(query: string) {
  return prisma.item.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      category: true,
      location: true
    },
    take: 20
  });
}

// ✅ Replace: getAllCategories
export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { items: true }
      }
    }
  });
}

// ✅ Replace: getAllTags
export async function getAllTags() {
  return prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { itemTags: true }
      }
    }
  });
}

// ✅ Replace: getRecentItems
export async function getRecentItems(limit: number = 10) {
  return prisma.item.findMany({
    include: {
      category: true,
      location: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

// ✅ Replace: getItemStats
export async function getItemStats() {
  const [totalItems, totalCategories, totalTags] = await Promise.all([
    prisma.item.count(),
    prisma.category.count(),
    prisma.tag.count()
  ]);

  return {
    totalItems,
    totalCategories,
    totalTags
  };
}
```

---

### Phase 3: Update Server Actions (4-6 hours)

#### Step 3.1: Update Category Actions

**File:** `src/app/actions/categories.ts`

**BEFORE (Drizzle):**
```typescript
import { db } from '@/db'
import { categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
```

**AFTER (Prisma):**
```typescript
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { categorySchema } from '@/lib/validations'
```

**Update createCategory:**
```typescript
export async function createCategory(formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    icon: formData.get('icon') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    const result = await prisma.category.create({
      data: parsed.data
    })
    revalidatePath('/categories')
    return { success: true, data: result }
  } catch (error) {
    return { error: 'Failed to create category' }
  }
}
```

**Update updateCategory:**
```typescript
export async function updateCategory(id: string, formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    icon: formData.get('icon') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.category.update({
      where: { id },
      data: parsed.data
    })

    revalidatePath('/categories')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update category' }
  }
}
```

**Update deleteCategory:**
```typescript
export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    })
    revalidatePath('/categories')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete category' }
  }
}
```

#### Step 3.2: Update Item Actions

**File:** `src/app/actions/items.ts`

**Major Change:** Convert `location` string to `locationId` relation

**Update createItem:**
```typescript
export async function createItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    locationId: formData.get('locationId'), // 🔄 CHANGED from 'location'
    quantity: Number(formData.get('quantity')) || 1,
    serialNumber: formData.get('serialNumber') || undefined,
    modelNumber: formData.get('modelNumber') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    const result = await prisma.item.create({
      data: parsed.data,
      include: {
        category: true,
        location: true,
        tags: {
          include: { tag: true }
        }
      }
    })
    revalidatePath('/items')
    return { success: true, data: result }
  } catch (error) {
    return { error: 'Failed to create item' }
  }
}
```

**Similar updates for updateItem and deleteItem...**

---

### Phase 4: Update Validation Schemas (1-2 hours)

**File:** `src/lib/validations.ts`

```typescript
import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100), // 🆕 ADD slug validation
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(), // 🆕 ADD color validation
  minQuantity: z.number().int().min(0).optional(),
})

export const itemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().cuid(),
  locationId: z.string().cuid(), // 🔄 CHANGED from location string
  quantity: z.number().int().min(0),
  minQuantity: z.number().int().min(0).optional(),
  serialNumber: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(), // 🆕 ADD
  purchaseLocation: z.string().max(200).optional(), // 🆕 ADD
  notes: z.string().max(2000).optional(),
  // ... add other fields
})

// 🆕 ADD Location schema
export const locationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().cuid().optional(),
})
```

---

### Phase 5: Testing & Validation (5-8 hours)

#### Step 5.1: Update Unit Tests

**Update test fixtures to match Prisma types:**

```typescript
// tests/fixtures/item-fixtures.ts
import { Item, Category, Location } from '@prisma/client'

// ✅ Already using Prisma types - minimal changes needed
```

#### Step 5.2: Integration Tests

```bash
# Run all tests to find breaking changes
npm run test

# Expected failures:
# - tests using Drizzle imports
# - tests expecting location as string
# - tests with old field names
```

#### Step 5.3: Manual Testing Checklist

- [ ] Create category with slug
- [ ] Create location
- [ ] Create item with locationId
- [ ] Update item
- [ ] Delete item (cascade to ItemTag)
- [ ] Search items
- [ ] Filter by category
- [ ] Filter by location
- [ ] Tag management
- [ ] Pagination
- [ ] Stats/analytics

#### Step 5.4: Database Verification

```sql
-- Verify all data migrated correctly
SELECT COUNT(*) FROM Category;
SELECT COUNT(*) FROM Location;
SELECT COUNT(*) FROM Item;
SELECT COUNT(*) FROM Tag;
SELECT COUNT(*) FROM ItemTag;

-- Check for orphaned records
SELECT * FROM Item WHERE locationId NOT IN (SELECT id FROM Location);

-- Verify timestamps converted correctly
SELECT id, name, createdAt, updatedAt FROM Item LIMIT 5;
```

---

### Phase 6: Documentation & Cleanup (2-3 hours)

#### Step 6.1: Update README

```markdown
## Database

This project uses **Prisma ORM** with SQLite.

### Schema Management

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name your-migration-name

# Apply migrations
npx prisma migrate deploy

# View database
npx prisma studio
```

#### Step 6.2: Remove Drizzle References

```bash
# Search for any remaining Drizzle imports
grep -r "from 'drizzle-orm'" src/
grep -r "from '@/db'" src/

# Remove Drizzle scripts from package.json
# REMOVE: "db:studio": "drizzle-kit studio"
# REMOVE: "db:migrate": "drizzle-kit generate && drizzle-kit push"

# ADD: "db:studio": "prisma studio"
# ADD: "db:migrate": "prisma migrate dev"
```

#### Step 6.3: Create Migration Documentation

**File:** `docs/migration-completed.md`

Document:
- Migration date
- Schema changes made
- Data transformations applied
- Breaking changes for team
- New query patterns
- Performance comparisons

---

## 6. Risk Assessment & Mitigation

### 6.1 High-Risk Areas

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **Data loss during location migration** | Medium | 🔴 Critical | • Create backup before migration<br>• Test migration on copy first<br>• Implement rollback script |
| **Timestamp conversion errors** | High | 🟡 High | • Use consistent UTC timezone<br>• Write comprehensive tests<br>• Verify all dates manually |
| **Missing query functionality** | Medium | 🟡 High | • Compare query capabilities<br>• Test all edge cases<br>• Add missing features |
| **Performance degradation** | Low | 🟡 Medium | • Benchmark before/after<br>• Add indexes as needed<br>• Optimize N+1 queries |
| **Type mismatch errors** | High | 🟢 Low | • Regenerate Prisma client<br>• Update TypeScript types<br>• Run type checker |

### 6.2 Rollback Strategy

**If migration fails, rollback procedure:**

1. **Database Rollback:**
   ```bash
   # Restore from backup
   cp inventory.db.backup inventory.db

   # Or rollback Prisma migration
   npx prisma migrate reset
   ```

2. **Code Rollback:**
   ```bash
   git revert <migration-commit>
   npm install  # Restore Drizzle packages
   ```

3. **Verification:**
   ```bash
   npm run test
   npm run dev  # Verify app works
   ```

### 6.3 Performance Benchmarks

**Before Migration (Drizzle):**
```bash
# Run benchmarks
npm run benchmark
```

**After Migration (Prisma):**
```bash
# Run same benchmarks
npm run benchmark

# Compare results:
# - Query execution time
# - Memory usage
# - Bundle size
# - Startup time
```

**Expected Performance:**
- Prisma: Slightly slower query execution (10-20ms overhead)
- Prisma: Better TypeScript support (compile-time safety)
- Prisma: Better developer experience (auto-completion)

---

## 7. Recommendation & Conclusion

### 7.1 Final Recommendation

**Migrate to Prisma** ✅

**Rationale:**
1. **API routes already use Prisma** (6 routes, ~500 LOC)
2. **More complete schema** (Location model, additional fields)
3. **Better production patterns** (pagination, filtering, search)
4. **Superior TypeScript support** (type-safe queries)
5. **Better ecosystem** (Prisma Studio, migrations, monitoring)
6. **Active development** (faster updates, more features)

**Against keeping Drizzle:**
- Only 5 files use it (~290 LOC)
- Missing Location model entirely
- Less sophisticated query patterns
- Would require significant additions to match Prisma schema

### 7.2 Timeline Summary

| Phase | Duration | Risk Level |
|-------|----------|-----------|
| Phase 1: Schema Unification | 3-5 hours | 🔴 High |
| Phase 2: Remove Drizzle | 2-3 hours | 🟡 Medium |
| Phase 3: Update Server Actions | 4-6 hours | 🔴 High |
| Phase 4: Update Validations | 1-2 hours | 🟢 Low |
| Phase 5: Testing & Validation | 5-8 hours | 🔴 High |
| Phase 6: Documentation | 2-3 hours | 🟢 Low |
| **TOTAL** | **17-27 hours** | 🔴 **High** |

**Recommended Approach:**
- Sprint 1 (Week 1-2): Phases 1-3 (core migration)
- Sprint 2 (Week 3-4): Phases 4-6 (testing & cleanup)
- 2 developers working in pair programming mode
- Daily standups to track progress
- Deploy to staging for 1 week before production

### 7.3 Success Criteria

Migration is complete when:
- ✅ All Drizzle imports removed
- ✅ All tests passing
- ✅ No schema drift between Prisma schema and database
- ✅ All API routes working correctly
- ✅ No performance degradation (< 10% slower acceptable)
- ✅ Full test coverage maintained
- ✅ Documentation updated
- ✅ Team trained on Prisma patterns

---

## 8. Appendix

### 8.1 File Dependencies Graph

```
src/db/schema.ts (Drizzle)
    ↓ imported by
    ├── src/db/index.ts
    ├── src/db/queries.ts
    ├── src/app/actions/categories.ts
    └── src/app/actions/items.ts

src/lib/db.ts (Prisma)
    ↓ imported by
    ├── src/app/api/items/route.ts
    ├── src/app/api/items/[id]/route.ts
    ├── src/app/api/categories/route.ts
    ├── src/app/api/tags/route.ts
    ├── src/app/api/locations/route.ts
    └── src/app/api/search/route.ts
```

### 8.2 Package Dependencies

**Current (Dual ORM):**
```json
{
  "drizzle-orm": "^0.44.6",
  "drizzle-kit": "^0.31.5",
  "better-sqlite3": "^12.4.1",
  "@types/better-sqlite3": "^7.6.13",
  "@prisma/client": "^6.17.1",
  "prisma": "^6.17.1"
}
```

**After Migration (Prisma Only):**
```json
{
  "@prisma/client": "^6.17.1",
  "prisma": "^6.17.1"
}
```

**Size Reduction:** ~8MB (Drizzle + better-sqlite3 removed)

### 8.3 Contact & Support

**Migration Lead:** Hive Mind Code Analyzer Agent
**Documentation Date:** 2025-10-10
**Last Updated:** 2025-10-10

---

**🚀 Ready to begin migration? Review this document with the team and get approval before proceeding.**
