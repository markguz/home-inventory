import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemList } from '@/components/items/ItemList';
import { mockItems } from '../fixtures/items';

describe('ItemList Component', () => {
  it('should render list of items', () => {
    render(<ItemList items={mockItems} />);
    mockItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  it('should render empty state when no items', () => {
    render(<ItemList items={[]} />);
    expect(screen.getByText(/no items found/i)).toBeInTheDocument();
  });

  it('should render correct number of item cards', () => {
    const { container } = render(<ItemList items={mockItems} />);
    const cards = container.querySelectorAll('[href*="/items/"]');
    expect(cards).toHaveLength(mockItems.length);
  });

  it('should display loading state', () => {
    render(<ItemList items={[]} isLoading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display error message', () => {
    const errorMessage = 'Failed to load items';
    render(<ItemList items={[]} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should render in grid layout', () => {
    const { container } = render(<ItemList items={mockItems} />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('should be responsive', () => {
    const { container } = render(<ItemList items={mockItems} />);
    const grid = container.querySelector('.grid');
    expect(grid?.className).toMatch(/grid-cols-\d+/);
  });

  it('should handle single item', () => {
    const singleItem = [mockItems[0]];
    render(<ItemList items={singleItem} />);
    expect(screen.getByText(singleItem[0].name)).toBeInTheDocument();
  });

  it('should handle large number of items', () => {
    const manyItems = Array(50)
      .fill(null)
      .map((_, i) => ({
        ...mockItems[0],
        id: `item_${i}`,
        name: `Item ${i}`,
      }));

    const { container } = render(<ItemList items={manyItems} />);
    const cards = container.querySelectorAll('[href*="/items/"]');
    expect(cards).toHaveLength(50);
  });

  it('should render pagination when provided', () => {
    const pagination = {
      page: 1,
      totalPages: 5,
      total: 100,
      limit: 20,
    };
    render(<ItemList items={mockItems} pagination={pagination} />);
    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
  });

  it('should call onPageChange when pagination buttons clicked', async () => {
    const onPageChange = vi.fn();
    const pagination = {
      page: 1,
      totalPages: 3,
      total: 60,
      limit: 20,
    };

    render(
      <ItemList
        items={mockItems}
        pagination={pagination}
        onPageChange={onPageChange}
      />
    );

    const nextButton = screen.getByText(/next/i);
    nextButton.click();

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should disable previous button on first page', () => {
    const pagination = {
      page: 1,
      totalPages: 3,
      total: 60,
      limit: 20,
    };

    render(<ItemList items={mockItems} pagination={pagination} />);
    const prevButton = screen.getByText(/previous/i);
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    const pagination = {
      page: 3,
      totalPages: 3,
      total: 60,
      limit: 20,
    };

    render(<ItemList items={mockItems} pagination={pagination} />);
    const nextButton = screen.getByText(/next/i);
    expect(nextButton).toBeDisabled();
  });

  it('should display total count', () => {
    const pagination = {
      page: 1,
      totalPages: 5,
      total: 95,
      limit: 20,
    };

    render(<ItemList items={mockItems} pagination={pagination} />);
    expect(screen.getByText(/95 items/i)).toBeInTheDocument();
  });

  it('should handle items with missing optional fields', () => {
    const itemsWithNulls = mockItems.map((item) => ({
      ...item,
      description: null,
      purchasePrice: null,
      currentValue: null,
    }));

    expect(() => render(<ItemList items={itemsWithNulls} />)).not.toThrow();
  });

  it('should maintain grid structure with few items', () => {
    const { container } = render(<ItemList items={[mockItems[0]]} />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('should show empty state with custom message', () => {
    render(
      <ItemList items={[]} emptyMessage="No items match your filters" />
    );
    expect(
      screen.getByText('No items match your filters')
    ).toBeInTheDocument();
  });

  it('should render items with consistent spacing', () => {
    const { container } = render(<ItemList items={mockItems} />);
    const grid = container.querySelector('.grid');
    expect(grid?.className).toContain('gap-');
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<ItemList items={mockItems} />);
    const list = screen.getByRole('list', { hidden: true });
    expect(list).toBeInTheDocument();
  });
});
