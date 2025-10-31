// Mock Prisma client FIRST (before any imports)
const mockPrisma = {
  location: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  item: {
    update: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock Next.js cache functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { updateItem } from '@/app/actions/items';

describe('updateItem Server Action', () => {
  const mockItemId = 'item-123';
  const mockLocationId = 'loc-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Updates', () => {
    it('should successfully update item with valid data', async () => {
      const formData = new FormData();
      formData.append('name', 'Updated Item');
      formData.append('description', 'Updated description');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Garage');
      formData.append('quantity', '5');
      formData.append('serialNumber', 'SN12345');
      formData.append('notes', 'Updated notes');

      // Mock location lookup
      mockPrisma.location.findUnique.mockResolvedValue({
        id: mockLocationId,
        name: 'Garage',
      });

      // Mock item update
      mockPrisma.item.update.mockResolvedValue({
        id: mockItemId,
        name: 'Updated Item',
        description: 'Updated description',
        categoryId: 'cat-1',
        locationId: mockLocationId,
        quantity: 5,
        serialNumber: 'SN12345',
        notes: 'Updated notes',
      });

      const result = await updateItem(mockItemId, formData);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: mockItemId },
        data: {
          name: 'Updated Item',
          description: 'Updated description',
          categoryId: 'cat-1',
          locationId: mockLocationId,
          quantity: 5,
          serialNumber: 'SN12345',
          notes: 'Updated notes',
        },
      });
    });

    it('should create new location if it does not exist', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'New Location');
      formData.append('quantity', '1');

      // Mock location not found, then created
      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.location.create as jest.Mock).mockResolvedValue({
        id: 'new-loc-789',
        name: 'New Location',
      });
      (mockPrisma.item.update as jest.Mock).mockResolvedValue({
        id: mockItemId,
        locationId: 'new-loc-789',
      });

      const result = await updateItem(mockItemId, formData);

      expect(mockPrisma.location.findUnique).toHaveBeenCalledWith({
        where: { name: 'New Location' },
      });
      expect(mockPrisma.location.create).toHaveBeenCalledWith({
        data: { name: 'New Location' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle optional fields when not provided', async () => {
      const formData = new FormData();
      formData.append('name', 'Minimal Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '1');

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        name: 'Office',
      });
      (mockPrisma.item.update as jest.Mock).mockResolvedValue({
        id: mockItemId,
      });

      const result = await updateItem(mockItemId, formData);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.item.update).toHaveBeenCalledWith({
        where: { id: mockItemId },
        data: expect.objectContaining({
          name: 'Minimal Item',
          categoryId: 'cat-1',
          quantity: 1,
          description: undefined,
          serialNumber: undefined,
          notes: undefined,
        }),
      });
    });

    it('should update item with partial data', async () => {
      const formData = new FormData();
      formData.append('name', 'Partially Updated');
      formData.append('categoryId', 'cat-2');
      formData.append('location', 'Basement');
      formData.append('quantity', '3');

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        name: 'Basement',
      });
      (mockPrisma.item.update as jest.Mock).mockResolvedValue({
        id: mockItemId,
      });

      const result = await updateItem(mockItemId, formData);

      expect(result.success).toBe(true);
      expect(mockPrisma.item.update).toHaveBeenCalled();
    });
  });

  describe('Validation Failures', () => {
    it('should return error when name is missing', async () => {
      const formData = new FormData();
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '1');

      const result = await updateItem(mockItemId, formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });

    it('should return error when name is empty string', async () => {
      const formData = new FormData();
      formData.append('name', '');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '1');

      const result = await updateItem(mockItemId, formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });

    it('should return error when category is missing', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('location', 'Office');
      formData.append('quantity', '1');

      const result = await updateItem(mockItemId, formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });

    it('should return error when location is missing', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('quantity', '1');

      const result = await updateItem(mockItemId, formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });

    it('should return error when quantity is negative', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '-5');

      const result = await updateItem(mockItemId, formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });

    it('should return error when name exceeds 200 characters', async () => {
      const formData = new FormData();
      formData.append('name', 'a'.repeat(201));
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '1');

      const result = await updateItem(mockItemId, formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });

    it('should return error when location exceeds 200 characters', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'a'.repeat(201));
      formData.append('quantity', '1');

      const result = await updateItem(mockItemId, formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });

    it('should return error when serial number exceeds 100 characters', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '1');
      formData.append('serialNumber', 'a'.repeat(101));

      const result = await updateItem(mockItemId, formData);

      expect(result.error).toBeDefined();
      expect(mockPrisma.item.update).not.toHaveBeenCalled();
    });
  });

  describe('Database Errors', () => {
    it('should handle database error gracefully', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '1');

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        name: 'Office',
      });
      (mockPrisma.item.update as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await updateItem(mockItemId, formData);

      expect(result).toEqual({ error: 'Failed to update item' });
    });

    it('should handle location creation error', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'New Location');
      formData.append('quantity', '1');

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.location.create as jest.Mock).mockRejectedValue(
        new Error('Failed to create location')
      );

      const result = await updateItem(mockItemId, formData);

      expect(result).toEqual({ error: 'Failed to update item' });
    });

    it('should handle item not found error', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '1');

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        name: 'Office',
      });
      (mockPrisma.item.update as jest.Mock).mockRejectedValue(
        new Error('Record to update not found')
      );

      const result = await updateItem(mockItemId, formData);

      expect(result).toEqual({ error: 'Failed to update item' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '0');

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        name: 'Office',
      });
      (mockPrisma.item.update as jest.Mock).mockResolvedValue({
        id: mockItemId,
        quantity: 0,
      });

      const result = await updateItem(mockItemId, formData);

      expect(result.success).toBe(true);
      expect(mockPrisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: 0 }),
        })
      );
    });

    it('should handle special characters in text fields', async () => {
      const formData = new FormData();
      formData.append('name', 'Item with "quotes" & special chars <html>');
      formData.append('categoryId', 'cat-1');
      formData.append('location', "O'Brien's Garage");
      formData.append('quantity', '1');
      formData.append('notes', 'Notes with\nmultiple\nlines');

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        name: "O'Brien's Garage",
      });
      (mockPrisma.item.update as jest.Mock).mockResolvedValue({
        id: mockItemId,
      });

      const result = await updateItem(mockItemId, formData);

      expect(result.success).toBe(true);
    });

    it('should handle very long valid serial number (100 chars)', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '1');
      formData.append('serialNumber', 'a'.repeat(100));

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        name: 'Office',
      });
      (mockPrisma.item.update as jest.Mock).mockResolvedValue({
        id: mockItemId,
      });

      const result = await updateItem(mockItemId, formData);

      expect(result.success).toBe(true);
    });

    it('should convert string quantity to number', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('categoryId', 'cat-1');
      formData.append('location', 'Office');
      formData.append('quantity', '42');

      (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        name: 'Office',
      });
      (mockPrisma.item.update as jest.Mock).mockResolvedValue({
        id: mockItemId,
      });

      const result = await updateItem(mockItemId, formData);

      expect(result.success).toBe(true);
      expect(mockPrisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: 42 }),
        })
      );
    });
  });
});
