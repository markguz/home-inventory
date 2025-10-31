import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ItemsPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Items</h1>
        <Link href="/items/create">
          <Button>Add Item</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            View and manage all your inventory items here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
