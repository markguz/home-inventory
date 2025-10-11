'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertBadge } from '@/components/ui/alert-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Package } from 'lucide-react'

interface AlertSummary {
  totalAlerts: number
  categoryCounts: Record<string, number>
  items: Array<{
    id: string
    name: string
    quantity: number
    minQuantity: number
    category: {
      id: string
      name: string
      icon: string | null
      color: string | null
    }
    location: {
      id: string
      name: string
    }
  }>
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/alerts?format=summary')
      const result = await response.json()

      if (result.success) {
        setAlerts(result.data)
      } else {
        setError(result.error || 'Failed to fetch alerts')
      }
    } catch (err) {
      setError('Failed to fetch alerts')
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAlerts} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const groupedItems = alerts?.items.reduce(
    (acc, item) => {
      const categoryName = item.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(item)
      return acc
    },
    {} as Record<string, typeof alerts.items>
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            Low Stock Alerts
          </h1>
          <p className="text-muted-foreground mt-2">
            Items running low on inventory
          </p>
        </div>
        <Button onClick={fetchAlerts} variant="outline">
          Refresh
        </Button>
      </div>

      {alerts && alerts.totalAlerts === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Stock Levels Good</h3>
            <p className="text-muted-foreground text-center">
              No items are currently below their minimum quantity threshold
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Total alerts: {alerts?.totalAlerts || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {alerts &&
                  Object.entries(alerts.categoryCounts).map(([category, count]) => (
                    <div
                      key={category}
                      className="px-3 py-1 bg-secondary rounded-md text-sm"
                    >
                      {category}: <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {groupedItems &&
              Object.entries(groupedItems).map(([categoryName, items]) => (
                <Card key={categoryName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {items[0].category.icon && (
                        <span className="text-2xl">{items[0].category.icon}</span>
                      )}
                      {categoryName}
                      <AlertBadge variant="warning" className="ml-2">
                        {items.length}
                      </AlertBadge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex-1">
                            <Link
                              href={`/items/${item.id}`}
                              className="font-medium hover:underline"
                            >
                              {item.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              Location: {item.location.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Current / Min
                            </div>
                            <div className="font-semibold">
                              <span className="text-red-600">{item.quantity}</span>
                              {' / '}
                              <span className="text-muted-foreground">
                                {item.minQuantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
