import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAllCategories } from '@/db/queries'

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Categories</h1>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No categories yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {categories.map(category => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
