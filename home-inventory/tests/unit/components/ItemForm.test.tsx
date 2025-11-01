import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemForm } from '@/components/items/ItemForm';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('ItemForm - Location Dropdown', () => {
  const mockLocations = [
    { id: 'loc-1', name: 'Garage', description: 'Main garage', parentId: null },
    { id: 'loc-2', name: 'Shed', description: 'Tool shed', parentId: null },
    { id: 'loc-3', name: 'Kitchen', description: 'Kitchen storage', parentId: null },
  ];

  const mockCategories = [
    { id: 'cat-1', name: 'Tools', description: 'Power tools and hand tools' },
    { id: 'cat-2', name: 'Appliances', description: 'Kitchen appliances' },
  ];

  const mockOnSubmit = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  // Helper functions to get select elements by name
  const getLocationSelect = () => {
    const selects = screen.getAllByRole('combobox');
    return selects.find(select => select.getAttribute('name') === 'locationId')!;
  };

  const getCategorySelect = () => {
    const selects = screen.getAllByRole('combobox');
    return selects.find(select => select.getAttribute('name') === 'categoryId')!;
  };

  describe('Render Tests', () => {
    it('should render ItemForm with locations prop', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const locationLabel = screen.getByText(/^location$/i);
      expect(locationLabel).toBeInTheDocument();

      // Find the select element by name attribute
      const locationSelect = getLocationSelect();
      expect(locationSelect).toBeInTheDocument();
    });

    it('should verify location dropdown is visible in the form', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      expect(locationSelect).toBeVisible();
      expect(locationSelect.tagName).toBe('SELECT');
    });

    it('should verify location label displays "Location"', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const label = screen.getByText(/^location$/i);
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('should verify "Select a location" placeholder text is shown', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const placeholderOption = screen.getByRole('option', { name: /select a location/i });

      expect(placeholderOption).toBeInTheDocument();
      expect(placeholderOption).toHaveValue('');
    });

    it('should render location dropdown with proper styling', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      expect(locationSelect).toHaveClass('w-full', 'rounded-md', 'border', 'p-2');
    });
  });

  describe('Location List Tests', () => {
    it('should verify all locations are rendered as options', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      mockLocations.forEach((location) => {
        const option = screen.getByRole('option', { name: location.name });
        expect(option).toBeInTheDocument();
      });
    });

    it('should verify location names are displayed (not IDs)', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      mockLocations.forEach((location) => {
        expect(screen.getByText(location.name)).toBeInTheDocument();
        // Verify the visible text is the name, not the ID
        const option = screen.getByRole('option', { name: location.name });
        expect(option.textContent).toBe(location.name);
        expect(option.textContent).not.toBe(location.id);
      });
    });

    it('should verify location IDs are used as option values', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      mockLocations.forEach((location) => {
        const option = screen.getByRole('option', { name: location.name });
        expect(option).toHaveValue(location.id);
      });
    });

    it('should render correct number of location options (including placeholder)', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      const options = locationSelect.querySelectorAll('option');

      // Should have placeholder + all locations
      expect(options).toHaveLength(mockLocations.length + 1);
    });

    it('should handle empty locations array gracefully', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={[]}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      const options = locationSelect.querySelectorAll('option');

      // Should only have placeholder
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent(/select a location/i);
    });

    it('should render locations in the order provided', () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      const options = Array.from(locationSelect.querySelectorAll('option'));

      // Skip first option (placeholder)
      const locationOptions = options.slice(1);

      locationOptions.forEach((option, index) => {
        expect(option).toHaveTextContent(mockLocations[index].name);
        expect(option).toHaveValue(mockLocations[index].id);
      });
    });
  });

  describe('Selection Tests', () => {
    it('should verify user can select a location from dropdown', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      await user.selectOptions(locationSelect, 'loc-2');

      expect(locationSelect).toHaveValue('loc-2');
      expect(screen.getByRole('option', { name: 'Shed' })).toBeInTheDocument();
    });

    it('should verify selected location ID is captured in form data', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const categorySelect = getCategorySelect();
      const locationSelect = getLocationSelect();

      await user.type(nameInput, 'Test Item');
      await user.selectOptions(categorySelect, 'cat-1');
      await user.selectOptions(locationSelect, 'loc-3');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      const submittedFormData = mockOnSubmit.mock.calls[0][0];
      expect(submittedFormData.get('locationId')).toBe('loc-3');
    });

    it('should verify default location is pre-selected when editing', () => {
      const defaultValues = {
        name: 'Existing Item',
        categoryId: 'cat-1',
        locationId: 'loc-2',
        quantity: 5,
      };

      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          defaultValues={defaultValues}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      expect(locationSelect).toHaveValue('loc-2');

      const selectedOption = screen.getByRole('option', { name: 'Shed' }) as HTMLOptionElement;
      expect(selectedOption.selected).toBe(true);
    });

    it('should allow changing location selection', async () => {
      const defaultValues = {
        name: 'Existing Item',
        categoryId: 'cat-1',
        locationId: 'loc-1',
        quantity: 1,
      };

      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          defaultValues={defaultValues}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      expect(locationSelect).toHaveValue('loc-1');

      await user.selectOptions(locationSelect, 'loc-3');
      expect(locationSelect).toHaveValue('loc-3');
    });

    it('should verify form validates when no location selected', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const categorySelect = getCategorySelect();

      await user.type(nameInput, 'Test Item');
      await user.selectOptions(categorySelect, 'cat-1');
      // Don't select a location

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/location.*required/i);
        expect(errorMessage).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear validation error when location is selected', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const categorySelect = getCategorySelect();
      const locationSelect = getLocationSelect();

      await user.type(nameInput, 'Test Item');
      await user.selectOptions(categorySelect, 'cat-1');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/location.*required/i)).toBeInTheDocument();
      });

      await user.selectOptions(locationSelect, 'loc-1');

      await waitFor(() => {
        expect(screen.queryByText(/location.*required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should verify location selection is included in form submission', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const categorySelect = getCategorySelect();
      const locationSelect = getLocationSelect();
      const quantityInput = screen.getByLabelText(/^quantity/i);

      await user.type(nameInput, 'Power Drill');
      await user.selectOptions(categorySelect, 'cat-1');
      await user.selectOptions(locationSelect, 'loc-1');
      await user.clear(quantityInput);
      await user.type(quantityInput, '2');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      const submittedFormData = mockOnSubmit.mock.calls[0][0];
      expect(submittedFormData.get('name')).toBe('Power Drill');
      expect(submittedFormData.get('categoryId')).toBe('cat-1');
      expect(submittedFormData.get('locationId')).toBe('loc-1');
      expect(submittedFormData.get('quantity')).toBe('2');
    });

    it('should verify location data flows through to onSubmit handler', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const categorySelect = getCategorySelect();
      const locationSelect = getLocationSelect();

      await user.type(nameInput, 'Test Item');
      await user.selectOptions(categorySelect, 'cat-1');
      await user.selectOptions(locationSelect, 'loc-2');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      const formData = mockOnSubmit.mock.calls[0][0];
      const locationId = formData.get('locationId');

      expect(locationId).toBe('loc-2');
      expect(mockLocations.find((loc) => loc.id === locationId)).toEqual({
        id: 'loc-2',
        name: 'Shed',
        description: 'Tool shed',
        parentId: null,
      });
    });

    it('should verify location validation errors display properly', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const categorySelect = getCategorySelect();

      await user.type(nameInput, 'Test Item');
      await user.selectOptions(categorySelect, 'cat-1');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByText(/location.*required/i);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveClass('text-sm', 'text-red-500');
      });
    });

    it('should submit successfully with all required fields including location', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const categorySelect = getCategorySelect();
      const locationSelect = getLocationSelect();

      await user.type(nameInput, 'Circular Saw');
      await user.selectOptions(categorySelect, 'cat-1');
      await user.selectOptions(locationSelect, 'loc-1');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });

    it('should handle location change during form editing', async () => {
      const defaultValues = {
        name: 'Drill',
        categoryId: 'cat-1',
        locationId: 'loc-1',
        quantity: 1,
      };

      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          defaultValues={defaultValues}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      expect(locationSelect).toHaveValue('loc-1');

      // Change to different location
      await user.selectOptions(locationSelect, 'loc-3');
      expect(locationSelect).toHaveValue('loc-3');

      // Change back to original
      await user.selectOptions(locationSelect, 'loc-1');
      expect(locationSelect).toHaveValue('loc-1');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      const formData = mockOnSubmit.mock.calls[0][0];
      expect(formData.get('locationId')).toBe('loc-1');
    });

    it('should preserve location selection on form error', async () => {
      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={mockOnSubmit}
        />
      );

      const categorySelect = getCategorySelect();
      const locationSelect = getLocationSelect();

      await user.selectOptions(categorySelect, 'cat-1');
      await user.selectOptions(locationSelect, 'loc-2');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
      });

      // Location should still be selected
      expect(locationSelect).toHaveValue('loc-2');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single location in list', () => {
      const singleLocation = [mockLocations[0]];

      render(
        <ItemForm
          categories={mockCategories}
          locations={singleLocation}
          onSubmit={mockOnSubmit}
        />
      );

      const locationSelect = getLocationSelect();
      const options = locationSelect.querySelectorAll('option');

      expect(options).toHaveLength(2); // placeholder + 1 location
      expect(screen.getByRole('option', { name: 'Garage' })).toBeInTheDocument();
    });

    it('should handle locations with special characters in names', () => {
      const specialLocations = [
        { id: 'loc-1', name: "John's Garage", description: '', parentId: null },
        { id: 'loc-2', name: 'Storage #2', description: '', parentId: null },
        { id: 'loc-3', name: 'Shed & Workshop', description: '', parentId: null },
      ];

      render(
        <ItemForm
          categories={mockCategories}
          locations={specialLocations}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('option', { name: "John's Garage" })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Storage #2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Shed & Workshop' })).toBeInTheDocument();
    });

    it('should handle very long location names', () => {
      const longNameLocation = [
        {
          id: 'loc-1',
          name: 'Very Long Location Name That Might Overflow The Dropdown Container',
          description: '',
          parentId: null,
        },
      ];

      render(
        <ItemForm
          categories={mockCategories}
          locations={longNameLocation}
          onSubmit={mockOnSubmit}
        />
      );

      const option = screen.getByRole('option', {
        name: 'Very Long Location Name That Might Overflow The Dropdown Container',
      });
      expect(option).toBeInTheDocument();
    });

    it('should maintain location selection when form is disabled during submission', async () => {
      let resolveSubmit: () => void;
      const delayedSubmit = vi.fn(() => {
        return new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        });
      });

      render(
        <ItemForm
          categories={mockCategories}
          locations={mockLocations}
          onSubmit={delayedSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/item name/i);
      const categorySelect = getCategorySelect();
      const locationSelect = getLocationSelect();

      await user.type(nameInput, 'Test Item');
      await user.selectOptions(categorySelect, 'cat-1');
      await user.selectOptions(locationSelect, 'loc-2');

      const submitButton = screen.getByRole('button', { name: /save item/i });
      await user.click(submitButton);

      // Form should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Location should still have selected value
      expect(locationSelect).toHaveValue('loc-2');

      // Resolve the submission
      resolveSubmit!();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});
