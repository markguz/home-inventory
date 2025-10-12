import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, resetMocks } from '../mocks/prisma';
import { mockCategory, mockCategories, mockCategoriesWithCount } from '../fixtures/categories';
import { GET as getCategories, POST as createCategoryAPI } from '@/app/api/categories/route';
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

// Helper to create mock request
function createMockRequest(
  url: string,
  method: string = 'GET',
  body?: any
): Request {
  return new Request(url, {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  }) as any;
}

describe('Categories Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Full CRUD Workflow', () => {
    it('should complete full category lifecycle: create, read, update, delete', async () => {
      // Step 1: Create a new category via server action
      const newCategory = {
        id: 'cat_new123',
        name: 'Test Category',
        description: 'Integration test category',
        icon: '🧪',
        color: '#8b5cf6',
        minQuantity: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.category.create.mockResolvedValue(newCategory as any);

      const categoryFormData = createFormData({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Integration test category',
        icon: '🧪',
      });

      const createResult = await createCategory(categoryFormData);
      expect(createResult.success).toBe(true);
      expect(createResult.data?.name).toBe('Test Category');

      // Step 2: Fetch all categories via API
      mockPrisma.category.findMany.mockResolvedValue([
        ...mockCategoriesWithCount,
        { ...newCategory, _count: { items: 0 } },
      ] as any);

      const getResponse = await getCategories();
      const getResult = await getResponse.json();

      expect(getResult.success).toBe(true);
      expect(getResult.data.length).toBe(4);
      expect(getResult.data.some((cat: any) => cat.name === 'Test Category')).toBe(true);

      // Step 3: Update the category
      mockPrisma.category.update.mockResolvedValue({
        ...newCategory,
        name: 'Updated Test Category',
      } as any);

      const updateFormData = createFormData({
        name: 'Updated Test Category',
        slug: 'updated-test-category',
        description: 'Updated description',
      });

      const updateResult = await updateCategory(newCategory.id, updateFormData);
      expect(updateResult.success).toBe(true);

      // Step 4: Delete the category
      mockPrisma.category.delete.mockResolvedValue(newCategory as any);

      const deleteResult = await deleteCategory(newCategory.id);
      expect(deleteResult.success).toBe(true);

      // Step 5: Verify deletion by fetching categories again
      mockPrisma.category.findMany.mockResolvedValue(mockCategoriesWithCount as any);

      const finalGetResponse = await getCategories();
      const finalGetResult = await finalGetResponse.json();

      expect(finalGetResult.success).toBe(true);
      expect(finalGetResult.data.length).toBe(3);
      expect(finalGetResult.data.every((cat: any) => cat.id !== newCategory.id)).toBe(true);
    });

    it('should handle category with items and prevent deletion with constraint', async () => {
      // Create category
      const categoryWithItems = {
        ...mockCategory,
        _count: { items: 10 },
      };

      mockPrisma.category.create.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: 'Category With Items',
        slug: 'category-with-items',
      });

      const createResult = await createCategory(formData);
      expect(createResult.success).toBe(true);

      // Try to delete category with items (should fail with foreign key constraint)
      mockPrisma.category.delete.mockRejectedValue({
        code: 'P2003',
        meta: { field_name: 'categoryId' },
      });

      const deleteResult = await deleteCategory(mockCategory.id);
      expect(deleteResult.error).toBe('Failed to delete category');
      expect(deleteResult.success).toBeUndefined();
    });

    it('should maintain data consistency across API and server actions', async () => {
      // Create via server action
      mockPrisma.category.create.mockResolvedValue(mockCategory as any);

      const formData = createFormData({
        name: mockCategory.name,
        slug: 'electronics',
        description: mockCategory.description || '',
      });

      await createCategory(formData);

      // Fetch via API
      mockPrisma.category.findMany.mockResolvedValue([
        { ...mockCategory, _count: { items: 0 } },
      ] as any);

      const response = await getCategories();
      const result = await response.json();

      expect(result.data[0].name).toBe(mockCategory.name);
      expect(result.data[0].description).toBe(mockCategory.description);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors consistently across endpoints', async () => {
      const invalidData = { name: '' };

      // Test API validation
      const apiRequest = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        invalidData
      );

      const apiResponse = await createCategoryAPI(apiRequest as any);
      const apiResult = await apiResponse.json();

      expect(apiResponse.status).toBe(400);
      expect(apiResult.success).toBe(false);

      // Test server action validation
      const formData = createFormData({ name: '', slug: '' });
      const actionResult = await createCategory(formData);

      expect(actionResult.error).toBeDefined();
      expect(actionResult.success).toBeUndefined();
    });

    it('should handle database errors gracefully across all operations', async () => {
      const dbError = new Error('Database connection failed');

      // Test create error
      mockPrisma.category.create.mockRejectedValue(dbError);
      const testCreateFormData = createFormData({ name: 'Test', slug: 'test' });
      const createResult = await createCategory(testCreateFormData);
      expect(createResult.error).toBeDefined();

      // Test update error
      mockPrisma.category.update.mockRejectedValue(dbError);
      const updateFormData = createFormData({ name: 'Test', slug: 'test' });
      const updateResult = await updateCategory('cat_123', updateFormData);
      expect(updateResult.error).toBeDefined();

      // Test delete error
      mockPrisma.category.delete.mockRejectedValue(dbError);
      const deleteResult = await deleteCategory('cat_123');
      expect(deleteResult.error).toBeDefined();

      // Test GET API error
      mockPrisma.category.findMany.mockRejectedValue(dbError);
      const getResponse = await getCategories();
      expect(getResponse.status).toBe(500);
    });
  });

  describe('Data Validation Integration', () => {
    it('should enforce unique category names', async () => {
      mockPrisma.category.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });

      const formData = createFormData({
        name: 'Duplicate Category',
        slug: 'duplicate',
      });

      const result = await createCategory(formData);
      expect(result.error).toBe('Failed to create category');
    });

    it('should validate field lengths across all operations', async () => {
      const longName = 'a'.repeat(101);

      // Test create validation
      const testCreateFormData = createFormData({ name: longName, slug: 'test' });
      const createResult = await createCategory(testCreateFormData);
      expect(createResult.error).toBeDefined();

      // Test update validation
      const updateFormData = createFormData({ name: longName, slug: 'test' });
      const updateResult = await updateCategory('cat_123', updateFormData);
      expect(updateResult.error).toBeDefined();

      // Test API validation
      const apiRequest = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        { name: longName }
      );
      const apiResponse = await createCategoryAPI(apiRequest as any);
      expect(apiResponse.status).toBe(400);
    });

    it('should handle optional fields consistently', async () => {
      const categoryWithOptionals = {
        ...mockCategory,
        description: null,
        icon: null,
        color: null,
        minQuantity: null,
      };

      mockPrisma.category.create.mockResolvedValue(categoryWithOptionals as any);

      // Create with minimal data
      const formData = createFormData({
        name: 'Minimal',
        slug: 'minimal',
      });

      const result = await createCategory(formData);
      expect(result.success).toBe(true);

      // Verify API returns null for optional fields
      mockPrisma.category.findMany.mockResolvedValue([
        { ...categoryWithOptionals, _count: { items: 0 } },
      ] as any);

      const response = await getCategories();
      const apiResult = await response.json();

      expect(apiResult.data[0].description).toBeNull();
      expect(apiResult.data[0].icon).toBeNull();
    });
  });

  describe('Pagination and Sorting Integration', () => {
    it('should maintain alphabetical sort order after CRUD operations', async () => {
      // Initial state: sorted categories
      mockPrisma.category.findMany.mockResolvedValue(mockCategoriesWithCount as any);

      let response = await getCategories();
      let result = await response.json();

      const initialOrder = result.data.map((cat: any) => cat.name);

      // Add new category
      const newCategory = {
        ...mockCategory,
        id: 'cat_zzz',
        name: 'AAA First Category', // Should sort to beginning
      };

      mockPrisma.category.create.mockResolvedValue(newCategory as any);
      const formData = createFormData({
        name: newCategory.name,
        slug: 'aaa-first',
      });
      await createCategory(formData);

      // Fetch again and verify sort order
      mockPrisma.category.findMany.mockResolvedValue([
        { ...newCategory, _count: { items: 0 } },
        ...mockCategoriesWithCount,
      ] as any);

      response = await getCategories();
      result = await response.json();

      // Verify orderBy was called
      expect(mockPrisma.category.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('Cache Invalidation Integration', () => {
    it('should revalidate cache after all mutating operations', async () => {
      const { revalidatePath } = await import('next/cache');
      vi.mocked(revalidatePath).mockClear();

      mockPrisma.category.create.mockResolvedValue(mockCategory as any);
      mockPrisma.category.update.mockResolvedValue(mockCategory as any);
      mockPrisma.category.delete.mockResolvedValue(mockCategory as any);

      // Create
      const testCreateFormData = createFormData({ name: 'Test', slug: 'test' });
      await createCategory(testCreateFormData);
      expect(revalidatePath).toHaveBeenCalledWith('/categories');

      // Update
      const updateFormData = createFormData({ name: 'Updated', slug: 'updated' });
      await updateCategory('cat_123', updateFormData);
      expect(revalidatePath).toHaveBeenCalledWith('/categories');

      // Delete
      await deleteCategory('cat_123');
      expect(revalidatePath).toHaveBeenCalledWith('/categories');

      // Should be called 3 times total
      expect(revalidatePath).toHaveBeenCalledTimes(3);
    });
  });
});
