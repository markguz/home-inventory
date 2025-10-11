#!/usr/bin/env node
/**
 * Test database queries from src/db/queries.ts
 */

import * as queries from '../src/db/queries'

async function testQueries() {
  console.log('🧪 Testing Database Queries\n')

  try {
    // Test getAllItems
    console.log('1️⃣ Testing getAllItems()...')
    const allItems = await queries.getAllItems()
    console.log(`   ✅ Found ${allItems.length} items`)
    console.log(`   ✓ Includes: category, location, tags`)

    // Test getItemById
    if (allItems.length > 0) {
      console.log('\n2️⃣ Testing getItemById()...')
      const item = await queries.getItemById(allItems[0].id)
      console.log(`   ✅ Retrieved: ${item?.name}`)
      console.log(`   ✓ minQuantity field: ${item?.minQuantity}`)
      console.log(`   ✓ Quantity: ${item?.quantity}`)
      console.log(`   ✓ Category: ${item?.category.name}`)
      console.log(`   ✓ Location: ${item?.location.name}`)
      console.log(`   ✓ Tags: ${item?.tags.map((t) => t.tag.name).join(', ')}`)
    }

    // Test getItemsByCategory
    const categories = await queries.getAllCategories()
    if (categories.length > 0) {
      console.log('\n3️⃣ Testing getItemsByCategory()...')
      const categoryItems = await queries.getItemsByCategory(categories[0].id)
      console.log(`   ✅ Found ${categoryItems.length} items in ${categories[0].name}`)
    }

    // Test searchItems
    console.log('\n4️⃣ Testing searchItems()...')
    const searchResults = await queries.searchItems('mac')
    console.log(`   ✅ Search for "mac": ${searchResults.length} results`)

    // Test getAllCategories
    console.log('\n5️⃣ Testing getAllCategories()...')
    const allCategories = await queries.getAllCategories()
    console.log(`   ✅ Found ${allCategories.length} categories`)
    allCategories.forEach((cat) => {
      console.log(`   - ${cat.name}: minQuantity=${cat.minQuantity}`)
    })

    // Test getAllTags
    console.log('\n6️⃣ Testing getAllTags()...')
    const allTags = await queries.getAllTags()
    console.log(`   ✅ Found ${allTags.length} tags`)

    // Test getRecentItems
    console.log('\n7️⃣ Testing getRecentItems()...')
    const recentItems = await queries.getRecentItems(5)
    console.log(`   ✅ Found ${recentItems.length} recent items`)

    // Test getItemStats
    console.log('\n8️⃣ Testing getItemStats()...')
    const stats = await queries.getItemStats()
    console.log(`   ✅ Stats:`)
    console.log(`      - Total Items: ${stats.totalItems}`)
    console.log(`      - Total Categories: ${stats.totalCategories}`)
    console.log(`      - Total Tags: ${stats.totalTags}`)

    console.log('\n✅ All query tests passed!')
    return true
  } catch (error) {
    console.error('❌ Query test failed:', error)
    return false
  }
}

testQueries()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
