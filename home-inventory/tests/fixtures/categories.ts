import { Category } from '@prisma/client';

export const mockCategory: Category = {
  id: 'cat_test123',
  name: 'Electronics',
  description: 'Electronic devices and accessories',
  icon: '💻',
  color: '#3b82f6',
  minQuantity: 5,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockCategories: Category[] = [
  mockCategory,
  {
    id: 'cat_test456',
    name: 'Kitchen',
    description: 'Kitchen items and appliances',
    icon: '🍳',
    color: '#10b981',
    minQuantity: 3,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  },
  {
    id: 'cat_test789',
    name: 'Tools',
    description: 'Hand tools and power tools',
    icon: '🔨',
    color: '#f59e0b',
    minQuantity: 2,
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-03T00:00:00Z'),
  },
];

export const mockCategoryWithCount = {
  ...mockCategory,
  _count: {
    items: 5,
  },
};

export const mockCategoriesWithCount = mockCategories.map((cat, index) => ({
  ...cat,
  _count: {
    items: index + 1,
  },
}));

export const mockCategoryFormData = {
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test description',
  icon: '📦',
  color: '#8b5cf6',
  minQuantity: 10,
};

export const mockCategoryFormDataMinimal = {
  name: 'Minimal Category',
  slug: 'minimal-category',
};
