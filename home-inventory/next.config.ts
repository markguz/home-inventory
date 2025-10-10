import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Performance Optimizations */

  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,

  // Enable gzip compression
  compress: true,

  // Image optimization configuration
  images: {
    // Use modern image formats
    formats: ['image/avif', 'image/webp'],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache optimized images for 1 year
    minimumCacheTTL: 60 * 60 * 24 * 365, // 365 days

    // Add domains for remote images when needed
    remotePatterns: [
      // Example: Allow images from your CDN
      // {
      //   protocol: 'https',
      //   hostname: 'your-cdn-domain.com',
      //   port: '',
      //   pathname: '/images/**',
      // },
    ],
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@tanstack/react-query',
    ],
  },

  // Turbopack configuration (moved from experimental)
  turbopack: {
    // Enable optimizations
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },

  // Headers for caching static assets
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
