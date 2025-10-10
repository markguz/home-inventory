import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRecentItems, getItemStats } from '@/db/queries'

export default async function Home() {
  const [recentItems, stats] = await Promise.all([
    getRecentItems(5),
    getItemStats()
  ])

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Home Inventory System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalItems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalCategories}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalTags}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-8">
        <Link href="/items">
          <Button>View All Items</Button>
        </Link>
        <Link href="/items/new">
          <Button variant="outline">Add New Item</Button>
        </Link>
        <Link href="/categories">
          <Button variant="outline">Manage Categories</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Items</CardTitle>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <p className="text-muted-foreground">No items yet. Add your first item!</p>
          ) : (
            <ul className="space-y-2">
              {recentItems.map(item => (
                <li key={item.id} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <Link href={`/items/${item.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
