import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TagsPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tags</h1>
        <Link href="/tags/new">
          <Button>Add Tag</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tag Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Create and manage tags to categorize your items with flexible labels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
