import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/items/route';
import { mockPrisma, resetMocks } from '../mocks/prisma';
import { mockItem, mockItemFormData } from '../fixtures/items';

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

describe('Items API Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/items', () => {
    it('should return paginated items', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/items?page=1&limit=20'
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('totalPages');
    });

    it('should filter by categoryId', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/items?categoryId=cat_123'
      );

      await GET(request as any);

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat_123' }),
        })
      );
    });

    it('should filter by locationId', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/items?locationId=loc_123'
      );

      await GET(request as any);

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ locationId: 'loc_123' }),
        })
      );
    });

    it('should support custom pagination', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/items?page=2&limit=10'
      );

      await GET(request as any);

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should support sorting', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/items?sortBy=name&sortOrder=asc'
      );

      await GET(request as any);

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should include related data', async () => {
      const request = createMockRequest('http://localhost:3000/api/items');

      await GET(request as any);

      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            category: expect.anything(),
            location: expect.anything(),
            tags: expect.anything(),
          }),
        })
      );
    });

    it('should calculate pagination metadata correctly', async () => {
      mockPrisma.item.count.mockResolvedValue(45);

      const request = createMockRequest(
        'http://localhost:3000/api/items?page=2&limit=20'
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      });
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.item.findMany.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost:3000/api/items');

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/items', () => {
    it('should create new item with valid data', async () => {
      mockPrisma.item.create.mockResolvedValue(mockItem as any);

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        mockItemFormData
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const invalidData = { name: 'Test' }; // Missing required fields

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        invalidData
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });

    it('should validate field types', async () => {
      const invalidData = {
        ...mockItemFormData,
        quantity: 'not-a-number',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        invalidData
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });

    it('should create item with tags', async () => {
      const dataWithTags = {
        ...mockItemFormData,
        tagIds: ['tag_1', 'tag_2', 'tag_3'],
      };

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        dataWithTags
      );

      await POST(request as any);

      expect(mockPrisma.item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  tag: expect.objectContaining({ connect: { id: 'tag_1' } }),
                }),
              ]),
            }),
          }),
        })
      );
    });

    it('should create item without optional fields', async () => {
      const minimalData = {
        name: 'Minimal Item',
        categoryId: 'cat_123',
        locationId: 'loc_123',
        quantity: 1,
        condition: 'good',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        minimalData
      );

      const response = await POST(request as any);

      expect(response.status).toBe(201);
    });

    it('should validate URL format for imageUrl', async () => {
      const invalidImageUrl = {
        ...mockItemFormData,
        imageUrl: 'not-a-url',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        invalidImageUrl
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });

    it('should validate condition enum values', async () => {
      const invalidCondition = {
        ...mockItemFormData,
        condition: 'invalid-condition',
      };

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        invalidCondition
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });

    it('should handle database errors', async () => {
      mockPrisma.item.create.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        mockItemFormData
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return created item with relations', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        mockItemFormData
      );

      await POST(request as any);

      expect(mockPrisma.item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            category: true,
            location: true,
            tags: expect.anything(),
          }),
        })
      );
    });

    it('should validate negative prices', async () => {
      const negativePriceData = {
        ...mockItemFormData,
        purchasePrice: -100,
      };

      const request = createMockRequest(
        'http://localhost:3000/api/items',
        'POST',
        negativePriceData
      );

      const response = await POST(request as any);

      expect(response.status).toBe(400);
    });
  });
});
