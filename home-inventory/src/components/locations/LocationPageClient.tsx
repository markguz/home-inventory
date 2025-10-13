'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon, MapPin } from 'lucide-react'
import { Location } from '@/types'

interface LocationPageClientProps {
  locations: (Location & {
    _count?: { items: number }
    parent?: Location | null
  })[]
}

export function LocationPageClient({ locations }: LocationPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Locations</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No locations yet. Create your first location to get started.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Location
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {locations.map((location) => (
            <Link key={location.id} href={`/items?locationId=${location.id}`}>
              <Card className="relative hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {location.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {location.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {location._count && (
                      <span>
                        {location._count.items} item{location._count.items !== 1 ? 's' : ''}
                      </span>
                    )}
                    {location.parent && (
                      <span className="text-primary">
                        in {location.parent.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Location form coming soon. Use the API to create locations for now.
              </p>
              <Button onClick={() => setShowCreateDialog(false)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
