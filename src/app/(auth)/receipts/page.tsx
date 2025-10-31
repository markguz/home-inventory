import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReceiptsPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Receipt Scanner</h1>
        <Button>Upload Receipt</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Receipt Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Upload and process receipts to automatically add items to your inventory.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
