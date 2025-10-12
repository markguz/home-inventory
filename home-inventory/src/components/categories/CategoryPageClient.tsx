'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { Category } from '@/types'
import { CategoryForm } from './CategoryForm'
import { CategoryActions } from './CategoryActions'

interface CategoryPageClientProps {
  categories: (Category & { _count?: { items: number } })[]
}

export function CategoryPageClient({ categories }: CategoryPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Categories</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No categories yet. Create your first category to get started.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <CategoryActions category={category} />
                </div>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {category.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {category._count && (
                    <span>
                      {category._count.items} item{category._count.items !== 1 ? 's' : ''}
                    </span>
                  )}
                  {category.minQuantity !== null && category.minQuantity !== undefined && (
                    <span>Min qty: {category.minQuantity}</span>
                  )}
                  {category.color && (
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: category.color,
                        color: 'white',
                      }}
                    >
                      {category.color}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        mode="create"
      />
    </div>
  )
}
