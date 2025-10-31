import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LocationsPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Locations</h1>
        <Link href="/locations/new">
          <Button>Add Location</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Storage Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage storage locations for your inventory items.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
