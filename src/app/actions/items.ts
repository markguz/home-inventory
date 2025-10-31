'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ItemFormData } from '@/types/item';

export async function createItem(data: ItemFormData, userId: string) {
  try {
    const item = await prisma.item.create({
      data: {
        ...data,
        userId,
      },
      include: {
        category: true,
        location: true,
      },
    });

    revalidatePath('/items');
    return { success: true, item };
  } catch (error) {
    console.error('Failed to create item:', error);
    return { success: false, error: 'Failed to create item' };
  }
}

export async function updateItem(id: string, data: ItemFormData, userId: string) {
  try {
    // Verify ownership
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingItem) {
      return { success: false, error: 'Item not found' };
    }

    if (existingItem.userId !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const item = await prisma.item.update({
      where: { id },
      data,
      include: {
        category: true,
        location: true,
      },
    });

    revalidatePath('/items');
    revalidatePath(`/items/${id}`);
    return { success: true, item };
  } catch (error) {
    console.error('Failed to update item:', error);
    return { success: false, error: 'Failed to update item' };
  }
}

export async function deleteItem(id: string, userId: string) {
  try {
    // Verify ownership
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingItem) {
      return { success: false, error: 'Item not found' };
    }

    if (existingItem.userId !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.item.delete({
      where: { id },
    });

    revalidatePath('/items');
    redirect('/items');
  } catch (error) {
    console.error('Failed to delete item:', error);
    return { success: false, error: 'Failed to delete item' };
  }
}

export async function getItem(id: string, userId: string) {
  try {
    const item = await prisma.item.findUnique({
      where: { id },
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

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    if (item.userId !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    return { success: true, item };
  } catch (error) {
    console.error('Failed to get item:', error);
    return { success: false, error: 'Failed to get item' };
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, categories };
  } catch (error) {
    console.error('Failed to get categories:', error);
    return { success: false, error: 'Failed to get categories', categories: [] };
  }
}

export async function getLocations() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, locations };
  } catch (error) {
    console.error('Failed to get locations:', error);
    return { success: false, error: 'Failed to get locations', locations: [] };
  }
}
