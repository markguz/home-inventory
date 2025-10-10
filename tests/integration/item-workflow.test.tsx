import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemsPage } from '@/app/items/page';
import { prismaMock } from '../mocks/prisma';
import { mockItems, createMockItem } from '../fixtures/items';

describe('Item Management Workflow', () => {
  beforeEach(() => {
    prismaMock.item.findMany.mockResolvedValue(mockItems);
  });

  it('should complete full create item workflow', async () => {
    const user = userEvent.setup();
    const newItem = createMockItem({ name: 'New Laptop' });

    prismaMock.item.create.mockResolvedValue(newItem);
    prismaMock.item.findMany.mockResolvedValue([...mockItems, newItem]);

    render(<ItemsPage />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    // Click add new item button
    await user.click(screen.getByRole('button', { name: /add item/i }));

    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'New Laptop');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Electronics');
    await user.type(screen.getByLabelText(/location/i), 'Office');
    await user.type(screen.getByLabelText(/quantity/i), '1');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }));

    // Verify item appears in list
    await waitFor(() => {
      expect(screen.getByText('New Laptop')).toBeInTheDocument();
    });
  });

  it('should complete edit item workflow', async () => {
    const user = userEvent.setup();
    const updatedItem = { ...mockItems[0], name: 'Updated Laptop' };

    prismaMock.item.update.mockResolvedValue(updatedItem);

    render(<ItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // Update name
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Laptop');

    // Submit
    await user.click(screen.getByRole('button', { name: /update/i }));

    // Verify update
    await waitFor(() => {
      expect(screen.getByText('Updated Laptop')).toBeInTheDocument();
    });
  });

  it('should complete delete item workflow', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);

    prismaMock.item.delete.mockResolvedValue(mockItems[0]);
    prismaMock.item.findMany.mockResolvedValue(mockItems.slice(1));

    render(<ItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    // Click delete
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Verify confirmation
    expect(window.confirm).toHaveBeenCalled();

    // Verify item removed
    await waitFor(() => {
      expect(screen.queryByText('Laptop')).not.toBeInTheDocument();
    });
  });

  it('should search and filter items', async () => {
    const user = userEvent.setup();
    const electronicsItems = mockItems.filter(i => i.category === 'Electronics');

    prismaMock.item.findMany.mockResolvedValue(electronicsItems);

    render(<ItemsPage />);

    // Search
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'laptop');

    // Filter by category
    await user.selectOptions(screen.getByLabelText(/category/i), 'Electronics');

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.queryByText('Coffee Maker')).not.toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();
    const manyItems = Array.from({ length: 25 }, (_, i) =>
      createMockItem({ id: String(i), name: `Item ${i}` })
    );

    prismaMock.item.findMany.mockResolvedValue(manyItems.slice(0, 10));

    render(<ItemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Item 0')).toBeInTheDocument();
    });

    // Go to next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    prismaMock.item.findMany.mockResolvedValue(manyItems.slice(10, 20));

    await waitFor(() => {
      expect(screen.getByText('Item 10')).toBeInTheDocument();
    });
  });
});
