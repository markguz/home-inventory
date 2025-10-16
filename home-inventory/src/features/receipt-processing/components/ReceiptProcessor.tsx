/**
 * Receipt Processor - Main orchestration component
 * Coordinates receipt upload, processing, review, and item creation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ReceiptUpload } from './ReceiptUpload';
import { ReceiptItemsReview } from './ReceiptItemsReview';
import type { ParsedReceipt, ExtractedItem } from '../types';

type ProcessingStep = 'upload' | 'review' | 'creating';

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
  const handleItemsConfirmed = async (items: ExtractedItem[]) => {
    setStep('creating');

    try {
      // Here you would integrate with the existing item creation API
      // For now, we'll show a success message

      toast.success(`Ready to add ${items.length} items to inventory`);

      // TODO: Implement batch item creation
      // For each item, create an entry in the database
      // This requires category and location selection, which could be:
      // 1. Auto-detected from item names
      // 2. User-selected in a dialog
      // 3. Default values with option to edit later

      console.log('Items to create:', items);

      // Reset and redirect
      setTimeout(() => {
        router.push('/items');
      }, 2000);
    } catch (error) {
      console.error('Failed to create items:', error);
      toast.error('Failed to create items from receipt');
      setStep('review');
    }
  };

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
