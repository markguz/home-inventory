import { redirect } from 'next/navigation'
import { ItemForm } from '@/components/items/ItemForm'
import { getAllCategories } from '@/db/queries'
import { createItem } from '@/app/actions/items'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

export default async function NewItemPage() {
  const categories = await getAllCategories()

  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createItem(formData)
    if (result.success) {
      redirect('/items')
    }
  }

  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <Breadcrumbs />
      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemForm categories={categories} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </main>
  )
}
