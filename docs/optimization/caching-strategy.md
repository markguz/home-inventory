# Caching Strategy & Implementation

**Project:** Home Inventory System
**Date:** 2025-10-10
**Agent:** Optimizer (hive-optimizer)

## Overview

This document outlines the comprehensive caching strategy for the Home Inventory System, leveraging Next.js 15, React Query, and API route caching.

## Caching Layers

### 1. Browser Caching (Static Assets)
### 2. React Query (Client-Side Data)
### 3. Next.js ISR (Incremental Static Regeneration)
### 4. API Route Caching
### 5. Database Query Caching

---

## 1. Browser Caching

### Static Assets Configuration
```typescript
// next.config.ts (already implemented)
async headers() {
  return [
    {
      source: '/fonts/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/images/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

### Image Caching
```typescript
// Images are automatically cached by Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  // Cached for 1 year (set in next.config.ts)
/>
```

---

## 2. React Query (Client-Side Caching)

### Setup Provider
```typescript
// app/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,

            // Unused data is garbage collected after 10 minutes
            gcTime: 10 * 60 * 1000, // previously cacheTime

            // Retry failed requests
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on every mount/focus by default
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### Query Key Factory Pattern
```typescript
// lib/queryKeys.ts
export const queryKeys = {
  // Items
  items: {
    all: ['items'] as const,
    lists: () => [...queryKeys.items.all, 'list'] as const,
    list: (filters: { category?: string; location?: string; search?: string }) =>
      [...queryKeys.items.lists(), filters] as const,
    details: () => [...queryKeys.items.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.items.details(), id] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },

  // User
  user: {
    current: ['user', 'current'] as const,
    preferences: ['user', 'preferences'] as const,
  },
} as const;
```

### Custom Hooks with Caching
```typescript
// hooks/useInventoryItems.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

interface ItemFilters {
  category?: string;
  location?: string;
  search?: string;
}

export function useInventoryItems(filters: ItemFilters = {}) {
  return useQuery({
    queryKey: queryKeys.items.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.location) params.set('location', filters.location);
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },
    // Override defaults for specific queries
    staleTime: 2 * 60 * 1000, // 2 minutes for list data
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/items/${id}`);
      if (!response.ok) throw new Error('Failed to fetch item');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for detail data
    enabled: !!id, // Only run if id is provided
  });
}
```

### Mutation with Cache Updates
```typescript
// hooks/useCreateItem.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: CreateItemInput) => {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch all item lists
      queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });
    },
    onError: (error) => {
      console.error('Failed to create item:', error);
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateItemInput }) => {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update item');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the specific item in cache
      queryClient.setQueryData(queryKeys.items.detail(variables.id), data);

      // Invalidate item lists to show updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });
    },
  });
}
```

### Prefetching Strategy
```typescript
// components/InventoryList.tsx
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export function InventoryList() {
  const queryClient = useQueryClient();
  const { data: items } = useInventoryItems();

  const handleMouseEnter = (itemId: string) => {
    // Prefetch item details on hover
    queryClient.prefetchQuery({
      queryKey: queryKeys.items.detail(itemId),
      queryFn: () => fetch(`/api/items/${itemId}`).then(res => res.json()),
      staleTime: 10 * 60 * 1000,
    });
  };

  return (
    <div>
      {items?.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onMouseEnter={() => handleMouseEnter(item.id)}
        />
      ))}
    </div>
  );
}
```

---

## 3. Next.js ISR (Incremental Static Regeneration)

### Static Category Pages
```typescript
// app/categories/[slug]/page.tsx
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      items: {
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return <CategoryView category={category} />;
}
```

### On-Demand Revalidation
```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { path, secret } = await request.json();

  // Validate secret token
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 });
  }
}
```

---

## 4. API Route Caching

### Static API Routes
```typescript
// app/api/categories/route.ts
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  return Response.json(categories, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
```

### Dynamic API Routes with Cache Headers
```typescript
// app/api/items/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const items = await prisma.item.findMany({
    where: {
      ...(category && { category }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  // Cache for 5 minutes, stale-while-revalidate for 10 minutes
  return Response.json(items, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

---

## 5. Database Query Caching (Prisma)

### Query Result Caching Middleware
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
```

### In-Memory Cache for Frequent Queries
```typescript
// lib/cache.ts
import { LRUCache } from 'lru-cache';

// Create an LRU cache for frequently accessed data
const queryCache = new LRUCache<string, any>({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
});

export async function getCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const cached = queryCache.get(key);
  if (cached) return cached;

  const result = await queryFn();
  queryCache.set(key, result);
  return result;
}
```

---

## Cache Invalidation Strategy

### When to Invalidate

1. **On Create**: Invalidate list queries
2. **On Update**: Invalidate both detail and list queries
3. **On Delete**: Invalidate all related queries
4. **On Bulk Operations**: Invalidate entire query families

### Invalidation Examples
```typescript
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) });

// Invalidate all item lists
queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });

// Invalidate everything related to items
queryClient.invalidateQueries({ queryKey: queryKeys.items.all });

// Remove specific query from cache
queryClient.removeQueries({ queryKey: queryKeys.items.detail(id) });
```

---

## Performance Monitoring

### Cache Hit Rate Tracking
```typescript
// lib/cacheMetrics.ts
let cacheHits = 0;
let cacheMisses = 0;

export function trackCacheHit() {
  cacheHits++;
}

export function trackCacheMiss() {
  cacheMisses++;
}

export function getCacheHitRate() {
  const total = cacheHits + cacheMisses;
  return total === 0 ? 0 : (cacheHits / total) * 100;
}

export function resetCacheMetrics() {
  cacheHits = 0;
  cacheMisses = 0;
}
```

---

## Best Practices

### DO
- ✅ Use React Query for all API calls
- ✅ Set appropriate staleTime based on data volatility
- ✅ Invalidate cache after mutations
- ✅ Use query key factories for consistency
- ✅ Implement prefetching for predictable navigation

### DON'T
- ❌ Over-cache highly dynamic data
- ❌ Cache authenticated user data without proper invalidation
- ❌ Set very long staleTime for frequently changing data
- ❌ Forget to clean up old cache entries
- ❌ Cache sensitive data in browser

---

## Testing Cache Strategy

### Unit Tests
```typescript
// __tests__/caching.test.ts
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

describe('Caching Strategy', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should cache query results', async () => {
    const key = queryKeys.items.list({});
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve([]),
    });

    const cached = queryClient.getQueryData(key);
    expect(cached).toBeDefined();
  });

  it('should invalidate queries after mutation', () => {
    queryClient.setQueryData(queryKeys.items.list({}), []);
    queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });

    const state = queryClient.getQueryState(queryKeys.items.list({}));
    expect(state?.isInvalidated).toBe(true);
  });
});
```

---

## Conclusion

This caching strategy provides:
- **Fast initial loads** with static generation
- **Reduced server load** with client-side caching
- **Better UX** with optimistic updates
- **Lower costs** with fewer API calls

Implement progressively and monitor cache hit rates to optimize further.

---
**Status:** ✅ Ready for Implementation
**Priority:** High
**Dependencies:** React Query setup, API routes
