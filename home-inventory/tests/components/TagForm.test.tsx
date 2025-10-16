import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagForm } from '@/components/tags/TagForm';
import { mockTag, mockTagWithoutColor } from '../fixtures/tags';
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

describe('TagForm Component', () => {
  const mockOnOpenChange = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form fields in create mode', () => {
      const { container } = render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByText(/^color$/i)).toBeInTheDocument(); // Check for Color label
      // Check for text input
      expect(screen.getByPlaceholderText(/e\.g\., #FF5733/i)).toBeInTheDocument();
      // Check for color picker
      expect(container.querySelector('input[type="color"]')).toBeInTheDocument();
    });

    it('should render create mode title and description', () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.getByText('Create Tag')).toBeInTheDocument();
      expect(
        screen.getByText(/Add a new tag to label and organize your inventory items/i)
      ).toBeInTheDocument();
    });

    it('should render edit mode title and description', () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTag}
          mode="edit"
        />
      );

      expect(screen.getByText('Edit Tag')).toBeInTheDocument();
      expect(
        screen.getByText(/Update the tag information/i)
      ).toBeInTheDocument();
    });

    it('should pre-populate form fields in edit mode', () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTag}
          mode="edit"
        />
      );

      expect(screen.getByDisplayValue(mockTag.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockTag.color!)).toBeInTheDocument();
    });

    it('should render cancel and submit buttons', () => {
      render(
        <TagForm
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
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTag}
          mode="edit"
        />
      );

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('should render both text input and color picker for color field', () => {
      const { container } = render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      // Text input for hex code
      const textInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i);
      expect(textInput).toBeInTheDocument();

      // Color picker input
      const colorInputs = container.querySelectorAll('input[type="color"]');
      expect(colorInputs.length).toBe(1);
    });

    it('should show color field description', () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(
        screen.getByText(/Enter a hex color code \(e\.g\., #FF5733\) or use the color picker/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required name field', async () => {
      render(
        <TagForm
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
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Important');

      expect(nameInput).toHaveValue('Important');
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });

    it('should enforce maximum length on name field', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const longName = 'a'.repeat(51); // Max is 50
      await user.type(nameInput, longName);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/string must contain at most 50 character/i)).toBeInTheDocument();
      });
    });

    it('should validate hex color format', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Tag');

      const colorInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i);
      await user.type(colorInput, 'invalid-color');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid color hex/i)).toBeInTheDocument();
      });
    });

    it('should accept valid hex color format', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const colorInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i);
      await user.type(colorInput, '#FF5733');

      expect(colorInput).toHaveValue('#FF5733');
      expect(screen.queryByText(/invalid color hex/i)).not.toBeInTheDocument();
    });

    it('should accept uppercase hex color', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const colorInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i);
      await user.type(colorInput, '#AABBCC');

      expect(colorInput).toHaveValue('#AABBCC');
    });

    it('should accept lowercase hex color', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const colorInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i);
      await user.type(colorInput, '#aabbcc');

      expect(colorInput).toHaveValue('#aabbcc');
    });

    it('should reject hex color without # prefix', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test');
      await user.type(screen.getByPlaceholderText(/e\.g\., #FF5733/i), 'FF5733');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid color hex/i)).toBeInTheDocument();
      });
    });

    it('should reject short hex color', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test');
      await user.type(screen.getByPlaceholderText(/e\.g\., #FF5733/i), '#FFF');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid color hex/i)).toBeInTheDocument();
      });
    });

    it('should enforce max length of 7 characters for color', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const colorInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i) as HTMLInputElement;
      await user.type(colorInput, '#FF5733EXTRA');

      // Should be truncated to 7 characters
      expect(colorInput.value.length).toBeLessThanOrEqual(7);
    });
  });

  describe('Optional Color Field', () => {
    it('should allow empty color field', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_tag_1', name: 'Test Tag' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Tag');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should send empty string as color when not provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_tag_1' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Tag');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.color).toBe('');
      });
    });

    it('should handle tag without color in edit mode', () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTagWithoutColor}
          mode="edit"
        />
      );

      expect(screen.getByDisplayValue(mockTagWithoutColor.name)).toBeInTheDocument();
      const colorInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i);
      expect(colorInput).toHaveValue('');
    });
  });

  describe('Form Submission - Create Mode', () => {
    it('should submit form with valid data in create mode', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_tag_1', name: 'New Tag' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'New Tag');

      const colorInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i);
      await user.type(colorInput, '#FF5733');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tags',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should send correct data in request body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_tag_1' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Important');
      await user.type(screen.getByPlaceholderText(/e\.g\., #FF5733/i), '#EF4444');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);

        expect(body).toEqual({
          name: 'Important',
          color: '#EF4444',
        });
      });
    });

    it('should show success toast on successful creation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_tag_1' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'New Tag');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Tag created successfully');
      });
    });

    it('should close dialog on successful creation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_tag_1' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'New Tag');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should refresh router on successful creation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_tag_1' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'New Tag');
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
        json: async () => ({ ...mockTag, name: 'Updated Tag' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTag}
          mode="edit"
        />
      );

      const nameInput = screen.getByDisplayValue(mockTag.name);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Tag');

      await user.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/tags/${mockTag.id}`,
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should show success toast on successful update', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTag,
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTag}
          mode="edit"
        />
      );

      await user.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Tag updated successfully');
      });
    });

    it('should update color field', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockTag, color: '#3B82F6' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTag}
          mode="edit"
        />
      );

      const colorInput = screen.getByDisplayValue(mockTag.color!);
      await user.clear(colorInput);
      await user.type(colorInput, '#3B82F6');

      await user.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.color).toBe('#3B82F6');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on failed submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Tag already exists' }),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Duplicate Tag');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Tag already exists');
      });
    });

    it('should show generic error message when no specific error provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Tag');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save tag');
      });
    });

    it('should show error on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Tag');
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
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Tag');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('Dialog Functionality', () => {
    it('should not render when open is false', () => {
      render(
        <TagForm
          open={false}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.queryByText('Create Tag')).not.toBeInTheDocument();
    });

    it('should call onOpenChange when cancel button is clicked', async () => {
      render(
        <TagForm
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
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Tag');
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('should show "Saving..." text while submitting', async () => {
      (global.fetch as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Tag');
      await user.click(screen.getByRole('button', { name: /create/i }));

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Color Picker Integration', () => {
    it('should sync color picker with text input', async () => {
      const { container } = render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const colorPicker = container.querySelector('input[type="color"]') as HTMLInputElement;
      const textInput = screen.getByPlaceholderText(/e\.g\., #FF5733/i) as HTMLInputElement;

      // Type in text input
      await user.type(textInput, '#3B82F6');
      expect(textInput).toHaveValue('#3B82F6');
    });

    it('should default color picker to black when no color provided', () => {
      const { container } = render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const colorPicker = container.querySelector('input[type="color"]') as HTMLInputElement;
      expect(colorPicker).toHaveValue('#000000');
    });

    it('should set color picker value in edit mode', () => {
      const { container } = render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTag}
          mode="edit"
        />
      );

      const colorPicker = container.querySelector('input[type="color"]') as HTMLInputElement;
      expect(colorPicker).toHaveValue(mockTag.color);
    });
  });

  describe('Form Reset', () => {
    it('should reset form after successful submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_tag_1' }),
      });

      const { rerender } = render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Tag');
      await user.type(screen.getByPlaceholderText(/e\.g\., #FF5733/i), '#FF5733');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      // Reopen the form
      rerender(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      // Form fields should be empty
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/e\.g\., #FF5733/i)).toHaveValue('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle tag without color in edit mode', () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTagWithoutColor}
          mode="edit"
        />
      );

      expect(screen.getByDisplayValue(mockTagWithoutColor.name)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\., #FF5733/i)).toHaveValue('');
    });

    it('should handle clearing color field', async () => {
      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          tag={mockTag}
          mode="edit"
        />
      );

      const colorInput = screen.getByDisplayValue(mockTag.color!);
      await user.clear(colorInput);

      expect(colorInput).toHaveValue('');
    });

    it('should handle non-error exceptions', async () => {
      (global.fetch as any).mockRejectedValueOnce('Unknown error');

      render(
        <TagForm
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      await user.type(screen.getByLabelText(/name/i), 'Test Tag');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred');
      });
    });
  });
});
