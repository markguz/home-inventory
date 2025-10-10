import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getItemById } from '@/db/queries'
import { format } from 'date-fns'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = await getItemById(params.id)
  
  if (!item) {
    notFound()
  }

  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{item.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Category:</span>{' '}
              <Badge variant="secondary">{item.category.name}</Badge>
            </div>
            <div>
              <span className="font-semibold">Location:</span> {item.location}
            </div>
            <div>
              <span className="font-semibold">Quantity:</span>{' '}
              <Badge variant={item.quantity < 5 ? 'destructive' : 'default'}>
                {item.quantity}x
              </Badge>
            </div>
            {item.description && (
              <div>
                <span className="font-semibold">Description:</span>
                <p className="mt-1 text-muted-foreground">{item.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {item.serialNumber && (
              <div>
                <span className="font-semibold">Serial Number:</span> {item.serialNumber}
              </div>
            )}
            {item.modelNumber && (
              <div>
                <span className="font-semibold">Model Number:</span> {item.modelNumber}
              </div>
            )}
            {item.notes && (
              <div>
                <span className="font-semibold">Notes:</span>
                <p className="mt-1 text-muted-foreground">{item.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/items">
          <Button variant="outline">Back to Items</Button>
        </Link>
      </div>
    </main>
  )
}
