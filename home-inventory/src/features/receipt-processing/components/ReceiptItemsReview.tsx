/**
 * Receipt Items Review Component
 * Review and edit extracted items before adding to inventory
 */

'use client';

import { useState, useCallback } from 'react';
import { Trash2, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ExtractedItem, ParsedReceipt } from '../types';

interface ReceiptItemsReviewProps {
  parsedReceipt: ParsedReceipt;
  onItemsConfirmed: (items: ExtractedItem[]) => void;
  onCancel: () => void;
}

export function ReceiptItemsReview({
  parsedReceipt,
  onItemsConfirmed,
  onCancel,
}: ReceiptItemsReviewProps) {
  const [items, setItems] = useState<ExtractedItem[]>(parsedReceipt.items);
  const [editingId, setEditingId] = useState<string | null>(null);

  /**
   * Handle item name edit
   */
  const handleNameChange = useCallback((id: string, newName: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  }, []);

  /**
   * Handle item price edit
   */
  const handlePriceChange = useCallback((id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, price } : item))
      );
    }
  }, []);

  /**
   * Handle item quantity edit
   */
  const handleQuantityChange = useCallback((id: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity > 0) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  }, []);

  /**
   * Delete an item
   */
  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * Get confidence badge color
   */
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return { text: 'High', className: 'bg-green-100 text-green-800' };
    if (confidence >= 0.6) return { text: 'Medium', className: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low', className: 'bg-red-100 text-red-800' };
  };

  /**
   * Confirm and send items to inventory
   */
  const handleConfirm = () => {
    if (items.length === 0) {
      return;
    }
    onItemsConfirmed(items);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Receipt Items</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} items found • Overall confidence: {Math.round(parsedReceipt.confidence * 100)}%
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          {parsedReceipt.total ? `Total: $${parsedReceipt.total.toFixed(2)}` : 'No total found'}
        </Badge>
      </div>

      {/* Items list */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-3 font-medium grid grid-cols-12 gap-4">
          <div className="col-span-5">Item Name</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Confidence</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No items to review
            </div>
          ) : (
            items.map((item) => {
              const badge = getConfidenceBadge(item.confidence);
              const isEditing = editingId === item.id;

              return (
                <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/50">
                  <div className="col-span-5">
                    {isEditing ? (
                      <Input
                        value={item.name}
                        onChange={(e) => handleNameChange(item.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="text-left hover:text-primary transition-colors"
                      >
                        {item.name}
                      </button>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.price || ''}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      className="h-8"
                      placeholder="$0.00"
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="h-8"
                    />
                  </div>

                  <div className="col-span-2">
                    <Badge className={badge.className}>{badge.text}</Badge>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Metadata */}
      {(parsedReceipt.merchantName || parsedReceipt.date) && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          {parsedReceipt.merchantName && (
            <div>
              <span className="font-medium">Merchant:</span> {parsedReceipt.merchantName}
            </div>
          )}
          {parsedReceipt.date && (
            <div>
              <span className="font-medium">Date:</span>{' '}
              {parsedReceipt.date.toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={items.length === 0}>
          <Check className="mr-2 h-4 w-4" />
          Add {items.length} Items to Inventory
        </Button>
      </div>
    </div>
  );
}
