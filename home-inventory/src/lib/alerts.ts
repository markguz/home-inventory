import { prisma } from './db'

/**
 * Alert detection service for consumables with minimum quantity tracking
 */

export interface LowStockItem {
  id: string
  name: string
  quantity: number
  minQuantity: number
  category: {
    id: string
    name: string
    icon: string | null
    color: string | null
  }
  location: {
    id: string
    name: string
  }
}

export interface AlertSummary {
  totalAlerts: number
  categoryCounts: Record<string, number>
  items: LowStockItem[]
}

/**
 * Get all items with low stock
 * An item is considered low stock if:
 * - Item has minQuantity set and quantity < minQuantity, OR
 * - Item has no minQuantity but category has minQuantity and quantity < category.minQuantity
 */
export async function getItemsWithLowStock(): Promise<LowStockItem[]> {
  const items = await prisma.item.findMany({
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
          minQuantity: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Filter items that are below threshold
  const lowStockItems = items.filter((item) => {
    const threshold = item.minQuantity ?? item.category.minQuantity

    // Only alert if a threshold is set and quantity is below it
    if (threshold !== null && threshold !== undefined) {
      return item.quantity < threshold
    }

    return false
  })

  return lowStockItems.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    minQuantity: (item.minQuantity ?? item.category.minQuantity) as number,
    category: {
      id: item.category.id,
      name: item.category.name,
      icon: item.category.icon,
      color: item.category.color,
    },
    location: item.location,
  }))
}

/**
 * Check if a specific item has low stock alert
 */
export async function checkItemAlert(itemId: string): Promise<boolean> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      category: {
        select: {
          minQuantity: true,
        },
      },
    },
  })

  if (!item) {
    return false
  }

  const threshold = item.minQuantity ?? item.category.minQuantity

  if (threshold !== null && threshold !== undefined) {
    return item.quantity < threshold
  }

  return false
}

/**
 * Get count of low stock items per category
 */
export async function getCategoryAlertCount(
  categoryId: string
): Promise<number> {
  const items = await prisma.item.findMany({
    where: { categoryId },
    include: {
      category: {
        select: {
          minQuantity: true,
        },
      },
    },
  })

  const lowStockCount = items.filter((item) => {
    const threshold = item.minQuantity ?? item.category.minQuantity

    if (threshold !== null && threshold !== undefined) {
      return item.quantity < threshold
    }

    return false
  }).length

  return lowStockCount
}

/**
 * Get comprehensive alert summary with category grouping
 */
export async function getAlertSummary(): Promise<AlertSummary> {
  const lowStockItems = await getItemsWithLowStock()

  const categoryCounts = lowStockItems.reduce(
    (acc, item) => {
      const categoryName = item.category.name
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    totalAlerts: lowStockItems.length,
    categoryCounts,
    items: lowStockItems,
  }
}

/**
 * Get effective minimum quantity for an item (item override or category default)
 */
export async function getEffectiveMinQuantity(
  itemId: string
): Promise<number | null> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      category: {
        select: {
          minQuantity: true,
        },
      },
    },
  })

  if (!item) {
    return null
  }

  return item.minQuantity ?? item.category.minQuantity ?? null
}
