/**
 * Component Tests: AlertBadge UI Component
 * Tests the visual alert badge rendering and behavior
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '../setup/test-utils';
import { createMockItem, type AlertLevel } from '../fixtures/alert-fixtures';

/**
 * AlertBadge Component (to be implemented)
 * Displays a visual indicator of stock level alerts
 */
interface AlertBadgeProps {
  item: {
    quantity: number;
    minQuantity?: number | null;
  };
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Mock component for testing (should be replaced with actual implementation)
const AlertBadge = ({ item, showLabel = true, size = 'md' }: AlertBadgeProps) => {
  const { quantity, minQuantity } = item;

  if (!minQuantity || minQuantity === 0) {
    return null;
  }

  const percentage = (quantity / minQuantity) * 100;
  let level: AlertLevel;
  let color: string;
  let label: string;

  if (quantity === 0 || percentage <= 50) {
    level = 'critical';
    color = 'bg-red-500';
    label = 'Critical';
  } else if (percentage <= 100) {
    level = 'warning';
    color = 'bg-yellow-500';
    label = 'Low Stock';
  } else {
    level = 'ok';
    color = 'bg-green-500';
    label = 'In Stock';
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      data-testid="alert-badge"
      data-level={level}
      className={`inline-flex items-center rounded-full ${color} text-white ${sizeClasses[size]}`}
      role="status"
      aria-label={`Stock level: ${label}`}
    >
      {showLabel && <span>{label}</span>}
      {!showLabel && (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
};

describe('AlertBadge Component Tests', () => {
  describe('Rendering', () => {
    it('should render critical badge for zero quantity', () => {
      const item = createMockItem({ quantity: 0, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-level', 'critical');
      expect(badge).toHaveTextContent('Critical');
    });

    it('should render critical badge for low stock (<50%)', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveAttribute('data-level', 'critical');
      expect(badge).toHaveClass('bg-red-500');
    });

    it('should render warning badge for low stock (50-100%)', () => {
      const item = createMockItem({ quantity: 8, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveAttribute('data-level', 'warning');
      expect(badge).toHaveClass('bg-yellow-500');
      expect(badge).toHaveTextContent('Low Stock');
    });

    it('should render ok badge for sufficient stock', () => {
      const item = createMockItem({ quantity: 15, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveAttribute('data-level', 'ok');
      expect(badge).toHaveClass('bg-green-500');
    });

    it('should not render badge when minQuantity is null', () => {
      const item = createMockItem({ quantity: 5, minQuantity: null });
      const { container } = render(<AlertBadge item={item} />);

      expect(container.querySelector('[data-testid="alert-badge"]')).not.toBeInTheDocument();
    });

    it('should not render badge when minQuantity is zero', () => {
      const item = createMockItem({ quantity: 5, minQuantity: 0 });
      const { container } = render(<AlertBadge item={item} />);

      expect(container.querySelector('[data-testid="alert-badge"]')).not.toBeInTheDocument();
    });
  });

  describe('Label Display', () => {
    it('should show label when showLabel is true', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 10 });
      render(<AlertBadge item={item} showLabel={true} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveTextContent('Critical');
    });

    it('should hide label when showLabel is false', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 10 });
      render(<AlertBadge item={item} showLabel={false} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge.textContent).toBe('Critical'); // sr-only text
      expect(badge.querySelector('.sr-only')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size badge', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 10 });
      render(<AlertBadge item={item} size="sm" />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render medium size badge (default)', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveClass('text-sm');
    });

    it('should render large size badge', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 10 });
      render(<AlertBadge item={item} size="lg" />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('should have aria-label with stock level', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveAttribute('aria-label', 'Stock level: Critical');
    });

    it('should provide screen reader text when label is hidden', () => {
      const item = createMockItem({ quantity: 8, minQuantity: 10 });
      render(<AlertBadge item={item} showLabel={false} />);

      const srText = screen.getByText('Low Stock', { selector: '.sr-only' });
      expect(srText).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should use red for critical alerts', () => {
      const item = createMockItem({ quantity: 0, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveClass('bg-red-500');
    });

    it('should use yellow for warning alerts', () => {
      const item = createMockItem({ quantity: 8, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveClass('bg-yellow-500');
    });

    it('should use green for ok stock levels', () => {
      const item = createMockItem({ quantity: 15, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveClass('bg-green-500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 50% stock as critical', () => {
      const item = createMockItem({ quantity: 5, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveAttribute('data-level', 'critical');
    });

    it('should handle exactly 100% stock as warning', () => {
      const item = createMockItem({ quantity: 10, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveAttribute('data-level', 'warning');
    });

    it('should handle very large quantities', () => {
      const item = createMockItem({ quantity: 1000000, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveAttribute('data-level', 'ok');
    });

    it('should handle negative quantity gracefully', () => {
      const item = createMockItem({ quantity: -5, minQuantity: 10 });
      render(<AlertBadge item={item} />);

      const badge = screen.getByTestId('alert-badge');
      expect(badge).toHaveAttribute('data-level', 'critical');
    });
  });

  describe('Integration with Item Card', () => {
    it('should display alongside item information', () => {
      const item = createMockItem({
        name: 'Coffee Beans',
        quantity: 3,
        minQuantity: 10
      });

      const { container } = render(
        <div data-testid="item-card">
          <h3>{item.name}</h3>
          <p>Quantity: {item.quantity}</p>
          <AlertBadge item={item} />
        </div>
      );

      expect(screen.getByText('Coffee Beans')).toBeInTheDocument();
      expect(screen.getByTestId('alert-badge')).toBeInTheDocument();
    });
  });
});
