import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertBadge } from '@/components/ui/alert-badge'
import { ItemWithRelations } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVerticalIcon, Pencil, Eye } from 'lucide-react'

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
          {/* Action menu with View and Edit options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Item actions"
              >
                <MoreVerticalIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/items/${item.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/items/${item.id}/edit`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit Item
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
