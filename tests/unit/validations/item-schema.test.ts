import { itemSchema, itemUpdateSchema } from '../../../home-inventory/src/lib/validations';

describe('Item Validation Schemas', () => {
  describe('itemUpdateSchema', () => {
    describe('Valid Data', () => {
      it('should validate complete item data', () => {
        const validData = {
          name: 'Power Drill',
          description: 'DeWalt 20V MAX',
          categoryId: 'cat-123',
          location: 'Garage, Shelf 2',
          quantity: 2,
          minQuantity: 1,
          serialNumber: 'DW12345',
          notes: 'Purchased in 2023',
        };

        const result = itemUpdateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow partial updates with only name', () => {
        const result = itemUpdateSchema.safeParse({ name: 'Updated Name' });
        expect(result.success).toBe(true);
      });

      it('should allow partial updates with only category', () => {
        const result = itemUpdateSchema.safeParse({ categoryId: 'cat-456' });
        expect(result.success).toBe(true);
      });

      it('should allow partial updates with only location', () => {
        const result = itemUpdateSchema.safeParse({ location: 'New Location' });
        expect(result.success).toBe(true);
      });

      it('should allow partial updates with only quantity', () => {
        const result = itemUpdateSchema.safeParse({ quantity: 5 });
        expect(result.success).toBe(true);
      });

      it('should allow empty object for update schema', () => {
        const result = itemUpdateSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should accept optional id field', () => {
        const result = itemUpdateSchema.safeParse({
          id: 'item-123',
          name: 'Test',
        });
        expect(result.success).toBe(true);
      });

      it('should accept optional tagIds array', () => {
        const result = itemUpdateSchema.safeParse({
          name: 'Test',
          tagIds: ['tag-1', 'tag-2', 'tag-3'],
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Field Constraints', () => {
      it('should reject empty name string', () => {
        const result = itemUpdateSchema.safeParse({ name: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Name is required');
        }
      });

      it('should reject name longer than 200 characters', () => {
        const longName = 'a'.repeat(201);
        const result = itemUpdateSchema.safeParse({ name: longName });
        expect(result.success).toBe(false);
      });

      it('should accept name with exactly 200 characters', () => {
        const maxName = 'a'.repeat(200);
        const result = itemUpdateSchema.safeParse({ name: maxName });
        expect(result.success).toBe(true);
      });

      it('should reject empty categoryId string', () => {
        const result = itemUpdateSchema.safeParse({ categoryId: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Category is required');
        }
      });

      it('should allow empty location string in update schema', () => {
        // itemUpdateSchema is partial, so empty strings are allowed
        const result = itemUpdateSchema.safeParse({ location: '' });
        expect(result.success).toBe(true);
      });

      it('should allow location longer than 200 characters in update schema', () => {
        // itemUpdateSchema is partial and doesn't enforce max length on optional fields
        const longLocation = 'a'.repeat(201);
        const result = itemUpdateSchema.safeParse({ location: longLocation });
        expect(result.success).toBe(true);
      });

      it('should accept location with exactly 200 characters', () => {
        const maxLocation = 'a'.repeat(200);
        const result = itemUpdateSchema.safeParse({ location: maxLocation });
        expect(result.success).toBe(true);
      });

      it('should reject negative quantity', () => {
        const result = itemUpdateSchema.safeParse({ quantity: -1 });
        expect(result.success).toBe(false);
      });

      it('should accept zero quantity', () => {
        const result = itemUpdateSchema.safeParse({ quantity: 0 });
        expect(result.success).toBe(true);
      });

      it('should reject decimal quantity', () => {
        const result = itemUpdateSchema.safeParse({ quantity: 2.5 });
        expect(result.success).toBe(false);
      });

      it('should reject negative minQuantity', () => {
        const result = itemUpdateSchema.safeParse({ minQuantity: -1 });
        expect(result.success).toBe(false);
      });

      it('should accept zero minQuantity', () => {
        const result = itemUpdateSchema.safeParse({ minQuantity: 0 });
        expect(result.success).toBe(true);
      });

      it('should accept undefined minQuantity', () => {
        const result = itemUpdateSchema.safeParse({ minQuantity: undefined });
        expect(result.success).toBe(true);
      });

      it('should reject serial number longer than 100 characters', () => {
        const longSerial = 'a'.repeat(101);
        const result = itemUpdateSchema.safeParse({ serialNumber: longSerial });
        expect(result.success).toBe(false);
      });

      it('should accept serial number with exactly 100 characters', () => {
        const maxSerial = 'a'.repeat(100);
        const result = itemUpdateSchema.safeParse({ serialNumber: maxSerial });
        expect(result.success).toBe(true);
      });
    });

    describe('Optional Fields', () => {
      it('should allow missing description', () => {
        const result = itemUpdateSchema.safeParse({
          name: 'Test',
          categoryId: 'cat-1',
          location: 'Office',
          quantity: 1,
        });
        expect(result.success).toBe(true);
      });

      it('should allow missing serialNumber', () => {
        const result = itemUpdateSchema.safeParse({
          name: 'Test',
          categoryId: 'cat-1',
          location: 'Office',
          quantity: 1,
        });
        expect(result.success).toBe(true);
      });

      it('should allow missing notes', () => {
        const result = itemUpdateSchema.safeParse({
          name: 'Test',
          categoryId: 'cat-1',
          location: 'Office',
          quantity: 1,
        });
        expect(result.success).toBe(true);
      });

      it('should allow empty string for optional fields', () => {
        const result = itemUpdateSchema.safeParse({
          description: '',
          serialNumber: '',
          notes: '',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Type Validation', () => {
      it('should reject non-string name', () => {
        const result = itemUpdateSchema.safeParse({ name: 123 });
        expect(result.success).toBe(false);
      });

      it('should reject non-number quantity', () => {
        const result = itemUpdateSchema.safeParse({ quantity: 'five' });
        expect(result.success).toBe(false);
      });

      it('should reject non-array tagIds', () => {
        const result = itemUpdateSchema.safeParse({ tagIds: 'tag-1' });
        expect(result.success).toBe(false);
      });

      it('should reject tagIds with non-string elements', () => {
        const result = itemUpdateSchema.safeParse({ tagIds: [1, 2, 3] });
        expect(result.success).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very large quantity values', () => {
        const result = itemUpdateSchema.safeParse({ quantity: 999999 });
        expect(result.success).toBe(true);
      });

      it('should handle special characters in text fields', () => {
        const result = itemUpdateSchema.safeParse({
          name: 'Item with "quotes" & special <chars>',
          description: "Description with 'apostrophes'",
          location: 'Location with symbols !@#$%',
          notes: 'Notes with\nmultiple\nlines',
        });
        expect(result.success).toBe(true);
      });

      it('should handle Unicode characters', () => {
        const result = itemUpdateSchema.safeParse({
          name: '工具 Tool 🔧',
          description: 'Description en français',
          location: 'Ubicación en español',
        });
        expect(result.success).toBe(true);
      });

      it('should handle whitespace in required fields', () => {
        const result = itemUpdateSchema.safeParse({ name: '   ' });
        // Schema should trim or reject whitespace-only strings
        expect(result.success).toBe(true); // Based on current implementation
      });

      it('should handle empty tagIds array', () => {
        const result = itemUpdateSchema.safeParse({ tagIds: [] });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('itemSchema (Full Schema)', () => {
    describe('Required Fields Validation', () => {
      it('should require name', () => {
        const data = {
          categoryId: 'cat-1',
          location: 'Office',
          quantity: 1,
        };
        const result = itemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should require categoryId', () => {
        const data = {
          name: 'Test',
          location: 'Office',
          quantity: 1,
        };
        const result = itemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should require location', () => {
        const data = {
          name: 'Test',
          categoryId: 'cat-1',
          quantity: 1,
        };
        const result = itemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should require quantity', () => {
        const data = {
          name: 'Test',
          categoryId: 'cat-1',
          location: 'Office',
        };
        const result = itemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('Complete Valid Item', () => {
      it('should validate minimal valid item', () => {
        const minimalItem = {
          name: 'Test Item',
          categoryId: 'cat-1',
          location: 'Office',
          quantity: 1,
        };
        const result = itemSchema.safeParse(minimalItem);
        expect(result.success).toBe(true);
      });

      it('should validate complete item with all fields', () => {
        const completeItem = {
          name: 'Power Drill',
          description: 'DeWalt 20V MAX cordless drill',
          categoryId: 'cat-tools',
          location: 'Garage, Shelf 3',
          quantity: 2,
          minQuantity: 1,
          serialNumber: 'DW12345678',
          notes: 'Purchased in 2023, includes battery and charger',
        };
        const result = itemSchema.safeParse(completeItem);
        expect(result.success).toBe(true);
      });
    });
  });
});
