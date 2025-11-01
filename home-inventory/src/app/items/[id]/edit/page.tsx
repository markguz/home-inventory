import { redirect, notFound } from 'next/navigation'
import { ItemForm } from '@/components/items/ItemForm'
import { getAllCategories, getItemById } from '@/db/queries'
import { updateItem } from '@/app/actions/items'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { auth } from '@/auth'
import type { ItemFormData } from '@/lib/validations'

interface EditItemPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  // Await params to get the id
  const { id } = await params

  // Get authenticated user
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Fetch item and categories in parallel
  const [item, categories] = await Promise.all([
    getItemById(id),
    getAllCategories()
  ])

  // Check if item exists
  if (!item) {
    notFound()
  }

  // Check authorization - only show if user owns the item
  if (item.userId !== session.user.id) {
    redirect('/items')
  }

  // Transform item data to ItemForm defaultValues format
  const defaultValues: Partial<ItemFormData> = {
    name: item.name,
    description: item.description || undefined,
    categoryId: item.categoryId,
    locationId: item.locationId,
    quantity: item.quantity,
    minQuantity: item.minQuantity || undefined,
    serialNumber: item.serialNumber || undefined,
    notes: item.notes || undefined,
  }

  // Create wrapper for updateItem server action
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await updateItem(id, formData)
    if (result.success) {
      redirect(`/items/${id}`)
    }
    // If there's an error, the form will handle displaying it
  }

  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <Breadcrumbs />
      <Card>
        <CardHeader>
          <CardTitle>Edit Item</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemForm
            categories={categories}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </main>
  )
}
