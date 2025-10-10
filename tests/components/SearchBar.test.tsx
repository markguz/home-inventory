import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
  });

  it('should call onSearch with debounced query', async () => {
    const user = userEvent.setup();
    jest.useFakeTimers();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search items/i);
    await user.type(input, 'laptop');

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('laptop');
    });

    jest.useRealTimers();
  });

  it('should not search for empty query', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search items/i);
    await user.type(input, 'test');
    await user.clear(input);

    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('should show clear button when input has value', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search items/i);
    await user.type(input, 'laptop');

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should clear input when clear button clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/search items/i);
    await user.type(input, 'laptop');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(input).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('should accept initial value prop', () => {
    render(<SearchBar onSearch={mockOnSearch} initialValue="electronics" />);

    expect(screen.getByPlaceholderText(/search items/i)).toHaveValue('electronics');
  });
});
