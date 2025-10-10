import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemCard } from '@/components/ItemCard';
import { mockItems } from '../fixtures/items';

describe('ItemCard Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockItem = mockItems[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render item details', () => {
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(mockItem.name)).toBeInTheDocument();
    expect(screen.getByText(mockItem.description)).toBeInTheDocument();
    expect(screen.getByText(mockItem.category)).toBeInTheDocument();
    expect(screen.getByText(mockItem.location)).toBeInTheDocument();
  });

  it('should display formatted price', () => {
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('$1,299.99')).toBeInTheDocument();
  });

  it('should display item image', () => {
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const image = screen.getByAltText(mockItem.name);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining(mockItem.imageUrl));
  });

  it('should call onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockItem);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockItem.id);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should show confirmation dialog before delete', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);

    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
  });

  it('should not delete if confirmation cancelled', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);

    render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should display placeholder image when imageUrl is null', () => {
    const itemWithoutImage = { ...mockItem, imageUrl: null };
    render(<ItemCard item={itemWithoutImage} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const image = screen.getByAltText(mockItem.name);
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('should apply correct CSS classes for condition', () => {
    const { container } = render(<ItemCard item={mockItem} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const conditionBadge = screen.getByText(mockItem.condition);
    expect(conditionBadge).toHaveClass('condition-excellent');
  });
});
