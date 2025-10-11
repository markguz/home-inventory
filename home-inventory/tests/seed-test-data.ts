#!/usr/bin/env node
/**
 * Seed test data for Prisma migration validation
 */

import { prisma } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding test data...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        icon: '💻',
        color: '#3B82F6',
        minQuantity: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Kitchen',
        description: 'Kitchen appliances and utensils',
        icon: '🍳',
        color: '#EF4444',
        minQuantity: 5,
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // Create locations
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Living Room',
        description: 'Main living area',
      },
    }),
    prisma.location.create({
      data: {
        name: 'Kitchen',
        description: 'Cooking and dining area',
      },
    }),
  ])

  console.log(`✅ Created ${locations.length} locations`)

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'warranty',
        color: '#10B981',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'fragile',
        color: '#F59E0B',
      },
    }),
  ])

  console.log(`✅ Created ${tags.length} tags`)

  // Create items with minQuantity field
  const items = await Promise.all([
    prisma.item.create({
      data: {
        name: 'MacBook Pro',
        description: '16-inch laptop for development',
        quantity: 1,
        minQuantity: 1,
        categoryId: categories[0].id,
        locationId: locations[0].id,
        serialNumber: 'MBP-2024-001',
        notes: 'Primary development machine',
        tags: {
          create: [
            {
              tag: { connect: { id: tags[0].id } },
            },
          ],
        },
      },
      include: {
        category: true,
        location: true,
        tags: { include: { tag: true } },
      },
    }),
    prisma.item.create({
      data: {
        name: 'Coffee Mugs',
        description: 'Ceramic coffee mugs',
        quantity: 4,
        minQuantity: 6,
        categoryId: categories[1].id,
        locationId: locations[1].id,
        notes: 'Below minimum quantity - needs restocking',
        tags: {
          create: [
            {
              tag: { connect: { id: tags[1].id } },
            },
          ],
        },
      },
      include: {
        category: true,
        location: true,
        tags: { include: { tag: true } },
      },
    }),
  ])

  console.log(`✅ Created ${items.length} items`)
  console.log('\n📊 Test Data Summary:')
  items.forEach((item) => {
    console.log(`\n- ${item.name}`)
    console.log(`  Quantity: ${item.quantity} (min: ${item.minQuantity})`)
    console.log(`  Category: ${item.category.name} (min: ${item.category.minQuantity})`)
    console.log(`  Location: ${item.location.name}`)
    console.log(`  Tags: ${item.tags.map((t) => t.tag.name).join(', ')}`)
    if (item.minQuantity && item.quantity < item.minQuantity) {
      console.log(`  ⚠️  Below minimum quantity!`)
    }
  })

  console.log('\n✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
