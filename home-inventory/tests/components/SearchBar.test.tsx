import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/items/SearchBar';

describe('SearchBar Component', () => {
  const mockOnSearch = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('should render search input', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toBeInTheDocument();
  });

  it('should call onSearch when typing', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);

    await user.type(input, 'laptop');

    // Debounced, so wait for the call
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith('laptop');
      },
      { timeout: 1000 }
    );
  });

  it('should debounce search calls', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);

    // Type multiple characters quickly
    await user.type(input, 'test');

    // Should only call once after debounce
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );
  });

  it('should display current search value', () => {
    render(<SearchBar onSearch={mockOnSearch} initialValue="MacBook" />);
    const input = screen.getByDisplayValue('MacBook');
    expect(input).toBeInTheDocument();
  });

  it('should clear search when clear button is clicked', async () => {
    render(<SearchBar onSearch={mockOnSearch} initialValue="laptop" />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('should handle empty search query', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);

    await user.type(input, 'test');
    await user.clear(input);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  it('should render search icon', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('type', 'search');
  });

  it('should not call onSearch on mount', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should handle special characters in search', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);

    await user.type(input, '$100 & more');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('$100 & more');
    });
  });

  it('should trim whitespace from search query', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);

    await user.type(input, '  laptop  ');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('laptop');
    });
  });

  it('should be keyboard accessible', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);

    input.focus();
    expect(document.activeElement).toBe(input);

    await user.keyboard('macbook');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  it('should show loading state when searching', async () => {
    render(<SearchBar onSearch={mockOnSearch} isLoading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should disable input while loading', () => {
    render(<SearchBar onSearch={mockOnSearch} isLoading={true} />);
    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toBeDisabled();
  });

  it('should handle rapid clearing and typing', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);

    await user.type(input, 'test');
    await user.clear(input);
    await user.type(input, 'new search');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenLastCalledWith('new search');
    });
  });

  it('should persist value across re-renders', async () => {
    const { rerender } = render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/search/i);

    await user.type(input, 'laptop');

    rerender(<SearchBar onSearch={mockOnSearch} />);

    expect(input).toHaveValue('laptop');
  });
});
