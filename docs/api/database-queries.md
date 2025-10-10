# Database Queries

Database query patterns and examples using Prisma ORM.

## Prisma Setup

\`\`\`typescript
import { prisma } from '@/lib/db';
\`\`\`

## Common Queries

### Items

#### List All Items with Relations
\`\`\`typescript
const items = await prisma.item.findMany({
  include: {
    category: true,
    location: true,
    tags: {
      include: {
        tag: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});
\`\`\`

#### Get Single Item
\`\`\`typescript
const item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    category: true,
    location: true,
    tags: {
      include: {
        tag: true
      }
    }
  }
});
\`\`\`

#### Create Item
\`\`\`typescript
const item = await prisma.item.create({
  data: {
    name: "Samsung TV",
    categoryId: "cat_123",
    locationId: "loc_456",
    purchasePrice: 1299.99,
    currentValue: 899.99,
    condition: "excellent",
    tags: {
      create: [
        { tagId: "tag_789" }
      ]
    }
  },
  include: {
    category: true,
    location: true,
    tags: { include: { tag: true } }
  }
});
\`\`\`

#### Update Item
\`\`\`typescript
const item = await prisma.item.update({
  where: { id: itemId },
  data: {
    name: "Updated Name",
    currentValue: 799.99,
    tags: {
      deleteMany: {},
      create: [
        { tagId: "tag_new" }
      ]
    }
  },
  include: {
    category: true,
    location: true,
    tags: { include: { tag: true } }
  }
});
\`\`\`

#### Delete Item
\`\`\`typescript
await prisma.item.delete({
  where: { id: itemId }
});
\`\`\`

### Advanced Queries

#### Search with Filters
\`\`\`typescript
const items = await prisma.item.findMany({
  where: {
    AND: [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { categoryId: categoryFilter },
      { locationId: locationFilter },
      {
        currentValue: {
          gte: minValue,
          lte: maxValue
        }
      },
      {
        tags: {
          some: {
            tagId: { in: tagIds }
          }
        }
      }
    ]
  },
  include: {
    category: {
      select: { id: true, name: true, color: true, icon: true }
    },
    location: {
      select: { id: true, name: true }
    },
    _count: { select: { tags: true } }
  },
  orderBy: { [sortBy]: sortOrder },
  take: limit,
  skip: (page - 1) * limit
});

const total = await prisma.item.count({ where: /* same where clause */ });
\`\`\`

#### Pagination Helper
\`\`\`typescript
async function getPaginatedItems(
  page: number = 1,
  limit: number = 20,
  where: any = {}
) {
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.item.count({ where })
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
\`\`\`

### Categories

#### List All Categories with Item Count
\`\`\`typescript
const categories = await prisma.category.findMany({
  include: {
    _count: {
      select: { items: true }
    }
  },
  orderBy: { name: 'asc' }
});
\`\`\`

### Locations

#### List Locations with Hierarchy
\`\`\`typescript
const locations = await prisma.location.findMany({
  include: {
    parent: true,
    children: true,
    _count: {
      select: { items: true }
    }
  },
  orderBy: { name: 'asc' }
});
\`\`\`

### Tags

#### List Tags with Usage Count
\`\`\`typescript
const tags = await prisma.tag.findMany({
  include: {
    _count: {
      select: { itemTags: true }
    }
  },
  orderBy: { name: 'asc' }
});
\`\`\`

## Performance Optimization

### Indexes
Schema includes indexes on:
- `item.categoryId`
- `item.locationId`
- `item.name`
- `itemTag.itemId`
- `itemTag.tagId`

### Connection Pooling
\`\`\`typescript
// Configured in lib/db.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});
\`\`\`

### Query Optimization Tips
1. Use `select` to limit fields
2. Use `include` only when needed
3. Implement cursor-based pagination for large datasets
4. Cache frequently accessed data
5. Use transactions for multiple related operations

## Transactions

\`\`\`typescript
const result = await prisma.$transaction(async (tx) => {
  const item = await tx.item.create({ data: itemData });
  await tx.itemTag.createMany({
    data: tagIds.map(tagId => ({ itemId: item.id, tagId }))
  });
  return item;
});
\`\`\`

## Database Schema

See: `prisma/schema.prisma` for complete schema definition

Key models:
- **Item**: Main inventory item
- **Category**: Item categories
- **Location**: Storage locations
- **Tag**: Flexible labels
- **ItemTag**: Many-to-many relationship

See also:
- [API Overview](./overview.md)
- [Database Setup](../development/database.md)
