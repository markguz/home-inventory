import { getAllLocations } from '@/db/queries'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { LocationPageClient } from '@/components/locations/LocationPageClient'

export default async function LocationsPage() {
  const locations = await getAllLocations()

  return (
    <main className="container mx-auto p-8">
      <Breadcrumbs />
      <LocationPageClient locations={locations} />
    </main>
  )
}
