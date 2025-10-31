import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AlertsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Low Stock Alerts</h1>
      <Card>
        <CardHeader>
          <CardTitle>No Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            All items are sufficiently stocked. Alerts will appear here when items fall below minimum quantity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
