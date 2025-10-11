import { ItemListItem } from '@/types/item.types';

export const mockCategory = {
  id: 'cat_123',
  name: 'Electronics',
  description: 'Electronic devices and accessories',
  icon: '📱',
  color: '#3B82F6',
  minQuantity: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockLocation = {
  id: 'loc_123',
  name: 'Living Room',
  description: null,
  parentId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTag = {
  id: 'tag_123',
  name: 'Important',
  color: '#EF4444',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockItem: ItemListItem = {
  id: 'item_123',
  name: 'MacBook Pro',
  description: 'M2 Pro 16-inch laptop',
  quantity: 1,
  minQuantity: null,
  purchaseDate: new Date('2024-01-15'),
  purchasePrice: 2499.99,
  currentValue: 2200.0,
  condition: 'excellent',
  notes: 'Primary work laptop',
  imageUrl: 'https://example.com/macbook.jpg',
  barcode: '123456789',
  serialNumber: 'SN123456',
  warrantyUntil: new Date('2027-01-15'),
  categoryId: 'cat_123',
  locationId: 'loc_123',
  category: mockCategory,
  location: mockLocation,
  tags: [],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

export const mockItems: ItemListItem[] = [
  mockItem,
  {
    ...mockItem,
    id: 'item_124',
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone model',
    quantity: 1,
    purchasePrice: 1199.0,
    currentValue: 1000.0,
    condition: 'good',
  },
  {
    ...mockItem,
    id: 'item_125',
    name: 'AirPods Pro',
    description: 'Wireless earbuds',
    quantity: 2,
    purchasePrice: 249.0,
    currentValue: 200.0,
    condition: 'good',
  },
];

export const mockItemFormData = {
  name: 'Test Item',
  description: 'Test description',
  quantity: 1,
  purchaseDate: new Date('2024-01-01').toISOString(),
  purchasePrice: 100.0,
  currentValue: 90.0,
  condition: 'good' as const,
  notes: 'Test notes',
  imageUrl: 'https://example.com/test.jpg',
  barcode: '123456',
  serialNumber: 'SN123',
  warrantyUntil: new Date('2025-01-01').toISOString(),
  categoryId: 'cat_123',
  locationId: 'loc_123',
  tagIds: ['tag_123'],
};
