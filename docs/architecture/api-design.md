# API Design - Server Actions & Routes

## Overview

This document defines the complete API architecture for the home inventory management system using Next.js 14 Server Actions as the primary mutation mechanism, with API routes reserved for special cases (image uploads, complex queries, exports).

---

## API Architecture Philosophy

### Server Actions First (Preferred)

**Why Server Actions?**
- Type-safe by default (no API contract definition needed)
- Direct function calls (better performance)
- Automatic revalidation support
- Progressive enhancement
- Simpler error handling
- No CORS concerns

**Use Server Actions for:**
- CRUD operations (create, update, delete)
- Form submissions
- Data mutations
- Simple queries

### API Routes (Special Cases Only)

**Use API Routes for:**
- File uploads (Cloudinary integration)
- Webhooks (external service callbacks)
- Complex search endpoints
- Data exports (CSV, PDF)
- Third-party integrations

---

## Server Actions

Server Actions are defined in `app/actions/` directory and use the `'use server'` directive.

### 1. Item Actions (`app/actions/items.ts`)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { items, itemTags } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { NewItem } from '@/lib/db/schema'

// Validation schema
const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  locationId: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageUrls: z.array(z.string().url()).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.number().positive().optional(),
  purchaseLocation: z.string().max(200).optional(),
  estimatedValue: z.number().positive().optional(),
  quantity: z.number().int().min(1).max(10000).default(1),
  serialNumber: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(),
  warrantyExpiry: z.coerce.date().optional(),
  lastMaintenance: z.coerce.date().optional(),
  notes: z.string().max(2000).optional()
})

// Result type for consistent error handling
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: any }

/**
 * Create a new item
 */
export async function createItem(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // Parse and validate form data
    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      categoryId: formData.get('categoryId'),
      locationId: formData.get('locationId'),
      imageUrl: formData.get('imageUrl'),
      purchasePrice: formData.get('purchasePrice'),
      estimatedValue: formData.get('estimatedValue'),
      quantity: formData.get('quantity'),
      notes: formData.get('notes')
    }

    const validated = itemSchema.parse(rawData)

    // Convert prices to cents for storage
    const itemData: NewItem = {
      ...validated,
      purchasePrice: validated.purchasePrice
        ? Math.round(validated.purchasePrice * 100)
        : null,
      estimatedValue: validated.estimatedValue
        ? Math.round(validated.estimatedValue * 100)
        : null
    }

    // Insert into database
    const [newItem] = await db.insert(items).values(itemData).returning()

    // Revalidate relevant pages
    revalidatePath('/items')
    revalidatePath('/categories/' + validated.categoryId)

    return { success: true, data: { id: newItem.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      }
    }

    console.error('Create item error:', error)
    return {
      success: false,
      error: 'Failed to create item'
    }
  }
}

/**
 * Update an existing item
 */
export async function updateItem(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // Parse form data
    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      categoryId: formData.get('categoryId'),
      locationId: formData.get('locationId'),
      imageUrl: formData.get('imageUrl'),
      purchasePrice: formData.get('purchasePrice'),
      estimatedValue: formData.get('estimatedValue'),
      quantity: formData.get('quantity'),
      notes: formData.get('notes')
    }

    // Validate with partial schema (allow updating subset of fields)
    const validated = itemSchema.partial().parse(rawData)

    // Convert prices to cents
    const updateData: Partial<NewItem> = {
      ...validated,
      purchasePrice: validated.purchasePrice
        ? Math.round(validated.purchasePrice * 100)
        : undefined,
      estimatedValue: validated.estimatedValue
        ? Math.round(validated.estimatedValue * 100)
        : undefined,
      updatedAt: new Date()
    }

    // Update in database
    const [updatedItem] = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, id))
      .returning()

    if (!updatedItem) {
      return { success: false, error: 'Item not found' }
    }

    // Revalidate pages
    revalidatePath('/items')
    revalidatePath('/items/' + id)
    if (validated.categoryId) {
      revalidatePath('/categories/' + validated.categoryId)
    }

    return { success: true, data: { id: updatedItem.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      }
    }

    console.error('Update item error:', error)
    return {
      success: false,
      error: 'Failed to update item'
    }
  }
}

/**
 * Delete an item
 */
export async function deleteItem(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    // Delete item (cascade will delete item_tags)
    await db.delete(items).where(eq(items.id, id))

    // Revalidate pages
    revalidatePath('/items')

    return { success: true, data: { id } }
  } catch (error) {
    console.error('Delete item error:', error)
    return {
      success: false,
      error: 'Failed to delete item'
    }
  }
}

/**
 * Add tag to item
 */
export async function addTagToItem(
  itemId: string,
  tagId: string
): Promise<ActionResult<void>> {
  try {
    await db.insert(itemTags).values({ itemId, tagId })
    revalidatePath('/items/' + itemId)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Add tag error:', error)
    return { success: false, error: 'Failed to add tag' }
  }
}

/**
 * Remove tag from item
 */
export async function removeTagFromItem(
  itemId: string,
  tagId: string
): Promise<ActionResult<void>> {
  try {
    await db
      .delete(itemTags)
      .where(
        and(
          eq(itemTags.itemId, itemId),
          eq(itemTags.tagId, tagId)
        )
      )
    revalidatePath('/items/' + itemId)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Remove tag error:', error)
    return { success: false, error: 'Failed to remove tag' }
  }
}
```

### 2. Category Actions (`app/actions/categories.ts`)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { NewCategory } from '@/lib/db/schema'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  type: z.enum(['home', 'garage', 'automobile']),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  parentId: z.string().optional()
})

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: any }

/**
 * Create a new category
 */
export async function createCategory(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      type: formData.get('type'),
      description: formData.get('description'),
      icon: formData.get('icon'),
      parentId: formData.get('parentId')
    }

    const validated = categorySchema.parse(rawData)

    const [newCategory] = await db
      .insert(categories)
      .values(validated)
      .returning()

    revalidatePath('/categories')

    return { success: true, data: { id: newCategory.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      }
    }

    console.error('Create category error:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      type: formData.get('type'),
      description: formData.get('description'),
      icon: formData.get('icon'),
      parentId: formData.get('parentId')
    }

    const validated = categorySchema.partial().parse(rawData)

    const [updatedCategory] = await db
      .update(categories)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning()

    if (!updatedCategory) {
      return { success: false, error: 'Category not found' }
    }

    revalidatePath('/categories')
    revalidatePath('/categories/' + id)

    return { success: true, data: { id: updatedCategory.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      }
    }

    console.error('Update category error:', error)
    return { success: false, error: 'Failed to update category' }
  }
}

/**
 * Delete category
 */
export async function deleteCategory(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    // Check if category has items (prevent deletion)
    const itemCount = await db.query.items.findMany({
      where: eq(items.categoryId, id),
      limit: 1
    })

    if (itemCount.length > 0) {
      return {
        success: false,
        error: 'Cannot delete category with items'
      }
    }

    await db.delete(categories).where(eq(categories.id, id))

    revalidatePath('/categories')

    return { success: true, data: { id } }
  } catch (error) {
    console.error('Delete category error:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}
```

### 3. Location Actions (`app/actions/locations.ts`)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { locations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const locationSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional()
})

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: any }

/**
 * Create location
 */
export async function createLocation(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const rawData = {
      categoryId: formData.get('categoryId'),
      name: formData.get('name'),
      description: formData.get('description')
    }

    const validated = locationSchema.parse(rawData)

    const [newLocation] = await db
      .insert(locations)
      .values(validated)
      .returning()

    revalidatePath('/locations')
    revalidatePath('/categories/' + validated.categoryId)

    return { success: true, data: { id: newLocation.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      }
    }

    console.error('Create location error:', error)
    return { success: false, error: 'Failed to create location' }
  }
}

// Similar updateLocation and deleteLocation functions...
```

### 4. Tag Actions (`app/actions/tags.ts`)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { tags } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#6B7280')
})

// Create, update, delete tag functions similar to above...
```

---

## API Routes

API routes are defined in `app/api/` directory.

### 1. Image Upload Route (`app/api/upload/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
})

/**
 * POST /api/upload
 * Upload image to Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'inventory-items',
          transformation: [
            { width: 1200, height: 900, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload
 * Delete image from Cloudinary
 */
export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID required' },
        { status: 400 }
      )
    }

    await cloudinary.uploader.destroy(publicId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}
```

### 2. Search Route (`app/api/items/search/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { items, categories, locations } from '@/lib/db/schema'
import { sql, like, and, or, eq } from 'drizzle-orm'

/**
 * GET /api/items/search
 * Complex search with multiple filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const categoryId = searchParams.get('category')
    const locationId = searchParams.get('location')
    const minValue = searchParams.get('minValue')
    const maxValue = searchParams.get('maxValue')
    const tags = searchParams.get('tags')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build dynamic where clause
    const conditions = []

    if (query) {
      conditions.push(
        or(
          like(items.name, `%${query}%`),
          like(items.description, `%${query}%`),
          like(items.serialNumber, `%${query}%`),
          like(items.modelNumber, `%${query}%`)
        )
      )
    }

    if (categoryId) {
      conditions.push(eq(items.categoryId, categoryId))
    }

    if (locationId) {
      conditions.push(eq(items.locationId, locationId))
    }

    if (minValue) {
      const cents = Math.round(parseFloat(minValue) * 100)
      conditions.push(sql`${items.estimatedValue} >= ${cents}`)
    }

    if (maxValue) {
      const cents = Math.round(parseFloat(maxValue) * 100)
      conditions.push(sql`${items.estimatedValue} <= ${cents}`)
    }

    // Execute query
    const results = await db
      .select({
        item: items,
        category: categories,
        location: locations
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .leftJoin(locations, eq(items.locationId, locations.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    return NextResponse.json({
      results,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
```

### 3. Export Route (`app/api/items/export/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAllItems } from '@/lib/db/queries'

/**
 * GET /api/items/export?format=csv|json
 * Export items to CSV or JSON
 */
export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'json'
    const items = await getAllItems()

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Name',
        'Description',
        'Category',
        'Location',
        'Quantity',
        'Purchase Price',
        'Estimated Value',
        'Serial Number',
        'Model Number'
      ]

      const rows = items.map(item => [
        item.name,
        item.description || '',
        item.category.name,
        item.location?.name || '',
        item.quantity,
        item.purchasePrice ? (item.purchasePrice / 100).toFixed(2) : '',
        item.estimatedValue ? (item.estimatedValue / 100).toFixed(2) : '',
        item.serialNumber || '',
        item.modelNumber || ''
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inventory-${Date.now()}.csv"`
        }
      })
    } else {
      // Return JSON
      return NextResponse.json(items, {
        headers: {
          'Content-Disposition': `attachment; filename="inventory-${Date.now()}.json"`
        }
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}
```

### 4. Statistics Route (`app/api/stats/route.ts`)

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { items, categories } from '@/lib/db/schema'
import { sql, eq } from 'drizzle-orm'

/**
 * GET /api/stats
 * Dashboard statistics
 */
export async function GET() {
  try {
    // Total items
    const [{ totalItems }] = await db
      .select({ totalItems: sql<number>`count(*)` })
      .from(items)

    // Total value
    const [{ totalValue }] = await db
      .select({ totalValue: sql<number>`sum(${items.estimatedValue})` })
      .from(items)

    // Items by category
    const itemsByCategory = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        count: sql<number>`count(${items.id})`,
        totalValue: sql<number>`sum(${items.estimatedValue})`
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .groupBy(categories.id, categories.name)

    // Low stock items
    const [{ lowStockCount }] = await db
      .select({ lowStockCount: sql<number>`count(*)` })
      .from(items)
      .where(sql`${items.quantity} <= 5`)

    // Recent items
    const recentItems = await db.query.items.findMany({
      limit: 5,
      orderBy: (items, { desc }) => [desc(items.createdAt)],
      with: { category: true }
    })

    return NextResponse.json({
      overview: {
        totalItems,
        totalValue: totalValue || 0,
        lowStockCount
      },
      itemsByCategory,
      recentItems
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
```

---

## Client-Side Integration

### Using Server Actions in Forms

```tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createItem } from '@/app/actions/items'
import { ItemForm } from '@/components/items/item-form'
import { toast } from '@/components/ui/use-toast'

export function CreateItemPage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createItem(formData)

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Item created successfully'
        })
        router.push('/items/' + result.data.id)
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }

  return <ItemForm onSubmit={handleSubmit} disabled={isPending} />
}
```

### Using API Routes with TanStack Query

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

export function useSearchItems(query: string) {
  return useQuery({
    queryKey: ['items', 'search', query],
    queryFn: async () => {
      const response = await fetch(
        `/api/items/search?q=${encodeURIComponent(query)}`
      )
      if (!response.ok) throw new Error('Search failed')
      return response.json()
    },
    enabled: query.length > 0
  })
}
```

---

## Query Key Factory (config/query-keys.ts)

```typescript
/**
 * Centralized query key factory for TanStack Query
 */
export const queryKeys = {
  items: {
    all: ['items'] as const,
    lists: () => [...queryKeys.items.all, 'list'] as const,
    list: (filters?: ItemFilters) =>
      [...queryKeys.items.lists(), filters] as const,
    details: () => [...queryKeys.items.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.items.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.items.all, 'search', query] as const
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.categories.details(), id] as const
  },
  locations: {
    all: ['locations'] as const,
    lists: () => [...queryKeys.locations.all, 'list'] as const,
    list: (categoryId?: string) =>
      [...queryKeys.locations.lists(), categoryId] as const
  },
  tags: {
    all: ['tags'] as const,
    list: () => [...queryKeys.tags.all, 'list'] as const
  },
  stats: {
    dashboard: ['stats', 'dashboard'] as const
  }
}
```

---

## Type Definitions (types/api.ts)

```typescript
/**
 * Server Action result type
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: any }

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  results: T[]
  pagination: PaginationMeta
}

/**
 * Search filters
 */
export interface ItemFilters {
  query?: string
  categoryId?: string
  locationId?: string
  tags?: string[]
  minValue?: number
  maxValue?: number
  lowStock?: boolean
}
```

---

## Error Handling Strategy

### Server Action Errors
- Use discriminated union `ActionResult<T>` type
- Return validation errors with details
- Log errors server-side
- Return user-friendly messages

### API Route Errors
- Use standard HTTP status codes
- Return JSON error responses
- Include error codes for client handling
- Log stack traces server-side

---

## Testing Strategy

### Server Actions Testing
```typescript
import { describe, it, expect } from 'vitest'
import { createItem } from '@/app/actions/items'

describe('createItem', () => {
  it('creates item with valid data', async () => {
    const formData = new FormData()
    formData.append('name', 'Test Item')
    formData.append('categoryId', 'cat1')

    const result = await createItem(formData)

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('id')
  })

  it('returns error for invalid data', async () => {
    const formData = new FormData()
    // Missing required fields

    const result = await createItem(formData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Validation failed')
  })
})
```

### API Routes Testing
```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/upload/route'

describe('POST /api/upload', () => {
  it('uploads image successfully', async () => {
    const formData = new FormData()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveProperty('url')
  })
})
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
**Author:** Architect Agent (Claude Flow Swarm)
**Status:** Complete
