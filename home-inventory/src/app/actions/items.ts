'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { items } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { itemSchema } from '@/lib/validations'

export async function createItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    location: formData.get('location'),
    quantity: Number(formData.get('quantity')) || 1,
    serialNumber: formData.get('serialNumber') || undefined,
    modelNumber: formData.get('modelNumber') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    const result = await db.insert(items).values(parsed.data).returning()
    revalidatePath('/items')
    return { success: true, data: result[0] }
  } catch (error) {
    return { error: 'Failed to create item' }
  }
}

export async function updateItem(id: string, formData: FormData) {
  const parsed = itemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    location: formData.get('location'),
    quantity: Number(formData.get('quantity')) || 1,
    serialNumber: formData.get('serialNumber') || undefined,
    modelNumber: formData.get('modelNumber') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.update(items)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(items.id, id))
    
    revalidatePath('/items')
    revalidatePath(`/items/${id}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update item' }
  }
}

export async function deleteItem(id: string) {
  try {
    await db.delete(items).where(eq(items.id, id))
    revalidatePath('/items')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete item' }
  }
}
