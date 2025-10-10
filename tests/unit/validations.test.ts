import { itemSchema, searchParamsSchema, categorySchema } from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('itemSchema', () => {
    const validItem = {
      name: 'Test Item',
      description: 'Test Description',
      category: 'Electronics',
      location: 'Office',
      quantity: 1,
      purchaseDate: new Date('2023-01-15'),
      purchasePrice: 99.99,
      condition: 'New',
    };

    it('should validate correct item data', () => {
      const result = itemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = itemSchema.safeParse({ ...validItem, name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const result = itemSchema.safeParse({ ...validItem, quantity: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const result = itemSchema.safeParse({ ...validItem, purchasePrice: -10 });
      expect(result.success).toBe(false);
    });

    it('should allow optional fields to be missing', () => {
      const minimalItem = {
        name: 'Minimal Item',
        category: 'Other',
        location: 'Garage',
        quantity: 1,
      };
      const result = itemSchema.safeParse(minimalItem);
      expect(result.success).toBe(true);
    });

    it('should reject name longer than 255 characters', () => {
      const longName = 'a'.repeat(256);
      const result = itemSchema.safeParse({ ...validItem, name: longName });
      expect(result.success).toBe(false);
    });

    it('should handle future purchase dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = itemSchema.safeParse({ ...validItem, purchaseDate: futureDate });
      expect(result.success).toBe(false);
    });
  });

  describe('searchParamsSchema', () => {
    it('should validate search query', () => {
      const result = searchParamsSchema.safeParse({ query: 'laptop' });
      expect(result.success).toBe(true);
    });

    it('should validate category filter', () => {
      const result = searchParamsSchema.safeParse({ category: 'Electronics' });
      expect(result.success).toBe(true);
    });

    it('should validate multiple filters', () => {
      const result = searchParamsSchema.safeParse({
        query: 'laptop',
        category: 'Electronics',
        location: 'Office',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty search params', () => {
      const result = searchParamsSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('categorySchema', () => {
    it('should validate category name', () => {
      const result = categorySchema.safeParse({ name: 'Electronics' });
      expect(result.success).toBe(true);
    });

    it('should reject empty category name', () => {
      const result = categorySchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });
});
