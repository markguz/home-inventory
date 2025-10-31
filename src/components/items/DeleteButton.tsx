'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteItem } from '@/app/actions/items';

// Temporary auth - replace with actual session
const TEMP_USER_ID = 'user-1';

interface DeleteButtonProps {
  itemId: string;
  itemName: string;
}

export function DeleteButton({ itemId, itemName }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteItem(itemId, TEMP_USER_ID);

      if (result?.success === false) {
        toast.error(result.error || 'Failed to delete item');
        setIsDeleting(false);
        setShowConfirm(false);
      } else {
        toast.success('Item deleted successfully');
        router.push('/items');
      }
    } catch (error) {
      toast.error('Failed to delete item');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-sm text-gray-600">Delete {itemName}?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          {isDeleting ? 'Deleting...' : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 disabled:bg-gray-100"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Delete
    </button>
  );
}
