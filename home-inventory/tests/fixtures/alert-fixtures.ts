/**
 * Test Fixtures for Consumables Alert Feature
 * Provides mock data for testing alert functionality
 */

import { Item, Category } from '@prisma/client';

export const mockCategories = {
  consumable: {
    id: 'cat-consumable-1',
    name: 'Consumables',
    description: 'Items that are consumed over time',
    icon: '🍎',
    color: '#FF6B6B',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  electronics: {
    id: 'cat-electronics-1',
    name: 'Electronics',
    description: 'Electronic devices',
    icon: '💻',
    color: '#4ECDC4',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  tools: {
    id: 'cat-tools-1',
    name: 'Tools',
    description: 'Hand and power tools',
    icon: '🔧',
    color: '#95E1D3',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
} as const;

export const mockLocations = {
  kitchen: {
    id: 'loc-kitchen-1',
    name: 'Kitchen',
    description: 'Main kitchen',
    parentId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  garage: {
    id: 'loc-garage-1',
    name: 'Garage',
    description: 'Storage garage',
    parentId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
} as const;

export interface ItemWithAlert extends Omit<Item, 'minQuantity'> {
  minQuantity?: number | null;
  category: typeof mockCategories.consumable;
}

export const mockItemsWithMinQuantity = {
  // Critical alert: quantity below minQuantity
  coffeeBeans: {
    id: 'item-coffee-1',
    name: 'Coffee Beans',
    description: 'Premium Arabica coffee beans',
    quantity: 2,
    minQuantity: 5,
    purchaseDate: new Date('2025-01-01'),
    purchasePrice: 15.99,
    currentValue: 15.99,
    condition: 'good',
    notes: 'Buy from local roaster',
    imageUrl: null,
    barcode: '1234567890',
    serialNumber: null,
    warrantyUntil: null,
    categoryId: mockCategories.consumable.id,
    locationId: mockLocations.kitchen.id,
    category: mockCategories.consumable,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-10'),
  },

  // Warning alert: quantity equals minQuantity
  trashBags: {
    id: 'item-trash-1',
    name: 'Trash Bags',
    description: '13 gallon kitchen bags',
    quantity: 10,
    minQuantity: 10,
    purchaseDate: new Date('2025-01-05'),
    purchasePrice: 12.99,
    currentValue: 12.99,
    condition: 'good',
    notes: null,
    imageUrl: null,
    barcode: null,
    serialNumber: null,
    warrantyUntil: null,
    categoryId: mockCategories.consumable.id,
    locationId: mockLocations.kitchen.id,
    category: mockCategories.consumable,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-10'),
  },

  // OK: quantity above minQuantity
  paperTowels: {
    id: 'item-paper-1',
    name: 'Paper Towels',
    description: 'Premium absorbent paper towels',
    quantity: 20,
    minQuantity: 8,
    purchaseDate: new Date('2025-01-01'),
    purchasePrice: 24.99,
    currentValue: 24.99,
    condition: 'good',
    notes: 'Bulk purchase',
    imageUrl: null,
    barcode: null,
    serialNumber: null,
    warrantyUntil: null,
    categoryId: mockCategories.consumable.id,
    locationId: mockLocations.kitchen.id,
    category: mockCategories.consumable,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-10'),
  },

  // Edge case: zero quantity with minQuantity
  dishSoap: {
    id: 'item-soap-1',
    name: 'Dish Soap',
    description: 'Eco-friendly dish soap',
    quantity: 0,
    minQuantity: 3,
    purchaseDate: new Date('2024-12-15'),
    purchasePrice: 4.99,
    currentValue: 4.99,
    condition: 'good',
    notes: 'Urgent restock',
    imageUrl: null,
    barcode: null,
    serialNumber: null,
    warrantyUntil: null,
    categoryId: mockCategories.consumable.id,
    locationId: mockLocations.kitchen.id,
    category: mockCategories.consumable,
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2025-01-10'),
  },

  // No minQuantity set (should use category default)
  sponges: {
    id: 'item-sponge-1',
    name: 'Kitchen Sponges',
    description: 'Multi-pack scrub sponges',
    quantity: 3,
    minQuantity: null,
    purchaseDate: new Date('2025-01-08'),
    purchasePrice: 6.99,
    currentValue: 6.99,
    condition: 'good',
    notes: null,
    imageUrl: null,
    barcode: null,
    serialNumber: null,
    warrantyUntil: null,
    categoryId: mockCategories.consumable.id,
    locationId: mockLocations.kitchen.id,
    category: mockCategories.consumable,
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-10'),
  },

  // Non-consumable item (should not trigger alerts)
  laptop: {
    id: 'item-laptop-1',
    name: 'MacBook Pro',
    description: '16-inch laptop',
    quantity: 1,
    minQuantity: null,
    purchaseDate: new Date('2024-06-01'),
    purchasePrice: 2499.99,
    currentValue: 2000.00,
    condition: 'excellent',
    notes: 'Work laptop',
    imageUrl: null,
    barcode: null,
    serialNumber: 'MB123456',
    warrantyUntil: new Date('2027-06-01'),
    categoryId: mockCategories.electronics.id,
    locationId: mockLocations.garage.id,
    category: mockCategories.electronics,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2025-01-10'),
  },
} as const;

export const mockAlertThresholds = {
  critical: 0.5, // Alert when quantity <= 50% of minQuantity
  warning: 1.0,  // Alert when quantity <= 100% of minQuantity
  ok: Infinity,  // No alert
} as const;

export const mockCategoryDefaults = {
  consumableMinQuantity: 5,
  nonConsumableMinQuantity: 1,
} as const;

export type AlertLevel = 'critical' | 'warning' | 'ok' | 'none';

export interface AlertItem extends ItemWithAlert {
  alertLevel: AlertLevel;
  stockPercentage: number;
}

export const expectedAlerts: AlertItem[] = [
  {
    ...mockItemsWithMinQuantity.dishSoap,
    alertLevel: 'critical',
    stockPercentage: 0,
  },
  {
    ...mockItemsWithMinQuantity.coffeeBeans,
    alertLevel: 'critical',
    stockPercentage: 40,
  },
  {
    ...mockItemsWithMinQuantity.trashBags,
    alertLevel: 'warning',
    stockPercentage: 100,
  },
];

export const createMockItem = (overrides: Partial<ItemWithAlert> = {}): ItemWithAlert => ({
  id: `item-${Date.now()}`,
  name: 'Test Item',
  description: 'Test description',
  quantity: 10,
  minQuantity: 5,
  purchaseDate: new Date(),
  purchasePrice: 10.0,
  currentValue: 10.0,
  condition: 'good',
  notes: null,
  imageUrl: null,
  barcode: null,
  serialNumber: null,
  warrantyUntil: null,
  categoryId: mockCategories.consumable.id,
  locationId: mockLocations.kitchen.id,
  category: mockCategories.consumable,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const testScenarios = {
  criticalAlert: {
    description: 'Item with quantity at 0',
    item: createMockItem({ quantity: 0, minQuantity: 5 }),
    expectedLevel: 'critical' as AlertLevel,
  },
  warningAlert: {
    description: 'Item with quantity equal to minQuantity',
    item: createMockItem({ quantity: 5, minQuantity: 5 }),
    expectedLevel: 'warning' as AlertLevel,
  },
  okStock: {
    description: 'Item with quantity above minQuantity',
    item: createMockItem({ quantity: 10, minQuantity: 5 }),
    expectedLevel: 'ok' as AlertLevel,
  },
  noMinQuantity: {
    description: 'Item with no minQuantity set',
    item: createMockItem({ minQuantity: null }),
    expectedLevel: 'none' as AlertLevel,
  },
  negativeQuantity: {
    description: 'Edge case: negative quantity',
    item: createMockItem({ quantity: -1, minQuantity: 5 }),
    expectedLevel: 'critical' as AlertLevel,
  },
  zeroMinQuantity: {
    description: 'Edge case: zero minQuantity',
    item: createMockItem({ quantity: 5, minQuantity: 0 }),
    expectedLevel: 'ok' as AlertLevel,
  },
};
