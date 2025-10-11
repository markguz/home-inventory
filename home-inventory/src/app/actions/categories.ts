'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
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
    const result = await prisma.category.create({
      data: parsed.data
    })
    revalidatePath('/categories')
    return { success: true, data: result }
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
    await prisma.category.update({
      where: { id },
      data: parsed.data
    })

    revalidatePath('/categories')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update category' }
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    })
    revalidatePath('/categories')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete category' }
  }
}
