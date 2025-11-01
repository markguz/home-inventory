import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';

describe('Edit Item Integration Tests', () => {
  let testUserId: string;
  let testCategoryId: string;
  let testLocationId: string;
  let testItemId: string;
  let testTag1Id: string;
  let testTag2Id: string;
  let otherUserId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `edit-test-${Date.now()}@example.com`,
        name: 'Edit Test User',
      },
    });
    testUserId = testUser.id;

    // Create other user for permission tests
    const otherUser = await prisma.user.create({
      data: {
        email: `other-user-${Date.now()}@example.com`,
        name: 'Other User',
      },
    });
    otherUserId = otherUser.id;

    // Create test category
    const testCategory = await prisma.category.create({
      data: {
        name: `Test Category ${Date.now()}`,
        slug: `test-category-${Date.now()}`,
      },
    });
    testCategoryId = testCategory.id;

    // Create test location
    const testLocation = await prisma.location.create({
      data: {
        name: `Test Location ${Date.now()}`,
      },
    });
    testLocationId = testLocation.id;

    // Create test tags
    const tag1 = await prisma.tag.create({
      data: {
        name: `Tag1-${Date.now()}`,
        color: '#FF0000',
      },
    });
    testTag1Id = tag1.id;

    const tag2 = await prisma.tag.create({
      data: {
        name: `Tag2-${Date.now()}`,
        color: '#00FF00',
      },
    });
    testTag2Id = tag2.id;
  });

  beforeEach(async () => {
    // Create fresh test item before each test
    const testItem = await prisma.item.create({
      data: {
        name: 'Original Item',
        description: 'Original description',
        quantity: 1,
        condition: 'good',
        userId: testUserId,
        categoryId: testCategoryId,
        locationId: testLocationId,
      },
    });
    testItemId = testItem.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.itemTag.deleteMany({
      where: {
        OR: [
          { item: { userId: testUserId } },
          { item: { userId: otherUserId } },
        ],
      },
    });

    await prisma.item.deleteMany({
      where: {
        OR: [{ userId: testUserId }, { userId: otherUserId }],
      },
    });

    await prisma.tag.deleteMany({
      where: {
        id: { in: [testTag1Id, testTag2Id] },
      },
    });

    await prisma.location.deleteMany({
      where: { id: testLocationId },
    });

    await prisma.category.deleteMany({
      where: { id: testCategoryId },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [testUserId, otherUserId] },
      },
    });

    await prisma.$disconnect();
  });

  describe('Full Edit Flow', () => {
    it('should successfully update item with basic fields', async () => {
      const updatedData = {
        name: 'Updated Item Name',
        description: 'Updated description',
        quantity: 5,
      };

      const updatedItem = await prisma.item.update({
        where: { id: testItemId },
        data: updatedData,
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

      expect(updatedItem.name).toBe('Updated Item Name');
      expect(updatedItem.description).toBe('Updated description');
      expect(updatedItem.quantity).toBe(5);
      expect(updatedItem.category).toBeDefined();
      expect(updatedItem.location).toBeDefined();
    });

    it('should update item with all optional fields', async () => {
      const updateData = {
        name: 'Complete Update',
        description: 'Full description',
        quantity: 10,
        minQuantity: 3,
        serialNumber: 'SN-123456',
        notes: 'Important notes',
        purchasePrice: 299.99,
        currentValue: 250.0,
        condition: 'excellent' as const,
        purchaseDate: new Date('2024-01-15'),
        warrantyUntil: new Date('2027-01-15'),
        imageUrl: 'https://example.com/image.jpg',
        barcode: '1234567890123',
      };

      const updatedItem = await prisma.item.update({
        where: { id: testItemId },
        data: updateData,
      });

      expect(updatedItem.name).toBe('Complete Update');
      expect(updatedItem.quantity).toBe(10);
      expect(updatedItem.minQuantity).toBe(3);
      expect(updatedItem.serialNumber).toBe('SN-123456');
      expect(updatedItem.notes).toBe('Important notes');
      expect(updatedItem.purchasePrice).toBe(299.99);
      expect(updatedItem.currentValue).toBe(250.0);
      expect(updatedItem.condition).toBe('excellent');
      expect(updatedItem.barcode).toBe('1234567890123');
    });

    it('should update item category', async () => {
      const newCategory = await prisma.category.create({
        data: {
          name: `New Category ${Date.now()}`,
          slug: `new-category-${Date.now()}`,
        },
      });

      const updatedItem = await prisma.item.update({
        where: { id: testItemId },
        data: { categoryId: newCategory.id },
        include: { category: true },
      });

      expect(updatedItem.categoryId).toBe(newCategory.id);
      expect(updatedItem.category.name).toBe(newCategory.name);

      // Cleanup
      await prisma.category.delete({ where: { id: newCategory.id } });
    });

    it('should update item location', async () => {
      const newLocation = await prisma.location.create({
        data: {
          name: `New Location ${Date.now()}`,
        },
      });

      const updatedItem = await prisma.item.update({
        where: { id: testItemId },
        data: { locationId: newLocation.id },
        include: { location: true },
      });

      expect(updatedItem.locationId).toBe(newLocation.id);
      expect(updatedItem.location.name).toBe(newLocation.name);

      // Cleanup
      await prisma.location.delete({ where: { id: newLocation.id } });
    });

    it('should update item tags', async () => {
      // Delete existing tags first
      await prisma.itemTag.deleteMany({
        where: { itemId: testItemId },
      });

      // Add new tags
      const updatedItem = await prisma.item.update({
        where: { id: testItemId },
        data: {
          tags: {
            create: [
              { tag: { connect: { id: testTag1Id } } },
              { tag: { connect: { id: testTag2Id } } },
            ],
          },
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      expect(updatedItem.tags).toHaveLength(2);
      expect(updatedItem.tags.map((t) => t.tagId)).toContain(testTag1Id);
      expect(updatedItem.tags.map((t) => t.tagId)).toContain(testTag2Id);
    });

    it('should replace existing tags', async () => {
      // Add initial tag
      await prisma.itemTag.create({
        data: {
          itemId: testItemId,
          tagId: testTag1Id,
        },
      });

      // Replace with different tag
      await prisma.itemTag.deleteMany({
        where: { itemId: testItemId },
      });

      const updatedItem = await prisma.item.update({
        where: { id: testItemId },
        data: {
          tags: {
            create: [{ tag: { connect: { id: testTag2Id } } }],
          },
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      expect(updatedItem.tags).toHaveLength(1);
      expect(updatedItem.tags[0].tagId).toBe(testTag2Id);
    });

    it('should remove all tags', async () => {
      // Add tags first
      await prisma.itemTag.createMany({
        data: [
          { itemId: testItemId, tagId: testTag1Id },
          { itemId: testItemId, tagId: testTag2Id },
        ],
      });

      // Remove all tags
      await prisma.itemTag.deleteMany({
        where: { itemId: testItemId },
      });

      const item = await prisma.item.findUnique({
        where: { id: testItemId },
        include: { tags: true },
      });

      expect(item?.tags).toHaveLength(0);
    });
  });

  describe('Data Persistence', () => {
    it('should persist changes across queries', async () => {
      // Update item
      await prisma.item.update({
        where: { id: testItemId },
        data: {
          name: 'Persisted Name',
          quantity: 99,
        },
      });

      // Fetch item again
      const fetchedItem = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      expect(fetchedItem?.name).toBe('Persisted Name');
      expect(fetchedItem?.quantity).toBe(99);
    });

    it('should maintain relationships after update', async () => {
      await prisma.item.update({
        where: { id: testItemId },
        data: { name: 'Updated Name' },
      });

      const item = await prisma.item.findUnique({
        where: { id: testItemId },
        include: {
          category: true,
          location: true,
        },
      });

      expect(item?.category.id).toBe(testCategoryId);
      expect(item?.location.id).toBe(testLocationId);
    });

    it('should update timestamp on modification', async () => {
      const originalItem = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      await prisma.item.update({
        where: { id: testItemId },
        data: { name: 'Updated' },
      });

      const updatedItem = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      expect(updatedItem?.updatedAt.getTime()).toBeGreaterThan(
        originalItem!.updatedAt.getTime()
      );
    });
  });

  describe('Validation & Constraints', () => {
    it('should fail when updating with invalid category', async () => {
      await expect(
        prisma.item.update({
          where: { id: testItemId },
          data: { categoryId: 'nonexistent-category' },
        })
      ).rejects.toThrow();
    });

    it('should fail when updating with invalid location', async () => {
      await expect(
        prisma.item.update({
          where: { id: testItemId },
          data: { locationId: 'nonexistent-location' },
        })
      ).rejects.toThrow();
    });

    it('should fail when adding nonexistent tag', async () => {
      await expect(
        prisma.item.update({
          where: { id: testItemId },
          data: {
            tags: {
              create: [{ tag: { connect: { id: 'nonexistent-tag' } } }],
            },
          },
        })
      ).rejects.toThrow();
    });

    it('should maintain data integrity with concurrent updates', async () => {
      const updates = [
        prisma.item.update({
          where: { id: testItemId },
          data: { quantity: 10 },
        }),
        prisma.item.update({
          where: { id: testItemId },
          data: { name: 'Concurrent Update' },
        }),
      ];

      await Promise.all(updates);

      const item = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      expect(item?.quantity).toBe(10);
      expect(item?.name).toBe('Concurrent Update');
    });
  });

  describe('Partial Updates', () => {
    it('should only update specified fields', async () => {
      const originalItem = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      await prisma.item.update({
        where: { id: testItemId },
        data: { name: 'Only Name Changed' },
      });

      const updatedItem = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      expect(updatedItem?.name).toBe('Only Name Changed');
      expect(updatedItem?.description).toBe(originalItem?.description);
      expect(updatedItem?.quantity).toBe(originalItem?.quantity);
      expect(updatedItem?.categoryId).toBe(originalItem?.categoryId);
    });

    it('should update single optional field', async () => {
      await prisma.item.update({
        where: { id: testItemId },
        data: { serialNumber: 'SN-UPDATED' },
      });

      const item = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      expect(item?.serialNumber).toBe('SN-UPDATED');
    });

    it('should set optional field to null', async () => {
      // First set a value
      await prisma.item.update({
        where: { id: testItemId },
        data: { notes: 'Some notes' },
      });

      // Then set to null
      await prisma.item.update({
        where: { id: testItemId },
        data: { notes: null },
      });

      const item = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      expect(item?.notes).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should not update if transaction fails', async () => {
      const originalName = 'Original Name';
      await prisma.item.update({
        where: { id: testItemId },
        data: { name: originalName },
      });

      try {
        await prisma.$transaction(async (tx) => {
          await tx.item.update({
            where: { id: testItemId },
            data: { name: 'Transaction Update' },
          });

          // Force transaction to fail
          throw new Error('Transaction rollback');
        });
      } catch (error) {
        // Expected error
      }

      const item = await prisma.item.findUnique({
        where: { id: testItemId },
      });

      expect(item?.name).toBe(originalName);
    });
  });
});
