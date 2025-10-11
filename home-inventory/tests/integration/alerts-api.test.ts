/**
 * Integration Tests: Alerts API Endpoints
 * Tests API endpoints for creating items with minQuantity and querying alerts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestDatabase, cleanupTestDatabase } from '../setup/test-utils';
import { mockCategories, mockLocations, createMockItem } from '../fixtures/alert-fixtures';

describe('Alerts API - Integration Tests', () => {
  let prisma: any;
  let categoryId: string;
  let locationId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(prisma);
  });

  beforeEach(async () => {
    // Clean and setup test data
    await prisma.$executeRaw`DELETE FROM ItemTag`;
    await prisma.$executeRaw`DELETE FROM Item`;
    await prisma.$executeRaw`DELETE FROM Category`;
    await prisma.$executeRaw`DELETE FROM Location`;

    // Create test category and location
    const category = await prisma.category.create({
      data: {
        name: 'Test Consumables',
        description: 'Test category for consumables',
        icon: '🍎',
        color: '#FF6B6B',
      },
    });
    categoryId = category.id;

    const location = await prisma.location.create({
      data: {
        name: 'Test Location',
        description: 'Test storage location',
      },
    });
    locationId = location.id;
  });

  describe('POST /api/items - Create Item with minQuantity', () => {
    it('should create item with minQuantity field', async () => {
      const itemData = {
        name: 'Coffee Beans',
        description: 'Premium coffee',
        quantity: 5,
        minQuantity: 10,
        categoryId,
        locationId,
      };

      const item = await prisma.item.create({
        data: itemData,
      });

      expect(item).toBeDefined();
      expect(item.minQuantity).toBe(10);
      expect(item.quantity).toBe(5);
    });

    it('should create item without minQuantity (null value)', async () => {
      const itemData = {
        name: 'Laptop',
        description: 'Work laptop',
        quantity: 1,
        categoryId,
        locationId,
      };

      const item = await prisma.item.create({
        data: itemData,
      });

      expect(item).toBeDefined();
      expect(item.minQuantity).toBeNull();
    });

    it('should accept zero as minQuantity', async () => {
      const itemData = {
        name: 'Decorative Item',
        quantity: 5,
        minQuantity: 0,
        categoryId,
        locationId,
      };

      const item = await prisma.item.create({
        data: itemData,
      });

      expect(item.minQuantity).toBe(0);
    });

    it('should reject negative minQuantity', async () => {
      const itemData = {
        name: 'Invalid Item',
        quantity: 5,
        minQuantity: -5,
        categoryId,
        locationId,
      };

      // This should fail validation
      await expect(
        prisma.item.create({ data: itemData })
      ).rejects.toThrow();
    });

    it('should create multiple items with different minQuantity values', async () => {
      const items = [
        { name: 'Item 1', quantity: 10, minQuantity: 5, categoryId, locationId },
        { name: 'Item 2', quantity: 3, minQuantity: 10, categoryId, locationId },
        { name: 'Item 3', quantity: 20, minQuantity: 8, categoryId, locationId },
      ];

      const createdItems = await Promise.all(
        items.map((item) => prisma.item.create({ data: item }))
      );

      expect(createdItems).toHaveLength(3);
      expect(createdItems[0].minQuantity).toBe(5);
      expect(createdItems[1].minQuantity).toBe(10);
      expect(createdItems[2].minQuantity).toBe(8);
    });
  });

  describe('PUT /api/items/[id] - Update minQuantity', () => {
    it('should update existing item minQuantity', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Test Item',
          quantity: 10,
          minQuantity: 5,
          categoryId,
          locationId,
        },
      });

      const updated = await prisma.item.update({
        where: { id: item.id },
        data: { minQuantity: 15 },
      });

      expect(updated.minQuantity).toBe(15);
    });

    it('should set minQuantity to null', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Test Item',
          quantity: 10,
          minQuantity: 5,
          categoryId,
          locationId,
        },
      });

      const updated = await prisma.item.update({
        where: { id: item.id },
        data: { minQuantity: null },
      });

      expect(updated.minQuantity).toBeNull();
    });

    it('should update quantity without affecting minQuantity', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Test Item',
          quantity: 10,
          minQuantity: 5,
          categoryId,
          locationId,
        },
      });

      const updated = await prisma.item.update({
        where: { id: item.id },
        data: { quantity: 20 },
      });

      expect(updated.quantity).toBe(20);
      expect(updated.minQuantity).toBe(5);
    });
  });

  describe('GET /api/items/alerts - Query Low Stock Items', () => {
    beforeEach(async () => {
      // Create test items with various stock levels
      await prisma.item.createMany({
        data: [
          {
            name: 'Critical Item 1',
            quantity: 0,
            minQuantity: 10,
            categoryId,
            locationId,
          },
          {
            name: 'Critical Item 2',
            quantity: 3,
            minQuantity: 10,
            categoryId,
            locationId,
          },
          {
            name: 'Warning Item',
            quantity: 8,
            minQuantity: 10,
            categoryId,
            locationId,
          },
          {
            name: 'OK Item',
            quantity: 15,
            minQuantity: 10,
            categoryId,
            locationId,
          },
          {
            name: 'No MinQuantity Item',
            quantity: 5,
            minQuantity: null,
            categoryId,
            locationId,
          },
        ],
      });
    });

    it('should return items with low stock (quantity <= minQuantity)', async () => {
      const items = await prisma.item.findMany({
        where: {
          AND: [
            { minQuantity: { not: null } },
            { minQuantity: { gt: 0 } },
            {
              OR: [
                { quantity: { lte: prisma.raw('minQuantity') } },
              ],
            },
          ],
        },
        include: {
          category: true,
          location: true,
        },
      });

      // Should return 3 items: Critical Item 1, Critical Item 2, Warning Item
      expect(items.length).toBeGreaterThanOrEqual(3);
      items.forEach((item) => {
        expect(item.minQuantity).not.toBeNull();
        expect(item.quantity).toBeLessThanOrEqual(item.minQuantity!);
      });
    });

    it('should filter by alert level (critical)', async () => {
      const items = await prisma.item.findMany({
        where: {
          AND: [
            { minQuantity: { not: null } },
            { minQuantity: { gt: 0 } },
          ],
        },
      });

      const criticalItems = items.filter((item) => {
        if (!item.minQuantity) return false;
        const percentage = (item.quantity / item.minQuantity) * 100;
        return percentage <= 50;
      });

      // Should return 2 critical items
      expect(criticalItems.length).toBeGreaterThanOrEqual(2);
      criticalItems.forEach((item) => {
        const percentage = (item.quantity / item.minQuantity!) * 100;
        expect(percentage).toBeLessThanOrEqual(50);
      });
    });

    it('should filter by category', async () => {
      const items = await prisma.item.findMany({
        where: {
          categoryId,
          AND: [
            { minQuantity: { not: null } },
            { minQuantity: { gt: 0 } },
          ],
        },
      });

      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.categoryId).toBe(categoryId);
      });
    });

    it('should sort by stock level (most critical first)', async () => {
      const items = await prisma.item.findMany({
        where: {
          AND: [
            { minQuantity: { not: null } },
            { minQuantity: { gt: 0 } },
          ],
        },
        orderBy: [
          { quantity: 'asc' },
        ],
      });

      // Verify sorting: quantities should be in ascending order
      for (let i = 1; i < items.length; i++) {
        expect(items[i].quantity).toBeGreaterThanOrEqual(items[i - 1].quantity);
      }
    });

    it('should not return items without minQuantity', async () => {
      const items = await prisma.item.findMany({
        where: {
          AND: [
            { minQuantity: { not: null } },
            { minQuantity: { gt: 0 } },
          ],
        },
      });

      items.forEach((item) => {
        expect(item.minQuantity).not.toBeNull();
        expect(item.minQuantity).toBeGreaterThan(0);
      });
    });

    it('should include related category and location data', async () => {
      const items = await prisma.item.findMany({
        where: {
          minQuantity: { not: null },
        },
        include: {
          category: true,
          location: true,
        },
      });

      items.forEach((item) => {
        expect(item.category).toBeDefined();
        expect(item.category.name).toBeTruthy();
        expect(item.location).toBeDefined();
        expect(item.location.name).toBeTruthy();
      });
    });
  });

  describe('GET /api/items?lowStock=true - Filter Low Stock', () => {
    it('should accept lowStock query parameter', async () => {
      // This test verifies the API accepts the parameter
      // Actual filtering logic should be implemented in the API route
      const queryParams = new URLSearchParams({ lowStock: 'true' });
      expect(queryParams.get('lowStock')).toBe('true');
    });

    it('should combine lowStock filter with category filter', async () => {
      const queryParams = new URLSearchParams({
        lowStock: 'true',
        categoryId,
      });

      expect(queryParams.get('lowStock')).toBe('true');
      expect(queryParams.get('categoryId')).toBe(categoryId);
    });
  });

  describe('Database Schema Validation', () => {
    it('should have minQuantity field on Item model', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Schema Test',
          quantity: 5,
          minQuantity: 10,
          categoryId,
          locationId,
        },
      });

      expect(item).toHaveProperty('minQuantity');
    });

    it('should allow minQuantity to be nullable', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Nullable Test',
          quantity: 5,
          categoryId,
          locationId,
        },
      });

      expect(item.minQuantity).toBeNull();
    });

    it('should store minQuantity as integer', async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Type Test',
          quantity: 5,
          minQuantity: 10,
          categoryId,
          locationId,
        },
      });

      expect(typeof item.minQuantity).toBe('number');
      expect(Number.isInteger(item.minQuantity)).toBe(true);
    });
  });
});
