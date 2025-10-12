import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, resetMocks } from '../../mocks/prisma';
import { mockCategory } from '../../fixtures/categories';
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories';

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Helper to create FormData
function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}

describe('Category Server Actions Unit Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('createCategory', () => {
    it('should create category with valid data', async () => {
      mockPrisma.category.create.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        icon: '💻',
      });

      const result = await createCategory(formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCategory);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices',
          icon: '💻',
        },
      });
    });

    it('should handle missing optional fields', async () => {
      mockPrisma.category.create.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: 'Books',
        slug: 'books',
      });

      const result = await createCategory(formData);

      expect(result.success).toBe(true);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Books',
          slug: 'books',
        },
      });
    });

    it('should convert empty strings to undefined for optional fields', async () => {
      mockPrisma.category.create.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: 'Books',
        slug: 'books',
        description: '',
        icon: '',
      });

      const result = await createCategory(formData);

      expect(result.success).toBe(true);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Books',
          slug: 'books',
        },
      });
    });

    it('should return validation error for missing required name', async () => {
      const formData = createFormData({
        slug: 'test-slug',
      });

      const result = await createCategory(formData);

      expect(result.error).toBeDefined();
      expect(result.success).toBeUndefined();
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });

    it('should return validation error for missing required slug', async () => {
      const formData = createFormData({
        name: 'Test Category',
      });

      const result = await createCategory(formData);

      expect(result.error).toBeDefined();
      expect(result.success).toBeUndefined();
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });

    it('should return validation errors for invalid fields', async () => {
      const formData = createFormData({
        name: '', // Empty name
        slug: '', // Empty slug
      });

      const result = await createCategory(formData);

      expect(result.error).toBeDefined();
      expect(result.success).toBeUndefined();
    });

    it('should validate name length (max 100)', async () => {
      const longName = 'a'.repeat(101);
      const formData = createFormData({
        name: longName,
        slug: 'test',
      });

      const result = await createCategory(formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });

    it('should validate slug length (max 100)', async () => {
      const longSlug = 'a'.repeat(101);
      const formData = createFormData({
        name: 'Test',
        slug: longSlug,
      });

      const result = await createCategory(formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrisma.category.create.mockRejectedValue(new Error('Database error'));

      const formData = createFormData({
        name: 'Test',
        slug: 'test',
      });

      const result = await createCategory(formData);

      expect(result.error).toBe('Failed to create category');
      expect(result.success).toBeUndefined();
    });

    it('should revalidate /categories path on success', async () => {
      const { revalidatePath } = await import('next/cache');
      mockPrisma.category.create.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: 'Test',
        slug: 'test',
      });

      await createCategory(formData);

      expect(revalidatePath).toHaveBeenCalledWith('/categories');
    });

    it('should handle unique constraint violation', async () => {
      mockPrisma.category.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });

      const formData = createFormData({
        name: 'Duplicate',
        slug: 'duplicate',
      });

      const result = await createCategory(formData);

      expect(result.error).toBe('Failed to create category');
    });
  });

  describe('updateCategory', () => {
    it('should update category with valid data', async () => {
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        name: 'Updated Name',
      } as any);

      const formData = createFormData({
        name: 'Updated Name',
        slug: 'updated-name',
        description: 'Updated description',
      });

      const result = await updateCategory('cat_test123', formData);

      expect(result.success).toBe(true);
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat_test123' },
        data: {
          name: 'Updated Name',
          slug: 'updated-name',
          description: 'Updated description',
        },
      });
    });

    it('should handle missing optional fields in update', async () => {
      mockPrisma.category.update.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: 'Updated',
        slug: 'updated',
      });

      const result = await updateCategory('cat_test123', formData);

      expect(result.success).toBe(true);
    });

    it('should return validation error for invalid data', async () => {
      const formData = createFormData({
        name: '', // Invalid empty name
        slug: 'test',
      });

      const result = await updateCategory('cat_test123', formData);

      expect(result.error).toBeDefined();
      expect(result.success).toBeUndefined();
      expect(mockPrisma.category.update).not.toHaveBeenCalled();
    });

    it('should handle non-existent category', async () => {
      mockPrisma.category.update.mockRejectedValue({
        code: 'P2025',
        meta: { cause: 'Record not found' },
      });

      const formData = createFormData({
        name: 'Test',
        slug: 'test',
      });

      const result = await updateCategory('nonexistent_id', formData);

      expect(result.error).toBe('Failed to update category');
    });

    it('should handle database errors during update', async () => {
      mockPrisma.category.update.mockRejectedValue(new Error('Database error'));

      const formData = createFormData({
        name: 'Test',
        slug: 'test',
      });

      const result = await updateCategory('cat_test123', formData);

      expect(result.error).toBe('Failed to update category');
    });

    it('should revalidate /categories path on success', async () => {
      const { revalidatePath } = await import('next/cache');
      mockPrisma.category.update.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: 'Test',
        slug: 'test',
      });

      await updateCategory('cat_test123', formData);

      expect(revalidatePath).toHaveBeenCalledWith('/categories');
    });

    it('should convert empty optional fields to undefined', async () => {
      mockPrisma.category.update.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: 'Test',
        slug: 'test',
        description: '',
        icon: '',
      });

      const result = await updateCategory('cat_test123', formData);

      expect(result.success).toBe(true);
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat_test123' },
        data: {
          name: 'Test',
          slug: 'test',
        },
      });
    });

    it('should validate name length on update', async () => {
      const longName = 'a'.repeat(101);
      const formData = createFormData({
        name: longName,
        slug: 'test',
      });

      const result = await updateCategory('cat_test123', formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.category.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockPrisma.category.delete.mockResolvedValue(mockCategory as any);

      const result = await deleteCategory('cat_test123');

      expect(result.success).toBe(true);
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat_test123' },
      });
    });

    it('should handle non-existent category deletion', async () => {
      mockPrisma.category.delete.mockRejectedValue({
        code: 'P2025',
        meta: { cause: 'Record not found' },
      });

      const result = await deleteCategory('nonexistent_id');

      expect(result.error).toBe('Failed to delete category');
      expect(result.success).toBeUndefined();
    });

    it('should handle foreign key constraint violation', async () => {
      mockPrisma.category.delete.mockRejectedValue({
        code: 'P2003',
        meta: { field_name: 'categoryId' },
      });

      const result = await deleteCategory('cat_test123');

      expect(result.error).toBe('Failed to delete category');
    });

    it('should handle database errors during deletion', async () => {
      mockPrisma.category.delete.mockRejectedValue(new Error('Database error'));

      const result = await deleteCategory('cat_test123');

      expect(result.error).toBe('Failed to delete category');
    });

    it('should revalidate /categories path on successful deletion', async () => {
      const { revalidatePath } = await import('next/cache');
      mockPrisma.category.delete.mockResolvedValue(mockCategory as any);

      await deleteCategory('cat_test123');

      expect(revalidatePath).toHaveBeenCalledWith('/categories');
    });

    it('should handle empty category id', async () => {
      mockPrisma.category.delete.mockRejectedValue(new Error('Invalid ID'));

      const result = await deleteCategory('');

      expect(result.error).toBe('Failed to delete category');
    });
  });
});
