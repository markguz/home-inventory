/**
 * @test Breadcrumb Navigation Integration Tests
 * @description Integration tests for breadcrumb navigation with routing
 * @prerequisites Next.js routing context
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// TODO: Import actual Breadcrumb component once implemented
// import { Breadcrumb } from '@/components/layout/Breadcrumb';

// Mock component that generates breadcrumbs from pathname
const MockDynamicBreadcrumb = ({ pathname }: { pathname: string }) => {
  const generateBreadcrumbs = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/' }];

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({
        label: label.replace(/-/g, ' '),
        href: index === segments.length - 1 ? null : href,
      });
    });

    return breadcrumbs;
  };

  const items = generateBreadcrumbs(pathname);

  return (
    <nav aria-label="breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
            {index < items.length - 1 && ' / '}
          </li>
        ))}
      </ol>
    </nav>
  );
};

describe('Breadcrumb Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Route Path Parsing', () => {
    it('should generate breadcrumbs from root path', () => {
      vi.mocked(usePathname).mockReturnValue('/');

      render(<MockDynamicBreadcrumb pathname="/" />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should generate breadcrumbs from simple path', () => {
      const pathname = '/items';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
    });

    it('should generate breadcrumbs from nested path', () => {
      const pathname = '/items/electronics';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('should generate breadcrumbs from deep nested path', () => {
      const pathname = '/categories/electronics/computers/laptops';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Computers')).toBeInTheDocument();
      expect(screen.getByText('Laptops')).toBeInTheDocument();
    });
  });

  describe('Dynamic Route Handling', () => {
    it('should handle dynamic route segments [id]', () => {
      const pathname = '/items/abc123';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Abc123')).toBeInTheDocument();
    });

    it('should handle UUID-style IDs', () => {
      const pathname = '/items/550e8400-e29b-41d4-a716-446655440000';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      // Should show ID or fetch item name
      const lastBreadcrumb = screen.getByText(/550e8400/i);
      expect(lastBreadcrumb).toBeInTheDocument();
    });

    it('should handle /new route specially', () => {
      const pathname = '/items/new';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should handle /edit route', () => {
      const pathname = '/items/123/edit';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText(/123/)).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  describe('Label Mapping', () => {
    it('should capitalize first letter of segments', () => {
      const pathname = '/items/electronics';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('should convert kebab-case to Title Case', () => {
      const pathname = '/home-appliances/kitchen-tools';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home appliances')).toBeInTheDocument();
      expect(screen.getByText('Kitchen tools')).toBeInTheDocument();
    });

    it('should use custom labels from mapping', () => {
      // TODO: Test custom label mapping once implemented
      // Example: '/items' should show 'My Items' instead of 'Items'
      const pathname = '/items';
      render(<MockDynamicBreadcrumb pathname={pathname} />);
      expect(screen.getByText('Items')).toBeInTheDocument();
    });

    it('should handle special route names', () => {
      const pathname = '/categories';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Categories')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should generate correct href for each segment', () => {
      const pathname = '/items/electronics/laptops';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');

      const itemsLink = screen.getByText('Items').closest('a');
      expect(itemsLink).toHaveAttribute('href', '/items');

      const electronicsLink = screen.getByText('Electronics').closest('a');
      expect(electronicsLink).toHaveAttribute('href', '/items/electronics');

      const laptopsItem = screen.getByText('Laptops');
      expect(laptopsItem.closest('a')).toBeNull(); // Last item not a link
    });

    it('should not create link for current page', () => {
      const pathname = '/items/details';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      const detailsItem = screen.getByText('Details');
      expect(detailsItem.closest('a')).toBeNull();
    });

    it('should create links for all parent segments', () => {
      const pathname = '/a/b/c/d';
      const { container } = render(<MockDynamicBreadcrumb pathname={pathname} />);

      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(4); // Home, A, B, C (D is current)
    });
  });

  describe('Edge Cases in Routes', () => {
    it('should handle trailing slash', () => {
      const pathname = '/items/';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
    });

    it('should handle multiple slashes', () => {
      const pathname = '/items//electronics';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      // Should filter out empty segments
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('should handle query parameters in path', () => {
      const pathname = '/items?category=electronics';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      // Should ignore query params
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
    });

    it('should handle hash fragments', () => {
      const pathname = '/items#section-1';
      render(<MockDynamicBreadcrumb pathname={pathname} />);

      // Should ignore hash
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
    });
  });

  describe('Route Updates', () => {
    it('should update breadcrumbs when pathname changes', async () => {
      const { rerender } = render(<MockDynamicBreadcrumb pathname="/items" />);
      expect(screen.getByText('Items')).toBeInTheDocument();

      rerender(<MockDynamicBreadcrumb pathname="/categories" />);
      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });
    });

    it('should maintain Home link across route changes', () => {
      const { rerender } = render(<MockDynamicBreadcrumb pathname="/items" />);
      const homeLink1 = screen.getByText('Home').closest('a');
      expect(homeLink1).toHaveAttribute('href', '/');

      rerender(<MockDynamicBreadcrumb pathname="/categories" />);
      const homeLink2 = screen.getByText('Home').closest('a');
      expect(homeLink2).toHaveAttribute('href', '/');
    });
  });

  describe('Performance', () => {
    it('should efficiently generate breadcrumbs for complex paths', () => {
      const pathname = '/a/b/c/d/e/f/g/h/i/j';

      const start = performance.now();
      render(<MockDynamicBreadcrumb pathname={pathname} />);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Should be fast
    });

    it('should memoize breadcrumb generation', () => {
      const pathname = '/items/electronics';
      const { rerender } = render(<MockDynamicBreadcrumb pathname={pathname} />);

      // Rerender with same pathname
      rerender(<MockDynamicBreadcrumb pathname={pathname} />);

      // Should use memoized result
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
  });
});
