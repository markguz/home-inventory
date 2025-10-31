import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemForm } from '@/components/items/ItemForm';

// Mock categories for testing
const mockCategories = [
  { id: 'cat-1', name: 'Electronics', description: 'Electronic items' },
  { id: 'cat-2', name: 'Tools', description: 'Hand and power tools' },
  { id: 'cat-3', name: 'Furniture', description: 'Home furniture' },
];

// Mock item data for edit mode
const mockItem = {
  id: 'item-123',
  name: 'Cordless Drill',
  description: 'DeWalt 20V MAX',
  categoryId: 'cat-2',
  location: 'Garage, Shelf 3',
  quantity: 2,
  minQuantity: 1,
  serialNumber: 'DW12345',
  notes: 'Purchased in 2023',
};

describe('ItemForm - Edit Mode', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Pre-population', () => {
    it('should pre-populate all fields with existing item data', () => {
      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      // Verify all fields are populated
      expect(screen.getByLabelText(/item name/i)).toHaveValue(mockItem.name);
      expect(screen.getByLabelText(/description/i)).toHaveValue(mockItem.description);
      expect(screen.getByLabelText(/category/i)).toHaveValue(mockItem.categoryId);
      expect(screen.getByLabelText(/location/i)).toHaveValue(mockItem.location);
      expect(screen.getByLabelText(/^quantity$/i)).toHaveValue(mockItem.quantity);
      expect(screen.getByLabelText(/minimum quantity/i)).toHaveValue(mockItem.minQuantity);
      expect(screen.getByLabelText(/serial number/i)).toHaveValue(mockItem.serialNumber);
      expect(screen.getByLabelText(/notes/i)).toHaveValue(mockItem.notes);
    });

    it('should handle partial data when some fields are missing', () => {
      const partialItem = {
        name: 'Basic Item',
        categoryId: 'cat-1',
        location: 'Living Room',
        quantity: 1,
      };

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={partialItem}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/item name/i)).toHaveValue(partialItem.name);
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/serial number/i)).toHaveValue('');
      expect(screen.getByLabelText(/notes/i)).toHaveValue('');
    });

    it('should render Save Item button text', () => {
      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('button', { name: /save item/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation in Edit Mode', () => {
    it('should validate required name field on edit', async () => {
      const user = userEvent.setup();
      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      // Clear the name field
      const nameInput = screen.getByLabelText(/item name/i);
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /save item/i }));

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate required category field on edit', async () => {
      const user = userEvent.setup();
      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      // Clear category
      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, '');
      await user.click(screen.getByRole('button', { name: /save item/i }));

      await waitFor(() => {
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate required location field on edit', async () => {
      const user = userEvent.setup();
      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      // Clear location
      const locationInput = screen.getByLabelText(/location/i);
      await user.clear(locationInput);
      await user.click(screen.getByRole('button', { name: /save item/i }));

      await waitFor(() => {
        expect(screen.getByText(/location is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate quantity is non-negative', async () => {
      const user = userEvent.setup();
      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      const quantityInput = screen.getByLabelText(/^quantity$/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '-5');
      await user.click(screen.getByRole('button', { name: /save item/i }));

      // The form should show validation error or not submit
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should validate name max length (200 characters)', async () => {
      const user = userEvent.setup();
      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      const longName = 'a'.repeat(201);
      const nameInput = screen.getByLabelText(/item name/i);
      await user.clear(nameInput);
      await user.type(nameInput, longName);
      await user.click(screen.getByRole('button', { name: /save item/i }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission in Edit Mode', () => {
    it('should submit form with updated valid data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: true });

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      // Update some fields
      const nameInput = screen.getByLabelText(/item name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Drill Name');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      await user.click(screen.getByRole('button', { name: /save item/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Verify FormData was created correctly
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData).toBeInstanceOf(FormData);
      expect(submittedData.get('name')).toBe('Updated Drill Name');
      expect(submittedData.get('description')).toBe('Updated description');
    });

    it('should submit with partial updates (only changed fields)', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: true });

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      // Only update quantity
      const quantityInput = screen.getByLabelText(/^quantity$/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      await user.click(screen.getByRole('button', { name: /save item/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.get('quantity')).toBe('5');
      // Other fields should still be present
      expect(submittedData.get('name')).toBe(mockItem.name);
    });

    it('should handle optional fields correctly when empty', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: true });

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      // Clear optional fields
      const serialInput = screen.getByLabelText(/serial number/i);
      await user.clear(serialInput);

      const notesInput = screen.getByLabelText(/notes/i);
      await user.clear(notesInput);

      await user.click(screen.getByRole('button', { name: /save item/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State in Edit Mode', () => {
    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/saving/i);
    });

    it('should show "Saving..." text during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      await user.click(screen.getByRole('button', { name: /save item/i }));

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    it('should re-enable button after successful submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: true });

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should re-enable button after failed submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases in Edit Mode', () => {
    it('should handle minQuantity as undefined', () => {
      const itemWithoutMinQty = { ...mockItem, minQuantity: undefined };

      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={itemWithoutMinQty}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/minimum quantity/i)).toHaveValue(null);
    });

    it('should handle empty categories array gracefully', () => {
      render(
        <ItemForm
          categories={[]}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect).toBeInTheDocument();
      // Should only have the "Select a category" option
      expect(categorySelect.children).toHaveLength(1);
    });

    it('should preserve data when form validation fails', async () => {
      const user = userEvent.setup();
      render(
        <ItemForm
          categories={mockCategories}
          defaultValues={mockItem}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Valid Name');

      // Clear required field to trigger validation error
      const locationInput = screen.getByLabelText(/location/i);
      await user.clear(locationInput);

      await user.click(screen.getByRole('button', { name: /save item/i }));

      // Name should still be preserved
      await waitFor(() => {
        expect(nameInput).toHaveValue('Valid Name');
      });
    });
  });
});
