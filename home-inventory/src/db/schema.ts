import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const items = sqliteTable('items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: text('category_id').notNull().references(() => categories.id),
  location: text('location').notNull(),
  quantity: integer('quantity').notNull().default(1),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  purchasePrice: real('purchase_price'),
  purchaseLocation: text('purchase_location'),
  warrantyExpiry: integer('warranty_expiry', { mode: 'timestamp' }),
  lastMaintenance: integer('last_maintenance', { mode: 'timestamp' }),
  imageUrl: text('image_url'),
  imageUrls: text('image_urls', { mode: 'json' }).$type<string[]>(),
  serialNumber: text('serial_number'),
  modelNumber: text('model_number'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const itemsToTags = sqliteTable('items_to_tags', {
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
})

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id]
  }),
  tags: many(itemsToTags)
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items)
}))

export const itemsToTagsRelations = relations(itemsToTags, ({ one }) => ({
  item: one(items, {
    fields: [itemsToTags.itemId],
    references: [items.id]
  }),
  tag: one(tags, {
    fields: [itemsToTags.tagId],
    references: [tags.id]
  })
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  items: many(itemsToTags)
}))
