/**
 * Test Utilities and Setup
 * Common test helpers and configuration for the test suite
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a new QueryClient for each test to ensure isolation
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

// Custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });

export const mockApiError = (message: string, status = 500, delay = 0) =>
  new Promise((_, reject) => {
    setTimeout(() => {
      reject({
        response: {
          data: { error: message },
          status,
        },
      });
    }, delay);
  });

// Database test helpers
export const createTestDatabase = async () => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'file:./test.db',
      },
    },
  });

  // Clean database before tests
  await prisma.$executeRaw`DELETE FROM ItemTag`;
  await prisma.$executeRaw`DELETE FROM Item`;
  await prisma.$executeRaw`DELETE FROM Category`;
  await prisma.$executeRaw`DELETE FROM Location`;
  await prisma.$executeRaw`DELETE FROM Tag`;

  return prisma;
};

export const cleanupTestDatabase = async (prisma: any) => {
  await prisma.$executeRaw`DELETE FROM ItemTag`;
  await prisma.$executeRaw`DELETE FROM Item`;
  await prisma.$executeRaw`DELETE FROM Category`;
  await prisma.$executeRaw`DELETE FROM Location`;
  await prisma.$executeRaw`DELETE FROM Tag`;
  await prisma.$disconnect();
};

// Test data builders
export const buildCategory = (overrides = {}) => ({
  name: `Category ${Date.now()}`,
  description: 'Test category',
  icon: '📦',
  color: '#FF6B6B',
  ...overrides,
});

export const buildLocation = (overrides = {}) => ({
  name: `Location ${Date.now()}`,
  description: 'Test location',
  parentId: null,
  ...overrides,
});

export const buildItem = (categoryId: string, locationId: string, overrides = {}) => ({
  name: `Item ${Date.now()}`,
  description: 'Test item',
  quantity: 10,
  categoryId,
  locationId,
  ...overrides,
});

// Wait utilities
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition timeout');
    }
    await waitFor(interval);
  }
};

// Assertion helpers
export const expectAlertLevel = (item: any, expectedLevel: string) => {
  const { quantity, minQuantity } = item;

  if (!minQuantity || minQuantity === 0) {
    expect(expectedLevel).toBe('none');
    return;
  }

  const percentage = (quantity / minQuantity) * 100;

  if (quantity === 0 || percentage <= 50) {
    expect(expectedLevel).toBe('critical');
  } else if (percentage <= 100) {
    expect(expectedLevel).toBe('warning');
  } else {
    expect(expectedLevel).toBe('ok');
  }
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
