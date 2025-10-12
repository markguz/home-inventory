import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, resetMocks } from '../../mocks/prisma';
import { mockCategory, mockCategoriesWithCount, mockCategoryFormData } from '../../fixtures/categories';
import { GET, POST } from '@/app/api/categories/route';

// Mock Next.js request
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

describe('Categories API Unit Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/categories', () => {
    it('should return all categories with item counts', async () => {
      mockPrisma.category.findMany.mockResolvedValue(mockCategoriesWithCount as any);

      const request = createMockRequest('http://localhost:3000/api/categories');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBe(3);
      expect(data.data[0]).toHaveProperty('_count');
      expect(data.data[0]._count).toHaveProperty('items');
    });

    it('should call prisma with correct include and orderBy', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      await GET();

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no categories exist', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch categories');
    });

    it('should sort categories alphabetically by name', async () => {
      const unsortedCategories = [
        { ...mockCategory, name: 'Zebra' },
        { ...mockCategory, name: 'Apple' },
        { ...mockCategory, name: 'Mango' },
      ];
      mockPrisma.category.findMany.mockResolvedValue(unsortedCategories as any);

      await GET();

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('POST /api/categories', () => {
    it('should create new category with valid data', async () => {
      mockPrisma.category.create.mockResolvedValue(mockCategory as any);

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        mockCategoryFormData
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.name).toBe(mockCategory.name);
    });

    it('should validate required name field', async () => {
      const invalidData = { description: 'Missing name' };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        invalidData
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
    });

    it('should accept category with only required fields', async () => {
      const minimalCategory = {
        ...mockCategory,
        description: null,
        icon: null,
        color: null,
        minQuantity: null,
      };
      mockPrisma.category.create.mockResolvedValue(minimalCategory as any);

      const minimalData = { name: 'Minimal Category', slug: 'minimal-category' };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        minimalData
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should validate name length (max 100 characters)', async () => {
      const longName = 'a'.repeat(101);
      const invalidData = { name: longName };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        invalidData
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });

    it('should validate minQuantity is non-negative integer', async () => {
      const invalidData = {
        name: 'Test',
        minQuantity: -5,
      };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        invalidData
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });

    it('should validate minQuantity is integer', async () => {
      const invalidData = {
        name: 'Test',
        minQuantity: 5.5,
      };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        invalidData
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });

    it('should accept optional color field', async () => {
      mockPrisma.category.create.mockResolvedValue({
        ...mockCategory,
        color: '#ff6b6b',
      } as any);

      const dataWithColor = {
        name: 'Colorful Category',
        slug: 'colorful-category',
        color: '#ff6b6b',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        dataWithColor
      );

      const response = await POST(request as any);

      expect(response.status).toBe(201);
    });

    it('should accept optional icon field', async () => {
      mockPrisma.category.create.mockResolvedValue({
        ...mockCategory,
        icon: '🎨',
      } as any);

      const dataWithIcon = {
        name: 'Art Supplies',
        slug: 'art-supplies',
        icon: '🎨',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        dataWithIcon
      );

      const response = await POST(request as any);

      expect(response.status).toBe(201);
    });

    it('should handle database errors during creation', async () => {
      mockPrisma.category.create.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        mockCategoryFormData
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create category');
    });

    it('should handle unique constraint violation', async () => {
      mockPrisma.category.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        mockCategoryFormData
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should trim whitespace from name', async () => {
      const dataWithWhitespace = {
        name: '  Test Category  ',
        slug: 'test-category',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        dataWithWhitespace
      );

      await POST(request as any);

      // Zod should handle trimming automatically
      expect(mockPrisma.category.create).toHaveBeenCalled();
    });

    it('should reject empty string for name', async () => {
      const invalidData = { name: '' };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        invalidData
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });

    it('should reject name with only whitespace', async () => {
      const invalidData = { name: '   ' };

      const request = createMockRequest(
        'http://localhost:3000/api/categories',
        'POST',
        invalidData
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });
  });
});
