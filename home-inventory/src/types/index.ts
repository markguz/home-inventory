import { items, categories, tags, itemsToTags } from '@/db/schema'

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert

export type ItemWithRelations = Item & {
  category: Category
  tags: Array<{
    tag: Tag
  }>
}

export type FilterParams = {
  category?: string
  location?: string
  search?: string
  tags?: string[]
}
