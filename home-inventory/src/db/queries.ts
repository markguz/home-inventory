import { db } from './index'
import { items, categories, tags, itemsToTags } from './schema'
import { eq, and, like, desc, sql, isNull } from 'drizzle-orm'

export async function getAllItems() {
  return db.query.items.findMany({
    with: {
      category: true,
      tags: { with: { tag: true } }
    },
    orderBy: desc(items.updatedAt)
  })
}

export async function getItemById(id: string) {
  return db.query.items.findFirst({
    where: eq(items.id, id),
    with: {
      category: true,
      tags: { with: { tag: true } }
    }
  })
}

export async function getItemsByCategory(categoryId: string) {
  return db.query.items.findMany({
    where: eq(items.categoryId, categoryId),
    with: {
      category: true,
      tags: { with: { tag: true } }
    }
  })
}

export async function searchItems(query: string) {
  const searchPattern = `%${query}%`
  return db.select().from(items).where(
    sql`${items.name} LIKE ${searchPattern} OR ${items.description} LIKE ${searchPattern}`
  ).limit(20)
}

export async function getAllCategories() {
  return db.select().from(categories).orderBy(categories.name)
}

export async function getAllTags() {
  return db.select().from(tags).orderBy(tags.name)
}

export async function getRecentItems(limit: number = 10) {
  return db.query.items.findMany({
    with: { category: true },
    orderBy: desc(items.createdAt),
    limit
  })
}

export async function getItemStats() {
  const totalItems = await db.select({ count: sql<number>`count(*)` }).from(items)
  const totalCategories = await db.select({ count: sql<number>`count(*)` }).from(categories)
  const totalTags = await db.select({ count: sql<number>`count(*)` }).from(tags)
  return {
    totalItems: totalItems[0].count,
    totalCategories: totalCategories[0].count,
    totalTags: totalTags[0].count
  }
}
