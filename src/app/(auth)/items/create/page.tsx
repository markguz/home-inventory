'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ItemForm } from '@/components/items/ItemForm';
import { createItem, getCategories, getLocations } from '@/app/actions/items';
import { Category, Location, ItemFormData } from '@/types/item';

// Temporary auth - replace with actual session
const TEMP_USER_ID = 'user-1';

export default function CreateItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesResult, locationsResult] = await Promise.all([
          getCategories(),
          getLocations(),
        ]);

        setCategories(categoriesResult.categories || []);
        setLocations(locationsResult.locations || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (data: ItemFormData) => {
    const result = await createItem(data, TEMP_USER_ID);

    if (result.success && result.item) {
      toast.success('Item created successfully');
      router.push(`/items/${result.item.id}`);
    } else {
      toast.error(result.error || 'Failed to create item');
      throw new Error(result.error);
    }
  };

  const handleCancel = () => {
    router.push('/items');
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">Create New Item</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Add a new item to your inventory
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <ItemForm
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
