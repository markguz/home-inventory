# Database Strategy for Home Inventory System

## Executive Summary
This document analyzes database technologies and strategies for building a Next.js 13+ home inventory management system. We compare Prisma vs Drizzle ORM, SQLite vs PostgreSQL databases, and image storage solutions with specific recommendations for MVP and production scenarios.

---

## 1. ORM Comparison: Prisma vs Drizzle

### Option A: Drizzle ORM (Recommended for New Projects ⭐)

**What it is:** Modern, lightweight, TypeScript-first ORM with SQL-like syntax.

**Why it's gaining popularity:**
- Lightweight (7.4KB vs 170KB for Prisma)
- Better performance (no runtime overhead)
- SQL-like syntax (easier for SQL developers)
- Better TypeScript inference
- No code generation step
- Supports edge runtimes (Cloudflare Workers, Vercel Edge)

**Installation:**
```bash
npm install drizzle-orm
npm install -D drizzle-kit

# For SQLite
npm install better-sqlite3
npm install -D @types/better-sqlite3

# For PostgreSQL
npm install pg
npm install -D @types/pg
```

**Schema Definition:**
```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const items = sqliteTable('items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: text('category_id').notNull().references(() => categories.id),
  location: text('location').notNull(),
  quantity: integer('quantity').notNull().default(1),

  // Purchase info
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  purchasePrice: real('purchase_price'),
  purchaseLocation: text('purchase_location'),

  // Warranty/Maintenance
  warrantyExpiry: integer('warranty_expiry', { mode: 'timestamp' }),
  lastMaintenance: integer('last_maintenance', { mode: 'timestamp' }),

  // Images
  imageUrl: text('image_url'),
  imageUrls: text('image_urls', { mode: 'json' }).$type<string[]>(),

  // Metadata
  serialNumber: text('serial_number'),
  modelNumber: text('model_number'),
  notes: text('notes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Junction table for many-to-many
export const itemsToTags = sqliteTable('items_to_tags', {
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
})

// Relations
export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id]
  }),
  tags: many(itemsToTags)
}))

export const itemsToTagsRelations = relations(itemsToTags, ({ one }) => ({
  item: one(items, {
    fields: [itemsToTags.itemId],
    references: [items.id]
  }),
  tag: one(tags, {
    fields: [itemsToTags.tagId],
    references: [tags.id]
  })
}))
```

**Database Client:**
```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('inventory.db')
export const db = drizzle(sqlite, { schema })
```

**Queries:**
```typescript
// lib/db/queries.ts
import { db } from './index'
import { items, categories, tags, itemsToTags } from './schema'
import { eq, and, like, desc, sql } from 'drizzle-orm'

// Get all items with relations
export async function getAllItems() {
  return db.query.items.findMany({
    with: {
      category: true,
      tags: {
        with: {
          tag: true
        }
      }
    },
    orderBy: desc(items.updatedAt)
  })
}

// Get items by category
export async function getItemsByCategory(categoryId: string) {
  return db.query.items.findMany({
    where: eq(items.categoryId, categoryId),
    with: {
      category: true,
      tags: { with: { tag: true } }
    }
  })
}

// Search items
export async function searchItems(query: string) {
  return db.select()
    .from(items)
    .where(
      sql`${items.name} LIKE ${'%' + query + '%'}
          OR ${items.description} LIKE ${'%' + query + '%'}`
    )
    .limit(20)
}

// Create item
export async function createItem(data: typeof items.$inferInsert) {
  return db.insert(items).values(data).returning()
}

// Update item
export async function updateItem(id: string, data: Partial<typeof items.$inferInsert>) {
  return db.update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning()
}

// Delete item
export async function deleteItem(id: string) {
  return db.delete(items).where(eq(items.id, id))
}

// Get low stock items
export async function getLowStockItems(threshold: number = 5) {
  return db.query.items.findMany({
    where: sql`${items.quantity} <= ${threshold}`,
    with: { category: true }
  })
}

// Get items by tag
export async function getItemsByTag(tagName: string) {
  return db.select({
    item: items,
    category: categories
  })
    .from(items)
    .innerJoin(itemsToTags, eq(items.id, itemsToTags.itemId))
    .innerJoin(tags, eq(itemsToTags.tagId, tags.id))
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(tags.name, tagName))
}
```

**Migrations:**
```bash
# Generate migration
npx drizzle-kit generate:sqlite

# Run migration
npx drizzle-kit push:sqlite

# Drizzle Studio (Visual DB Manager)
npx drizzle-kit studio
```

**drizzle.config.ts:**
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './inventory.db'
  }
} satisfies Config
```

**Pros:**
- ✅ Lightweight (7.4KB)
- ✅ SQL-like syntax (easier for SQL devs)
- ✅ Better TypeScript inference
- ✅ No code generation
- ✅ Edge runtime support
- ✅ Better performance
- ✅ Drizzle Studio (visual DB tool)

**Cons:**
- ❌ Smaller community (but growing fast)
- ❌ Less mature than Prisma
- ❌ Fewer learning resources

---

### Option B: Prisma ORM (Mature, Battle-Tested)

**What it is:** Most popular TypeScript ORM with excellent DX.

**Installation:**
```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

**Schema Definition:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./inventory.db"
}

model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  icon        String?
  items       Item[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Item {
  id                String    @id @default(cuid())
  name              String
  description       String?
  location          String
  quantity          Int       @default(1)

  purchaseDate      DateTime?
  purchasePrice     Float?
  purchaseLocation  String?

  warrantyExpiry    DateTime?
  lastMaintenance   DateTime?

  imageUrl          String?
  imageUrls         Json?

  serialNumber      String?
  modelNumber       String?
  notes             String?

  categoryId        String
  category          Category  @relation(fields: [categoryId], references: [id])

  tags              Tag[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([categoryId])
  @@index([name])
}

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String?
  items     Item[]
  createdAt DateTime @default(now())
}
```

**Database Client:**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

**Queries:**
```typescript
// lib/queries.ts
import { db } from './db'

export async function getAllItems() {
  return db.item.findMany({
    include: {
      category: true,
      tags: true
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function searchItems(query: string) {
  return db.item.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 20
  })
}

export async function getLowStockItems(threshold: number = 5) {
  return db.item.findMany({
    where: { quantity: { lte: threshold } },
    include: { category: true }
  })
}
```

**Migrations:**
```bash
# Generate migration
npx prisma migrate dev --name init

# Run migration in production
npx prisma migrate deploy

# Prisma Studio (Visual DB Manager)
npx prisma studio
```

**Pros:**
- ✅ Most popular (large community)
- ✅ Excellent documentation
- ✅ Great DX with Prisma Studio
- ✅ Auto-completion is excellent
- ✅ Mature and stable
- ✅ Type-safe by default

**Cons:**
- ❌ Large bundle size (170KB)
- ❌ Code generation step required
- ❌ Can be slow for complex queries
- ❌ No edge runtime support (yet)

---

### Recommendation: Drizzle for New Projects, Prisma for Familiarity

**Use Drizzle if:**
- Starting a new project
- Want better performance
- Need edge runtime support
- Prefer SQL-like syntax

**Use Prisma if:**
- Team already knows Prisma
- Want maximum community support
- Need battle-tested stability
- Prefer declarative schema

---

## 2. Database Comparison: SQLite vs PostgreSQL

### Option A: SQLite (Recommended for MVP ⭐)

**What it is:** Serverless, file-based SQL database.

**Architecture:**
- Single `.db` file
- No separate server process
- Perfect for local development
- Can be deployed to production for single-user apps

**Pros:**
- ✅ Zero configuration
- ✅ No hosting costs
- ✅ Fast for small-to-medium datasets
- ✅ Perfect for local-first apps
- ✅ Easy backups (copy file)
- ✅ Great for MVP/prototyping
- ✅ Works everywhere (portable)

**Cons:**
- ❌ Single writer at a time (limited concurrency)
- ❌ No built-in full-text search (requires extension)
- ❌ Limited to server filesystem
- ❌ Not ideal for multi-user production

**Use Cases:**
- ✅ Personal home inventory (single user)
- ✅ Desktop applications
- ✅ Local-first apps
- ✅ MVP/prototyping

**Deployment:**
```typescript
// For Vercel deployment with SQLite
// Use Turso (SQLite on the edge)
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
})

export const db = drizzle(client)
```

**Turso (SQLite-as-a-Service):**
- Built on libSQL (SQLite fork)
- Edge-native (fast globally)
- Generous free tier
- Perfect for Next.js/Vercel

---

### Option B: PostgreSQL (Production-Ready for Multi-User)

**What it is:** Advanced open-source relational database.

**Pros:**
- ✅ Full ACID compliance
- ✅ Excellent concurrency (many writers)
- ✅ Built-in full-text search
- ✅ JSON support (JSONB)
- ✅ Advanced features (triggers, stored procedures)
- ✅ Scalable to millions of rows
- ✅ Industry standard

**Cons:**
- ❌ Requires hosting (Vercel Postgres, Supabase, Railway)
- ❌ More complex setup
- ❌ Costs money in production
- ❌ Overkill for simple apps

**Use Cases:**
- ✅ Multi-user production apps
- ✅ Team/organization inventory systems
- ✅ Apps requiring complex queries
- ✅ Need for full-text search

**Hosting Options:**
1. **Vercel Postgres** - $0.27/month (hobby tier)
2. **Supabase** - Free tier available
3. **Railway** - $5/month
4. **Neon** - Serverless Postgres (free tier)

**Connection:**
```typescript
// With Drizzle + PostgreSQL
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client)
```

**With Prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

### Recommendation Matrix:

| Scenario | Recommendation | Why |
|----------|----------------|-----|
| Personal inventory (1 user) | SQLite | Simple, zero cost, fast |
| Family inventory (2-5 users) | SQLite or Turso | Good enough, edge deployment |
| Team inventory (5-20 users) | PostgreSQL | Better concurrency |
| Enterprise inventory | PostgreSQL | Advanced features, scalability |
| MVP/Prototype | SQLite | Fastest to start |
| Production (unknown scale) | Start SQLite, migrate later | Validate first, optimize later |

---

## 3. Image Storage Solutions

### Option A: Local Filesystem (MVP)

**Architecture:**
```
public/
└── uploads/
    └── items/
        ├── abc123.jpg
        └── def456.jpg
```

**Implementation:**
```typescript
// app/api/upload/route.ts
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Create unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
  const filename = `${uniqueSuffix}-${file.name}`
  const filepath = join(process.cwd(), 'public/uploads/items', filename)

  await writeFile(filepath, buffer)

  return NextResponse.json({
    url: `/uploads/items/${filename}`
  })
}
```

**With Next.js Image Optimization:**
```tsx
import Image from 'next/image'

<Image
  src={item.imageUrl}
  alt={item.name}
  width={400}
  height={300}
  quality={85}
/>
```

**Pros:**
- ✅ Zero cost
- ✅ Simple implementation
- ✅ Fast for local dev
- ✅ Works with Next.js Image

**Cons:**
- ❌ Not scalable (filesystem limits)
- ❌ No CDN (slower globally)
- ❌ Lost on redeployment (Vercel)
- ❌ No image processing

**Use for:** MVP only, local development

---

### Option B: Cloudinary (Recommended for Production ⭐)

**What it is:** Media management platform with generous free tier.

**Free Tier:**
- 25GB storage
- 25GB bandwidth/month
- Image transformations
- CDN included

**Installation:**
```bash
npm install cloudinary
```

**Setup:**
```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export default cloudinary
```

**Upload Implementation:**
```typescript
// app/api/upload/route.ts
import cloudinary from '@/lib/cloudinary'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'inventory-items',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })

  return NextResponse.json({
    url: result.secure_url,
    public_id: result.public_id
  })
}
```

**Client-Side Upload (Better UX):**
```typescript
// lib/upload.ts
export async function uploadToCloudinary(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  )

  return response.json()
}
```

**Display with Transformations:**
```tsx
import Image from 'next/image'

// Cloudinary delivers optimized image
<Image
  src={`https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_300,c_fill,q_auto,f_auto/${publicId}`}
  alt={item.name}
  width={400}
  height={300}
/>
```

**Pros:**
- ✅ Generous free tier (25GB)
- ✅ Automatic image optimization
- ✅ Global CDN
- ✅ On-the-fly transformations
- ✅ Responsive images
- ✅ Scales to millions of images

**Cons:**
- ❌ Vendor lock-in
- ❌ Costs after free tier

---

### Option C: AWS S3 + CloudFront

**Use when:**
- Need maximum control
- Already using AWS
- High-scale requirements

**Pros:**
- ✅ Cheapest at scale ($0.023/GB)
- ✅ Infinite scalability
- ✅ Full control

**Cons:**
- ❌ More complex setup
- ❌ No built-in transformations
- ❌ Need to configure CDN separately

**Implementation:**
```bash
npm install @aws-sdk/client-s3
npm install @aws-sdk/s3-request-presigner
```

```typescript
// lib/s3.ts
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function uploadToS3(file: File) {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `items/${Date.now()}-${file.name}`,
      Body: file,
      ContentType: file.type
    }
  })

  const result = await upload.done()
  return result.Location
}
```

---

### Recommendation Matrix:

| Phase | Recommendation | Why |
|-------|----------------|-----|
| MVP | Local filesystem | Fastest to start |
| Beta | Cloudinary free tier | Professional, zero cost |
| Production (<10K images) | Cloudinary | Best DX, included CDN |
| Production (>10K images) | S3 + CloudFront | Most cost-effective at scale |

---

## 4. Complete Stack Recommendations

### Recommended Stack for Home Inventory MVP:

```yaml
ORM: Drizzle ORM
Database: SQLite (local) or Turso (deployed)
Image Storage: Cloudinary (free tier)
```

**Why:**
- Zero hosting costs
- Fast development
- Easy to scale later
- Professional result

**Upgrade Path:**
```
MVP: SQLite + Cloudinary Free
↓
Scale: Turso + Cloudinary Free
↓
Production: PostgreSQL + Cloudinary Paid/S3
```

---

## 5. Database Schema Best Practices

### Indexing Strategy:
```typescript
// Add indexes for common queries
@@index([categoryId])
@@index([name])
@@index([location])
@@index([createdAt, updatedAt])
```

### Full-Text Search:
```typescript
// SQLite FTS5
CREATE VIRTUAL TABLE items_fts USING fts5(name, description, content=items)

// PostgreSQL
CREATE INDEX items_search_idx ON items USING gin(to_tsvector('english', name || ' ' || description))
```

### Soft Deletes:
```typescript
deletedAt: integer('deleted_at', { mode: 'timestamp' })

// Query non-deleted items
where: isNull(items.deletedAt)
```

---

## 6. Performance Optimization

### Connection Pooling (PostgreSQL):
```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000
})
```

### Query Optimization:
```typescript
// Select only needed fields
db.select({
  id: items.id,
  name: items.name,
  imageUrl: items.imageUrl
}).from(items)

// Pagination
.limit(20)
.offset(page * 20)
```

### Caching with React Cache:
```typescript
import { cache } from 'react'

export const getItems = cache(async () => {
  return db.query.items.findMany()
})
```

---

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Turso (Edge SQLite)](https://turso.tech)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/performance-tips.html)
