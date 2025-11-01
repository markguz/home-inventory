'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { itemSchema } from '@/lib/validations'
import { auth } from '@/auth'

/**
 * Helper function to find or create a location by name
 * Maintains backward compatibility with text-based location field
 */
async function findOrCreateLocation(locationName: string) {
  let location = await prisma.location.findUnique({
    where: { name: locationName }
  })

  if (!location) {
    location = await prisma.location.create({
      data: { name: locationName }
    })
  }

  return location
}

export async function createItem(formData: FormData) {
  // Check authentication
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  const parsed = itemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    location: formData.get('location'),
    quantity: Number(formData.get('quantity')) || 1,
    serialNumber: formData.get('serialNumber') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    // Create item with Prisma
    const result = await prisma.item.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        locationId: parsed.data.locationId,
        quantity: parsed.data.quantity,
        serialNumber: parsed.data.serialNumber,
        notes: parsed.data.notes,
        userId: session.user.id,
      }
    })

    revalidatePath('/items')
    return { success: true, data: result }
  } catch (error) {
    return { error: 'Failed to create item' }
  }
}

export async function updateItem(id: string, formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    locationId: formData.get('locationId'),
    quantity: Number(formData.get('quantity')) || 1,
    serialNumber: formData.get('serialNumber') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    // Update item with Prisma
    await prisma.item.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        locationId: parsed.data.locationId,
        quantity: parsed.data.quantity,
        serialNumber: parsed.data.serialNumber,
        notes: parsed.data.notes,
      }
    })

    revalidatePath('/items')
    revalidatePath(`/items/${id}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update item' }
  }
}

export async function deleteItem(id: string) {
  try {
    await prisma.item.delete({
      where: { id }
    })
    revalidatePath('/items')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete item' }
  }
}
