import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemForm } from '@/components/ItemForm';
import { mockItems, mockCategories } from '../fixtures/items';

describe('ItemForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty form for new item', () => {
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('should populate form when editing existing item', () => {
    const item = mockItems[0];
    render(<ItemForm item={item} onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue(item.name);
    expect(screen.getByLabelText(/description/i)).toHaveValue(item.description);
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    await user.type(screen.getByLabelText(/name/i), 'New Item');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Electronics');
    await user.type(screen.getByLabelText(/location/i), 'Office');
    await user.type(screen.getByLabelText(/quantity/i), '2');
    await user.type(screen.getByLabelText(/price/i), '99.99');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Item',
        description: 'Test description',
        category: 'Electronics',
        location: 'Office',
        quantity: 2,
        purchasePrice: 99.99,
      }));
    });
  });

  it('should validate quantity is positive', async () => {
    const user = userEvent.setup();
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    await user.type(screen.getByLabelText(/quantity/i), '-1');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/quantity must be positive/i)).toBeInTheDocument();
  });

  it('should validate price is positive', async () => {
    const user = userEvent.setup();
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    await user.type(screen.getByLabelText(/price/i), '-50');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/price must be positive/i)).toBeInTheDocument();
  });

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should handle image upload', async () => {
    const user = userEvent.setup();
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    const input = screen.getByLabelText(/image/i);
    await user.upload(input, file);

    expect(input.files[0]).toBe(file);
    expect(input.files).toHaveLength(1);
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ItemForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} categories={mockCategories} />);

    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });
});
