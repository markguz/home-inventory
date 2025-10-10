import { db } from './index'
import { categories, items } from './schema'

async function seed() {
  console.log('Seeding database...')

  // Clear existing data (in reverse order due to foreign keys)
  console.log('Clearing existing data...')
  await db.delete(items)
  await db.delete(categories)

  console.log('Inserting seed data...')

  // Create categories
  const categoryData = await db.insert(categories).values([
    {
      name: 'Home',
      slug: 'home',
      description: 'Household items and furniture',
      icon: 'home'
    },
    {
      name: 'Garage',
      slug: 'garage',
      description: 'Tools, equipment, and garage items',
      icon: 'wrench'
    },
    {
      name: 'Automobile',
      slug: 'automobile',
      description: 'Vehicle parts and accessories',
      icon: 'car'
    }
  ]).returning()

  console.log('Created categories:', categoryData.length)

  // Create sample items
  const homeCategory = categoryData.find(c => c.slug === 'home')
  const garageCategory = categoryData.find(c => c.slug === 'garage')

  if (homeCategory) {
    await db.insert(items).values([
      {
        name: 'Coffee Maker',
        description: 'Programmable coffee maker with 12-cup capacity',
        categoryId: homeCategory.id,
        location: 'Kitchen, Counter',
        quantity: 1,
        purchasePrice: 79.99
      },
      {
        name: 'Area Rug',
        description: '8x10 Persian-style area rug',
        categoryId: homeCategory.id,
        location: 'Living Room',
        quantity: 1,
        purchasePrice: 299.99
      }
    ])
  }

  if (garageCategory) {
    await db.insert(items).values([
      {
        name: 'Cordless Drill',
        description: '20V MAX cordless drill/driver kit',
        categoryId: garageCategory.id,
        location: 'Garage, Toolbox',
        quantity: 1,
        serialNumber: 'DW20V123456',
        purchasePrice: 149.99
      },
      {
        name: 'Paint Sprayer',
        description: 'Electric paint sprayer for indoor/outdoor use',
        categoryId: garageCategory.id,
        location: 'Garage, Shelf 2',
        quantity: 1,
        purchasePrice: 89.99
      }
    ])
  }

  console.log('Database seeded successfully!')
}

seed().catch(console.error)
