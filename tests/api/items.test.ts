import { GET, POST, PUT, DELETE } from '@/app/api/items/route';
import { prismaMock } from '../mocks/prisma';
import { mockItems, createMockItem } from '../fixtures/items';

describe('Items API Routes', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      prismaMock.item.findMany.mockResolvedValue(mockItems);

      const request = new Request('http://localhost:3000/api/items');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(3);
      expect(prismaMock.item.findMany).toHaveBeenCalled();
    });

    it('should filter items by category', async () => {
      const electronicsItems = mockItems.filter(i => i.category === 'Electronics');
      prismaMock.item.findMany.mockResolvedValue(electronicsItems);

      const request = new Request('http://localhost:3000/api/items?category=Electronics');
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].category).toBe('Electronics');
    });

    it('should search items by name', async () => {
      prismaMock.item.findMany.mockResolvedValue([mockItems[0]]);

      const request = new Request('http://localhost:3000/api/items?search=laptop');
      const response = await GET(request);
      const data = await response.json();

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({ contains: 'laptop' })
          })
        })
      );
    });

    it('should handle database errors', async () => {
      prismaMock.item.findMany.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/items');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/items', () => {
    it('should create new item', async () => {
      const newItem = createMockItem({ id: '4', name: 'New Item' });
      prismaMock.item.create.mockResolvedValue(newItem);

      const request = new Request('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Item',
          category: 'Other',
          location: 'Office',
          quantity: 1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.item.name).toBe('New Item');
      expect(prismaMock.item.create).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const request = new Request('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle duplicate items', async () => {
      prismaMock.item.create.mockRejectedValue({ code: 'P2002' });

      const request = new Request('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: 'Duplicate', category: 'Other' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /api/items/[id]', () => {
    it('should update existing item', async () => {
      const updatedItem = { ...mockItems[0], name: 'Updated Laptop' };
      prismaMock.item.update.mockResolvedValue(updatedItem);

      const request = new Request('http://localhost:3000/api/items/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Laptop' }),
      });

      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.item.name).toBe('Updated Laptop');
    });

    it('should return 404 for non-existent item', async () => {
      prismaMock.item.update.mockRejectedValue({ code: 'P2025' });

      const request = new Request('http://localhost:3000/api/items/999', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await PUT(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/items/[id]', () => {
    it('should delete item', async () => {
      prismaMock.item.delete.mockResolvedValue(mockItems[0]);

      const request = new Request('http://localhost:3000/api/items/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: '1' } });

      expect(response.status).toBe(204);
      expect(prismaMock.item.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should return 404 for non-existent item', async () => {
      prismaMock.item.delete.mockRejectedValue({ code: 'P2025' });

      const request = new Request('http://localhost:3000/api/items/999', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
    });
  });
});
