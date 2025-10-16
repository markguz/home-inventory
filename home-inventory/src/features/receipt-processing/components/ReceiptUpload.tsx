/**
 * Receipt Upload Component
 * Drag-and-drop file upload for receipt images
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, FileImage, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedReceipt } from '../types';

interface ReceiptUploadProps {
  onReceiptProcessed: (receipt: ParsedReceipt) => void;
}

export function ReceiptUpload({ onReceiptProcessed }: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * Handle file selection from input or drag-drop
   */
  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Please upload a JPEG, PNG, or WebP image');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      await processReceipt(file);
    },
    []
  );

  /**
   * Process receipt image with OCR
   */
  const processReceipt = async (file: File) => {
    setIsProcessing(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Send to API
      const response = await fetch('/api/receipts/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process receipt');
      }

      toast.success(`Found ${result.data.items.length} items in receipt`);
      onReceiptProcessed(result.data);
    } catch (error) {
      console.error('Receipt processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  /**
   * Handle file input change
   */
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-lg font-medium">Processing receipt...</div>
              <div className="text-sm text-muted-foreground">
                This may take a few moments
              </div>
            </>
          ) : (
            <>
              {selectedFile ? (
                <FileImage className="w-12 h-12 text-primary" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400" />
              )}
              <div className="text-lg font-medium">
                {selectedFile ? selectedFile.name : 'Upload receipt image'}
              </div>
              <div className="text-sm text-muted-foreground">
                Drag and drop or click to select
              </div>
              <div className="text-xs text-muted-foreground">
                Supports JPEG, PNG, WebP (max 10MB)
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
