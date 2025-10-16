import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationForm } from '@/components/locations/LocationForm';
import { mockLocation, mockLocationMinimal, mockLocations } from '../fixtures/locations';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next/navigation
const mockRouterRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

describe('LocationForm Component', () => {
  const mockOnOpenChange = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock and set default response for locations API
    global.fetch = vi.fn((url) => {
      if (url === '/api/locations') {
        return Promise.resolve({
          ok: true,
          json: async () => mockLocations,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields in create mode', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

      // Wait for parent location select to load
      await waitFor(() => {
        expect(screen.getByText(/parent location/i)).toBeInTheDocument();
      });
    });

    it('should render create mode title and description', () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.getByText('Create Location')).toBeInTheDocument();
      expect(
        screen.getByText(/Add a new location to organize where items are stored/i)
      ).toBeInTheDocument();
    });

    it('should render edit mode title and description', () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          location={mockLocation}
          mode="edit"
        />
      );

      expect(screen.getByText('Edit Location')).toBeInTheDocument();
      expect(
        screen.getByText(/Update the location information/i)
      ).toBeInTheDocument();
    });

    it('should pre-populate form fields in edit mode', () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          location={mockLocation}
          mode="edit"
        />
      );

      expect(screen.getByDisplayValue(mockLocation.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockLocation.description!)).toBeInTheDocument();
    });

    it('should render cancel and submit buttons', () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should show correct button text in edit mode', () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          location={mockLocation}
          mode="edit"
        />
      );

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required name field', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should accept valid name input', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Kitchen Cabinet');

      expect(nameInput).toHaveValue('Kitchen Cabinet');
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });

    it('should enforce maximum length on name field', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const longName = 'a'.repeat(201); // Max is 200
      await user.type(nameInput, longName);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/string must contain at most 200 character/i)).toBeInTheDocument();
      });
    });
  });

  describe('Optional Fields', () => {
    it('should allow empty description field', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_loc_1', name: 'Test Location' }),
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Location');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should accept description input', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Storage area for kitchen items');

      expect(descriptionInput).toHaveValue('Storage area for kitchen items');
    });

    it('should allow empty parentId field (defaults to none)', async () => {
      global.fetch = vi.fn((url) => {
        if (url === '/api/locations' && typeof url === 'string') {
          return Promise.resolve({
            ok: true,
            json: async () => mockLocations,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'new_loc_1', name: 'Test Location' }),
        });
      }) as any;

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Location');

      // Wait for select to be enabled
      await waitFor(() => {
        const selectTrigger = screen.getByRole('combobox');
        expect(selectTrigger).not.toBeDisabled();
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const createCalls = (global.fetch as any).mock.calls.filter(
          (call: any) => call[0] === '/api/locations' && call[1]?.method === 'POST'
        );
        expect(createCalls.length).toBeGreaterThan(0);
        const body = JSON.parse(createCalls[0][1].body);
        expect(body.parentId).toBeNull();
      });
    });

    it('should display parent location select with options', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      // Wait for locations to load
      await waitFor(() => {
        const selectTrigger = screen.getByRole('combobox');
        expect(selectTrigger).not.toBeDisabled();
      });

      // Open select dropdown
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      // Should show "No parent" option and loaded locations
      await waitFor(() => {
        expect(screen.getByText(/no parent \(top level\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - Create Mode', () => {
    it('should submit form with valid data in create mode', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_loc_1', name: 'New Location' }),
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'New Location');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Test description');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/locations',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should send correct data in request body', async () => {
      global.fetch = vi.fn((url) => {
        if (url === '/api/locations' && typeof url === 'string') {
          return Promise.resolve({
            ok: true,
            json: async () => mockLocations,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'new_loc_1' }),
        });
      }) as any;

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Kitchen');
      await user.type(screen.getByLabelText(/description/i), 'Main kitchen area');

      // Wait for select to load and select a parent
      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      // Select the first location from mock data
      await waitFor(() => {
        const firstLocation = screen.getByText(mockLocations[0].name);
        expect(firstLocation).toBeInTheDocument();
      });

      await user.click(screen.getByText(mockLocations[0].name));

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        const createCalls = (global.fetch as any).mock.calls.filter(
          (call: any) => call[0] === '/api/locations' && call[1]?.method === 'POST'
        );
        const body = JSON.parse(createCalls[0][1].body);

        expect(body).toEqual({
          name: 'Kitchen',
          description: 'Main kitchen area',
          parentId: mockLocations[0].id,
        });
      });
    });

    it('should show success toast on successful creation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_loc_1' }),
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'New Location');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Location created successfully');
      });
    });

    it('should close dialog on successful creation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_loc_1' }),
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'New Location');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should refresh router on successful creation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_loc_1' }),
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'New Location');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockRouterRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission - Edit Mode', () => {
    it('should submit form with updated data in edit mode', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockLocation, name: 'Updated Location' }),
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          location={mockLocation}
          mode="edit"
        />
      );

      const nameInput = screen.getByDisplayValue(mockLocation.name);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Location');

      await user.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/locations/${mockLocation.id}`,
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should show success toast on successful update', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLocation,
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          location={mockLocation}
          mode="edit"
        />
      );

      await user.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Location updated successfully');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on failed submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Location already exists' }),
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Duplicate Location');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Location already exists');
      });
    });

    it('should show generic error on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Location');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('should not close dialog on error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Location');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('Dialog Functionality', () => {
    it('should not render when open is false', () => {
      const { container } = render(
        <LocationForm
          open={false}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.queryByText('Create Location')).not.toBeInTheDocument();
    });

    it('should call onOpenChange when cancel button is clicked', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should disable submit button while submitting', async () => {
      (global.fetch as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Location');
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('should show "Saving..." text while submitting', async () => {
      (global.fetch as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Location');
      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('should reset form after successful submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_loc_1' }),
      });

      const { rerender } = render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Location');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      // Reopen the form
      rerender(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      // Form fields should be empty
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle location without description in edit mode', () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          location={mockLocationMinimal}
          mode="edit"
        />
      );

      expect(screen.getByDisplayValue(mockLocationMinimal.name)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });

    it('should handle location without parentId in edit mode', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          location={mockLocation}
          mode="edit"
        />
      );

      // Wait for select to load
      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Should default to "none" value
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeInTheDocument();
    });

    it('should default to "none" for parentId when creating new location', async () => {
      global.fetch = vi.fn((url) => {
        if (url === '/api/locations' && typeof url === 'string') {
          return Promise.resolve({
            ok: true,
            json: async () => mockLocations,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'new_loc_1' }),
        });
      }) as any;

      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test');

      // Wait for select to load
      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Submit without changing parent (should default to null)
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        const createCalls = (global.fetch as any).mock.calls.filter(
          (call: any) => call[0] === '/api/locations' && call[1]?.method === 'POST'
        );
        const body = JSON.parse(createCalls[0][1].body);
        expect(body.parentId).toBeNull();
      });
    });

    it('should filter out current location from parent options in edit mode', async () => {
      render(
        <LocationForm
          open={true}
          onOpenChange={mockOnOpenChange}
          location={mockLocation}
          mode="edit"
        />
      );

      // Wait for select to load
      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Open select
      await user.click(screen.getByRole('combobox'));

      // The current location should not appear in the list
      await waitFor(() => {
        expect(screen.queryByText(mockLocation.name)).not.toBeInTheDocument();
      });
    });
  });
});
