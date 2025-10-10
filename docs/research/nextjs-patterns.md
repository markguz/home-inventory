# Next.js 13+ Best Practices for Home Inventory System

## Executive Summary
This document outlines Next.js 13+ App Router patterns specifically tailored for building a home inventory management system. The focus is on leveraging React Server Components, modern data fetching, and optimal file organization.

---

## 1. App Router Architecture

### File-Based Routing Structure
```
app/
├── layout.tsx                 # Root layout (Server Component)
├── page.tsx                   # Home page
├── globals.css               # Global styles
├── inventory/
│   ├── layout.tsx            # Inventory section layout
│   ├── page.tsx              # Inventory list view
│   ├── [id]/
│   │   ├── page.tsx          # Item detail view
│   │   └── edit/
│   │       └── page.tsx      # Edit item form
│   └── new/
│       └── page.tsx          # Create new item
├── categories/
│   ├── page.tsx              # Categories overview
│   └── [category]/
│       └── page.tsx          # Category-filtered items
├── search/
│   └── page.tsx              # Search results
└── api/
    ├── items/
    │   └── route.ts          # API route for items
    └── upload/
        └── route.ts          # Image upload endpoint
```

**Key Benefits for Inventory System:**
- Automatic code splitting per route
- Nested layouts for consistent navigation
- Type-safe dynamic routes with TypeScript
- Clear separation of concerns

---

## 2. Server vs Client Components

### Server Components (Default - Use Most of the Time)

**Use for:**
- Displaying inventory lists
- Item detail pages
- Category navigation
- Any data fetching from database

```tsx
// app/inventory/page.tsx (Server Component)
import { db } from '@/lib/db'
import { ItemCard } from '@/components/ItemCard'

export default async function InventoryPage() {
  // Direct database query - no API route needed
  const items = await db.item.findMany({
    include: { tags: true, category: true },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

// Automatic static generation or ISR
export const revalidate = 60 // Revalidate every 60 seconds
```

**Advantages:**
- Zero JavaScript sent to client (better performance)
- Direct database access (no API routes needed)
- Automatic request deduplication
- Streaming with Suspense

### Client Components (Use Sparingly)

**Use for:**
- Form inputs and validation
- Interactive search/filter
- Modal dialogs
- Image upload with preview
- State management

```tsx
'use client'

// app/inventory/new/ItemForm.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ItemForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)

    const response = await fetch('/api/items', {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      router.push('/inventory')
      router.refresh() // Refresh server components
    }

    setLoading(false)
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

**Best Practice: Composition Pattern**
```tsx
// Server Component wraps Client Component
// app/inventory/new/page.tsx
import { ItemForm } from './ItemForm'
import { getCategories } from '@/lib/queries'

export default async function NewItemPage() {
  const categories = await getCategories() // Server-side fetch

  return (
    <div>
      <h1>Add New Item</h1>
      <ItemForm categories={categories} /> {/* Pass data to client */}
    </div>
  )
}
```

---

## 3. Data Fetching Patterns

### Pattern 1: Server Component Direct Fetch (Recommended)

```tsx
// app/inventory/page.tsx
import { db } from '@/lib/db'

export default async function InventoryPage({
  searchParams
}: {
  searchParams: { category?: string; search?: string }
}) {
  // Direct database query with filters
  const items = await db.item.findMany({
    where: {
      category: searchParams.category,
      name: searchParams.search
        ? { contains: searchParams.search, mode: 'insensitive' }
        : undefined
    },
    include: {
      tags: true,
      category: true
    }
  })

  return <ItemList items={items} />
}

// Enable static generation with dynamic params
export async function generateStaticParams() {
  const categories = await db.category.findMany()
  return categories.map(cat => ({ category: cat.slug }))
}
```

**Advantages:**
- No API route overhead
- Type-safe queries
- Automatic caching and revalidation
- Works with static generation

### Pattern 2: Parallel Data Fetching

```tsx
// app/dashboard/page.tsx
async function getRecentItems() {
  return db.item.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
}

async function getItemStats() {
  return db.item.groupBy({ by: ['categoryId'], _count: true })
}

async function getLowStockItems() {
  return db.item.findMany({ where: { quantity: { lte: 5 } } })
}

export default async function Dashboard() {
  // Parallel fetching - all run simultaneously
  const [recentItems, stats, lowStock] = await Promise.all([
    getRecentItems(),
    getItemStats(),
    getLowStockItems()
  ])

  return (
    <div>
      <RecentItems items={recentItems} />
      <StatsWidget stats={stats} />
      <LowStockAlert items={lowStock} />
    </div>
  )
}
```

### Pattern 3: Streaming with Suspense

```tsx
// app/inventory/page.tsx
import { Suspense } from 'react'

async function ItemList() {
  // Slow query
  const items = await db.item.findMany({ include: { tags: true } })
  return <div>{/* Render items */}</div>
}

export default function InventoryPage() {
  return (
    <div>
      <h1>Inventory</h1>
      <Suspense fallback={<ItemListSkeleton />}>
        <ItemList />
      </Suspense>
    </div>
  )
}
```

**Perfect for:**
- Large inventory lists
- Image-heavy pages
- Progressive loading

### Pattern 4: Client-Side Mutations

```tsx
'use client'

import { useTransition } from 'react'
import { deleteItem } from '@/app/actions'

export function DeleteButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await deleteItem(itemId)
        })
      }}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}

// app/actions.ts (Server Action)
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function deleteItem(id: string) {
  await db.item.delete({ where: { id } })
  revalidatePath('/inventory')
}
```

---

## 4. Metadata and SEO Optimization

### Static Metadata
```tsx
// app/inventory/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inventory Management',
  description: 'Manage your home, garage, and automobile inventory',
  keywords: ['inventory', 'home organization', 'asset management']
}
```

### Dynamic Metadata
```tsx
// app/inventory/[id]/page.tsx
import { db } from '@/lib/db'
import { Metadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await db.item.findUnique({ where: { id: params.id } })

  return {
    title: `${item.name} - Inventory`,
    description: item.description,
    openGraph: {
      images: [item.imageUrl]
    }
  }
}

export default async function ItemPage({ params }: Props) {
  const item = await db.item.findUnique({ where: { id: params.id } })
  return <ItemDetail item={item} />
}
```

### Structured Data for Search
```tsx
// app/inventory/[id]/page.tsx
export default async function ItemPage({ params }: Props) {
  const item = await db.item.findUnique({ where: { id: params.id } })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description,
    image: item.imageUrl,
    sku: item.id
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ItemDetail item={item} />
    </>
  )
}
```

---

## 5. Performance Optimization Patterns

### Image Optimization
```tsx
import Image from 'next/image'

export function ItemCard({ item }) {
  return (
    <div>
      <Image
        src={item.imageUrl}
        alt={item.name}
        width={400}
        height={300}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        placeholder="blur"
        blurDataURL={item.blurHash}
        className="rounded-lg"
      />
    </div>
  )
}
```

### Route Segment Config
```tsx
// app/inventory/page.tsx
export const dynamic = 'force-dynamic' // Always dynamic
export const revalidate = 3600 // ISR - revalidate every hour
export const fetchCache = 'force-cache' // Aggressive caching

// Or for real-time inventory
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### Loading States
```tsx
// app/inventory/loading.tsx
export default function Loading() {
  return <InventorySkeleton />
}
```

---

## 6. Recommended Project Structure

```
src/
├── app/                          # App Router pages
│   ├── (auth)/                   # Route group (no URL segment)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Shared dashboard layout
│   │   ├── inventory/
│   │   ├── categories/
│   │   └── search/
│   ├── api/
│   │   ├── items/route.ts
│   │   └── upload/route.ts
│   └── actions.ts                # Server Actions
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── inventory/                # Domain-specific components
│   └── forms/
├── lib/
│   ├── db.ts                     # Database client
│   ├── queries.ts                # Reusable queries
│   ├── validations.ts            # Zod schemas
│   └── utils.ts
├── types/
│   └── index.ts
└── hooks/
    └── use-items.ts
```

---

## 7. Key Takeaways for Home Inventory System

1. **Use Server Components by default** - Better performance, direct DB access
2. **Client Components only for interactivity** - Forms, modals, search filters
3. **Leverage parallel data fetching** - Dashboard stats, category counts
4. **Implement proper caching strategy** - ISR for item lists, dynamic for real-time stock
5. **Optimize images aggressively** - Next/Image with proper sizing
6. **Use Server Actions for mutations** - Simpler than API routes
7. **Implement loading/error boundaries** - Better UX during data fetching
8. **Type-safe throughout** - TypeScript + Prisma/Drizzle types

---

## 8. Anti-Patterns to Avoid

❌ **Don't**: Create unnecessary API routes for internal data
```tsx
// BAD: Unnecessary API route
// app/api/items/route.ts
export async function GET() {
  const items = await db.item.findMany()
  return Response.json(items)
}

// app/inventory/page.tsx (Client Component)
'use client'
const response = await fetch('/api/items')
const items = await response.json()
```

✅ **Do**: Fetch directly in Server Components
```tsx
// GOOD: Direct database query
// app/inventory/page.tsx (Server Component)
const items = await db.item.findMany()
```

❌ **Don't**: Use 'use client' at top level unnecessarily
❌ **Don't**: Mix data fetching in Client Components
❌ **Don't**: Over-fetch data (select only needed fields)

---

## 9. Testing Considerations

```tsx
// Unit test Server Component (render as async)
import { render } from '@testing-library/react'
import InventoryPage from '@/app/inventory/page'

jest.mock('@/lib/db')

test('renders inventory items', async () => {
  const { container } = render(await InventoryPage())
  // assertions
})
```

---

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
