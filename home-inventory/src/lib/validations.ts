import { z } from 'zod'

export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required').max(200),
  quantity: z.number().int().min(0).default(1),
  purchaseDate: z.date().optional(),
  purchasePrice: z.number().positive().optional(),
  purchaseLocation: z.string().max(200).optional(),
  warrantyExpiry: z.date().optional(),
  lastMaintenance: z.date().optional(),
  imageUrl: z.string().url().optional(),
  serialNumber: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
})

export const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color hex').optional(),
})

export const itemUpdateSchema = itemSchema.partial().extend({
  id: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

export const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
})

export type ItemFormData = z.infer<typeof itemSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type TagFormData = z.infer<typeof tagSchema>
export type LocationFormData = z.infer<typeof locationSchema>
