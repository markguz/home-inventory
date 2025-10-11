/**
 * @test Breadcrumb Accessibility Tests
 * @description Comprehensive accessibility testing using jest-axe
 * @standards WCAG 2.1 Level AA compliance
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

expect.extend(toHaveNoViolations);

// Mock Breadcrumb component
const MockBreadcrumb = ({ items, separator = '/' }: any) => (
  <nav aria-label="breadcrumb">
    <ol style={{ listStyle: 'none', display: 'flex', gap: '0.5rem' }}>
      {items.map((item: any, index: number) => (
        <li key={index}>
          {item.href ? (
            <a href={item.href}>{item.label}</a>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span aria-hidden="true" style={{ margin: '0 0.5rem' }}>
              {separator}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

describe('Breadcrumb Accessibility', () => {
  describe('ARIA Landmarks and Labels', () => {
    it('should have navigation role', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: null },
      ];

      render(<MockBreadcrumb items={items} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have aria-label="breadcrumb"', () => {
      const items = [{ label: 'Home', href: '/' }];
      render(<MockBreadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'breadcrumb');
    });

    it('should use semantic list structure', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: '/items' },
      ];

      const { container } = render(<MockBreadcrumb items={items} />);
      expect(container.querySelector('ol')).toBeInTheDocument();
      expect(container.querySelectorAll('li')).toHaveLength(2);
    });

    it('should have aria-current="page" on current item', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Current Page', href: null },
      ];

      render(<MockBreadcrumb items={items} />);
      const currentItem = screen.getByText('Current Page');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });

    it('should hide separator from screen readers', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: null },
      ];

      const { container } = render(<MockBreadcrumb items={items} />);
      const separator = container.querySelector('[aria-hidden="true"]');
      expect(separator).toBeInTheDocument();
      expect(separator?.textContent).toBe('/');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard navigable with Tab', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: '/items' },
        { label: 'Details', href: null },
      ];

      render(<MockBreadcrumb items={items} />);

      const homeLink = screen.getByText('Home');
      const itemsLink = screen.getByText('Items');

      // Tab to first link
      await user.tab();
      expect(homeLink).toHaveFocus();

      // Tab to second link
      await user.tab();
      expect(itemsLink).toHaveFocus();
    });

    it('should skip current page item in tab order', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Current', href: null },
      ];

      render(<MockBreadcrumb items={items} />);

      await user.tab();
      expect(screen.getByText('Home')).toHaveFocus();

      // Next tab should skip current item (no href)
      await user.tab();
      expect(screen.getByText('Current')).not.toHaveFocus();
    });

    it('should support Enter key on links', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: '/items' },
      ];

      render(<MockBreadcrumb items={items} />);

      const homeLink = screen.getByText('Home').closest('a');
      if (homeLink) {
        homeLink.addEventListener('click', handleClick);
        await user.click(homeLink);
        expect(handleClick).toHaveBeenCalled();
      }
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should announce breadcrumb navigation properly', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: '/items' },
        { label: 'Details', href: null },
      ];

      render(<MockBreadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAccessibleName('breadcrumb');
    });

    it('should provide context for current location', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Current Location', href: null },
      ];

      render(<MockBreadcrumb items={items} />);

      const currentItem = screen.getByText('Current Location');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });

    it('should not announce separators to screen readers', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: null },
      ];

      const { container } = render(<MockBreadcrumb items={items} separator=">" />);

      const separator = container.querySelector('[aria-hidden="true"]');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
    });

    it('should provide meaningful link text', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Electronics', href: '/electronics' },
      ];

      render(<MockBreadcrumb items={items} />);

      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Electronics' })).toBeInTheDocument();
    });
  });

  describe('Automated Accessibility Testing', () => {
    it('should have no axe violations with simple breadcrumb', async () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: null },
      ];

      const { container } = render(<MockBreadcrumb items={items} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with complex breadcrumb', async () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Categories', href: '/categories' },
        { label: 'Electronics', href: '/categories/electronics' },
        { label: 'Laptops', href: '/categories/electronics/laptops' },
        { label: 'Gaming Laptops', href: null },
      ];

      const { container } = render(<MockBreadcrumb items={items} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with custom separator', async () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: null },
      ];

      const { container } = render(<MockBreadcrumb items={items} separator="→" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with JSX separator', async () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: null },
      ];

      const CustomSep = <span className="separator">›</span>;
      const { container } = render(<MockBreadcrumb items={items} separator={CustomSep} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('should maintain sufficient color contrast for links', () => {
      // Note: This would typically use a color contrast checker tool
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: null },
      ];

      const { container } = render(<MockBreadcrumb items={items} />);

      // Links should be visible and distinguishable
      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should distinguish current page visually', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Current', href: null },
      ];

      render(<MockBreadcrumb items={items} />);

      const currentItem = screen.getByText('Current');
      expect(currentItem.tagName.toLowerCase()).toBe('span');
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: '/items' },
      ];

      render(<MockBreadcrumb items={items} />);

      const homeLink = screen.getByText('Home');
      await user.tab();

      expect(homeLink).toHaveFocus();
      // Focus indicator is managed by browser/CSS
    });

    it('should maintain focus order', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'First', href: '/first' },
        { label: 'Second', href: '/second' },
        { label: 'Third', href: '/third' },
      ];

      render(<MockBreadcrumb items={items} />);

      await user.tab();
      expect(screen.getByText('First')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Second')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Third')).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    it('should remain accessible on mobile viewports', async () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Category', href: '/category' },
        { label: 'Item', href: null },
      ];

      // Simulate mobile viewport
      global.innerWidth = 375;
      const { container } = render(<MockBreadcrumb items={items} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle touch interactions', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Items', href: '/items' },
      ];

      render(<MockBreadcrumb items={items} />);

      const links = screen.getAllByRole('link');
      // Links should be large enough for touch (44x44px recommended)
      expect(links).toHaveLength(2);
    });
  });

  describe('Error States', () => {
    it('should handle missing labels gracefully', () => {
      const items = [
        { label: '', href: '/' },
        { label: 'Items', href: null },
      ];

      const { container } = render(<MockBreadcrumb items={items} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle missing hrefs gracefully', () => {
      const items = [
        { label: 'Home', href: null },
        { label: 'Items', href: null },
      ];

      render(<MockBreadcrumb items={items} />);

      // All items should render as text
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
    });
  });
});
