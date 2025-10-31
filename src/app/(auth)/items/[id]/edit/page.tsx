'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ItemForm } from '@/components/items/ItemForm';
import { updateItem, getItem, getCategories, getLocations } from '@/app/actions/items';
import { Item, Category, Location, ItemFormData } from '@/types/item';

// Temporary auth - replace with actual session
const TEMP_USER_ID = 'user-1';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditItemPage({ params }: PageProps) {
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [itemResult, categoriesResult, locationsResult] = await Promise.all([
          getItem(params.id, TEMP_USER_ID),
          getCategories(),
          getLocations(),
        ]);

        if (!itemResult.success || !itemResult.item) {
          toast.error('Item not found');
          router.push('/items');
          return;
        }

        setItem(itemResult.item);
        setCategories(categoriesResult.categories || []);
        setLocations(locationsResult.locations || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load item');
        router.push('/items');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id, router]);

  const handleSubmit = async (data: ItemFormData) => {
    const result = await updateItem(params.id, data, TEMP_USER_ID);

    if (result.success) {
      toast.success('Item updated successfully');
      router.push(`/items/${params.id}`);
    } else {
      toast.error(result.error || 'Failed to update item');
      throw new Error(result.error);
    }
  };

  const handleCancel = () => {
    router.push(`/items/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">Edit Item</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Update the details of {item.name}
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <ItemForm
            item={{
              name: item.name,
              description: item.description || undefined,
              categoryId: item.categoryId,
              locationId: item.locationId,
              quantity: item.quantity,
              minQuantity: item.minQuantity || undefined,
              purchasePrice: item.purchasePrice || undefined,
              currentValue: item.currentValue || undefined,
              condition: (item.condition as 'new' | 'like-new' | 'good' | 'fair' | 'poor' | undefined) || undefined,
              notes: item.notes || undefined,
              barcode: item.barcode || undefined,
              serialNumber: item.serialNumber || undefined,
            }}
            categories={categories}
            locations={locations}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
