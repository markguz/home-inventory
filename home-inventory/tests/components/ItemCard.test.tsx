import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemCard } from '@/components/items/ItemCard';
import { mockItem } from '../fixtures/items';

describe('ItemCard Component', () => {
  it('should render item name', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText(mockItem.name)).toBeInTheDocument();
  });

  it('should render item description when provided', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText(mockItem.description!)).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const itemWithoutDesc = { ...mockItem, description: null };
    const { container } = render(<ItemCard item={itemWithoutDesc} />);
    expect(container.querySelector('.line-clamp-2')).not.toBeInTheDocument();
  });

  it('should render category information', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText(new RegExp(mockItem.category.name))).toBeInTheDocument();
  });

  it('should render location information', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText(mockItem.location.name)).toBeInTheDocument();
  });

  it('should render quantity badge when quantity > 1', () => {
    const multipleItems = { ...mockItem, quantity: 5 };
    render(<ItemCard item={multipleItems} />);
    expect(screen.getByText('×5')).toBeInTheDocument();
  });

  it('should not render quantity badge when quantity is 1', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.queryByText('×1')).not.toBeInTheDocument();
  });

  it('should render purchase price when provided', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText(/Paid:/)).toBeInTheDocument();
    expect(screen.getByText(/\$2,499\.99/)).toBeInTheDocument();
  });

  it('should render current value when provided', () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText(/Value:/)).toBeInTheDocument();
    expect(screen.getByText(/\$2,200\.00/)).toBeInTheDocument();
  });

  it('should not render price section when both prices are null', () => {
    const itemWithoutPrices = {
      ...mockItem,
      purchasePrice: null,
      currentValue: null,
    };
    const { container } = render(<ItemCard item={itemWithoutPrices} />);
    expect(screen.queryByText(/Paid:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Value:/)).not.toBeInTheDocument();
  });

  it('should render condition badge with correct styling', () => {
    const { container } = render(<ItemCard item={mockItem} />);
    const conditionBadge = screen.getByText(mockItem.condition);
    expect(conditionBadge).toBeInTheDocument();
    expect(conditionBadge.className).toContain('bg-green-100');
  });

  it('should apply correct condition styling', () => {
    const conditions = [
      { condition: 'excellent', bgClass: 'bg-green-100' },
      { condition: 'good', bgClass: 'bg-blue-100' },
      { condition: 'fair', bgClass: 'bg-yellow-100' },
      { condition: 'poor', bgClass: 'bg-red-100' },
    ] as const;

    conditions.forEach(({ condition, bgClass }) => {
      const item = { ...mockItem, condition };
      const { container } = render(<ItemCard item={item} />);
      const badge = screen.getByText(condition);
      expect(badge.className).toContain(bgClass);
      cleanup();
    });
  });

  it('should render purchase date when provided', () => {
    render(<ItemCard item={mockItem} />);
    // Date formatting varies by locale, so just check for month
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
  });

  it('should render image when imageUrl is provided', () => {
    const { container } = render(<ItemCard item={mockItem} />);
    const image = container.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('alt', mockItem.name);
  });

  it('should not render image container when imageUrl is null', () => {
    const itemWithoutImage = { ...mockItem, imageUrl: null };
    const { container } = render(<ItemCard item={itemWithoutImage} />);
    expect(container.querySelector('.h-48')).not.toBeInTheDocument();
  });

  it('should render as a clickable link', () => {
    const { container } = render(<ItemCard item={mockItem} />);
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `/items/${mockItem.id}`);
  });

  it('should apply hover styles', () => {
    const { container } = render(<ItemCard item={mockItem} />);
    const card = container.querySelector('.hover\\:shadow-lg');
    expect(card).toBeInTheDocument();
  });

  it('should render category with custom color when provided', () => {
    const { container } = render(<ItemCard item={mockItem} />);
    const categoryBadge = container.querySelector('[style*="backgroundColor"]');
    expect(categoryBadge).toBeInTheDocument();
  });

  it('should render lucide icons', () => {
    const { container } = render(<ItemCard item={mockItem} />);
    // Check for icon containers (Package, MapPin, Calendar)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should handle items with all optional fields as null', () => {
    const minimalItem = {
      ...mockItem,
      description: null,
      purchaseDate: null,
      purchasePrice: null,
      currentValue: null,
      imageUrl: null,
      quantity: 1,
    };

    expect(() => render(<ItemCard item={minimalItem} />)).not.toThrow();
    expect(screen.getByText(minimalItem.name)).toBeInTheDocument();
  });

  it('should have accessible structure', () => {
    const { container } = render(<ItemCard item={mockItem} />);
    expect(container.querySelector('h3')).toBeInTheDocument();
    expect(container.querySelector('a')).toHaveAttribute('href');
  });

  it('should display creation date', () => {
    render(<ItemCard item={mockItem} />);
    // Check that date is rendered (format may vary)
    const dateElements = screen.getAllByText(/Jan|2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });
});

function cleanup() {
  // Helper for cleanup between condition tests
  document.body.innerHTML = '';
}
