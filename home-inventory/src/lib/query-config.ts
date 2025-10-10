import { QueryClient } from '@tanstack/react-query';

export const queryConfig = {
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: Data stays in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,

      // Refetch on reconnect to sync data
      refetchOnReconnect: true,

      // Structural sharing for better performance
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
};

export function createQueryClient() {
  return new QueryClient(queryConfig);
}

// Query keys for consistent cache management
export const queryKeys = {
  items: {
    all: ['items'] as const,
    lists: () => [...queryKeys.items.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.items.lists(), { filters }] as const,
    details: () => [...queryKeys.items.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.items.details(), id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.categories.lists(), { filters }] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },
  locations: {
    all: ['locations'] as const,
    lists: () => [...queryKeys.locations.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.locations.lists(), { filters }] as const,
    details: () => [...queryKeys.locations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.locations.details(), id] as const,
  },
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tags.lists(), { filters }] as const,
  },
  search: {
    all: ['search'] as const,
    query: (q: string, filters: Record<string, unknown>) => [...queryKeys.search.all, q, filters] as const,
  },
} as const;
