import { prisma } from '@/lib/db'

export async function getAllItems() {
  return prisma.item.findMany({
    include: {
      category: true,
      location: true,
      tags: {
        include: {
          tag: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })
}

export async function getItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  })
}

export async function getItemsByCategory(categoryId: string) {
  return prisma.item.findMany({
    where: { categoryId },
    include: {
      category: true,
      location: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  })
}

export async function searchItems(query: string) {
  return prisma.item.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } }
      ]
    },
    take: 20
  })
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getAllTags() {
  return prisma.tag.findMany({
    include: {
      _count: {
        select: { itemTags: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getAllLocations() {
  return prisma.location.findMany({
    include: {
      _count: {
        select: { items: true }
      },
      parent: true
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getRecentItems(limit: number = 10) {
  return prisma.item.findMany({
    include: {
      category: true,
      location: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })
}

export async function getItemStats() {
  const [totalItems, totalCategories, totalTags] = await Promise.all([
    prisma.item.count(),
    prisma.category.count(),
    prisma.tag.count()
  ])

  return {
    totalItems,
    totalCategories,
    totalTags
  }
}
