import { vi } from 'vitest';
import { mockItem, mockItems } from '../fixtures/items';

export const mockPrisma = {
  item: {
    findMany: vi.fn().mockResolvedValue(mockItems),
    findUnique: vi.fn().mockResolvedValue(mockItem),
    create: vi.fn().mockResolvedValue(mockItem),
    update: vi.fn().mockResolvedValue(mockItem),
    delete: vi.fn().mockResolvedValue(mockItem),
    count: vi.fn().mockResolvedValue(mockItems.length),
  },
  category: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
  },
  location: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
  },
  tag: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

// Mock the Prisma client module
vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

export const resetMocks = () => {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockClear' in method) {
          method.mockClear();
        }
      });
    }
  });
};
