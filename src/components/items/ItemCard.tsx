import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertBadge } from '@/components/ui/alert-badge'
import { ItemWithRelations } from '@/types'

export function ItemCard({ item }: { item: ItemWithRelations }) {
  // Determine if item has low stock alert
  const minQuantity = item.minQuantity ?? item.category.minQuantity
  const hasLowStock = minQuantity !== null && minQuantity !== undefined && item.quantity < minQuantity

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{item.name}</span>
          <div className="flex gap-2 items-center">
            {hasLowStock && <AlertBadge variant="warning" />}
            <Badge variant={item.quantity < 5 ? 'destructive' : 'default'}>
              {item.quantity}x
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{item.category.name}</Badge>
          <Link href={`/items/${item.id}`}>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
