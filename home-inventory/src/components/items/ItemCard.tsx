import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ItemWithRelations } from '@/types'

export function ItemCard({ item }: { item: ItemWithRelations }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{item.name}</span>
          <Badge variant={item.quantity < 5 ? 'destructive' : 'default'}>
            {item.quantity}x
          </Badge>
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
