import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/items/[id]/route';
import { mockPrisma, resetMocks } from '../../../mocks/prisma';
import { mockItem, mockCategory, mockLocation, mockTag } from '../../../fixtures/items';

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

const { auth } = await import('@/auth');

// Mock request helper
function createMockRequest(
  url: string,
  method: string = 'GET',
  body?: any
): NextRequest {
  return new Request(url, {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  }) as any;
}

describe('Edit Item API Unit Tests', () => {
  const mockSession = {
    user: {
      id: 'user-test-1',
      email: 'test@example.com',
      role: 'USER',
    },
  };

  const mockAdminSession = {
    user: {
      id: 'admin-user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe('GET /api/items/[id]', () => {
    it('should return item with all relations', async () => {
      mockPrisma.item.findUnique.mockResolvedValue({
        ...mockItem,
        tags: [
          {
            itemId: mockItem.id,
            tagId: 'tag_123',
            tag: mockTag,
          },
        ],
      } as any);

      const params = Promise.resolve({ id: 'item_123' });
      const request = createMockRequest('http://localhost:3001/api/items/item_123');

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id', 'item_123');
      expect(data.data).toHaveProperty('category');
      expect(data.data).toHaveProperty('location');
      expect(data.data).toHaveProperty('tags');
    });

    it('should return 404 when item does not exist', async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: 'nonexistent' });
      const request = createMockRequest('http://localhost:3001/api/items/nonexistent');

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Item not found');
    });

    it('should include tags with tag relation', async () => {
      mockPrisma.item.findUnique.mockResolvedValue({
        ...mockItem,
        tags: [
          {
            itemId: mockItem.id,
            tagId: 'tag_123',
            tag: mockTag,
          },
        ],
      } as any);

      const params = Promise.resolve({ id: 'item_123' });
      const request = createMockRequest('http://localhost:3001/api/items/item_123');

      await GET(request, { params });

      expect(mockPrisma.item.findUnique).toHaveBeenCalledWith({
        where: { id: 'item_123' },
        include: {
          category: true,
          location: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.item.findUnique.mockRejectedValue(new Error('Database error'));

      const params = Promise.resolve({ id: 'item_123' });
      const request = createMockRequest('http://localhost:3001/api/items/item_123');

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch item');
    });
  });

  describe('PATCH /api/items/[id]', () => {
    describe('Authentication & Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        (auth as any).mockResolvedValue(null);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { name: 'Updated Name' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 403 when user does not own item', async () => {
        (auth as any).mockResolvedValue({
          user: { id: 'different-user', email: 'other@example.com', role: 'USER' },
        });

        mockPrisma.item.findUnique.mockResolvedValue({
          id: 'item_123',
          userId: 'user-test-1', // Different from authenticated user
        } as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { name: 'Updated Name' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Forbidden');
      });

      it('should allow admin to edit any item', async () => {
        (auth as any).mockResolvedValue(mockAdminSession);

        mockPrisma.item.findUnique.mockResolvedValue({
          id: 'item_123',
          userId: 'user-test-1', // Different from admin
        } as any);

        mockPrisma.item.update.mockResolvedValue(mockItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { name: 'Updated by Admin' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should allow owner to edit their item', async () => {
        (auth as any).mockResolvedValue(mockSession);

        mockPrisma.item.findUnique.mockResolvedValue({
          id: 'item_123',
          userId: 'user-test-1',
        } as any);

        mockPrisma.item.update.mockResolvedValue(mockItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { name: 'Updated by Owner' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should return 404 when item does not exist', async () => {
        (auth as any).mockResolvedValue(mockSession);

        mockPrisma.item.findUnique.mockResolvedValue(null);

        const params = Promise.resolve({ id: 'nonexistent' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/nonexistent',
          'PATCH',
          { name: 'Updated Name' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Item not found');
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        (auth as any).mockResolvedValue(mockSession);
        mockPrisma.item.findUnique.mockResolvedValue({
          id: 'item_123',
          userId: 'user-test-1',
        } as any);
      });

      it('should return 400 when category does not exist', async () => {
        mockPrisma.category.findUnique.mockResolvedValue(null);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { categoryId: 'nonexistent-category' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Invalid categoryId');
      });

      it('should return 400 when location does not exist', async () => {
        mockPrisma.location.findUnique.mockResolvedValue(null);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { locationId: 'nonexistent-location' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Invalid locationId');
      });

      it('should return 400 when tags do not exist', async () => {
        mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag_1' }] as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { tagIds: ['tag_1', 'nonexistent-tag'] }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Invalid tagIds');
      });

      it('should validate category exists before update', async () => {
        mockPrisma.category.findUnique.mockResolvedValue(mockCategory as any);
        mockPrisma.item.update.mockResolvedValue(mockItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { categoryId: 'cat_123' }
        );

        await PATCH(request, { params });

        expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
          where: { id: 'cat_123' },
        });
      });

      it('should validate location exists before update', async () => {
        mockPrisma.location.findUnique.mockResolvedValue(mockLocation as any);
        mockPrisma.item.update.mockResolvedValue(mockItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { locationId: 'loc_123' }
        );

        await PATCH(request, { params });

        expect(mockPrisma.location.findUnique).toHaveBeenCalledWith({
          where: { id: 'loc_123' },
        });
      });

      it('should validate all tags exist before update', async () => {
        mockPrisma.tag.findMany.mockResolvedValue([
          { id: 'tag_1' },
          { id: 'tag_2' },
        ] as any);
        mockPrisma.item.update.mockResolvedValue(mockItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { tagIds: ['tag_1', 'tag_2'] }
        );

        await PATCH(request, { params });

        expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
          where: { id: { in: ['tag_1', 'tag_2'] } },
          select: { id: true },
        });
      });
    });

    describe('Successful Updates', () => {
      beforeEach(() => {
        (auth as any).mockResolvedValue(mockSession);
        mockPrisma.item.findUnique.mockResolvedValue({
          id: 'item_123',
          userId: 'user-test-1',
        } as any);
      });

      it('should successfully update with partial fields', async () => {
        const updatedItem = { ...mockItem, name: 'Updated Name' };
        mockPrisma.item.update.mockResolvedValue(updatedItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { name: 'Updated Name' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('Updated Name');
      });

      it('should update all fields', async () => {
        const updateData = {
          name: 'New Name',
          description: 'New Description',
          quantity: 5,
          minQuantity: 2,
          serialNumber: 'SN-NEW-123',
          notes: 'Updated notes',
        };

        mockPrisma.item.update.mockResolvedValue({
          ...mockItem,
          ...updateData,
        } as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          updateData
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockPrisma.item.update).toHaveBeenCalled();
      });

      it('should update tags', async () => {
        mockPrisma.tag.findMany.mockResolvedValue([
          { id: 'tag_1' },
          { id: 'tag_2' },
          { id: 'tag_3' },
        ] as any);
        mockPrisma.item.update.mockResolvedValue(mockItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { tagIds: ['tag_1', 'tag_2', 'tag_3'] }
        );

        await PATCH(request, { params });

        expect(mockPrisma.item.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              tags: {
                deleteMany: {},
                create: [
                  { tag: { connect: { id: 'tag_1' } } },
                  { tag: { connect: { id: 'tag_2' } } },
                  { tag: { connect: { id: 'tag_3' } } },
                ],
              },
            }),
          })
        );
      });

      it('should update category with validation', async () => {
        mockPrisma.category.findUnique.mockResolvedValue(mockCategory as any);
        mockPrisma.item.update.mockResolvedValue({
          ...mockItem,
          categoryId: 'cat_new',
        } as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { categoryId: 'cat_new' }
        );

        const response = await PATCH(request, { params });

        expect(response.status).toBe(200);
        expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
          where: { id: 'cat_new' },
        });
      });

      it('should update location with validation', async () => {
        mockPrisma.location.findUnique.mockResolvedValue(mockLocation as any);
        mockPrisma.item.update.mockResolvedValue({
          ...mockItem,
          locationId: 'loc_new',
        } as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { locationId: 'loc_new' }
        );

        const response = await PATCH(request, { params });

        expect(response.status).toBe(200);
        expect(mockPrisma.location.findUnique).toHaveBeenCalledWith({
          where: { id: 'loc_new' },
        });
      });

      it('should filter out undefined values', async () => {
        mockPrisma.item.update.mockResolvedValue(mockItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { name: 'Updated Name', description: undefined }
        );

        await PATCH(request, { params });

        const updateCall = mockPrisma.item.update.mock.calls[0][0];
        expect(updateCall.data).not.toHaveProperty('description');
        expect(updateCall.data).toHaveProperty('name');
      });

      it('should include all relations in response', async () => {
        mockPrisma.item.update.mockResolvedValue({
          ...mockItem,
          tags: [
            {
              itemId: mockItem.id,
              tagId: 'tag_123',
              tag: mockTag,
            },
          ],
        } as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { name: 'Updated' }
        );

        await PATCH(request, { params });

        expect(mockPrisma.item.update).toHaveBeenCalledWith(
          expect.objectContaining({
            include: {
              category: true,
              location: true,
              tags: {
                include: {
                  tag: true,
                },
              },
            },
          })
        );
      });

      it('should handle empty tag array', async () => {
        mockPrisma.item.update.mockResolvedValue(mockItem as any);

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { tagIds: [] }
        );

        const response = await PATCH(request, { params });

        expect(response.status).toBe(200);
        // Empty array should not trigger tag validation
        expect(mockPrisma.tag.findMany).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        (auth as any).mockResolvedValue(mockSession);
        mockPrisma.item.findUnique.mockResolvedValue({
          id: 'item_123',
          userId: 'user-test-1',
        } as any);
      });

      it('should handle validation errors', async () => {
        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { quantity: 'not-a-number' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Validation error');
        expect(data.details).toBeDefined();
      });

      it('should handle database errors', async () => {
        mockPrisma.item.update.mockRejectedValue(new Error('Database error'));

        const params = Promise.resolve({ id: 'item_123' });
        const request = createMockRequest(
          'http://localhost:3001/api/items/item_123',
          'PATCH',
          { name: 'Updated' }
        );

        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to update item');
      });
    });
  });
});
