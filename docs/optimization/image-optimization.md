# Image Optimization Guide

**Project:** Home Inventory System
**Date:** 2025-10-10
**Agent:** Optimizer (hive-optimizer)

## Overview

This guide provides comprehensive image optimization strategies for the Home Inventory System, focusing on Next.js 15 Image component, loading strategies, and performance best practices.

## Next.js Image Configuration

### Already Implemented in next.config.ts
```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
}
```

## Image Loading Strategies

### 1. Priority Images (Above the Fold)
```typescript
// For images visible on initial page load
import Image from 'next/image';

export function HeroSection() {
  return (
    <Image
      src="/hero-inventory.jpg"
      alt="Home Inventory Dashboard"
      width={1200}
      height={600}
      priority // Loads immediately, no lazy loading
      quality={90} // Higher quality for hero images
      sizes="100vw" // Full viewport width
    />
  );
}
```

### 2. Lazy-Loaded Images (Below the Fold)
```typescript
// For images that appear lower on the page
export function InventoryItemImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={300}
      height={300}
      loading="lazy" // Default behavior, explicit for clarity
      quality={85} // Slightly lower quality for smaller file size
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    />
  );
}
```

### 3. Images with Placeholder Blur
```typescript
// Generate blur placeholder from actual image
import { getPlaiceholder } from 'plaiceholder';

export async function getStaticProps() {
  const { base64, img } = await getPlaiceholder('/path/to/image.jpg');

  return {
    props: {
      imageProps: {
        ...img,
        blurDataURL: base64,
      },
    },
  };
}

// In component
<Image
  {...imageProps}
  placeholder="blur"
  alt="Item image"
/>
```

## Image Upload & Processing

### 1. Client-Side Image Compression
```typescript
// lib/imageCompression.ts
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<Blob> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas conversion failed'));
        },
        'image/jpeg',
        quality
      );

      URL.revokeObjectURL(img.src);
    };

    img.onerror = reject;
  });
}
```

### 2. Image Upload Component
```typescript
// components/ImageUploader.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';

export function ImageUploader({ onUpload }: { onUpload: (file: File) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Compress in background
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
      });
      const compressedFile = new File([compressed], file.name, {
        type: 'image/jpeg',
      });
      onUpload(compressedFile);
    } catch (error) {
      console.error('Compression failed:', error);
      // Fallback to original file
      onUpload(file);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
        {preview ? (
          <div className="relative w-full h-full">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
            {isCompressing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-white">Compressing...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-12 h-12 mb-4 text-gray-400" />
            <p className="text-sm text-gray-500">Click to upload image</p>
            <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
          </div>
        )}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
```

## Loading Skeletons

### 1. Image Skeleton Component
```typescript
// components/ImageSkeleton.tsx
export function ImageSkeleton({
  width = 300,
  height = 300,
  className = '',
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
      style={{ width, height }}
    />
  );
}
```

### 2. Item Card with Image Skeleton
```typescript
// components/ItemCard.tsx
import { useState } from 'react';
import Image from 'next/image';
import { ImageSkeleton } from './ImageSkeleton';

export function ItemCard({ item }: { item: Item }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="border rounded-lg p-4">
      <div className="relative">
        {!imageLoaded && <ImageSkeleton width={300} height={300} />}
        <Image
          src={item.imageUrl || '/placeholder-item.png'}
          alt={item.name}
          width={300}
          height={300}
          className={imageLoaded ? 'block' : 'hidden'}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <h3 className="mt-2 font-semibold">{item.name}</h3>
      <p className="text-sm text-gray-600">{item.category}</p>
    </div>
  );
}
```

## Progressive Image Loading

### 1. Low Quality Image Placeholder (LQIP)
```typescript
// Generate LQIP on server
import sharp from 'sharp';

export async function generateLQIP(imagePath: string): Promise<string> {
  const buffer = await sharp(imagePath)
    .resize(20) // Very small
    .blur(10)
    .jpeg({ quality: 20 })
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}
```

### 2. Progressive JPEG Loading
```typescript
// Upload API route with image processing
// app/api/upload/route.ts
import sharp from 'sharp';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('image') as File;

  const buffer = Buffer.from(await file.arrayBuffer());

  // Generate multiple sizes
  const sizes = [
    { name: 'thumbnail', width: 150 },
    { name: 'medium', width: 600 },
    { name: 'large', width: 1200 },
  ];

  const images = await Promise.all(
    sizes.map(async ({ name, width }) => {
      const processed = await sharp(buffer)
        .resize(width, null, { withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      // Upload to storage
      const url = await uploadToStorage(processed, `${name}-${file.name}`);
      return { size: name, url };
    })
  );

  return Response.json({ images });
}
```

## Responsive Images

### 1. Responsive Image Component
```typescript
// components/ResponsiveImage.tsx
import Image from 'next/image';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio?: '1:1' | '4:3' | '16:9';
  priority?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  aspectRatio = '4:3',
  priority = false,
}: ResponsiveImageProps) {
  const aspectRatios = {
    '1:1': 'pb-[100%]',
    '4:3': 'pb-[75%]',
    '16:9': 'pb-[56.25%]',
  };

  return (
    <div className="relative w-full">
      <div className={`relative ${aspectRatios[aspectRatio]}`}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover rounded-lg"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
    </div>
  );
}
```

## Image Gallery Optimization

### 1. Grid Gallery with Lazy Loading
```typescript
// components/ImageGallery.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageSkeleton } from './ImageSkeleton';

export function ImageGallery({ images }: { images: string[] }) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set([...prev, index]));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((src, index) => (
        <div key={src} className="relative aspect-square">
          {!loadedImages.has(index) && <ImageSkeleton />}
          <Image
            src={src}
            alt={`Gallery image ${index + 1}`}
            fill
            className={`object-cover rounded-lg transition-opacity duration-300 ${
              loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => handleImageLoad(index)}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={index < 4 ? 'eager' : 'lazy'} // Load first 4 immediately
          />
        </div>
      ))}
    </div>
  );
}
```

## CDN and Storage Optimization

### 1. Cloudinary Integration Example
```typescript
// lib/cloudinary.ts
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
  } = {}
): string {
  const { width = 800, quality = 'auto', format = 'auto' } = options;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const transformations = [
    `w_${width}`,
    `q_${quality}`,
    `f_${format}`,
    'c_limit', // Don't upscale
  ].join(',');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}
```

### 2. Remote Image Patterns
```typescript
// next.config.ts (add to existing config)
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      port: '',
      pathname: '/storage/**',
    },
  ],
}
```

## Performance Monitoring

### 1. Image Loading Metrics
```typescript
// lib/imageMetrics.ts
export function trackImageLoad(src: string, loadTime: number) {
  // Log or send to analytics
  console.log(`Image loaded: ${src} in ${loadTime}ms`);
}

// In component
useEffect(() => {
  const startTime = performance.now();

  const img = new window.Image();
  img.src = imageSrc;
  img.onload = () => {
    const loadTime = performance.now() - startTime;
    trackImageLoad(imageSrc, loadTime);
  };
}, [imageSrc]);
```

## Best Practices Checklist

### DO
- ✅ Use Next.js Image component for all images
- ✅ Specify width and height to prevent layout shift
- ✅ Use `priority` for above-the-fold images
- ✅ Implement lazy loading for below-the-fold images
- ✅ Provide alt text for accessibility
- ✅ Use appropriate image formats (AVIF, WebP)
- ✅ Compress images before upload
- ✅ Use responsive images with `sizes` prop

### DON'T
- ❌ Use `<img>` tag directly (use Next.js Image)
- ❌ Upload full-resolution images without compression
- ❌ Load all images eagerly
- ❌ Forget to add loading skeletons
- ❌ Use very high quality settings (> 90) unnecessarily
- ❌ Ignore image dimensions (causes layout shift)

## Implementation Priority

### Phase 1 (Immediate)
1. ✅ Use Next.js Image component everywhere
2. ✅ Add loading skeletons
3. ✅ Implement priority loading for hero images
4. ✅ Set up responsive image sizes

### Phase 2 (Next Sprint)
5. 🎯 Add client-side image compression
6. 🎯 Generate LQIP for uploaded images
7. 🎯 Implement image gallery optimization
8. 🎯 Set up CDN integration

### Phase 3 (Future)
9. 🎯 Add image lazy loading intersection observer
10. 🎯 Implement progressive image loading
11. 🎯 Add image caching strategies
12. 🎯 Monitor image loading performance

## Expected Results

### Before Optimization
- Initial page load: All images load eagerly
- Total image payload: ~2-3 MB
- LCP affected by large images

### After Optimization
- Initial page load: Only critical images
- Total initial payload: < 500 KB
- LCP improvement: 30-50%
- Subsequent loads: Cached from CDN

---
**Status:** ✅ Ready for Implementation
**Priority:** High
**Dependencies:** Next.js Image component, image compression library
