import { z } from 'zod';

/**
 * Item validation schema
 */
export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity must be at least 0').default(1),
  minQuantity: z.coerce.number().int().min(0, 'Min quantity must be at least 0').optional(),
  purchaseDate: z.union([z.string(), z.date()]).optional().transform(val => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  purchasePrice: z.coerce.number().min(0, 'Purchase price must be positive').optional(),
  currentValue: z.coerce.number().min(0, 'Current value must be positive').optional(),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).default('good'),
  notes: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  barcode: z.string().optional(),
  serialNumber: z.string().optional(),
  warrantyUntil: z.union([z.string(), z.date()]).optional().transform(val => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  categoryId: z.string().min(1, 'Category is required'),
  locationId: z.string().min(1, 'Location is required'),
  userId: z.string().min(1, 'User ID is required'),
  tags: z.array(z.string()).optional(),
});

export type ItemFormData = z.infer<typeof itemSchema>;

/**
 * Category validation schema
 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  minQuantity: z.coerce.number().int().min(0).optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

/**
 * Location validation schema
 */
export const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export type LocationFormData = z.infer<typeof locationSchema>;

/**
 * Tag validation schema
 */
export const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().optional(),
});

export type TagFormData = z.infer<typeof tagSchema>;

/**
 * Search query schema
 */
export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  condition: z.string().optional(),
  minQuantity: z.coerce.number().optional(),
  maxQuantity: z.coerce.number().optional(),
});

export type SearchQuery = z.infer<typeof searchSchema>;
