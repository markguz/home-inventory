/**
 * @file Breadcrumb Test Fixtures
 * @description Test data and fixtures for breadcrumb component testing
 */

import { vi } from 'vitest'

export interface BreadcrumbItem {
  label: string;
  href?: string | null;
}

export const breadcrumbFixtures = {
  // Simple breadcrumbs
  home: [{ label: 'Home', href: '/' }],

  homeAndItems: [
    { label: 'Home', href: '/' },
    { label: 'Items', href: null },
  ],

  // Nested breadcrumbs
  threeLevel: [
    { label: 'Home', href: '/' },
    { label: 'Items', href: '/items' },
    { label: 'Details', href: null },
  ],

  fourLevel: [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Electronics', href: '/categories/electronics' },
    { label: 'Laptops', href: null },
  ],

  // Deep nesting
  deepNested: [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Electronics', href: '/categories/electronics' },
    { label: 'Computers', href: '/categories/electronics/computers' },
    { label: 'Laptops', href: '/categories/electronics/computers/laptops' },
    { label: 'Gaming', href: null },
  ],

  // Edge cases
  emptyArray: [],

  singleItem: [{ label: 'Lone Item', href: null }],

  allLinks: [
    { label: 'First', href: '/first' },
    { label: 'Second', href: '/second' },
    { label: 'Third', href: '/third' },
  ],

  noLinks: [
    { label: 'First', href: null },
    { label: 'Second', href: null },
    { label: 'Third', href: null },
  ],

  // Special characters
  specialChars: [
    { label: 'Home & Garden', href: '/' },
    { label: 'Tools <-> Equipment', href: '/tools' },
    { label: 'Items (New)', href: null },
  ],

  // Long labels
  longLabels: [
    { label: 'Home', href: '/' },
    {
      label: 'This is a very long breadcrumb label that might need truncation',
      href: '/long',
    },
    { label: 'Another extremely long label for testing purposes', href: null },
  ],

  // Dynamic routes
  itemDetails: [
    { label: 'Home', href: '/' },
    { label: 'Items', href: '/items' },
    { label: 'Item 123', href: null },
  ],

  itemEdit: [
    { label: 'Home', href: '/' },
    { label: 'Items', href: '/items' },
    { label: 'Item 123', href: '/items/123' },
    { label: 'Edit', href: null },
  ],

  newItem: [
    { label: 'Home', href: '/' },
    { label: 'Items', href: '/items' },
    { label: 'New', href: null },
  ],

  // Category paths
  categoryPath: [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Electronics', href: null },
  ],

  nestedCategory: [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Electronics', href: '/categories/electronics' },
    { label: 'Laptops', href: '/categories/electronics/laptops' },
    { label: 'Gaming Laptops', href: null },
  ],

  // Kebab-case paths
  kebabCase: [
    { label: 'Home', href: '/' },
    { label: 'Home Appliances', href: '/home-appliances' },
    { label: 'Kitchen Tools', href: null },
  ],
};

export const routePathFixtures = {
  root: '/',
  items: '/items',
  itemDetails: '/items/abc123',
  itemEdit: '/items/abc123/edit',
  newItem: '/items/new',
  categories: '/categories',
  categoryDetails: '/categories/electronics',
  nestedCategory: '/categories/electronics/laptops',
  deepNested: '/a/b/c/d/e/f',
  kebabCase: '/home-appliances/kitchen-tools',
  trailingSlash: '/items/',
  multipleSlashes: '/items//electronics',
  withQuery: '/items?category=electronics',
  withHash: '/items#section-1',
};

export const labelMappings = {
  '/': 'Home',
  '/items': 'My Items',
  '/categories': 'All Categories',
  '/items/new': 'Add New Item',
  '/settings': 'Settings',
  '/profile': 'My Profile',
};

export const customSeparators = {
  slash: '/',
  chevron: '>',
  arrow: '→',
  dash: '-',
  pipe: '|',
  dot: '•',
};

export const mockNavigation = {
  pathname: '/items/electronics',
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

// Helper to generate breadcrumbs from path
export function generateBreadcrumbsFromPath(
  pathname: string,
  customLabels?: Record<string, string>
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label =
      customLabels?.[href] ||
      segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    breadcrumbs.push({
      label,
      href: index === segments.length - 1 ? null : href,
    });
  });

  return breadcrumbs;
}

// Helper to create mock items
export function createMockBreadcrumb(count: number): BreadcrumbItem[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `Level ${i + 1}`,
    href: i < count - 1 ? `/level${i + 1}` : null,
  }));
}
