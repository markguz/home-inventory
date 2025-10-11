# Prisma Best Practices Guide

**Home Inventory System - Complete Reference**

This comprehensive guide covers Prisma best practices, performance optimization, type safety patterns, and migration strategies for the Home Inventory application.

---

## Table of Contents

1. [Query Optimization](#1-query-optimization)
2. [Type Safety](#2-type-safety)
3. [Error Handling](#3-error-handling)
4. [Performance Optimization](#4-performance-optimization)
5. [Development Workflow](#5-development-workflow)
6. [Drizzle to Prisma Migration](#6-drizzle-to-prisma-migration)
7. [Troubleshooting Guide](#7-troubleshooting-guide)
8. [VS Code Extensions](#8-vs-code-extensions)

---

## 1. Query Optimization

### 1.1 Include vs Select

**Rule of Thumb:** Use `select` for specific fields, `include` for entire relations.

#### ❌ Bad: Over-fetching with include
```typescript
// Fetches ALL fields from category (including timestamps, descriptions, etc.)
const item = await prisma.item.findUnique({
  where: { id },
  include: {
    category: true, // Gets everything
    location: true,
  }
});
```

#### ✅ Good: Selective field fetching
```typescript
// Only fetch what you need
const item = await prisma.item.findUnique({
  where: { id },
  include: {
    category: {
      select: { id: true, name: true, icon: true, color: true }
    },
    location: {
      select: { id: true, name: true }
    }
  }
});
```

#### ⚡ Best: Use select for everything when possible
```typescript
const item = await prisma.item.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    quantity: true,
    category: {
      select: { id: true, name: true, icon: true }
    },
    location: {
      select: { id: true, name: true }
    }
  }
});
```

### 1.2 Avoiding N+1 Queries

**Problem:** Loading relations in a loop creates N+1 queries.

#### ❌ Bad: N+1 Query Pattern
```typescript
// Gets all items (1 query)
const items = await prisma.item.findMany();

// Then gets category for each item (N queries)
const itemsWithCategories = await Promise.all(
  items.map(async (item) => ({
    ...item,
    category: await prisma.category.findUnique({
      where: { id: item.categoryId }
    })
  }))
);
// Total: 1 + N queries! 😱
```

#### ✅ Good: Include relations upfront
```typescript
// Gets everything in 1 query
const items = await prisma.item.findMany({
  include: {
    category: {
      select: { id: true, name: true, icon: true }
    }
  }
});
// Total: 1 query! 🚀
```

#### ⚡ Best: Use nested includes efficiently
```typescript
// Current implementation in /api/items/route.ts
const items = await prisma.item.findMany({
  include: {
    category: {
      select: { id: true, name: true, icon: true, color: true }
    },
    location: {
      select: { id: true, name: true }
    },
    tags: {
      include: {
        tag: true // Note: Could optimize with select
      }
    }
  }
});
```

**Optimization tip for tags:**
```typescript
tags: {
  select: {
    tag: {
      select: { id: true, name: true, color: true }
    }
  }
}
```

### 1.3 FindUnique vs FindFirst

#### Use `findUnique` when:
- Querying by unique field (id, unique constraint)
- You expect exactly one result
- Better performance (uses index)

```typescript
// ✅ Good: Query by unique field
const item = await prisma.item.findUnique({
  where: { id: itemId }
});
```

#### Use `findFirst` when:
- Querying by non-unique fields
- You want the first match from multiple results
- Using complex where conditions

```typescript
// ✅ Good: Query by non-unique field
const item = await prisma.item.findFirst({
  where: {
    name: { contains: 'laptop' },
    quantity: { gt: 0 }
  },
  orderBy: { createdAt: 'desc' }
});
```

#### Use `findUniqueOrThrow` for cleaner error handling:
```typescript
// ❌ Current pattern (verbose)
const item = await prisma.item.findUnique({ where: { id } });
if (!item) {
  return NextResponse.json(
    { success: false, error: 'Item not found' },
    { status: 404 }
  );
}

// ✅ Better: Let Prisma throw
try {
  const item = await prisma.item.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({ success: true, data: item });
} catch (error) {
  if (error.code === 'P2025') {
    return NextResponse.json(
      { success: false, error: 'Item not found' },
      { status: 404 }
    );
  }
  throw error;
}
```

### 1.4 Batch Operations

#### ❌ Bad: Multiple individual operations
```typescript
for (const item of items) {
  await prisma.item.update({
    where: { id: item.id },
    data: { quantity: item.quantity }
  });
}
// N database round-trips! 😱
```

#### ✅ Good: Use batch operations
```typescript
// Single query with transaction
await prisma.$transaction(
  items.map(item =>
    prisma.item.update({
      where: { id: item.id },
      data: { quantity: item.quantity }
    })
  )
);
```

#### ⚡ Best: Use updateMany when possible
```typescript
// Bulk update with single query
await prisma.item.updateMany({
  where: {
    categoryId: 'old-category-id'
  },
  data: {
    categoryId: 'new-category-id'
  }
});
```

### 1.5 Parallel Queries with Promise.all

#### ✅ Current implementation (excellent!)
```typescript
// From /api/items/route.ts
const [items, total] = await Promise.all([
  prisma.item.findMany({ where, include, orderBy, skip, take }),
  prisma.item.count({ where })
]);
```

**More examples:**
```typescript
// Fetch multiple independent resources in parallel
const [categories, locations, tags] = await Promise.all([
  prisma.category.findMany(),
  prisma.location.findMany(),
  prisma.tag.findMany()
]);

// Aggregate queries in parallel
const [totalItems, lowStockCount, categoryStats] = await Promise.all([
  prisma.item.count(),
  prisma.item.count({ where: { quantity: { lte: 5 } } }),
  prisma.category.findMany({
    include: { _count: { select: { items: true } } }
  })
]);
```

---

## 2. Type Safety

### 2.1 Using Prisma Generated Types

Prisma automatically generates types from your schema. Use them!

#### ✅ Import and use Prisma types
```typescript
import { Prisma, Item, Category, Location } from '@prisma/client';

// Use generated types
type ItemWithRelations = Prisma.ItemGetPayload<{
  include: {
    category: true;
    location: true;
    tags: { include: { tag: true } };
  };
}>;

// Use in functions
async function getItemWithDetails(id: string): Promise<ItemWithRelations | null> {
  return prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      tags: { include: { tag: true } }
    }
  });
}
```

### 2.2 Type-Safe Queries with Validator

Combine Prisma types with Zod for end-to-end type safety:

```typescript
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Prisma validator for type inference
const itemWithRelations = Prisma.validator<Prisma.ItemDefaultArgs>()({
  include: {
    category: {
      select: { id: true, name: true, icon: true }
    },
    location: {
      select: { id: true, name: true }
    }
  }
});

// Infer the type
type ItemWithRelations = Prisma.ItemGetPayload<typeof itemWithRelations>;

// Use in API route
export async function GET(request: NextRequest) {
  const items: ItemWithRelations[] = await prisma.item.findMany(itemWithRelations);
  return NextResponse.json({ success: true, data: items });
}
```

### 2.3 Custom Type Extensions

Extend Prisma types for your application needs:

```typescript
import { Item, Category } from '@prisma/client';

// Add computed properties
type ItemWithStatus = Item & {
  isLowStock: boolean;
  daysUntilExpiry?: number;
};

function enrichItem(item: Item, category: Category): ItemWithStatus {
  const minQty = item.minQuantity ?? category.minQuantity ?? 0;

  return {
    ...item,
    isLowStock: item.quantity <= minQty,
    daysUntilExpiry: item.warrantyUntil
      ? Math.floor((item.warrantyUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : undefined
  };
}
```

### 2.4 Zod + Prisma Integration

**Current pattern in validations.ts:**
```typescript
export const itemSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  quantity: z.number().int().min(0).default(1),
  // ...
});

export type ItemFormData = z.infer<typeof itemSchema>;
```

**Enhanced pattern with Prisma:**
```typescript
import { Prisma } from '@prisma/client';

// For API input validation (Zod)
export const itemCreateSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().cuid(),
  locationId: z.string().cuid(),
  quantity: z.number().int().min(0).default(1),
  tagIds: z.array(z.string().cuid()).optional()
});

// For database operations (Prisma)
export type ItemCreateInput = Prisma.ItemCreateInput;
export type ItemUpdateInput = Prisma.ItemUpdateInput;

// Convert Zod to Prisma
function toItemCreateInput(data: z.infer<typeof itemCreateSchema>): ItemCreateInput {
  const { tagIds, ...itemData } = data;

  return {
    ...itemData,
    category: { connect: { id: data.categoryId } },
    location: { connect: { id: data.locationId } },
    tags: {
      create: tagIds?.map(tagId => ({
        tag: { connect: { id: tagId } }
      }))
    }
  };
}
```

---

## 3. Error Handling

### 3.1 Common Prisma Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| P2002 | Unique constraint violation | 409 Conflict |
| P2025 | Record not found | 404 Not Found |
| P2003 | Foreign key constraint failed | 400 Bad Request |
| P2014 | Relation violation | 400 Bad Request |
| P2034 | Transaction failed | 500 Internal Error |

### 3.2 Structured Error Handling

#### ❌ Current pattern (basic)
```typescript
try {
  const item = await prisma.item.create({ data });
  return NextResponse.json({ success: true, data: item });
} catch (error) {
  console.error('Error creating item:', error);
  return NextResponse.json(
    { success: false, error: 'Failed to create item' },
    { status: 500 }
  );
}
```

#### ✅ Better: Handle specific errors
```typescript
import { Prisma } from '@prisma/client';

try {
  const item = await prisma.item.create({ data });
  return NextResponse.json({ success: true, data: item }, { status: 201 });
} catch (error) {
  // Unique constraint violation (duplicate name/barcode)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return NextResponse.json(
        {
          success: false,
          error: `An item with this ${field} already exists`,
          code: 'DUPLICATE_ENTRY'
        },
        { status: 409 }
      );
    }

    // Foreign key constraint (invalid category/location)
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category or location ID',
          code: 'INVALID_REFERENCE'
        },
        { status: 400 }
      );
    }

    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
  }

  // Validation error from Zod
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation error',
        details: error.issues,
        code: 'VALIDATION_ERROR'
      },
      { status: 400 }
    );
  }

  // Unknown error - log but don't expose details
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

### 3.3 Transaction Error Handling

```typescript
try {
  const result = await prisma.$transaction(async (tx) => {
    // Create item
    const item = await tx.item.create({ data: itemData });

    // Update category count
    await tx.category.update({
      where: { id: itemData.categoryId },
      data: { itemCount: { increment: 1 } }
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'ITEM_CREATED',
        itemId: item.id,
        userId: session.user.id
      }
    });

    return item;
  }, {
    maxWait: 5000, // Wait max 5s for transaction to start
    timeout: 10000, // Timeout after 10s
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });

  return NextResponse.json({ success: true, data: result });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2034') {
      return NextResponse.json(
        { success: false, error: 'Transaction conflict. Please retry.' },
        { status: 409 }
      );
    }
  }

  // Transaction rolled back automatically
  console.error('Transaction failed:', error);
  return NextResponse.json(
    { success: false, error: 'Transaction failed' },
    { status: 500 }
  );
}
```

### 3.4 Retry Logic for Transient Failures

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2024', 'P2034'].includes(error.code); // Timeout or transaction conflict

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const item = await withRetry(() =>
  prisma.item.create({ data: itemData })
);
```

---

## 4. Performance Optimization

### 4.1 Connection Pooling Configuration

#### ✅ Current implementation in lib/db.ts
```typescript
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

#### ⚡ Enhanced with connection pool settings
```typescript
// For SQLite (current database)
const DATABASE_URL = process.env.DATABASE_URL || 'file:./inventory.db'

// For PostgreSQL (when scaling)
// DATABASE_URL = postgresql://user:pass@host:5432/dbname?connection_limit=10&pool_timeout=30

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
  datasources: {
    db: { url: DATABASE_URL }
  },
  // Note: SQLite doesn't support connection pooling
  // Configure these when migrating to PostgreSQL
});

// Connection pool monitoring (PostgreSQL only)
if (process.env.DATABASE_URL?.includes('postgresql')) {
  setInterval(async () => {
    const metrics = await prisma.$metrics.json();
    console.log('Connection pool:', metrics);
  }, 60000); // Log every minute
}
```

### 4.2 Index Optimization

#### ✅ Current indexes in schema.prisma
```prisma
model Item {
  // ...fields...

  @@index([categoryId])
  @@index([locationId])
  @@index([name])
}

model ItemTag {
  // ...fields...

  @@unique([itemId, tagId])
  @@index([itemId])
  @@index([tagId])
}
```

#### 🎯 Recommended additional indexes
```prisma
model Item {
  // ...existing fields...

  @@index([categoryId])
  @@index([locationId])
  @@index([name])

  // Add these for common queries:
  @@index([quantity]) // For low stock alerts
  @@index([createdAt]) // For sorting by date
  @@index([warrantyUntil]) // For expiry queries
  @@index([categoryId, locationId]) // Composite for filtered lists
  @@index([barcode]) // For barcode lookups
}

model Location {
  // ...existing fields...

  @@index([parentId]) // For hierarchy queries
}
```

**Query performance impact:**
```typescript
// Before index on quantity:
const lowStock = await prisma.item.findMany({
  where: { quantity: { lte: 5 } }
}); // Full table scan! 😱

// After @@index([quantity]):
// Same query, but uses index! 🚀
```

### 4.3 Query Caching Strategies

#### Option 1: In-Memory Cache (for frequently accessed data)
```typescript
import { LRUCache } from 'lru-cache';

const categoryCache = new LRUCache<string, Category[]>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function getCategoriesWithCache() {
  const cacheKey = 'all-categories';
  let categories = categoryCache.get(cacheKey);

  if (!categories) {
    categories = await prisma.category.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' }
    });
    categoryCache.set(cacheKey, categories);
  }

  return categories;
}
```

#### Option 2: React Query (Next.js Client-Side)
```typescript
// Already configured in the project!
import { useQuery } from '@tanstack/react-query';

export function useItems(filters: ItemFilters) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => fetchItems(filters),
    staleTime: 1000 * 60, // 1 minute
    cacheTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

#### Option 3: Database Query Caching
```typescript
// Prisma middleware for caching
prisma.$use(async (params, next) => {
  const cacheKey = `${params.model}:${params.action}:${JSON.stringify(params.args)}`;

  if (params.action === 'findMany' || params.action === 'findUnique') {
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await next(params);
    cache.set(cacheKey, result, 60); // Cache for 60 seconds
    return result;
  }

  return next(params);
});
```

### 4.4 Middleware for Performance Monitoring

```typescript
// lib/prisma-middleware.ts
import { Prisma } from '@prisma/client';

export function performanceMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;

    // Log slow queries
    if (duration > 100) {
      console.warn(`Slow query detected (${duration}ms):`, {
        model: params.model,
        action: params.action,
        args: params.args
      });
    }

    // Track metrics
    metrics.recordQuery({
      model: params.model,
      action: params.action,
      duration
    });

    return result;
  };
}

// In lib/db.ts
prisma.$use(performanceMiddleware());
```

### 4.5 Batch Loading with DataLoader Pattern

```typescript
// lib/dataloaders.ts
import DataLoader from 'dataloader';

export const categoryLoader = new DataLoader<string, Category>(
  async (ids) => {
    const categories = await prisma.category.findMany({
      where: { id: { in: [...ids] } }
    });

    // Return in same order as requested
    return ids.map(id => categories.find(c => c.id === id)!);
  }
);

// Usage in resolver/route
const items = await prisma.item.findMany();
const itemsWithCategories = await Promise.all(
  items.map(async (item) => ({
    ...item,
    category: await categoryLoader.load(item.categoryId) // Batched!
  }))
);
```

---

## 5. Development Workflow

### 5.1 Schema Evolution Best Practices

#### Making Schema Changes
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_barcode_index

# 3. Generate client
npx prisma generate

# 4. Review generated migration
cat prisma/migrations/*/migration.sql
```

#### Safe Schema Changes Checklist
- ✅ Add nullable fields (backwards compatible)
- ✅ Add new models
- ✅ Add indexes
- ⚠️ Rename fields (requires data migration)
- ⚠️ Change field types (may lose data)
- ❌ Remove fields without migration (data loss!)

### 5.2 Migration Strategies

#### Development Migrations
```bash
# Create and apply migration
npx prisma migrate dev --name descriptive_name

# Reset database (WARNING: data loss)
npx prisma migrate reset

# Apply migrations without prompts
npx prisma migrate dev --skip-seed
```

#### Production Migrations
```bash
# 1. Review pending migrations
npx prisma migrate status

# 2. Deploy migrations (no prompts, safe for CI/CD)
npx prisma migrate deploy

# 3. Verify migration
npx prisma migrate status
```

#### Data Migrations
```typescript
// prisma/migrations/20240101_update_categories/migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update existing data
  await prisma.category.updateMany({
    where: { minQuantity: null },
    data: { minQuantity: 0 }
  });

  console.log('Data migration completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 5.3 Testing with Prisma

#### Test Database Setup
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db' // Separate test database
    }
  }
});

beforeAll(async () => {
  // Apply migrations to test DB
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Item');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Category');
  // ... or use prisma migrate deploy
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
});
```

#### Mocking Prisma in Tests
```typescript
// tests/mocks/prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

// Usage in tests
import { prismaMock } from './mocks/prisma';

test('creates item', async () => {
  const mockItem = { id: '1', name: 'Test Item', quantity: 1 };
  prismaMock.item.create.mockResolvedValue(mockItem);

  const result = await createItem(itemData);
  expect(result).toEqual(mockItem);
  expect(prismaMock.item.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ name: 'Test Item' })
  });
});
```

### 5.4 Seeding Strategies

#### Basic Seed Script
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (development only!)
  if (process.env.NODE_ENV === 'development') {
    await prisma.item.deleteMany();
    await prisma.category.deleteMany();
    await prisma.location.deleteMany();
  }

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      icon: 'laptop',
      color: '#3B82F6',
      minQuantity: 2
    }
  });

  // Create locations
  const basement = await prisma.location.create({
    data: {
      name: 'Basement',
      description: 'Storage area'
    }
  });

  // Create items with relations
  await prisma.item.createMany({
    data: [
      {
        name: 'MacBook Pro',
        description: '16-inch, M1 Pro',
        quantity: 1,
        categoryId: electronics.id,
        locationId: basement.id,
        purchasePrice: 2499.99,
        currentValue: 2200.00
      },
      // ... more items
    ]
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### Run seed script
```bash
# Manual
npx tsx prisma/seed.ts

# With migration reset
npx prisma migrate reset # Automatically runs seed

# Configure in package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 5.5 Prisma Studio

```bash
# Launch visual database editor
npx prisma studio

# Opens browser at http://localhost:5555
# - View/edit data
# - Test queries
# - Explore relations
```

---

## 6. Drizzle to Prisma Migration

### 6.1 Key Differences

| Feature | Drizzle | Prisma |
|---------|---------|--------|
| **Query Style** | SQL-like | Fluent API |
| **Type Generation** | Infer from schema | Generated client |
| **Relations** | Explicit joins | Include/select |
| **Migrations** | drizzle-kit | prisma migrate |
| **Schema Definition** | TypeScript | Prisma Schema Language |
| **Bundle Size** | ~17kb | ~500kb |
| **Learning Curve** | SQL knowledge | Proprietary API |

### 6.2 Query Syntax Conversion Cheat Sheet

#### SELECT Queries

**Drizzle:**
```typescript
import { db } from '@/db';
import { items, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Basic select
const allItems = await db.select().from(items);

// With where clause
const electronics = await db
  .select()
  .from(items)
  .where(eq(items.categoryId, categoryId));

// With joins
const itemsWithCategory = await db
  .select({
    item: items,
    category: categories
  })
  .from(items)
  .leftJoin(categories, eq(items.categoryId, categories.id));
```

**Prisma:**
```typescript
import { prisma } from '@/lib/db';

// Basic select
const allItems = await prisma.item.findMany();

// With where clause
const electronics = await prisma.item.findMany({
  where: { categoryId }
});

// With relations (no join needed!)
const itemsWithCategory = await prisma.item.findMany({
  include: {
    category: true
  }
});
```

#### INSERT Operations

**Drizzle:**
```typescript
// Single insert
const [newItem] = await db
  .insert(items)
  .values({
    name: 'Laptop',
    categoryId: 'cat_123',
    quantity: 1
  })
  .returning();

// Multiple inserts
await db.insert(items).values([
  { name: 'Item 1', categoryId: 'cat_123', quantity: 1 },
  { name: 'Item 2', categoryId: 'cat_456', quantity: 2 }
]);
```

**Prisma:**
```typescript
// Single insert
const newItem = await prisma.item.create({
  data: {
    name: 'Laptop',
    category: { connect: { id: 'cat_123' } },
    quantity: 1
  }
});

// Multiple inserts
await prisma.item.createMany({
  data: [
    { name: 'Item 1', categoryId: 'cat_123', quantity: 1 },
    { name: 'Item 2', categoryId: 'cat_456', quantity: 2 }
  ]
});
```

#### UPDATE Operations

**Drizzle:**
```typescript
// Update with where
await db
  .update(items)
  .set({ quantity: 5, updatedAt: new Date() })
  .where(eq(items.id, itemId));
```

**Prisma:**
```typescript
// Update single record
await prisma.item.update({
  where: { id: itemId },
  data: { quantity: 5 }
  // updatedAt automatic with @updatedAt
});

// Update many
await prisma.item.updateMany({
  where: { categoryId },
  data: { quantity: { increment: 1 } }
});
```

#### DELETE Operations

**Drizzle:**
```typescript
await db
  .delete(items)
  .where(eq(items.id, itemId));
```

**Prisma:**
```typescript
// Delete single (throws if not found)
await prisma.item.delete({
  where: { id: itemId }
});

// Delete many
await prisma.item.deleteMany({
  where: { categoryId }
});
```

### 6.3 Schema Migration

#### Drizzle Schema (Old)
```typescript
// db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const items = sqliteTable('items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  categoryId: text('category_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  description: text('description'),
});
```

#### Prisma Schema (New)
```prisma
// prisma/schema.prisma
model Item {
  id         String   @id @default(cuid())
  name       String
  categoryId String
  quantity   Int      @default(1)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  category   Category @relation(fields: [categoryId], references: [id])

  @@index([categoryId])
}

model Category {
  id          String  @id @default(cuid())
  name        String  @unique
  description String?
  items       Item[]
}
```

### 6.4 Migration Gotchas & Solutions

#### Issue 1: Relation Syntax
```typescript
// ❌ Drizzle-style (won't work)
const item = await prisma.item.create({
  data: {
    categoryId: 'cat_123'
  }
});

// ✅ Prisma-style (explicit connection)
const item = await prisma.item.create({
  data: {
    category: { connect: { id: 'cat_123' } }
  }
});

// ✅ Alternative (if foreign key exists in schema)
const item = await prisma.item.create({
  data: {
    categoryId: 'cat_123' // Works because schema has categoryId field!
  }
});
```

#### Issue 2: Eager Loading
```typescript
// ❌ Drizzle requires explicit joins
const items = await db
  .select()
  .from(items)
  .leftJoin(categories, eq(items.categoryId, categories.id));

// ✅ Prisma auto-loads with include
const items = await prisma.item.findMany({
  include: { category: true }
});
```

#### Issue 3: Transactions
```typescript
// ❌ Drizzle transaction syntax
await db.transaction(async (tx) => {
  await tx.insert(items).values(itemData);
  await tx.update(categories).set({ count: count + 1 });
});

// ✅ Prisma transaction syntax
await prisma.$transaction(async (tx) => {
  await tx.item.create({ data: itemData });
  await tx.category.update({
    where: { id: categoryId },
    data: { count: { increment: 1 } }
  });
});
```

#### Issue 4: Date Handling
```typescript
// ❌ Drizzle stores as integer/timestamp
createdAt: integer('created_at', { mode: 'timestamp' })

// ✅ Prisma uses DateTime (stored as ISO string in SQLite)
createdAt DateTime @default(now())

// Migration: Convert existing timestamps
UPDATE items SET created_at = datetime(created_at, 'unixepoch');
```

### 6.5 Step-by-Step Migration Plan

#### Phase 1: Preparation
```bash
# 1. Install Prisma
npm install prisma @prisma/client
npm install -D prisma

# 2. Initialize Prisma
npx prisma init --datasource-provider sqlite

# 3. Point to existing database
# Update DATABASE_URL in .env
DATABASE_URL="file:./inventory.db"
```

#### Phase 2: Schema Introspection
```bash
# Generate Prisma schema from existing DB
npx prisma db pull

# Review generated schema
cat prisma/schema.prisma

# Make adjustments (relations, indexes, etc.)
```

#### Phase 3: Code Migration
```typescript
// Create adapter layer for gradual migration
// lib/db-adapter.ts
export async function getItems() {
  // Use Prisma
  return prisma.item.findMany({
    include: { category: true }
  });
}

// Old code still using Drizzle works
// New code uses Prisma
```

#### Phase 4: Testing
```bash
# Test all CRUD operations
npm run test

# Verify data integrity
npx prisma studio
```

#### Phase 5: Cleanup
```bash
# Remove Drizzle dependencies
npm uninstall drizzle-orm drizzle-kit

# Remove old schema files
rm -rf src/db/schema.ts
```

---

## 7. Troubleshooting Guide

### 7.1 Common Errors and Solutions

#### Error: "Unknown arg `include`"
```typescript
// ❌ Problem: Using include with wrong method
const count = await prisma.item.count({
  include: { category: true } // count doesn't support include!
});

// ✅ Solution: Use appropriate method
const items = await prisma.item.findMany({
  include: { category: true }
});
```

#### Error: "P2002: Unique constraint failed"
```typescript
// Problem: Trying to create duplicate unique field

// ✅ Solution 1: Use upsert
const category = await prisma.category.upsert({
  where: { name: 'Electronics' },
  update: {},
  create: {
    name: 'Electronics',
    description: 'Electronic items'
  }
});

// ✅ Solution 2: Check existence first
const existing = await prisma.category.findUnique({
  where: { name: 'Electronics' }
});
if (!existing) {
  await prisma.category.create({ data: { name: 'Electronics' } });
}
```

#### Error: "P2025: Record not found"
```typescript
// ❌ Problem: Update/delete non-existent record
await prisma.item.update({
  where: { id: 'invalid' },
  data: { name: 'New Name' }
}); // Throws P2025

// ✅ Solution: Use findUnique first or catch error
const item = await prisma.item.findUnique({ where: { id } });
if (item) {
  await prisma.item.update({ where: { id }, data });
}

// Or handle the error
try {
  await prisma.item.update({ where: { id }, data });
} catch (error) {
  if (error.code === 'P2025') {
    return { error: 'Item not found' };
  }
  throw error;
}
```

#### Error: "Cannot read properties of undefined (reading 'id')"
```typescript
// ❌ Problem: Relation not loaded
const item = await prisma.item.findUnique({ where: { id } });
console.log(item.category.name); // undefined!

// ✅ Solution: Include the relation
const item = await prisma.item.findUnique({
  where: { id },
  include: { category: true }
});
console.log(item.category.name); // Works! ✓
```

#### Error: "SQLite database locked"
```typescript
// Problem: Concurrent writes to SQLite

// ✅ Solution 1: Enable WAL mode
// DATABASE_URL="file:./inventory.db?mode=wal"

// ✅ Solution 2: Increase timeout
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./inventory.db?timeout=5000'
    }
  }
});

// ✅ Solution 3: Use PostgreSQL for production (better concurrency)
```

### 7.2 Performance Issues

#### Issue: Slow Queries
```bash
# 1. Enable query logging
# In lib/db.ts, add:
log: ['query']

# 2. Identify slow queries (>100ms)
# Add middleware to log duration

# 3. Check for missing indexes
npx prisma db push --help

# 4. Use EXPLAIN QUERY PLAN (SQLite)
await prisma.$queryRaw`EXPLAIN QUERY PLAN SELECT * FROM items WHERE category_id = 'cat_123'`;
```

#### Issue: Too Many Queries (N+1)
```typescript
// ❌ Bad: Separate query for each item's category
const items = await prisma.item.findMany();
for (const item of items) {
  const category = await prisma.category.findUnique({
    where: { id: item.categoryId }
  }); // N+1! 😱
}

// ✅ Good: Include relations
const items = await prisma.item.findMany({
  include: { category: true }
}); // 1 query! 🚀
```

### 7.3 Type Issues

#### Issue: Type errors with relations
```typescript
// ❌ Problem: TypeScript doesn't know about included relations
const items = await prisma.item.findMany({
  include: { category: true }
});

items.forEach(item => {
  console.log(item.category.name); // TS error!
});

// ✅ Solution: Use Prisma.ItemGetPayload
type ItemWithCategory = Prisma.ItemGetPayload<{
  include: { category: true }
}>;

const items: ItemWithCategory[] = await prisma.item.findMany({
  include: { category: true }
});

items.forEach(item => {
  console.log(item.category.name); // Works! ✓
});
```

### 7.4 Migration Issues

#### Issue: Migration failed, database in bad state
```bash
# 1. Check migration status
npx prisma migrate status

# 2. Resolve failed migration
npx prisma migrate resolve --applied "20240101_migration_name"
# or
npx prisma migrate resolve --rolled-back "20240101_migration_name"

# 3. If all else fails (DEVELOPMENT ONLY!)
npx prisma migrate reset # WARNING: Data loss!
```

#### Issue: Cannot create migration with data loss
```bash
# Problem: Prisma warns about potential data loss

# ✅ Solution: Create manual migration
npx prisma migrate dev --create-only --name backup_data

# Edit the generated migration SQL to preserve data
# Then apply:
npx prisma migrate dev
```

---

## 8. VS Code Extensions

### 8.1 Essential Extensions

#### 1. **Prisma** (Official)
```
Name: Prisma
ID: Prisma.prisma
Publisher: Prisma
```

**Features:**
- Syntax highlighting for `.prisma` files
- Auto-completion
- Formatting
- Linting
- Jump to definition
- Rename refactoring

#### 2. **Prisma - Insider**
```
Name: Prisma Insider
ID: Prisma.prisma-insider
```
Early access to new features (optional).

### 8.2 Recommended Extensions

#### 3. **Database Client** (SQLite Management)
```
Name: SQLite
ID: alexcvzz.vscode-sqlite
```
View and query SQLite databases directly in VS Code.

#### 4. **Better Comments**
```
Name: Better Comments
ID: aaron-bond.better-comments
```
Highlight Prisma schema comments.

#### 5. **Error Lens**
```
Name: Error Lens
ID: usernamehw.errorlens
```
See Prisma errors inline.

### 8.3 VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  // Prisma formatting
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma",
    "editor.formatOnSave": true
  },

  // Auto-format on save
  "editor.formatOnSave": true,

  // Prisma language
  "files.associations": {
    "*.prisma": "prisma"
  },

  // Quick suggestions for Prisma
  "editor.quickSuggestions": {
    "other": true,
    "comments": false,
    "strings": true
  },

  // SQLite
  "sqlite.sqlite3": "/usr/bin/sqlite3"
}
```

### 8.4 Code Snippets

Create `.vscode/prisma.code-snippets`:

```json
{
  "Prisma Model": {
    "prefix": "pmodel",
    "body": [
      "model ${1:ModelName} {",
      "  id        String   @id @default(cuid())",
      "  ${2:name}     ${3:String}",
      "  createdAt DateTime @default(now())",
      "  updatedAt DateTime @updatedAt",
      "}"
    ]
  },

  "Prisma FindMany": {
    "prefix": "pfindmany",
    "body": [
      "const ${1:items} = await prisma.${2:model}.findMany({",
      "  where: { ${3:field}: ${4:value} },",
      "  include: { ${5:relation}: true },",
      "  orderBy: { ${6:createdAt}: 'desc' },",
      "  take: ${7:10}",
      "});"
    ]
  },

  "Prisma Create": {
    "prefix": "pcreate",
    "body": [
      "const ${1:item} = await prisma.${2:model}.create({",
      "  data: {",
      "    ${3:field}: ${4:value}",
      "  }",
      "});"
    ]
  }
}
```

---

## Summary & Quick Reference

### Query Performance Checklist
- ✅ Use `select` for specific fields instead of `include` when possible
- ✅ Include relations upfront to avoid N+1 queries
- ✅ Use `findUnique` for queries by unique fields
- ✅ Leverage `Promise.all` for parallel queries
- ✅ Add indexes for frequently queried fields
- ✅ Use batch operations (`createMany`, `updateMany`) instead of loops
- ✅ Enable connection pooling (PostgreSQL)

### Type Safety Checklist
- ✅ Use `Prisma.ModelGetPayload` for complex types
- ✅ Infer types with `Prisma.validator`
- ✅ Combine Zod + Prisma types for end-to-end safety
- ✅ Create type helpers for common query patterns

### Error Handling Checklist
- ✅ Handle specific Prisma error codes (P2002, P2025, etc.)
- ✅ Use transactions for multi-step operations
- ✅ Implement retry logic for transient failures
- ✅ Log errors but don't expose details to users
- ✅ Use `findUniqueOrThrow` for cleaner error handling

### Development Workflow Checklist
- ✅ Use descriptive migration names
- ✅ Review generated SQL before applying
- ✅ Test migrations in development first
- ✅ Use separate test database
- ✅ Create seed scripts for development data
- ✅ Use Prisma Studio for debugging

---

## Additional Resources

- **Official Docs:** https://www.prisma.io/docs
- **Schema Reference:** https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- **Error Reference:** https://www.prisma.io/docs/reference/api-reference/error-reference
- **Best Practices:** https://www.prisma.io/docs/guides/performance-and-optimization
- **Discord Community:** https://discord.gg/prisma
- **GitHub:** https://github.com/prisma/prisma

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-10
**Project:** Home Inventory System
**Database:** SQLite (Prisma 6.17.1)
