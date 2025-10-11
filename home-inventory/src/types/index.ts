import { Prisma } from '@prisma/client'

// Use Prisma-generated types
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Item = Prisma.ItemGetPayload<{}>
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Category = Prisma.CategoryGetPayload<{}>
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Tag = Prisma.TagGetPayload<{}>
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Location = Prisma.LocationGetPayload<{}>

// Create types for insertions
export type NewItem = Prisma.ItemCreateInput
export type NewCategory = Prisma.CategoryCreateInput
export type NewTag = Prisma.TagCreateInput

// Item with relations
export type ItemWithRelations = Prisma.ItemGetPayload<{
  include: {
    category: true
    location: true
    tags: {
      include: {
        tag: true
      }
    }
  }
}>

export type FilterParams = {
  category?: string
  location?: string
  search?: string
  tags?: string[]
}
