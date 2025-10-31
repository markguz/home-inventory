import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getItem, deleteItem } from '@/app/actions/items';
import { DeleteButton } from '@/components/items/DeleteButton';

interface PageProps {
  params: {
    id: string;
  };
}

// Temporary auth - replace with actual session
const TEMP_USER_ID = 'user-1';

export default async function ItemDetailPage({ params }: PageProps) {
  const result = await getItem(params.id, TEMP_USER_ID);

  if (!result.success || !result.item) {
    notFound();
  }

  const { item } = result;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold leading-6 text-gray-900">{item.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Item details</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/items/${item.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit
            </Link>
            <DeleteButton itemId={item.id} itemName={item.name} />
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {item.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.description}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.category.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.location.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Quantity</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.quantity}</dd>
            </div>

            {item.minQuantity !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Min Quantity</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.minQuantity}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">Condition</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{item.condition}</dd>
            </div>

            {item.purchasePrice !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                <dd className="mt-1 text-sm text-gray-900">${item.purchasePrice.toFixed(2)}</dd>
              </div>
            )}

            {item.currentValue !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Current Value</dt>
                <dd className="mt-1 text-sm text-gray-900">${item.currentValue.toFixed(2)}</dd>
              </div>
            )}

            {item.barcode && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Barcode</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.barcode}</dd>
              </div>
            )}

            {item.serialNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.serialNumber}</dd>
              </div>
            )}

            {item.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{item.notes}</dd>
              </div>
            )}

            {item.imageUrl && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-2">Image</dt>
                <dd className="mt-1">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="max-w-md rounded-lg shadow-md"
                  />
                </dd>
              </div>
            )}

            <div className="sm:col-span-2 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <dt className="font-medium">Created</dt>
                  <dd className="mt-1">{new Date(item.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-medium">Last Updated</dt>
                  <dd className="mt-1">{new Date(item.updatedAt).toLocaleString()}</dd>
                </div>
              </div>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/items"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          ← Back to all items
        </Link>
      </div>
    </div>
  );
}
