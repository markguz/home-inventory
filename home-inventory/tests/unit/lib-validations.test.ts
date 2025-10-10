import { describe, it, expect } from 'vitest';
import {
  itemSchema,
  itemUpdateSchema,
  categorySchema,
  locationSchema,
  tagSchema,
  searchSchema,
} from '@/lib/validations';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('itemSchema', () => {
    const validItem = {
      name: 'Test Item',
      description: 'Test description',
      quantity: 1,
      purchaseDate: new Date().toISOString(),
      purchasePrice: 100.0,
      currentValue: 90.0,
      condition: 'good',
      notes: 'Test notes',
      imageUrl: 'https://example.com/image.jpg',
      barcode: '123456',
      serialNumber: 'SN123',
      warrantyUntil: new Date().toISOString(),
      categoryId: 'clp1234567890',
      locationId: 'clp0987654321',
      tagIds: ['clp1111111111'],
    };

    it('should validate a complete valid item', () => {
      expect(() => itemSchema.parse(validItem)).not.toThrow();
    });

    it('should require name field', () => {
      const { name, ...itemWithoutName } = validItem;
      expect(() => itemSchema.parse(itemWithoutName)).toThrow();
    });

    it('should reject empty name', () => {
      expect(() =>
        itemSchema.parse({ ...validItem, name: '' })
      ).toThrow();
    });

    it('should reject name longer than 100 characters', () => {
      expect(() =>
        itemSchema.parse({ ...validItem, name: 'a'.repeat(101) })
      ).toThrow();
    });

    it('should require categoryId', () => {
      const { categoryId, ...itemWithoutCategory } = validItem;
      expect(() => itemSchema.parse(itemWithoutCategory)).toThrow();
    });

    it('should require locationId', () => {
      const { locationId, ...itemWithoutLocation } = validItem;
      expect(() => itemSchema.parse(itemWithoutLocation)).toThrow();
    });

    it('should validate quantity as positive integer', () => {
      expect(() =>
        itemSchema.parse({ ...validItem, quantity: -1 })
      ).toThrow();
      expect(() =>
        itemSchema.parse({ ...validItem, quantity: 1.5 })
      ).toThrow();
    });

    it('should validate condition enum', () => {
      const validConditions = ['excellent', 'good', 'fair', 'poor'];
      validConditions.forEach((condition) => {
        expect(() =>
          itemSchema.parse({ ...validItem, condition })
        ).not.toThrow();
      });

      expect(() =>
        itemSchema.parse({ ...validItem, condition: 'invalid' })
      ).toThrow();
    });

    it('should validate imageUrl as URL', () => {
      expect(() =>
        itemSchema.parse({ ...validItem, imageUrl: 'not-a-url' })
      ).toThrow();
      expect(() =>
        itemSchema.parse({ ...validItem, imageUrl: 'https://example.com' })
      ).not.toThrow();
    });

    it('should accept null for optional fields', () => {
      expect(() =>
        itemSchema.parse({
          ...validItem,
          description: null,
          purchaseDate: null,
          purchasePrice: null,
        })
      ).not.toThrow();
    });

    it('should validate positive prices', () => {
      expect(() =>
        itemSchema.parse({ ...validItem, purchasePrice: -10 })
      ).toThrow();
      expect(() =>
        itemSchema.parse({ ...validItem, currentValue: -5 })
      ).toThrow();
    });

    it('should validate CUID format for IDs', () => {
      expect(() =>
        itemSchema.parse({ ...validItem, categoryId: 'invalid-id' })
      ).toThrow();
    });

    it('should accept empty tagIds array', () => {
      expect(() =>
        itemSchema.parse({ ...validItem, tagIds: [] })
      ).not.toThrow();
    });

    it('should validate datetime strings', () => {
      expect(() =>
        itemSchema.parse({ ...validItem, purchaseDate: 'invalid-date' })
      ).toThrow();
    });
  });

  describe('itemUpdateSchema', () => {
    it('should require id field', () => {
      expect(() =>
        itemUpdateSchema.parse({ name: 'Updated' })
      ).toThrow();
    });

    it('should allow partial updates', () => {
      expect(() =>
        itemUpdateSchema.parse({
          id: 'clp1234567890',
          name: 'Updated Name',
        })
      ).not.toThrow();
    });

    it('should validate partial fields same as itemSchema', () => {
      expect(() =>
        itemUpdateSchema.parse({
          id: 'clp1234567890',
          quantity: -1,
        })
      ).toThrow();
    });
  });

  describe('categorySchema', () => {
    it('should validate valid category', () => {
      expect(() =>
        categorySchema.parse({
          name: 'Electronics',
          description: 'Electronic items',
          icon: '📱',
          color: '#FF0000',
        })
      ).not.toThrow();
    });

    it('should require name', () => {
      expect(() =>
        categorySchema.parse({ description: 'Test' })
      ).toThrow();
    });

    it('should validate hex color format', () => {
      expect(() =>
        categorySchema.parse({ name: 'Test', color: 'invalid' })
      ).toThrow();
      expect(() =>
        categorySchema.parse({ name: 'Test', color: '#GGGGGG' })
      ).toThrow();
      expect(() =>
        categorySchema.parse({ name: 'Test', color: '#FF0000' })
      ).not.toThrow();
    });

    it('should limit name length', () => {
      expect(() =>
        categorySchema.parse({ name: 'a'.repeat(51) })
      ).toThrow();
    });
  });

  describe('locationSchema', () => {
    it('should validate valid location', () => {
      expect(() =>
        locationSchema.parse({
          name: 'Living Room',
          description: 'Main living area',
          parentId: 'clp1234567890',
        })
      ).not.toThrow();
    });

    it('should require name', () => {
      expect(() => locationSchema.parse({})).toThrow();
    });

    it('should allow null parentId', () => {
      expect(() =>
        locationSchema.parse({ name: 'Home', parentId: null })
      ).not.toThrow();
    });

    it('should validate parentId as CUID', () => {
      expect(() =>
        locationSchema.parse({ name: 'Room', parentId: 'invalid' })
      ).toThrow();
    });
  });

  describe('tagSchema', () => {
    it('should validate valid tag', () => {
      expect(() =>
        tagSchema.parse({
          name: 'Important',
          color: '#FF0000',
        })
      ).not.toThrow();
    });

    it('should require name', () => {
      expect(() => tagSchema.parse({})).toThrow();
    });

    it('should limit name length to 30 characters', () => {
      expect(() =>
        tagSchema.parse({ name: 'a'.repeat(31) })
      ).toThrow();
      expect(() =>
        tagSchema.parse({ name: 'a'.repeat(30) })
      ).not.toThrow();
    });

    it('should validate hex color format', () => {
      expect(() =>
        tagSchema.parse({ name: 'Tag', color: 'red' })
      ).toThrow();
      expect(() =>
        tagSchema.parse({ name: 'Tag', color: '#ABCDEF' })
      ).not.toThrow();
    });
  });

  describe('searchSchema', () => {
    it('should validate basic search query', () => {
      expect(() =>
        searchSchema.parse({ query: 'laptop' })
      ).not.toThrow();
    });

    it('should require query field', () => {
      expect(() => searchSchema.parse({})).toThrow();
    });

    it('should apply default values', () => {
      const result = searchSchema.parse({ query: 'test' });
      expect(result.sortBy).toBe('name');
      expect(result.sortOrder).toBe('asc');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should validate sort options', () => {
      const validSortBy = ['name', 'createdAt', 'updatedAt', 'purchasePrice', 'currentValue'];
      validSortBy.forEach((sortBy) => {
        expect(() =>
          searchSchema.parse({ query: 'test', sortBy })
        ).not.toThrow();
      });

      expect(() =>
        searchSchema.parse({ query: 'test', sortBy: 'invalid' })
      ).toThrow();
    });

    it('should validate pagination limits', () => {
      expect(() =>
        searchSchema.parse({ query: 'test', page: 0 })
      ).toThrow();
      expect(() =>
        searchSchema.parse({ query: 'test', limit: 0 })
      ).toThrow();
      expect(() =>
        searchSchema.parse({ query: 'test', limit: 101 })
      ).toThrow();
    });

    it('should validate value ranges', () => {
      expect(() =>
        searchSchema.parse({ query: 'test', minValue: -1 })
      ).toThrow();
      expect(() =>
        searchSchema.parse({ query: 'test', maxValue: -1 })
      ).toThrow();
    });

    it('should validate condition filter', () => {
      expect(() =>
        searchSchema.parse({ query: 'test', condition: 'good' })
      ).not.toThrow();
      expect(() =>
        searchSchema.parse({ query: 'test', condition: 'invalid' })
      ).toThrow();
    });

    it('should validate optional CUID arrays', () => {
      expect(() =>
        searchSchema.parse({
          query: 'test',
          tagIds: ['clp1234567890', 'clp0987654321'],
        })
      ).not.toThrow();
      expect(() =>
        searchSchema.parse({ query: 'test', tagIds: ['invalid'] })
      ).toThrow();
    });
  });
});
