import { getAllCategories } from '@/db/queries'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { CategoryPageClient } from '@/components/categories/CategoryPageClient'

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  return (
    <main className="container mx-auto p-8">
      <Breadcrumbs />
      <CategoryPageClient categories={categories} />
    </main>
  )
}
