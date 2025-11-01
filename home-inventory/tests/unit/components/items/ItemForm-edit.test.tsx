import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemForm } from '@/features/items/components/ItemForm';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ItemForm - Edit Mode', () => {
  const mockCategories = [
    { id: 'cat_1', name: 'Electronics' },
    { id: 'cat_2', name: 'Furniture' },
  ];

  const mockLocations = [
    { id: 'loc_1', name: 'Living Room' },
    { id: 'loc_2', name: 'Bedroom' },
  ];

  const mockTags = [
    { id: 'tag_1', name: 'Important', color: '#FF0000' },
    { id: 'tag_2', name: 'Fragile', color: '#00FF00' },
  ];

  const mockExistingItem = {
    id: 'item_123',
    name: 'MacBook Pro',
    description: '16-inch M2 Pro',
    quantity: 1,
    minQuantity: 1,
    categoryId: 'cat_1',
    locationId: 'loc_1',
    condition: 'excellent' as const,
    purchasePrice: 2499.99,
    currentValue: 2200.0,
    purchaseDate: new Date('2024-01-15'),
    warrantyUntil: new Date('2027-01-15'),
    serialNumber: 'SN123456',
    barcode: '1234567890123',
    imageUrl: 'https://example.com/macbook.jpg',
    notes: 'Primary work laptop',
    tags: [
      {
        itemId: 'item_123',
        tagId: 'tag_1',
        tag: { id: 'tag_1', name: 'Important', color: '#FF0000' },
      },
    ],
  };

  const defaultProps = {
    categories: mockCategories,
    locations: mockLocations,
    tags: mockTags,
    mode: 'edit' as const,
    defaultValues: mockExistingItem,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Form Pre-population', () => {
    it('should display form with pre-populated basic fields', () => {
      render(<ItemForm {...defaultProps} />);

      expect(screen.getByDisplayValue('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByDisplayValue('16-inch M2 Pro')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('should pre-select category', () => {
      render(<ItemForm {...defaultProps} />);

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect).toHaveValue('cat_1');
    });

    it('should pre-select location', () => {
      render(<ItemForm {...defaultProps} />);

      const locationSelect = screen.getByLabelText(/location/i);
      expect(locationSelect).toHaveValue('loc_1');
    });

    it('should pre-select condition', () => {
      render(<ItemForm {...defaultProps} />);

      const conditionSelect = screen.getByLabelText(/condition/i);
      expect(conditionSelect).toHaveValue('excellent');
    });

    it('should display pre-populated optional fields', () => {
      render(<ItemForm {...defaultProps} />);

      expect(screen.getByDisplayValue('2499.99')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2200')).toBeInTheDocument();
      expect(screen.getByDisplayValue('SN123456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1234567890123')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('https://example.com/macbook.jpg')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('Primary work laptop')).toBeInTheDocument();
    });

    it('should pre-select tags', () => {
      render(<ItemForm {...defaultProps} />);

      // Tags should be displayed (implementation depends on tag component)
      const tagBadge = screen.getByText('Important');
      expect(tagBadge).toBeInTheDocument();
    });

    it('should display dates in correct format', () => {
      render(<ItemForm {...defaultProps} />);

      // Date inputs should have formatted values
      const purchaseDateInput = screen.getByLabelText(/purchase date/i);
      expect(purchaseDateInput).toHaveValue('2024-01-15');

      const warrantyInput = screen.getByLabelText(/warranty/i);
      expect(warrantyInput).toHaveValue('2027-01-15');
    });

    it('should handle item with no optional fields', () => {
      const minimalItem = {
        id: 'item_minimal',
        name: 'Minimal Item',
        quantity: 1,
        categoryId: 'cat_1',
        locationId: 'loc_1',
        condition: 'good' as const,
      };

      const props = {
        ...defaultProps,
        defaultValues: minimalItem,
      };

      render(<ItemForm {...props} />);

      expect(screen.getByDisplayValue('Minimal Item')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });
  });

  describe('Form Editing', () => {
    it('should allow editing item name', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/^name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'MacBook Pro Updated');

      expect(screen.getByDisplayValue('MacBook Pro Updated')).toBeInTheDocument();
    });

    it('should allow changing category', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, 'cat_2');

      expect(categorySelect).toHaveValue('cat_2');
    });

    it('should allow changing location', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const locationSelect = screen.getByLabelText(/location/i);
      await user.selectOptions(locationSelect, 'loc_2');

      expect(locationSelect).toHaveValue('loc_2');
    });

    it('should allow updating quantity', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText(/^quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('should allow editing optional fields', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const notesInput = screen.getByLabelText(/notes/i);
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated notes');

      expect(screen.getByDisplayValue('Updated notes')).toBeInTheDocument();
    });

    it('should allow adding tags', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      // Implementation depends on tag selection component
      const addTagButton = screen.getByRole('button', { name: /add tag/i });
      await user.click(addTagButton);

      // Should show tag selection
      const fragileTTagOption = screen.getByText('Fragile');
      await user.click(fragileTTagOption);

      expect(screen.getByText('Fragile')).toBeInTheDocument();
    });

    it('should allow removing tags', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const removeTagButton = screen.getByRole('button', {
        name: /remove.*important/i,
      });
      await user.click(removeTagButton);

      await waitFor(() => {
        expect(screen.queryByText('Important')).not.toBeInTheDocument();
      });
    });

    it('should allow clearing optional fields', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const serialNumberInput = screen.getByLabelText(/serial number/i);
      await user.clear(serialNumberInput);

      expect(serialNumberInput).toHaveValue('');
    });
  });

  describe('Form Submission', () => {
    it('should submit with updated data', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockExistingItem }),
      });
      global.fetch = mockFetch;

      render(<ItemForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/^name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated MacBook Pro');

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/items/${mockExistingItem.id}`,
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('Updated MacBook Pro'),
          })
        );
      });
    });

    it('should send only changed fields', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockExistingItem }),
      });
      global.fetch = mockFetch;

      render(<ItemForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText(/^quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '3');

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        const callArgs = mockFetch.mock.calls[0];
        const bodyData = JSON.parse(callArgs[1].body);
        expect(bodyData.quantity).toBe(3);
      });
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true, data: mockExistingItem }),
                }),
              100
            )
          )
      );

      render(<ItemForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true, data: mockExistingItem }),
                }),
              100
            )
          )
      );

      render(<ItemForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      expect(screen.getByText(/saving|updating/i)).toBeInTheDocument();
    });

    it('should redirect after successful update', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockExistingItem }),
      });

      render(<ItemForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/items');
      });
    });
  });

  describe('Validation', () => {
    it('should validate required fields on edit', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/^name/i);
      await user.clear(nameInput);

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate numeric fields', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const quantityInput = screen.getByLabelText(/^quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '-1');

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/quantity must be.*positive/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate URL format for image', async () => {
      const user = userEvent.setup();
      render(<ItemForm {...defaultProps} />);

      const imageUrlInput = screen.getByLabelText(/image url/i);
      await user.clear(imageUrlInput);
      await user.type(imageUrlInput, 'not-a-url');

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid.*url/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error toast on update failure', async () => {
      const user = userEvent.setup();
      const mockToast = vi.fn();
      vi.mocked(require('@/components/ui/toast').useToast).mockReturnValue({
        toast: mockToast,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Update failed' }),
      });

      render(<ItemForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/error|failed/i),
            variant: 'destructive',
          })
        );
      });
    });

    it('should display validation errors from API', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Validation error',
          details: [{ path: ['name'], message: 'Name is too short' }],
        }),
      });

      render(<ItemForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is too short/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      const mockToast = vi.fn();
      vi.mocked(require('@/components/ui/toast').useToast).mockReturnValue({
        toast: mockToast,
      });

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<ItemForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/error|failed/i),
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Cancel Action', () => {
    it('should navigate back on cancel', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
      });

      render(<ItemForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/items');
    });

    it('should not submit form when canceling', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      render(<ItemForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
