/**
 * Receipt Processor - Main orchestration component
 * Coordinates receipt upload, processing, review, and item creation
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ReceiptUpload } from './ReceiptUpload';
import { ReceiptItemsReview } from './ReceiptItemsReview';
import type { ParsedReceipt, ExtractedItem } from '../types';

type ProcessingStep = 'upload' | 'review' | 'creating';

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

/**
 * Fetch available categories
 */
async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch available locations
 */
async function fetchLocations(): Promise<Location[]> {
  try {
    const response = await fetch('/api/locations');
    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

/**
 * Find or get a default category
 */
async function getDefaultCategory(): Promise<string | null> {
  try {
    const categories = await fetchCategories();
    if (categories.length === 0) {
      console.warn('No categories available');
      return null;
    }
    // Try to find a Groceries category, otherwise use first category
    const groceriesCategory = categories.find((c) =>
      c.name.toLowerCase().includes('groceries')
    );
    return (groceriesCategory || categories[0])?.id || null;
  } catch (error) {
    console.error('Error getting default category:', error);
    return null;
  }
}

/**
 * Find or get a default location
 */
async function getDefaultLocation(): Promise<string | null> {
  try {
    const locations = await fetchLocations();
    if (locations.length === 0) {
      console.warn('No locations available');
      return null;
    }
    // Try to find a Pantry location, otherwise use first location
    const pantryLocation = locations.find((l) =>
      l.name.toLowerCase().includes('pantry')
    );
    return (pantryLocation || locations[0])?.id || null;
  } catch (error) {
    console.error('Error getting default location:', error);
    return null;
  }
}

export function ReceiptProcessor() {
  const router = useRouter();
  const [step, setStep] = useState<ProcessingStep>('upload');
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);

  /**
   * Handle receipt processed from upload
   */
  const handleReceiptProcessed = (receipt: ParsedReceipt) => {
    setParsedReceipt(receipt);
    setStep('review');
  };

  /**
   * Handle items confirmed from review
   */
  const handleItemsConfirmed = useCallback(
    async (items: ExtractedItem[]) => {
      setStep('creating');

      try {
        if (items.length === 0) {
          toast.error('No items to add');
          setStep('review');
          return;
        }

        // Get default category and location before processing items
        const [categoryId, locationId] = await Promise.all([
          getDefaultCategory(),
          getDefaultLocation(),
        ]);

        if (!categoryId) {
          toast.error(
            'No categories available. Please create a category first in the settings.'
          );
          setStep('review');
          return;
        }

        if (!locationId) {
          toast.error(
            'No locations available. Please create a location first in the settings.'
          );
          setStep('review');
          return;
        }

        let successCount = 0;
        let failedCount = 0;
        const failedItems: string[] = [];

        // Process each item
        for (const item of items) {
          try {
            const response = await fetch('/api/items', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: item.name,
                quantity: item.quantity,
                categoryId, // Use fetched category ID
                locationId, // Use fetched location ID
                description: `From receipt - ${parsedReceipt?.merchantName || 'Unknown merchant'} - Confidence: ${Math.round(item.confidence * 100)}%`,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to create item');
            }

            successCount++;
          } catch (itemError) {
            failedCount++;
            failedItems.push(item.name);
            console.error(`Failed to create item "${item.name}":`, itemError);
          }
        }

        // Show results
        if (successCount > 0) {
          toast.success(
            `Added ${successCount} item${successCount !== 1 ? 's' : ''} to inventory`
          );
        }

        if (failedCount > 0) {
          toast.error(
            `Failed to add ${failedCount} item${failedCount !== 1 ? 's' : ''}: ${failedItems.join(', ')}`
          );
        }

        // Reset and redirect after success
        if (successCount > 0) {
          setTimeout(() => {
            router.push('/items');
          }, 2000);
        } else {
          setStep('review');
        }
      } catch (error) {
        console.error('Failed to create items:', error);
        toast.error('Failed to create items from receipt');
        setStep('review');
      }
    },
    [parsedReceipt?.merchantName, router]
  );

  /**
   * Handle cancel from review
   */
  const handleCancel = () => {
    setParsedReceipt(null);
    setStep('upload');
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Receipt Processing</h1>
        <p className="text-muted-foreground">
          Upload a receipt image to automatically extract and add items to your inventory
        </p>
      </div>

      {/* Content based on current step */}
      {step === 'upload' && <ReceiptUpload onReceiptProcessed={handleReceiptProcessed} />}

      {step === 'review' && parsedReceipt && (
        <ReceiptItemsReview
          parsedReceipt={parsedReceipt}
          onItemsConfirmed={handleItemsConfirmed}
          onCancel={handleCancel}
        />
      )}

      {step === 'creating' && (
        <div className="text-center py-12">
          <div className="text-lg font-medium">Creating items...</div>
          <div className="text-sm text-muted-foreground mt-2">
            This may take a few moments
          </div>
        </div>
      )}
    </div>
  );
}
