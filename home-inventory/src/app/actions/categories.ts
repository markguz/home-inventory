'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { categorySchema } from '@/lib/validations'

export async function createCategory(formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    icon: formData.get('icon') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    const result = await db.insert(categories).values(parsed.data).returning()
    revalidatePath('/categories')
    return { success: true, data: result[0] }
  } catch (error) {
    return { error: 'Failed to create category' }
  }
}

export async function updateCategory(id: string, formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    icon: formData.get('icon') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.update(categories)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(categories.id, id))
    
    revalidatePath('/categories')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update category' }
  }
}

export async function deleteCategory(id: string) {
  try {
    await db.delete(categories).where(eq(categories.id, id))
    revalidatePath('/categories')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete category' }
  }
}
